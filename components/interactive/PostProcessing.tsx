"use client";

import {
	EffectComposer,
	Vignette,
	Bloom,
	Noise,
	ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { QualityTier } from "@/lib/interactive/capabilities";

// =============================================================================
// Types
// =============================================================================

interface PostProcessingProps {
	/** Current quality tier */
	qualityTier: QualityTier;
	/** Whether reduced motion is preferred */
	reducedMotion: boolean;
}

// =============================================================================
// Tier-Specific Composers
// =============================================================================

/**
 * Low tier: Vignette only
 */
function LowTierEffects({ vignetteIntensity }: { vignetteIntensity: number }) {
	return (
		<EffectComposer multisampling={0}>
			<Vignette
				offset={0.3}
				darkness={vignetteIntensity}
				blendFunction={BlendFunction.NORMAL}
			/>
		</EffectComposer>
	);
}

/**
 * Medium tier: Vignette + Bloom
 */
function MediumTierEffects({
	vignetteIntensity,
	bloomIntensity,
	bloomThreshold,
}: {
	vignetteIntensity: number;
	bloomIntensity: number;
	bloomThreshold: number;
}) {
	return (
		<EffectComposer multisampling={0}>
			<Vignette
				offset={0.3}
				darkness={vignetteIntensity}
				blendFunction={BlendFunction.NORMAL}
			/>
			<Bloom
				intensity={bloomIntensity}
				luminanceThreshold={bloomThreshold}
				luminanceSmoothing={0.9}
				mipmapBlur
			/>
		</EffectComposer>
	);
}

/**
 * High tier: Vignette + Bloom + Noise + Chromatic Aberration
 */
function HighTierEffects({
	vignetteIntensity,
	bloomIntensity,
	bloomThreshold,
	noiseOpacity,
	chromaticOffset,
}: {
	vignetteIntensity: number;
	bloomIntensity: number;
	bloomThreshold: number;
	noiseOpacity: number;
	chromaticOffset: number;
}) {
	return (
		<EffectComposer multisampling={4}>
			<Vignette
				offset={0.3}
				darkness={vignetteIntensity}
				blendFunction={BlendFunction.NORMAL}
			/>
			<Bloom
				intensity={bloomIntensity}
				luminanceThreshold={bloomThreshold}
				luminanceSmoothing={0.9}
				mipmapBlur
			/>
			<Noise
				opacity={noiseOpacity}
				blendFunction={BlendFunction.OVERLAY}
			/>
			<ChromaticAberration
				offset={[chromaticOffset, chromaticOffset]}
				radialModulation={false}
				modulationOffset={0.5}
			/>
		</EffectComposer>
	);
}

/**
 * Reduced motion: Vignette only (static effect)
 */
function ReducedMotionEffects() {
	return (
		<EffectComposer multisampling={0}>
			<Vignette
				offset={0.3}
				darkness={0.3}
				blendFunction={BlendFunction.NORMAL}
			/>
		</EffectComposer>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * PostProcessing - Cinematic post-processing effects.
 *
 * Effects are gated by quality tier:
 * - Low: Vignette only
 * - Medium: Vignette + Bloom
 * - High: Vignette + Bloom + Noise + Chromatic Aberration
 *
 * Reduced motion uses minimal static effects only.
 */
export function PostProcessing({ qualityTier, reducedMotion }: PostProcessingProps) {
	// Reduced motion overrides all tiers
	if (reducedMotion) {
		return <ReducedMotionEffects />;
	}

	// Skip post-processing entirely on auto (will default to low)
	if (qualityTier === "auto") {
		return <LowTierEffects vignetteIntensity={0.25} />;
	}

	switch (qualityTier) {
		case "high":
			return (
				<HighTierEffects
					vignetteIntensity={0.4}
					bloomIntensity={0.5}
					bloomThreshold={0.8}
					noiseOpacity={0.05}
					chromaticOffset={0.001}
				/>
			);
		case "medium":
			return (
				<MediumTierEffects
					vignetteIntensity={0.35}
					bloomIntensity={0.3}
					bloomThreshold={0.9}
				/>
			);
		case "low":
		default:
			return <LowTierEffects vignetteIntensity={0.25} />;
	}
}
