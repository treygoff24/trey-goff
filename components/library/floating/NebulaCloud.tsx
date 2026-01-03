'use client'

/**
 * NebulaCloud - Glowing cloud effect for constellation background.
 * Uses instanced particles for soft, glowing atmosphere.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// =============================================================================
// Types
// =============================================================================

interface NebulaCloudProps {
  color: string
  position: [number, number, number]
  radius?: number
  particleCount?: number
  reducedMotion: boolean
  opacity?: number
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_RADIUS = 20
const DEFAULT_PARTICLE_COUNT = 150

// =============================================================================
// Helpers
// =============================================================================

function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

// =============================================================================
// Component
// =============================================================================

export function NebulaCloud({
  color,
  position,
  radius = DEFAULT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  reducedMotion,
  opacity = 1,
}: NebulaCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const timeRef = useRef(0)

  // Parse color
  const baseColor = useMemo(() => new THREE.Color(color), [color])

  // Generate particle positions using seeded random
  const { positions, scales, phases } = useMemo(() => {
    const seed = hashString(color + position.join(','))
    const random = createSeededRandom(seed)

    const positions: THREE.Vector3[] = []
    const scales: number[] = []
    const phases: number[] = []

    for (let i = 0; i < particleCount; i++) {
      // Gaussian-like distribution (denser in center)
      const u = random()
      const v = random()
      const gaussianR = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
      const r = Math.abs(gaussianR) * radius * 0.5

      // Random spherical position
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.6 // Flatten vertically
      const z = r * Math.cos(phi)

      positions.push(new THREE.Vector3(x, y, z))

      // Larger particles toward center, smaller at edges
      const distanceRatio = r / radius
      const baseScale = 2 + (1 - distanceRatio) * 4
      scales.push(baseScale + random() * 2)

      // Random phase for animation
      phases.push(random() * Math.PI * 2)
    }

    return { positions, scales, phases }
  }, [color, position, radius, particleCount])

  // Set up instances
  useEffect(() => {
    if (!meshRef.current) return

    const matrix = new THREE.Matrix4()
    const scale = new THREE.Vector3()

    for (let i = 0; i < particleCount; i++) {
      const pos = positions[i]
      const s = scales[i] ?? 1

      if (!pos) continue

      scale.set(s, s, s)
      matrix.makeTranslation(pos.x, pos.y, pos.z)
      matrix.scale(scale)

      meshRef.current.setMatrixAt(i, matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, scales, particleCount])

  // Animate particles (gentle pulse)
  useFrame((_state, delta) => {
    if (reducedMotion || !meshRef.current) return

    timeRef.current += delta * 0.3

    const matrix = new THREE.Matrix4()
    const scale = new THREE.Vector3()
    const tempPos = new THREE.Vector3()

    // Only update a subset each frame for performance
    const updateCount = Math.min(30, particleCount)
    const startIndex = Math.floor((timeRef.current * 10) % particleCount)

    for (let i = startIndex; i < Math.min(startIndex + updateCount, particleCount); i++) {
      const pos = positions[i]
      const baseScale = scales[i] ?? 1
      const phase = phases[i] ?? 0

      if (!pos) continue

      // Gentle pulsing
      const pulse = 0.9 + 0.1 * Math.sin(timeRef.current * 2 + phase)
      const s = baseScale * pulse

      // Slight drift
      const drift = Math.sin(timeRef.current * 0.5 + phase) * 0.2
      tempPos.copy(pos)
      tempPos.y += drift

      scale.set(s, s, s)
      matrix.makeTranslation(tempPos.x, tempPos.y, tempPos.z)
      matrix.scale(scale)

      meshRef.current.setMatrixAt(i, matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={position}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, particleCount]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.08 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Central glow sphere */}
      <mesh>
        <sphereGeometry args={[radius * 0.3, 16, 16]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.05 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
