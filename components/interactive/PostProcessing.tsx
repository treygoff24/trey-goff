"use client";

/**
 * PostProcessing - Cinematic post-processing effects for Interactive route.
 *
 * Effects are gated by quality tier from QUALITY_PRESETS:
 * - Low: Vignette + ToneMapping
 * - Medium: Vignette + Bloom + ToneMapping
 * - High: Vignette + Bloom + Noise + ChromaticAberration + SSAO + DOF + ToneMapping
 *
 * Reduced motion disables animated effects (noise, chromatic aberration, DOF).
 */

import { EffectComposer, Vignette, Bloom, Noise, ChromaticAberration, DepthOfField, ToneMapping, SSAO } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { getQualitySettings, applyReducedMotion, type PostProcessingSettings } from "@/lib/interactive/quality";
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
// Effect Renderers
// =============================================================================

/**
 * Render effects based on PostProcessingSettings.
 * Uses separate EffectComposer configurations to avoid conditional children issues.
 */
function EffectsRenderer({ settings }: { settings: PostProcessingSettings }) {
	const { vignette, bloom, noise, chromaticAberration, ssao, depthOfField, toneMapping, multisampling } = settings;

	// Build effect list based on what's enabled
	const effects: React.ReactElement[] = [];

	if (ssao) {
		effects.push(
			<SSAO
				key="ssao"
				intensity={ssao.intensity}
				radius={ssao.radius}
				luminanceInfluence={0.5}
				bias={0.025}
			/>
		);
	}

	if (depthOfField) {
		effects.push(
			<DepthOfField
				key="dof"
				focusDistance={depthOfField.focusDistance}
				focalLength={depthOfField.focalLength}
				bokehScale={depthOfField.bokehScale}
			/>
		);
	}

	if (bloom) {
		effects.push(
			<Bloom
				key="bloom"
				intensity={bloom.intensity}
				luminanceThreshold={bloom.threshold}
				luminanceSmoothing={bloom.smoothing}
				mipmapBlur
			/>
		);
	}

	if (vignette) {
		effects.push(
			<Vignette
				key="vignette"
				offset={vignette.offset}
				darkness={vignette.darkness}
				blendFunction={BlendFunction.NORMAL}
			/>
		);
	}

	if (noise) {
		effects.push(
			<Noise
				key="noise"
				opacity={noise.opacity}
				blendFunction={BlendFunction.OVERLAY}
			/>
		);
	}

	if (chromaticAberration) {
		effects.push(
			<ChromaticAberration
				key="chromatic"
				offset={[chromaticAberration.offset, chromaticAberration.offset]}
				radialModulation={false}
				modulationOffset={0.5}
			/>
		);
	}

	if (toneMapping) {
		effects.push(<ToneMapping key="tonemapping" mode={ToneMappingMode.ACES_FILMIC} />);
	}

	if (effects.length === 0) {
		return null;
	}

	return (
		<EffectComposer multisampling={multisampling}>
			{effects}
		</EffectComposer>
	);
}

// =============================================================================
// Main Component
// =============================================================================

export function PostProcessing({ qualityTier, reducedMotion }: PostProcessingProps) {
	// Get settings for the current tier
	let settings = getQualitySettings(qualityTier);

	// Apply reduced motion overrides
	if (reducedMotion) {
		settings = applyReducedMotion(settings);
	}

	return <EffectsRenderer settings={settings.postprocessing} />;
}
