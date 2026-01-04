'use client'

/**
 * PostProcessingEffects - Cinematic postprocessing for the Floating Library.
 * Wraps EffectComposer with bloom, DOF, vignette, noise, and tone mapping.
 *
 * Configuration varies by view level:
 * - Universe: Light effects, wide DOF
 * - Constellation: Medium effects, DOF on nebula center
 * - Book: Strong effects, tight DOF on selected book
 */

import { useMemo } from 'react'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { VIEW_POSTPROCESSING, type ViewLevel } from '@/lib/library/types'

// =============================================================================
// Types
// =============================================================================

interface PostProcessingEffectsProps {
  /** Current view level for config selection */
  viewLevel: ViewLevel
  /** Whether postprocessing is enabled (for graceful degradation) */
  enabled?: boolean
  /** Whether to disable DOF (e.g., during filter mode) */
  disableDOF?: boolean
}

// =============================================================================
// Sub-components for conditional effects
// =============================================================================

/**
 * EffectComposer with DOF enabled - used when DOF is active.
 */
function EffectsWithDOF({
  viewLevel,
}: {
  viewLevel: ViewLevel
}) {
  const config = VIEW_POSTPROCESSING[viewLevel]
  const { bloom, dof, vignette, noise } = config

  // dof is guaranteed non-null here (checked by caller)
  if (!dof) return null

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={bloom.threshold}
        luminanceSmoothing={bloom.smoothing}
        intensity={bloom.intensity}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={dof.focusDistance}
        focalLength={dof.focalLength}
        bokehScale={dof.bokehScale}
      />
      <Vignette offset={vignette.offset} darkness={vignette.darkness} />
      <Noise opacity={noise.opacity} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

/**
 * EffectComposer without DOF - used when DOF is disabled (filter mode).
 */
function EffectsWithoutDOF({
  viewLevel,
}: {
  viewLevel: ViewLevel
}) {
  const config = VIEW_POSTPROCESSING[viewLevel]
  const { bloom, vignette, noise } = config

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={bloom.threshold}
        luminanceSmoothing={bloom.smoothing}
        intensity={bloom.intensity}
        mipmapBlur
      />
      <Vignette offset={vignette.offset} darkness={vignette.darkness} />
      <Noise opacity={noise.opacity} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PostProcessingEffects({
  viewLevel,
  enabled = true,
  disableDOF = false,
}: PostProcessingEffectsProps) {
  // Get config for current view level
  const config = useMemo(() => VIEW_POSTPROCESSING[viewLevel], [viewLevel])

  // Don't render if disabled
  if (!enabled) {
    return null
  }

  // Use separate components to avoid conditional children in EffectComposer
  // (EffectComposer doesn't accept false/null children)
  const shouldUseDOF = config.dof !== null && !disableDOF

  if (shouldUseDOF) {
    return <EffectsWithDOF viewLevel={viewLevel} />
  }

  return <EffectsWithoutDOF viewLevel={viewLevel} />
}
