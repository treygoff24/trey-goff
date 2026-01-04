'use client'

/**
 * NebulaCloud - Static glowing cloud effect for constellation background.
 * Previously had breathing animation - removed for performance.
 */

import { useMemo } from 'react'
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

// =============================================================================
// Component
// =============================================================================

export function NebulaCloud({
  color,
  position,
  radius = DEFAULT_RADIUS,
  reducedMotion,
  opacity = 1,
}: NebulaCloudProps) {
  // Parse color
  const baseColor = useMemo(() => new THREE.Color(color), [color])
  
  // Slightly desaturated version for outer glow
  const outerColor = useMemo(() => {
    const c = new THREE.Color(color)
    const hsl = { h: 0, s: 0, l: 0 }
    c.getHSL(hsl)
    c.setHSL(hsl.h, hsl.s * 0.6, hsl.l * 0.8)
    return c
  }, [color])

  // NO useFrame - nebulae are now static for GPU efficiency

  return (
    <group position={position}>
      {/* Outer soft glow */}
      <mesh>
        <sphereGeometry args={[radius * 0.8, 32, 32]} />
        <meshBasicMaterial
          color={outerColor}
          transparent
          opacity={0.04 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Inner brighter core */}
      <mesh>
        <sphereGeometry args={[radius * 0.3, 24, 24]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.08 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
