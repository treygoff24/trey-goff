'use client'

/**
 * FloatingBook - Individual book rendered as a 3D plane with cover texture.
 * Handles hover/select states, floating animation, and interaction.
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { BookWithPosition, Position3D } from '@/lib/library/types'
import { textureManager } from '@/lib/library/textures'
import { useLibraryStore } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface FloatingBookProps {
  book: BookWithPosition
  reducedMotion: boolean
  targetPosition?: Position3D
  opacity?: number
}

// =============================================================================
// Constants
// =============================================================================

/** Book dimensions (2:3 aspect ratio like a paperback) */
const BOOK_WIDTH = 2
const BOOK_HEIGHT = 3
const BOOK_DEPTH = 0.2

/** Floating animation parameters */
const FLOAT_AMPLITUDE = 0.15
const FLOAT_SPEED = 0.5
const ROTATION_AMPLITUDE = 0.03

/** Hover animation parameters */
const HOVER_SCALE = 1.15
const HOVER_TILT = 0.15

/** Position lerp speed */
const POSITION_LERP_SPEED = 3

// =============================================================================
// Component
// =============================================================================

export function FloatingBook({
  book,
  reducedMotion,
  targetPosition,
  opacity = 1,
}: FloatingBookProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // State
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Store
  const selectBook = useLibraryStore((s) => s.selectBook)
  const selectedBook = useLibraryStore((s) => s.selectedBook)
  const isSelected = selectedBook?.id === book.id

  // Animation refs - use book ID hash for deterministic offset
  const timeOffset = useMemo(() => {
    let hash = 0
    for (let i = 0; i < book.id.length; i++) {
      hash = (hash * 31 + book.id.charCodeAt(i)) & 0x7fffffff
    }
    return (hash % 1000) / 10
  }, [book.id])
  const timeRef = useRef(timeOffset)
  const currentPositionRef = useRef(new THREE.Vector3(...book.position))
  const targetPositionRef = useRef(new THREE.Vector3(...book.position))
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))

  // Load texture
  useEffect(() => {
    let mounted = true

    textureManager.getTexture(book.id, book.topics).then((tex) => {
      if (mounted) {
        setTexture(tex)
      }
    })

    return () => {
      mounted = false
    }
  }, [book.id, book.topics])

  // Update target position when prop changes
  useEffect(() => {
    if (targetPosition) {
      targetPositionRef.current.set(...targetPosition)
    } else {
      targetPositionRef.current.set(...book.position)
    }
  }, [targetPosition, book.position])

  // Update target scale based on hover/select state
  useEffect(() => {
    const scale = isHovered || isSelected ? HOVER_SCALE : 1
    targetScaleRef.current.set(scale, scale, scale)
  }, [isHovered, isSelected])

  // Animation frame
  useFrame((_state, delta) => {
    if (!meshRef.current) return

    // Update time
    timeRef.current += delta

    // Lerp position
    const currentPos = currentPositionRef.current
    const targetPos = targetPositionRef.current

    if (!reducedMotion) {
      currentPos.lerp(targetPos, delta * POSITION_LERP_SPEED)
    } else {
      currentPos.copy(targetPos)
    }

    // Apply floating animation (if not reduced motion)
    let floatY = 0
    let rotationX = 0
    let rotationZ = 0

    if (!reducedMotion && !isSelected) {
      const t = timeRef.current * FLOAT_SPEED
      floatY = Math.sin(t) * FLOAT_AMPLITUDE
      rotationX = Math.sin(t * 0.7) * ROTATION_AMPLITUDE
      rotationZ = Math.cos(t * 0.5) * ROTATION_AMPLITUDE
    }

    // Apply hover tilt
    if (isHovered && !reducedMotion) {
      rotationX += HOVER_TILT * 0.5
      rotationZ += HOVER_TILT * 0.3
    }

    // Set position
    meshRef.current.position.set(
      currentPos.x,
      currentPos.y + floatY,
      currentPos.z
    )

    // Set rotation
    meshRef.current.rotation.set(rotationX, 0, rotationZ)

    // Lerp scale
    if (!reducedMotion) {
      baseScaleRef.current.lerp(targetScaleRef.current, delta * 8)
    } else {
      baseScaleRef.current.copy(targetScaleRef.current)
    }
    meshRef.current.scale.copy(baseScaleRef.current)

    // Update material opacity
    if (materialRef.current) {
      materialRef.current.opacity = opacity
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

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      selectBook(book, book.position)
    },
    [book, selectBook]
  )

  // Cleanup cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  // Glow intensity based on state
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
        transparent={opacity < 1}
        opacity={opacity}
        emissive={texture ? '#ffffff' : '#888888'}
        emissiveIntensity={emissiveIntensity}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}
