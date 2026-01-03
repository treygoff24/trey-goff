'use client'

/**
 * Drifter - Orphan book floating on a lazy curved orbit through the void.
 * Renders a book with its own orbital animation via useFrame.
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { BookWithPosition } from '@/lib/library/types'
import { textureManager } from '@/lib/library/textures'
import { useLibraryStore } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface DrifterProps {
  book: BookWithPosition
  reducedMotion: boolean
}

// =============================================================================
// Constants
// =============================================================================

/** Book dimensions */
const BOOK_WIDTH = 2
const BOOK_HEIGHT = 3
const BOOK_DEPTH = 0.2

/** Orbit period range in seconds */
const MIN_ORBIT_PERIOD = 60
const MAX_ORBIT_PERIOD = 120

/** Hover animation parameters */
const HOVER_SCALE = 1.15
const HOVER_TILT = 0.15

// =============================================================================
// Helpers
// =============================================================================

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// =============================================================================
// Component
// =============================================================================

export function Drifter({ book, reducedMotion }: DrifterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const timeRef = useRef(0)

  // State
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Store
  const selectBook = useLibraryStore((s) => s.selectBook)
  const selectedBook = useLibraryStore((s) => s.selectedBook)
  const isSelected = selectedBook?.id === book.id

  // Scale refs
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))

  // Generate deterministic orbit parameters
  const orbitParams = useMemo(() => {
    const seed = hashString(book.id)
    const random = createSeededRandom(seed)

    return {
      baseX: book.position[0],
      baseY: book.position[1],
      baseZ: book.position[2],
      period: MIN_ORBIT_PERIOD + random() * (MAX_ORBIT_PERIOD - MIN_ORBIT_PERIOD),
      radiusX: 5 + random() * 10,
      radiusZ: 3 + random() * 7,
      verticalAmplitude: 2 + random() * 4,
      phaseOffset: random() * Math.PI * 2,
      wobbleFrequency: 0.1 + random() * 0.2,
      wobbleAmplitude: 0.5 + random() * 1,
    }
  }, [book.id, book.position])

  // Load texture
  useEffect(() => {
    let mounted = true
    textureManager.getTexture(book.id, book.topics).then((tex) => {
      if (mounted) setTexture(tex)
    })
    return () => { mounted = false }
  }, [book.id, book.topics])

  // Update target scale
  useEffect(() => {
    const scale = isHovered || isSelected ? HOVER_SCALE : 1
    targetScaleRef.current.set(scale, scale, scale)
  }, [isHovered, isSelected])

  // Animation
  useFrame((_state, delta) => {
    if (!meshRef.current) return

    timeRef.current += delta

    // Calculate orbital position
    let x = orbitParams.baseX
    let y = orbitParams.baseY
    let z = orbitParams.baseZ
    let rotationX = 0
    let rotationZ = 0

    if (!reducedMotion && !isSelected) {
      const t = timeRef.current / orbitParams.period
      const angle = t * Math.PI * 2 + orbitParams.phaseOffset

      const orbitX = Math.cos(angle) * orbitParams.radiusX
      const orbitZ = Math.sin(angle) * orbitParams.radiusZ
      const verticalOffset = Math.sin(angle * 2) * orbitParams.verticalAmplitude * 0.5
      const wobble = Math.sin(timeRef.current * orbitParams.wobbleFrequency) * orbitParams.wobbleAmplitude

      x += orbitX + wobble
      y += verticalOffset
      z += orbitZ

      // Gentle rotation
      rotationX = Math.sin(timeRef.current * 0.3) * 0.05
      rotationZ = Math.cos(timeRef.current * 0.2) * 0.03
    }

    // Hover tilt
    if (isHovered && !reducedMotion) {
      rotationX += HOVER_TILT * 0.5
      rotationZ += HOVER_TILT * 0.3
    }

    meshRef.current.position.set(x, y, z)
    meshRef.current.rotation.set(rotationX, 0, rotationZ)

    // Scale lerp
    if (!reducedMotion) {
      baseScaleRef.current.lerp(targetScaleRef.current, delta * 8)
    } else {
      baseScaleRef.current.copy(targetScaleRef.current)
    }
    meshRef.current.scale.copy(baseScaleRef.current)

    // Opacity
    if (materialRef.current) {
      materialRef.current.opacity = 0.85
    }
  })

  // Event handlers
  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setIsHovered(false)
    document.body.style.cursor = 'auto'
  }, [])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectBook(book, book.position)
  }, [book, selectBook])

  // Cleanup cursor
  useEffect(() => {
    return () => { document.body.style.cursor = 'auto' }
  }, [])

  const emissiveIntensity = useMemo(() => {
    if (isSelected) return 0.3
    if (isHovered) return 0.15
    return 0
  }, [isHovered, isSelected])

  return (
    <mesh
      ref={meshRef}
      position={book.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.85}
        emissive={texture ? '#ffffff' : '#888888'}
        emissiveIntensity={emissiveIntensity}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}
