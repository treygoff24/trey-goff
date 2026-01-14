'use client'

import { useMemo } from 'react'
import {
  useLibraryStore,
  selectPostprocessingEnabled,
  selectQualityLevel,
} from '@/lib/library/store'
import type { ViewLevel, Position3D } from '@/lib/library/types'
import { NebulaCore } from './NebulaCore'
import { NebulaWisps } from './NebulaWisps'
import { NebulaDust } from './NebulaDust'

interface LivingNebulaProps {
  topic: string
  color: string
  position: Position3D
  radius?: number
  isActive: boolean
  viewLevel: ViewLevel
  transitionPhase: number
  opacity?: number
  reducedMotion: boolean
}

const DEFAULT_RADIUS = 20

type LODTier = 0 | 1 | 2 | 3

const WISP_COUNTS: Record<LODTier, number> = {
  0: 0,
  1: 2,
  2: 5,
  3: 4,
}

const CORE_INTENSITY: Record<LODTier, number> = {
  0: 0.6,
  1: 0.8,
  2: 1.0,
  3: 0.7,
}

const HDR_BOOST = 1.3

function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function calculateLODTier(
  viewLevel: ViewLevel,
  isActive: boolean,
  transitionPhase: number
): LODTier {
  switch (viewLevel) {
    case 'universe':
      if (isActive && transitionPhase > 0.3) {
        return 1
      }
      return 0
    case 'constellation':
      return isActive ? 2 : 0
    case 'book':
      return isActive ? 3 : 0
    default:
      return 0
  }
}

function getEllipsoidScale(topic: string): [number, number, number] {
  const seed = hashString(topic + '_shape')
  const rng = seededRandom(seed)
  return [
    0.85 + rng() * 0.3,
    0.7 + rng() * 0.3,
    0.85 + rng() * 0.3,
  ]
}

export function LivingNebula({
  topic,
  color,
  position,
  radius = DEFAULT_RADIUS,
  isActive,
  viewLevel,
  transitionPhase,
  opacity = 1,
  reducedMotion,
}: LivingNebulaProps) {
  const postprocessingEnabled = useLibraryStore(selectPostprocessingEnabled)
  const qualityLevel = useLibraryStore(selectQualityLevel)

  const lodTier = calculateLODTier(viewLevel, isActive, transitionPhase)

  const ellipsoidScale = useMemo(() => getEllipsoidScale(topic), [topic])

  const coreScale: [number, number, number] = useMemo(
    () => [
      radius * ellipsoidScale[0],
      radius * ellipsoidScale[1],
      radius * ellipsoidScale[2],
    ],
    [radius, ellipsoidScale]
  )

  const baseIntensity = CORE_INTENSITY[lodTier]
  const intensity = postprocessingEnabled
    ? baseIntensity * HDR_BOOST
    : baseIntensity

  const transitionBoost = isActive && transitionPhase > 0 && transitionPhase < 1
    ? 1 + transitionPhase * 0.3
    : 1

  const wispCount = WISP_COUNTS[lodTier]
  const showParticles = lodTier >= 2 && qualityLevel !== 'minimal'

  // Only animate cores that are visible (active or transitioning)
  const shouldAnimateCore = isActive || transitionPhase > 0

  return (
    <group position={position}>
      <NebulaCore
        color={color}
        intensity={intensity * transitionBoost}
        scale={coreScale}
        reducedMotion={reducedMotion}
        opacity={opacity}
        isAnimating={shouldAnimateCore}
      />

      {wispCount > 0 && (
        <NebulaWisps
          topic={topic}
          color={color}
          count={wispCount}
          radius={radius}
          opacity={opacity * 0.7}
          reducedMotion={reducedMotion}
        />
      )}

      {showParticles && (
        <NebulaDust
          topicColor={color}
          radius={radius}
          position={[0, 0, 0]}
          viewLevel={viewLevel}
          isActive={isActive}
          opacity={opacity}
          reducedMotion={reducedMotion}
        />
      )}
    </group>
  )
}
