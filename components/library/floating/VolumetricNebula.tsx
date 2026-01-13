'use client'

/**
 * VolumetricNebula - Slice-volume nebula with parallax depth.
 *
 * Renders N camera-facing planes (billboards) distributed within an ellipsoid.
 * Each slice uses a shared procedural texture with randomized UV offset/scale.
 * HDR emissive values for bloom, with UV animation when active.
 *
 * LOD levels:
 * - Universe: 8 slices
 * - Constellation (inactive): 12 slices
 * - Constellation (active): 48 slices
 * - Book: 24 slices
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'
import { getNebulaTexture } from '@/lib/library/nebulaTextures'
import { getBlenderNebulaTexture } from '@/lib/library/blenderNebulaTextures'
import {
  useLibraryStore,
  selectPostprocessingEnabled,
  selectNebulaTextureMode,
  selectBlenderTexturesLoaded,
} from '@/lib/library/store'
import type { ViewLevel, Position3D } from '@/lib/library/types'

// =============================================================================
// Types
// =============================================================================

interface VolumetricNebulaProps {
  /** Topic name for texture and color */
  topic: string
  /** Topic color (hex) */
  color: string
  /** Center position in world space */
  position: Position3D
  /** Base radius of the nebula */
  radius?: number
  /** Whether this nebula is the active constellation */
  isActive: boolean
  /** Current view level */
  viewLevel: ViewLevel
  /** Transition progress (0-1) when approaching this nebula */
  transitionPhase: number
  /** Global opacity multiplier */
  opacity?: number
  /** Whether reduced motion is enabled */
  reducedMotion: boolean
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_RADIUS = 20

/** LOD slice counts by state - optimized for GPU performance */
const SLICE_COUNTS = {
  universe: 2,           // Minimal for distant view - just 2 slices
  constellationInactive: 4,  // Reduced further
  constellationActive: 12,   // Reduced from 16
  book: 6,               // Reduced from 8
} as const

/** HDR emissive intensities - lowered for softer glow */
const EMISSIVE_INTENSITY = {
  base: 0.8,
  active: 1.2,
  brightened: 1.6, // During transition
} as const

/** Fallback emissive (when postprocessing disabled) */
const FALLBACK_EMISSIVE_INTENSITY = {
  base: 0.3,
  active: 0.5,
  brightened: 0.6,
} as const

/** UV animation speed */
const UV_ANIMATION_SPEED = 0.02

/** LOD crossfade duration in seconds - set low for faster transition */
const CROSSFADE_DURATION = 0.05

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
 * Get axis ratios for ellipsoid shape based on topic.
 */
function getEllipsoidAxes(topic: string): [number, number, number] {
  const seed = hashString(topic)
  const rng = seededRandom(seed)
  // Ratios between 0.8 and 1.2
  return [
    0.8 + rng() * 0.4,
    0.8 + rng() * 0.4,
    0.8 + rng() * 0.4,
  ]
}

/**
 * Get the slice count based on view level and active state.
 */
function getSliceCount(viewLevel: ViewLevel, isActive: boolean): number {
  switch (viewLevel) {
    case 'universe':
      return SLICE_COUNTS.universe
    case 'constellation':
      return isActive ? SLICE_COUNTS.constellationActive : SLICE_COUNTS.constellationInactive
    case 'book':
      return SLICE_COUNTS.book
    default:
      return SLICE_COUNTS.universe
  }
}

// =============================================================================
// Slice Data Generation
// =============================================================================

interface SliceData {
  position: THREE.Vector3
  scale: number
  uvOffset: [number, number]
  uvScale: number
  rotation: number
}

/**
 * Generate deterministic slice positions within an ellipsoid.
 */
function generateSlices(
  count: number,
  radius: number,
  topic: string
): SliceData[] {
  const seed = hashString(topic + '_slices')
  const rng = seededRandom(seed)
  const axes = getEllipsoidAxes(topic)
  const slices: SliceData[] = []

  for (let i = 0; i < count; i++) {
    // Uniform distribution in ellipsoid using rejection sampling
    let x: number, y: number, z: number, d: number
    do {
      x = (rng() * 2 - 1)
      y = (rng() * 2 - 1)
      z = (rng() * 2 - 1)
      d = x * x + y * y + z * z
    } while (d > 1)

    // Apply ellipsoid axes
    const pos = new THREE.Vector3(
      x * radius * axes[0],
      y * radius * axes[1],
      z * radius * axes[2]
    )

    // Varied slice sizes - smaller overall for more organic look
    // Core slices larger, outer slices smaller and wispier
    const distFromCenter = Math.sqrt(d)
    const baseSize = radius * (0.4 + rng() * 0.4) // 0.4 to 0.8 of radius
    const distanceScale = 1.0 - distFromCenter * 0.5 // Smaller at edges
    const scale = baseSize * distanceScale

    // Random UV offset and scale for variety
    const uvOffset: [number, number] = [rng() * 0.5, rng() * 0.5]
    // Lower uvScale = lower opacity per slice (used as opacity multiplier)
    const uvScale = 0.15 + rng() * 0.25 // 0.15 to 0.4 - much softer

    // Random rotation for variety
    const rotation = rng() * Math.PI * 2

    slices.push({ position: pos, scale, uvOffset, uvScale, rotation })
  }

  return slices
}

// =============================================================================
// Single Slice Component
// =============================================================================

interface NebulaSliceProps {
  data: SliceData
  texture: THREE.Texture
  color: THREE.Color
  emissiveIntensity: number
  opacity: number
  uvAnimationOffset: number
  /** True when using Blender pre-rendered textures (color baked in) */
  isBlenderTexture: boolean
}

function NebulaSlice({
  data,
  texture,
  color,
  emissiveIntensity,
  opacity,
  uvAnimationOffset,
  isBlenderTexture,
}: NebulaSliceProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  // Update UV offset for animation
  useEffect(() => {
    if (materialRef.current?.map) {
      materialRef.current.map.offset.set(
        data.uvOffset[0] + uvAnimationOffset,
        data.uvOffset[1] + uvAnimationOffset * 0.7
      )
    }
  }, [data.uvOffset, uvAnimationOffset])

  return (
    <Billboard position={data.position} follow lockX={false} lockY={false} lockZ={false}>
      <mesh rotation={[0, 0, data.rotation]}>
        <planeGeometry args={[data.scale, data.scale]} />
        {isBlenderTexture ? (
          // Blender textures: Use emissiveMap for HDR bloom (texture has color baked in)
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            emissiveMap={texture}
            emissive="#ffffff"
            emissiveIntensity={emissiveIntensity * 2.5}
            transparent
            opacity={opacity * Math.min(data.uvScale * 6, 0.95)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        ) : (
          // Procedural textures: MeshStandardMaterial with emissive color
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            color="#000000"
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            transparent
            opacity={opacity * data.uvScale * 3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </Billboard>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function VolumetricNebula({
  topic,
  color,
  position,
  radius = DEFAULT_RADIUS,
  isActive,
  viewLevel,
  transitionPhase,
  opacity = 1,
  reducedMotion,
}: VolumetricNebulaProps) {
  const { invalidate } = useThree()
  const postprocessingEnabled = useLibraryStore(selectPostprocessingEnabled)
  const setIsUvPanning = useLibraryStore((s) => s.setIsUvPanning)

  // Nebula texture mode (Blender vs procedural)
  const nebulaTextureMode = useLibraryStore(selectNebulaTextureMode)
  const blenderTexturesLoaded = useLibraryStore(selectBlenderTexturesLoaded)

  // Animation state (using state for render-time values)
  const [uvOffset, setUvOffset] = useState(0)
  const [crossfadeProgress, setCrossfadeProgress] = useState(1)
  const isAnimatingRef = useRef(false)

  // Track previous slice count for crossfade
  const [prevSliceCount, setPrevSliceCount] = useState<number | null>(null)

  // Get current slice count
  const sliceCount = getSliceCount(viewLevel, isActive)

  // Determine if using Blender texture (mode is blender AND textures are loaded AND we have one for this topic)
  const isBlenderTexture = useMemo(() => {
    if (nebulaTextureMode !== 'blender' || !blenderTexturesLoaded) return false
    return getBlenderNebulaTexture(topic) !== null
  }, [nebulaTextureMode, blenderTexturesLoaded, topic])

  // Get texture (cached) - Blender if available, procedural as fallback
  // IMPORTANT: Clone Blender textures to avoid shared UV offset mutation
  const texture = useMemo(() => {
    // Try Blender texture first if mode is set and loaded
    if (nebulaTextureMode === 'blender' && blenderTexturesLoaded) {
      const blenderTex = getBlenderNebulaTexture(topic)
      if (blenderTex) {
        // Clone to avoid shared UV offset mutation across nebulae
        const cloned = blenderTex.clone()
        cloned.userData.__nebulaBlenderClone = true
        cloned.wrapS = THREE.RepeatWrapping
        cloned.wrapT = THREE.RepeatWrapping
        return cloned
      }
    }
    // Fall back to procedural (already unique per topic)
    const tex = getNebulaTexture(topic)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [topic, nebulaTextureMode, blenderTexturesLoaded])

  // Dispose cloned texture on unmount or when texture changes
  useEffect(() => {
    return () => {
      // Only dispose cloned Blender textures, never cached procedural textures
      if (texture.userData?.__nebulaBlenderClone) {
        texture.dispose()
      }
    }
  }, [texture])

  // Generate slice data (memoized, regenerates on slice count change)
  const slices = useMemo(
    () => generateSlices(sliceCount, radius, topic),
    [sliceCount, radius, topic]
  )

  // Previous slices for crossfade
  const prevSlices = useMemo(() => {
    if (prevSliceCount !== null && prevSliceCount !== sliceCount) {
      return generateSlices(prevSliceCount, radius, topic)
    }
    return null
  }, [prevSliceCount, sliceCount, radius, topic])

  // Track slice count changes for crossfade
  useEffect(() => {
    if (prevSliceCount !== null && prevSliceCount !== sliceCount) {
      setCrossfadeProgress(0)
    }
    setPrevSliceCount(sliceCount)
  }, [sliceCount, prevSliceCount])

  // Parse color
  const nebulaColor = useMemo(() => new THREE.Color(color), [color])

  // Calculate emissive intensity
  const emissiveIntensity = useMemo((): number => {
    const intensities = postprocessingEnabled ? EMISSIVE_INTENSITY : FALLBACK_EMISSIVE_INTENSITY

    // Base intensity
    let intensity: number = isActive ? intensities.active : intensities.base

    // Brighten during transition (0 -> 1 = normal -> brightened)
    if (transitionPhase > 0 && transitionPhase < 1) {
      intensity = THREE.MathUtils.lerp(intensity, intensities.brightened, transitionPhase)
    }

    return intensity
  }, [isActive, transitionPhase, postprocessingEnabled])

  // Should animate UV?
  const shouldAnimateUV = isActive && viewLevel === 'constellation' && !reducedMotion

  // UV animation frame loop
  useFrame((_, delta) => {
    let needsUpdate = false

    // Handle UV animation
    if (shouldAnimateUV) {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true
        setIsUvPanning(true)
      }
      setUvOffset((prev) => prev + delta * UV_ANIMATION_SPEED)
      needsUpdate = true
    } else if (isAnimatingRef.current) {
      isAnimatingRef.current = false
      setIsUvPanning(false)
    }

    // Handle crossfade
    if (crossfadeProgress < 1) {
      setCrossfadeProgress((prev) => Math.min(1, prev + delta / CROSSFADE_DURATION))
      needsUpdate = true
    }

    if (needsUpdate) {
      invalidate()
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isAnimatingRef.current) {
        setIsUvPanning(false)
      }
    }
  }, [setIsUvPanning])

  return (
    <group position={position}>
      {/* Previous slices (fading out during crossfade) */}
      {prevSlices && crossfadeProgress < 1 && prevSlices.map((slice, i) => (
        <NebulaSlice
          key={`prev-${i}`}
          data={slice}
          texture={texture}
          color={nebulaColor}
          emissiveIntensity={emissiveIntensity}
          opacity={opacity * (1 - crossfadeProgress)}
          uvAnimationOffset={uvOffset}
          isBlenderTexture={isBlenderTexture}
        />
      ))}

      {/* Current slices (fading in during crossfade) */}
      {slices.map((slice, i) => (
        <NebulaSlice
          key={`slice-${i}`}
          data={slice}
          texture={texture}
          color={nebulaColor}
          emissiveIntensity={emissiveIntensity}
          opacity={opacity * (prevSlices ? crossfadeProgress : 1)}
          uvAnimationOffset={uvOffset}
          isBlenderTexture={isBlenderTexture}
        />
      ))}
    </group>
  )
}
