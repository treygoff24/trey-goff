'use client'

/**
 * NebulaDust - GPU particles for "wisps" inside nebulae.
 *
 * Uses THREE.Points with custom attributes for efficient GPU rendering.
 * Particles drift through 3D noise when the nebula is active.
 *
 * LOD particle counts:
 * - Universe: 200
 * - Constellation (inactive): 400
 * - Constellation (active): 1000
 * - Book: 600
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { simplex2D } from '@/lib/library/noise'
import { useLibraryStore } from '@/lib/library/store'
import type { ViewLevel, Position3D } from '@/lib/library/types'

// =============================================================================
// Types
// =============================================================================

interface NebulaDustProps {
  /** Topic color (hex) for particle coloring */
  topicColor: string
  /** Base radius of the particle distribution */
  radius: number
  /** Center position in world space */
  position: Position3D
  /** Current view level for LOD */
  viewLevel: ViewLevel
  /** Whether this nebula is active */
  isActive: boolean
  /** Global opacity multiplier */
  opacity?: number
  /** Whether reduced motion is enabled */
  reducedMotion: boolean
}

// =============================================================================
// Constants
// =============================================================================

/** LOD particle counts */
const PARTICLE_COUNTS = {
  universe: 200,
  constellationInactive: 400,
  constellationActive: 1000,
  book: 600,
} as const

/** Particle size range */
const MIN_SIZE = 0.3
const MAX_SIZE = 1.2

/** Drift animation speed */
const DRIFT_SPEED = 0.15

/** Noise scale for drift */
const NOISE_SCALE = 0.1

// =============================================================================
// Gaussian Blob Texture (generated once)
// =============================================================================

let dustTextureCache: THREE.Texture | null = null

function getDustTexture(): THREE.Texture {
  if (dustTextureCache) return dustTextureCache

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Create radial gradient for soft blob
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  dustTextureCache = new THREE.CanvasTexture(canvas)
  dustTextureCache.needsUpdate = true

  return dustTextureCache
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Simple seeded random number generator.
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * Hash a string to a numeric seed.
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

/**
 * Convert hex color to HSL, apply hue shift, convert back to THREE.Color.
 */
function shiftHue(hexColor: string, hueShift: number): THREE.Color {
  const color = new THREE.Color(hexColor)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h = (hsl.h + hueShift + 1) % 1 // Keep in 0-1 range
  color.setHSL(hsl.h, hsl.s, hsl.l)
  return color
}

/**
 * Get particle count based on view level and active state.
 */
function getParticleCount(viewLevel: ViewLevel, isActive: boolean): number {
  switch (viewLevel) {
    case 'universe':
      return PARTICLE_COUNTS.universe
    case 'constellation':
      return isActive ? PARTICLE_COUNTS.constellationActive : PARTICLE_COUNTS.constellationInactive
    case 'book':
      return PARTICLE_COUNTS.book
    default:
      return PARTICLE_COUNTS.universe
  }
}

// =============================================================================
// Particle Data Generation
// =============================================================================

interface ParticleData {
  positions: Float32Array
  sizes: Float32Array
  opacities: Float32Array
  colors: Float32Array
  phases: Float32Array // For animation offset
}

/**
 * Generate particle data for N particles.
 */
function generateParticles(
  count: number,
  radius: number,
  topicColor: string,
  seed: number
): ParticleData {
  const rng = seededRandom(seed)
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // Position: uniform distribution in sphere with density falloff
    let x: number, y: number, z: number, d: number
    do {
      x = rng() * 2 - 1
      y = rng() * 2 - 1
      z = rng() * 2 - 1
      d = x * x + y * y + z * z
    } while (d > 1)

    // Apply radius with slight squeeze on Y axis
    const dist = Math.sqrt(d)
    positions[i * 3] = x * radius * 0.9
    positions[i * 3 + 1] = y * radius * 0.7
    positions[i * 3 + 2] = z * radius * 0.9

    // Size: larger near center
    sizes[i] = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * (1 - dist) * rng()

    // Opacity: higher near center, with randomness
    opacities[i] = (0.3 + 0.7 * (1 - dist)) * (0.5 + 0.5 * rng())

    // Color: shift hue ±10 degrees (±0.028 in 0-1 range)
    const hueShift = (rng() - 0.5) * 0.056
    const particleColor = shiftHue(topicColor, hueShift)
    colors[i * 3] = particleColor.r
    colors[i * 3 + 1] = particleColor.g
    colors[i * 3 + 2] = particleColor.b

    // Phase: for animation offset
    phases[i] = rng() * Math.PI * 2
  }

  return { positions, sizes, opacities, colors, phases }
}

// =============================================================================
// Component
// =============================================================================

export function NebulaDust({
  topicColor,
  radius,
  position,
  viewLevel,
  isActive,
  opacity = 1,
  reducedMotion,
}: NebulaDustProps) {
  const { invalidate } = useThree()
  const setIsParticleDrifting = useLibraryStore((s) => s.setIsParticleDrifting)

  // Refs
  const pointsRef = useRef<THREE.Points>(null)
  const isDriftingRef = useRef(false)
  const timeRef = useRef(0)

  // State for crossfade between LOD levels
  const [currentCount, setCurrentCount] = useState(() => getParticleCount(viewLevel, isActive))

  // Get target particle count
  const targetCount = getParticleCount(viewLevel, isActive)

  // Transition to new count (no crossfade, just regenerate)
  useEffect(() => {
    if (targetCount !== currentCount) {
      setCurrentCount(targetCount)
    }
  }, [targetCount, currentCount])

  // Generate particle data
  const seed = useMemo(() => hashString(topicColor + '_dust'), [topicColor])
  const particleData = useMemo(
    () => generateParticles(currentCount, radius, topicColor, seed),
    [currentCount, radius, topicColor, seed]
  )

  // Get sprite texture
  const texture = useMemo(() => getDustTexture(), [])

  // Create geometry with attributes
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3))
    geom.setAttribute('size', new THREE.BufferAttribute(particleData.sizes, 1))
    geom.setAttribute('opacity', new THREE.BufferAttribute(particleData.opacities, 1))
    geom.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3))
    geom.setAttribute('phase', new THREE.BufferAttribute(particleData.phases, 1))
    return geom
  }, [particleData])

  // Should animate drift?
  const shouldDrift = isActive && !reducedMotion

  // Animation frame
  useFrame((_, delta) => {
    if (!pointsRef.current) return

    // Handle drift animation flag
    if (shouldDrift) {
      if (!isDriftingRef.current) {
        isDriftingRef.current = true
        setIsParticleDrifting(true)
      }

      // Animate particles via noise
      timeRef.current += delta * DRIFT_SPEED
      const positionAttr = pointsRef.current.geometry.getAttribute('position')
      const phaseAttr = pointsRef.current.geometry.getAttribute('phase')

      for (let i = 0; i < currentCount; i++) {
        const phase = phaseAttr.getX(i)
        const baseX = particleData.positions[i * 3]!
        const baseY = particleData.positions[i * 3 + 1]!
        const baseZ = particleData.positions[i * 3 + 2]!

        // Drift via noise
        const t = timeRef.current + phase
        const noiseX = simplex2D(baseX * NOISE_SCALE, t, 0) * 0.5
        const noiseY = simplex2D(baseY * NOISE_SCALE, t, 100) * 0.5
        const noiseZ = simplex2D(baseZ * NOISE_SCALE, t, 200) * 0.5

        positionAttr.setXYZ(i, baseX + noiseX, baseY + noiseY, baseZ + noiseZ)
      }

      positionAttr.needsUpdate = true
      invalidate()
    } else if (isDriftingRef.current) {
      isDriftingRef.current = false
      setIsParticleDrifting(false)

      // Reset to base positions
      const positionAttr = pointsRef.current.geometry.getAttribute('position')
      for (let i = 0; i < currentCount; i++) {
        positionAttr.setXYZ(
          i,
          particleData.positions[i * 3]!,
          particleData.positions[i * 3 + 1]!,
          particleData.positions[i * 3 + 2]!
        )
      }
      positionAttr.needsUpdate = true
      invalidate()
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDriftingRef.current) {
        setIsParticleDrifting(false)
      }
    }
  }, [setIsParticleDrifting])

  return (
    <points ref={pointsRef} position={position}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        map={texture}
        transparent
        opacity={opacity * 0.6}
        size={0.8}
        sizeAttenuation
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
