/**
 * Zustand store for Interactive route state management.
 * Handles chunk loading states, player position, settings, and persistence.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  RoomId,
  ChunkState,
  ChunkInfo,
  InteractiveSettings,
  InteractiveStoreState,
  InteractiveStore,
} from './types'
import { DEFAULT_SETTINGS } from './types'
import type { QualityTier } from './capabilities'

const STORAGE_KEY = 'trey-interactive-state'
const MAX_DORMANT_CHUNKS = 2

/** Rooms in load priority order */
const ROOM_IDS: readonly RoomId[] = ['exterior', 'mainhall', 'library', 'gym', 'projects', 'garage']

/** Narrows a URL- or storage-sourced string to a room the registry actually knows. */
function isRoomId(value: string): value is RoomId {
  return (ROOM_IDS as readonly string[]).includes(value)
}

function createInitialChunkStates(): Map<RoomId, ChunkInfo> {
  const map = new Map<RoomId, ChunkInfo>()
  for (const id of ROOM_IDS) {
    map.set(id, {
      id,
      state: 'unloaded',
      loadedAt: null,
      lastActiveAt: null,
      memoryEstimate: 0,
    })
  }
  return map
}

const initialState: InteractiveStoreState = {
  chunkStates: createInitialChunkStates(),
  activeChunk: null,

  qualityTier: 'auto',
  effectiveQualityTier: 'medium',

  player: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    spawnPosition: [0, 0, 10], // exterior default
    spawnRotation: Math.PI, // facing mansion
    currentRoom: null,
    isMoving: false,
    isInteracting: false,
  },

  settings: { ...DEFAULT_SETTINGS },

  isLoading: true,
  loadingProgress: 0,
  loadingStatus: 'Initializing...',

  error: null,

  sessionStartTime: Date.now(),
  lastInteractionTime: Date.now(),
}

interface PersistedState {
  qualityTier: QualityTier
  settings: InteractiveSettings
  lastRoom: RoomId | null
  lastPosition: [number, number, number] | null
  lastRotation: [number, number, number] | null
}

function saveToLocalStorage(state: InteractiveStoreState): void {
  if (typeof window === 'undefined') return

  const persisted: PersistedState = {
    qualityTier: state.qualityTier,
    settings: state.settings,
    lastRoom: state.player.currentRoom,
    lastPosition: state.player.position,
    lastRotation: state.player.rotation,
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  } catch {
    // Storage quota exceeded or private mode
  }
}

function loadFromLocalStorage(): Partial<InteractiveStoreState> | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const persisted = JSON.parse(stored) as PersistedState

    return {
      qualityTier: persisted.qualityTier,
      settings: { ...DEFAULT_SETTINGS, ...persisted.settings },
      player: {
        ...initialState.player,
        currentRoom: persisted.lastRoom,
        position: persisted.lastPosition ?? [0, 0, 0],
        rotation: persisted.lastRotation ?? [0, 0, 0],
      },
    }
  } catch {
    return null
  }
}

function getUrlRoom(): RoomId | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const room = params.get('room')

  return room && isRoomId(room) ? room : null
}

function updateUrlRoom(room: RoomId | null): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  if (room) {
    url.searchParams.set('room', room)
  } else {
    url.searchParams.delete('room')
  }

  // Use replaceState to avoid adding to history
  window.history.replaceState({}, '', url.toString())
}

export const useInteractiveStore = create<InteractiveStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setChunkState: (room: RoomId, state: ChunkState) => {
      set((s) => {
        const newChunkStates = new Map(s.chunkStates)
        const info = newChunkStates.get(room)
        if (info) {
          newChunkStates.set(room, {
            ...info,
            state,
            loadedAt: state === 'loaded' ? Date.now() : info.loadedAt,
            lastActiveAt: state === 'active' ? Date.now() : info.lastActiveAt,
          })
        }
        return { chunkStates: newChunkStates }
      })
    },

    activateChunk: (room: RoomId) => {
      const initialState = get()

      if (initialState.activeChunk && initialState.activeChunk !== room) {
        get().setChunkState(initialState.activeChunk, 'dormant')
      }

      get().setChunkState(room, 'active')
      set({ activeChunk: room })

      // Enforce dormant limit - use fresh state after updates
      const freshState = get()
      const dormantChunks: { id: RoomId; lastActiveAt: number }[] = []
      for (const [id, info] of freshState.chunkStates) {
        if (info.state === 'dormant' && info.lastActiveAt) {
          dormantChunks.push({ id, lastActiveAt: info.lastActiveAt })
        }
      }

      if (dormantChunks.length > MAX_DORMANT_CHUNKS) {
        dormantChunks.sort((a, b) => a.lastActiveAt - b.lastActiveAt)
        const toDispose = dormantChunks.slice(0, dormantChunks.length - MAX_DORMANT_CHUNKS)
        for (const chunk of toDispose) {
          get().disposeChunk(chunk.id)
        }
      }
    },

    disposeChunk: (room: RoomId) => {
      set((s) => {
        const newChunkStates = new Map(s.chunkStates)
        const info = newChunkStates.get(room)
        if (info) {
          newChunkStates.set(room, {
            ...info,
            state: 'disposed',
            memoryEstimate: 0,
          })
        }
        return { chunkStates: newChunkStates }
      })

      // Reset to unloaded after disposal for potential reload
      setTimeout(() => {
        get().setChunkState(room, 'unloaded')
      }, 100)
    },

    setQualityTier: (tier: QualityTier) => {
      set({ qualityTier: tier })
      get().saveToStorage()
    },

    setEffectiveQualityTier: (tier: Exclude<QualityTier, 'auto'>) => {
      set({ effectiveQualityTier: tier })
    },

    setPlayerPosition: (position) => {
      set((s) => ({
        player: { ...s.player, position },
      }))
    },

    setPlayerRotation: (rotation) => {
      set((s) => ({
        player: { ...s.player, rotation },
      }))
    },

    setSpawnPosition: (spawnPosition) => {
      set((s) => ({
        player: { ...s.player, spawnPosition },
      }))
    },

    setSpawnRotation: (spawnRotation) => {
      set((s) => ({
        player: { ...s.player, spawnRotation },
      }))
    },

    setCurrentRoom: (room) => {
      set((s) => ({
        player: { ...s.player, currentRoom: room },
      }))
      updateUrlRoom(room)
      get().saveToStorage()
    },

    setIsMoving: (isMoving) => {
      set((s) => ({
        player: { ...s.player, isMoving },
      }))
    },

    setIsInteracting: (isInteracting) => {
      set((s) => ({
        player: { ...s.player, isInteracting },
      }))
    },

    updateSettings: (partial) => {
      set((s) => ({
        settings: { ...s.settings, ...partial },
      }))
      get().saveToStorage()
    },

    resetSettings: () => {
      set({ settings: { ...DEFAULT_SETTINGS } })
      get().saveToStorage()
    },

    setLoading: (isLoading) => {
      set({ isLoading })
    },

    setLoadingProgress: (progress, status) => {
      set((s) => ({
        loadingProgress: progress,
        loadingStatus: status ?? s.loadingStatus,
      }))
    },

    setError: (error) => {
      set({ error })
    },

    recordInteraction: () => {
      set({ lastInteractionTime: Date.now() })
    },

    saveToStorage: () => {
      saveToLocalStorage(get())
    },

    loadFromStorage: () => {
      const urlRoom = getUrlRoom()

      const stored = loadFromLocalStorage()

      if (stored || urlRoom) {
        set((s) => ({
          ...s,
          ...stored,
          player: {
            ...(stored?.player ?? s.player),
            currentRoom: urlRoom ?? stored?.player?.currentRoom ?? null,
          },
        }))
      }
    },
  })),
)
