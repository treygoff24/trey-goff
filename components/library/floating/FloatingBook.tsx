'use client'

/**
 * FloatingBook - Individual book rendered as a 3D plane with cover texture.
 * Handles hover/select states and smooth position/scale transitions.
 * Uses invalidate() for on-demand rendering (GPU efficient).
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
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

/** Hover animation parameters */
const HOVER_SCALE = 1.15
const HOVER_TILT = 0.15

/** Position lerp speed */
const POSITION_LERP_SPEED = 3

/** Threshold for considering lerp complete */
const LERP_THRESHOLD = 0.01

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
  const { invalidate } = useThree()

  // State
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Store
  const selectBook = useLibraryStore((s) => s.selectBook)
  const selectedBook = useLibraryStore((s) => s.selectedBook)
  const isSelected = selectedBook?.id === book.id

  // Animation refs
  const currentPositionRef = useRef(new THREE.Vector3(...book.position))
  const targetPositionRef = useRef(new THREE.Vector3(...book.position))
  const baseScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const isAnimatingRef = useRef(false)

  // Load texture
  useEffect(() => {
    let mounted = true

    textureManager.getTexture(book.id, book.topics).then((tex) => {
      if (mounted) {
        setTexture(tex)
        invalidate() // Re-render with new texture
      }
    })

    return () => {
      mounted = false
    }
  }, [book.id, book.topics, invalidate])

  // Update target position when prop changes
  useEffect(() => {
    if (targetPosition) {
      targetPositionRef.current.set(...targetPosition)
    } else {
      targetPositionRef.current.set(...book.position)
    }
    isAnimatingRef.current = true
    invalidate() // Trigger animation
  }, [targetPosition, book.position, invalidate])

  // Update target scale based on hover/select state
  useEffect(() => {
    const scale = isHovered || isSelected ? HOVER_SCALE : 1
    targetScaleRef.current.set(scale, scale, scale)
    isAnimatingRef.current = true
    invalidate() // Trigger animation
  }, [isHovered, isSelected, invalidate])

  // Animation frame - only runs when invalidate() is called
  useFrame((_state, delta) => {
    if (!meshRef.current) return

    // Skip if not animating
    if (!isAnimatingRef.current) return

    const currentPos = currentPositionRef.current
    const targetPos = targetPositionRef.current

    // Lerp position
    if (!reducedMotion) {
      currentPos.lerp(targetPos, delta * POSITION_LERP_SPEED)
    } else {
      currentPos.copy(targetPos)
    }

    // Set position (no floating animation - static for GPU efficiency)
    meshRef.current.position.copy(currentPos)

    // Apply hover tilt (static, not animated)
    if (isHovered && !reducedMotion) {
      meshRef.current.rotation.set(HOVER_TILT * 0.5, 0, HOVER_TILT * 0.3)
    } else {
      meshRef.current.rotation.set(0, 0, 0)
    }

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

    // Check if animation is complete
    const positionDist = currentPos.distanceTo(targetPos)
    const scaleDist = baseScaleRef.current.distanceTo(targetScaleRef.current)

    if (positionDist < LERP_THRESHOLD && scaleDist < LERP_THRESHOLD) {
      // Snap to final values
      currentPos.copy(targetPos)
      baseScaleRef.current.copy(targetScaleRef.current)
      isAnimatingRef.current = false
    } else {
      // Keep animating
      invalidate()
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
    if (isHovered) return 0.2
    return 0.05 // Very subtle base glow
  }, [isHovered, isSelected])

  // Disable raycast when book is fully hidden (filtered out)
  const isInteractive = opacity > 0.1

  return (
    <mesh
      ref={meshRef}
      position={book.position}
      onPointerOver={isInteractive ? handlePointerOver : undefined}
      onPointerOut={isInteractive ? handlePointerOut : undefined}
      onClick={isInteractive ? handleClick : undefined}
      raycast={isInteractive ? undefined : () => {}}
    >
      <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent={opacity < 1}
        opacity={opacity}
        emissive={new THREE.Color('#888888')}
        emissiveIntensity={emissiveIntensity}
        roughness={0.7}
        metalness={0.0}
      />
    </mesh>
  )
}
