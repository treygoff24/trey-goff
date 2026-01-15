'use client'

/**
 * StarField - Multi-layer parallax star field with warp stretch.
 *
 * Three layers with different parallax factors create depth perception.
 * During transitions, stars stretch in Z to create a warp effect.
 *
 * Layer specs:
 * - Far:  2000 stars, size 0.2-0.5, depth 800-1000, parallax 0.1x
 * - Mid:  1000 stars, size 0.4-0.8, depth 400-600, parallax 0.3x
 * - Near: 300 stars, size 0.6-1.2, depth 200-300, parallax 0.6x
 *
 * Color distribution:
 * - 90% white (#FFFFFF)
 * - 5% warm (#FFE4B5)
 * - 5% cool (#B0E0E6)
 * - 1 in 50 bright stars: 1.5x size
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLibraryStore, selectTransitionPhase } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface StarFieldProps {
  reducedMotion: boolean
}

interface StarLayerConfig {
  count: number
  sizeMin: number
  sizeMax: number
  depthMin: number
  depthMax: number
  parallaxFactor: number
}

// =============================================================================
// Constants
// =============================================================================

/** Layer configurations */
const LAYERS: StarLayerConfig[] = [
  { count: 2000, sizeMin: 0.2, sizeMax: 0.5, depthMin: 800, depthMax: 1000, parallaxFactor: 0.1 },
  { count: 1000, sizeMin: 0.4, sizeMax: 0.8, depthMin: 400, depthMax: 600, parallaxFactor: 0.3 },
  { count: 300, sizeMin: 0.6, sizeMax: 1.2, depthMin: 200, depthMax: 300, parallaxFactor: 0.6 },
]

/** Color distribution */
const COLORS = {
  white: new THREE.Color('#FFFFFF'),
  warm: new THREE.Color('#FFE4B5'),
  cool: new THREE.Color('#B0E0E6'),
}

/** Probability thresholds */
const WARM_THRESHOLD = 0.90 // 90% white, then warm
const COOL_THRESHOLD = 0.95 // 5% warm, 5% cool
const BRIGHT_PROBABILITY = 1 / 50 // 1 in 50 are bright

// =============================================================================
// Helpers
// =============================================================================

/**
 * Seeded random number generator for deterministic positions.
 * Uses a simple LCG (Linear Congruential Generator).
 */
function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

// =============================================================================
// Star Layer Component
// =============================================================================

interface StarLayerProps {
  config: StarLayerConfig
  layerIndex: number
  warpFactor: number
  reducedMotion: boolean
  isTransitioning: boolean
}

function StarLayer({
  config,
  layerIndex,
  warpFactor,
  reducedMotion,
  isTransitioning,
}: StarLayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera, invalidate } = useThree()

  // Track parallax offset internally
  const parallaxOffset = useRef(new THREE.Vector3())
  const prevCameraPos = useRef(new THREE.Vector3())

  // Reusable objects for useFrame - avoid per-frame allocations
  const tempMatrix = useRef(new THREE.Matrix4())
  const tempPosition = useRef(new THREE.Vector3())
  const tempScale = useRef(new THREE.Vector3())
  const tempCameraDelta = useRef(new THREE.Vector3())
  // Generate star data
  const starData = useMemo(() => {
    // Different seed per layer for variety
    const random = createSeededRandom(42 + layerIndex * 1000)

    const positions: THREE.Vector3[] = []
    const basePositions: THREE.Vector3[] = [] // Store original positions for parallax
    const colors: THREE.Color[] = []
    const sizes: number[] = []
    const brightnesses: number[] = []

    for (let i = 0; i < config.count; i++) {
      // Random position on sphere shell between depthMin and depthMax
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const depth = config.depthMin + random() * (config.depthMax - config.depthMin)

      const x = depth * Math.sin(phi) * Math.cos(theta)
      const y = depth * Math.sin(phi) * Math.sin(theta)
      const z = depth * Math.cos(phi)

      const pos = new THREE.Vector3(x, y, z)
      positions.push(pos.clone())
      basePositions.push(pos.clone())

      // Color selection
      const colorRoll = random()
      let color: THREE.Color
      if (colorRoll < WARM_THRESHOLD) {
        color = COLORS.white.clone()
      } else if (colorRoll < COOL_THRESHOLD) {
        color = COLORS.warm.clone()
      } else {
        color = COLORS.cool.clone()
      }
      colors.push(color)

      // Size with bright star chance
      const isBright = random() < BRIGHT_PROBABILITY
      const baseSize = config.sizeMin + random() * (config.sizeMax - config.sizeMin)
      sizes.push(isBright ? baseSize * 1.5 : baseSize)

      // Brightness (higher for bright stars)
      brightnesses.push(isBright ? 1.0 : 0.4 + random() * 0.4)
    }

    return { positions, basePositions, colors, sizes, brightnesses }
  }, [config, layerIndex])

  // Create color buffer
  const colorBuffer = useMemo(() => {
    const arr = new Float32Array(config.count * 3)
    for (let i = 0; i < config.count; i++) {
      const color = starData.colors[i]!
      const brightness = starData.brightnesses[i]!
      arr[i * 3] = color.r * brightness
      arr[i * 3 + 1] = color.g * brightness
      arr[i * 3 + 2] = color.b * brightness
    }
    return arr
  }, [config.count, starData])

  // Store previous warp for change detection
  const prevWarpRef = useRef(0)
  const needsUpdateRef = useRef(true)

  // Apply transforms in useFrame - handles parallax, warp, and initial setup
  useFrame(() => {
    if (!meshRef.current) return

    // Skip if reduced motion and not transitioning
    if (reducedMotion && !isTransitioning && !needsUpdateRef.current) return

    // Calculate camera delta for parallax - reuse temp vector
    const cameraDelta = tempCameraDelta.current.subVectors(camera.position, prevCameraPos.current)
    const cameraMovedSignificantly = cameraDelta.lengthSq() > 0.0001

    // Check if warp changed
    const warpDelta = Math.abs(warpFactor - prevWarpRef.current)
    const warpChanged = warpDelta > 0.001

    // Determine if update needed
    const shouldUpdate = needsUpdateRef.current || cameraMovedSignificantly || warpChanged || isTransitioning

    if (!shouldUpdate) return

    // Update parallax offset based on camera movement
    if (cameraMovedSignificantly) {
      parallaxOffset.current.x -= cameraDelta.x * config.parallaxFactor
      parallaxOffset.current.y -= cameraDelta.y * config.parallaxFactor
      parallaxOffset.current.z -= cameraDelta.z * config.parallaxFactor

      // Wrap positions to prevent drift (soft wrap within layer bounds)
      const maxDrift = config.depthMax * 0.2
      if (parallaxOffset.current.length() > maxDrift) {
        parallaxOffset.current.multiplyScalar(0.95) // Gradual reset
      }

      prevCameraPos.current.copy(camera.position)
    }

    // Update instance matrices - reuse temp objects
    const matrix = tempMatrix.current
    const position = tempPosition.current
    const scale = tempScale.current
    const offset = parallaxOffset.current

    for (let i = 0; i < config.count; i++) {
      const basePos = starData.basePositions[i]!
      const size = starData.sizes[i]!

      // Apply parallax offset
      position.set(
        basePos.x + offset.x,
        basePos.y + offset.y,
        basePos.z + offset.z
      )

      // Apply warp stretch in Z direction
      const warpZ = reducedMotion ? 1 : 1 + warpFactor * 0.5
      scale.set(size, size, size * warpZ)

      matrix.makeTranslation(position.x, position.y, position.z)
      matrix.scale(scale)

      meshRef.current.setMatrixAt(i, matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    prevWarpRef.current = warpFactor
    needsUpdateRef.current = false
    invalidate()
  })

  // Initial setup
  useEffect(() => {
    needsUpdateRef.current = true
  }, [])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, config.count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        transparent
        opacity={0.9}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colorBuffer, 3]}
      />
    </instancedMesh>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function StarField({ reducedMotion }: StarFieldProps) {
  const transitionPhase = useLibraryStore(selectTransitionPhase)
  const isTransitioning = useLibraryStore((s) => s.isTransitioning)

  // Computed warp factor - ramps 0-0.5 during first half of transition
  const warpFactor = useMemo(() => {
    if (reducedMotion) return 0
    // Ramp up 0-0.3s (phase 0-0.5), then settle
    if (transitionPhase <= 0.5) {
      return transitionPhase * 2 // 0 to 1 during first half
    }
    // Ease out during second half
    return 1 - (transitionPhase - 0.5) * 2
  }, [transitionPhase, reducedMotion])

  return (
    <group>
      {LAYERS.map((config, index) => (
        <StarLayer
          key={index}
          config={config}
          layerIndex={index}
          warpFactor={warpFactor}
          reducedMotion={reducedMotion}
          isTransitioning={isTransitioning}
        />
      ))}
    </group>
  )
}
