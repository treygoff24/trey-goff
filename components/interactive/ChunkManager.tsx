'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useInteractiveStore } from '@/lib/interactive/store'
import { loadGLTF, disposeObject, logMemoryUsage } from '@/lib/interactive/loaders'
import type { RoomId, ChunkState } from '@/lib/interactive/types'

interface ChunkData {
  gltf: GLTF
  scene: THREE.Group
  loadedAt: number
}

/**
 * The debug surface `ChunkManager` parks on `window` when `debug` is set, so a console
 * session can drive chunk loading by hand. Declared rather than cast so the handle stays
 * in step with the callbacks it exposes.
 */
export interface ChunkManagerDebugApi {
  loadChunk: (room: RoomId) => Promise<void>
  activateRoom: (room: RoomId) => void
  disposeRoom: (room: RoomId) => void
  getLoadedChunks: () => RoomId[]
}

declare global {
  interface Window {
    __chunkManager?: ChunkManagerDebugApi
  }
}

interface ChunkManagerProps {
  /** Enable debug logging */
  debug?: boolean
  /** Callback when chunk becomes active */
  onChunkActive?: (room: RoomId, scene: THREE.Group) => void
  /** Callback when chunk is disposed */
  onChunkDisposed?: (room: RoomId) => void
}

const CHUNK_BASE_PATH = '/assets/chunks/'
const MAX_MEMORY_MB = 500
const MEMORY_CHECK_INTERVAL = 5000 // ms

/**
 * Map room IDs to chunk file paths.
 * In production, these would be generated from the asset manifest.
 */
const CHUNK_PATHS: Record<RoomId, string> = {
  exterior: `${CHUNK_BASE_PATH}exterior.glb`,
  mainhall: `${CHUNK_BASE_PATH}mainhall.glb`,
  library: `${CHUNK_BASE_PATH}library.glb`,
  gym: `${CHUNK_BASE_PATH}gym.glb`,
  projects: `${CHUNK_BASE_PATH}projects.glb`,
  garage: `${CHUNK_BASE_PATH}garage.glb`,
}

function logStateTransition(
  room: RoomId,
  from: ChunkState | null,
  to: ChunkState,
  debug: boolean,
): void {
  if (!debug) return
  console.log(`[ChunkManager] ${room}: ${from ?? 'init'} → ${to}`)
}

/**
 * ChunkManager - Manages chunk loading, activation, and disposal.
 *
 * State machine flow:
 * unloaded → preloading → loaded → active → dormant → disposed
 *     ↑                                         │
 *     └─────────────────────────────────────────┘
 *
 * Responsibilities:
 * - Load chunks on preload request
 * - Activate chunks when player enters room
 * - Track dormant chunks for memory management
 * - Dispose oldest chunks when memory pressure
 */
export function ChunkManager({ debug = false, onChunkActive, onChunkDisposed }: ChunkManagerProps) {
  const { gl, scene } = useThree()

  // Chunk data storage (not in Zustand to avoid serialization issues with THREE objects)
  const chunksRef = useRef<Map<RoomId, ChunkData>>(new Map())
  const abortControllersRef = useRef<Map<RoomId, AbortController>>(new Map())

  const chunkStates = useInteractiveStore((s) => s.chunkStates)
  const activeChunk = useInteractiveStore((s) => s.activeChunk)
  const setChunkState = useInteractiveStore((s) => s.setChunkState)
  const activateChunk = useInteractiveStore((s) => s.activateChunk)

  const loadChunk = useCallback(
    async (room: RoomId): Promise<void> => {
      const currentState = chunkStates.get(room)?.state

      if (currentState === 'loaded' || currentState === 'active' || currentState === 'dormant') {
        return
      }

      // A live abort controller means a load is already in flight.
      if (abortControllersRef.current.has(room)) {
        return
      }

      if (currentState !== 'preloading') {
        logStateTransition(room, currentState ?? null, 'preloading', debug)
        setChunkState(room, 'preloading')
      }

      const controller = new AbortController()
      abortControllersRef.current.set(room, controller)

      try {
        const url = CHUNK_PATHS[room]
        const gltf = await loadGLTF(url, {
          signal: controller.signal,
          onProgress: (progress) => {
            if (debug) {
              console.log(`[ChunkManager] ${room}: ${progress.percent.toFixed(1)}%`)
            }
          },
        })

        if (controller.signal.aborted) {
          disposeObject(gltf.scene)
          return
        }

        const chunkData: ChunkData = {
          gltf,
          scene: gltf.scene,
          loadedAt: Date.now(),
        }
        chunksRef.current.set(room, chunkData)

        logStateTransition(room, 'preloading', 'loaded', debug)
        setChunkState(room, 'loaded')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // Load was cancelled - reset to unloaded
          logStateTransition(room, 'preloading', 'unloaded', debug)
          setChunkState(room, 'unloaded')
        } else {
          console.error(`[ChunkManager] Failed to load ${room}:`, error)
          setChunkState(room, 'unloaded')
        }
      } finally {
        abortControllersRef.current.delete(room)
      }
    },
    [chunkStates, setChunkState, debug],
  )

  const activateRoom = useCallback(
    (room: RoomId): void => {
      const chunk = chunksRef.current.get(room)
      const currentState = chunkStates.get(room)?.state

      if (!chunk || (currentState !== 'loaded' && currentState !== 'dormant')) {
        console.warn(`[ChunkManager] Cannot activate ${room} from state ${currentState}`)
        return
      }

      // A dormant chunk is still attached to the scene, just hidden.
      if (currentState === 'dormant') {
        chunk.scene.visible = true
      } else {
        scene.add(chunk.scene)
      }

      logStateTransition(room, currentState, 'active', debug)
      activateChunk(room) // This also marks previous as dormant

      onChunkActive?.(room, chunk.scene)
    },
    [chunkStates, scene, activateChunk, onChunkActive, debug],
  )

  const disposeRoom = useCallback(
    (room: RoomId): void => {
      // Cancel any pending loads FIRST (even if chunk not yet stored)
      const controller = abortControllersRef.current.get(room)
      if (controller) {
        controller.abort()
        abortControllersRef.current.delete(room)
      }

      const chunk = chunksRef.current.get(room)
      if (!chunk) {
        // Load was aborted before completion - just update state
        setChunkState(room, 'disposed')
        return
      }

      scene.remove(chunk.scene)

      disposeObject(chunk.scene)

      chunksRef.current.delete(room)

      logStateTransition(room, chunkStates.get(room)?.state ?? null, 'disposed', debug)
      setChunkState(room, 'disposed')

      onChunkDisposed?.(room)

      if (debug) {
        logMemoryUsage(gl)
      }
    },
    [scene, chunkStates, gl, onChunkDisposed, setChunkState, debug],
  )

  const makeDormant = useCallback(
    (room: RoomId): void => {
      const chunk = chunksRef.current.get(room)
      if (!chunk) return

      // Keep it attached so reactivation costs nothing but a visibility flip.
      chunk.scene.visible = false

      logStateTransition(room, 'active', 'dormant', debug)
    },
    [debug],
  )

  useEffect(() => {
    if (!debug) return

    const interval = setInterval(() => {
      const info = gl.info.memory
      const estimatedMB = info.geometries * 0.1 + info.textures * 2 // Rough estimate

      if (estimatedMB > MAX_MEMORY_MB * 0.8) {
        console.warn(`[ChunkManager] Memory pressure: ~${estimatedMB.toFixed(0)}MB`)
      }
    }, MEMORY_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [gl, debug])

  const prevActiveChunk = useRef<RoomId | null>(null)

  useEffect(() => {
    if (activeChunk !== prevActiveChunk.current) {
      if (prevActiveChunk.current) {
        makeDormant(prevActiveChunk.current)
      }
      prevActiveChunk.current = activeChunk
    }
  }, [activeChunk, makeDormant])

  useEffect(() => {
    for (const [room, info] of chunkStates) {
      if (info.state === 'preloading' && !abortControllersRef.current.has(room)) {
        void loadChunk(room)
      }
    }
  }, [chunkStates, loadChunk])

  useEffect(() => {
    for (const [room, info] of chunkStates) {
      if (info.state === 'disposed' && chunksRef.current.has(room)) {
        disposeRoom(room)
      }
    }
  }, [chunkStates, disposeRoom])

  useEffect(() => {
    // Store methods on window for debugging (development only)
    if (debug) {
      window.__chunkManager = {
        loadChunk,
        activateRoom,
        disposeRoom,
        getLoadedChunks: () => Array.from(chunksRef.current.keys()),
      }
    }
  }, [loadChunk, activateRoom, disposeRoom, debug])

  return null
}
