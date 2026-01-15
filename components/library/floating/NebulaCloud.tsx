'use client'

/**
 * NebulaCloud - Static glowing cloud effect for constellation background.
 * Uses HDR emissive values for bloom effect when postprocessing is enabled.
 * Previously had breathing animation - removed for performance.
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { useLibraryStore, selectPostprocessingEnabled } from '@/lib/library/store'

// =============================================================================
// Types
// =============================================================================

interface NebulaCloudProps {
  color: string
  position: [number, number, number]
  radius?: number
  opacity?: number
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_RADIUS = 20

/** HDR emissive intensity when postprocessing is enabled (caught by bloom) */
const HDR_EMISSIVE_INTENSITY = 2.0

/** Non-HDR emissive intensity fallback (when postprocessing disabled) */
const FALLBACK_EMISSIVE_INTENSITY = 0.8

// =============================================================================
// Component
// =============================================================================

export function NebulaCloud({
  color,
  position,
  radius = DEFAULT_RADIUS,
  opacity = 1,
}: NebulaCloudProps) {
  // Check if postprocessing is enabled for HDR vs fallback emissive
  const postprocessingEnabled = useLibraryStore(selectPostprocessingEnabled)
  
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

  // Emissive intensity: HDR when postprocessing enabled, clamped otherwise
  const emissiveIntensity = postprocessingEnabled
    ? HDR_EMISSIVE_INTENSITY
    : FALLBACK_EMISSIVE_INTENSITY

  // NO useFrame - nebulae are now static for GPU efficiency

  return (
    <group position={position}>
      {/* Outer soft glow - uses emissive for HDR bloom */}
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

      {/* Inner brighter core - HDR emissive for bloom */}
      <mesh>
        <sphereGeometry args={[radius * 0.3, 24, 24]} />
        <meshStandardMaterial
          color="#000000"
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.3 * opacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
