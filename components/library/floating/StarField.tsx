'use client'

/**
 * StarField - Static star field background.
 * Previously had twinkle animation - removed for performance (was causing constant GPU usage).
 * Stars are now static but still vary in brightness and size.
 */

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'

// =============================================================================
// Types
// =============================================================================

interface StarFieldProps {
  reducedMotion: boolean
  count?: number
  radius?: number
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_COUNT = 2000
const DEFAULT_RADIUS = 500

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
// Component
// =============================================================================

export function StarField({
  reducedMotion,
  count = DEFAULT_COUNT,
  radius = DEFAULT_RADIUS,
}: StarFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Generate star positions (using seeded random for determinism)
  const { positions, baseOpacities, sizes } = useMemo(() => {
    // Use a fixed seed for deterministic star field
    const random = createSeededRandom(42)

    const positions: THREE.Vector3[] = []
    const baseOpacities: number[] = []
    const sizes: number[] = []

    for (let i = 0; i < count; i++) {
      // Random position on sphere
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      const r = radius * (0.3 + random() * 0.7) // Vary distance

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positions.push(new THREE.Vector3(x, y, z))

      // Random base brightness (some stars brighter than others)
      baseOpacities.push(0.3 + random() * 0.7)

      // Random size (smaller stars more common)
      sizes.push(0.3 + Math.pow(random(), 2) * 0.7)
    }

    return { positions, baseOpacities, sizes }
  }, [count, radius])

  // Create instance colors for brightness variation
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const brightness = baseOpacities[i] ?? 0.5
      arr[i * 3] = brightness
      arr[i * 3 + 1] = brightness
      arr[i * 3 + 2] = brightness
    }
    return arr
  }, [count, baseOpacities])

  // Set up instances (in useEffect to avoid ref access during render)
  useEffect(() => {
    if (!meshRef.current) return

    const matrix = new THREE.Matrix4()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      const pos = positions[i]
      if (!pos) continue

      // Use precomputed size
      const size = sizes[i] ?? 0.5
      scale.set(size, size, size)

      matrix.makeTranslation(pos.x, pos.y, pos.z)
      matrix.scale(scale)

      meshRef.current.setMatrixAt(i, matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, count, sizes])

  // NO useFrame - stars are now static for GPU efficiency

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        transparent
        opacity={0.8}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colors, 3]}
      />
    </instancedMesh>
  )
}
