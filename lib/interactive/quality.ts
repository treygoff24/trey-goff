/**
 * Quality tier system for Interactive route.
 * Configures rendering settings based on device capability and user preference.
 */

import type { QualityTier } from "./capabilities";

// =============================================================================
// Quality Settings Types
// =============================================================================

export interface QualitySettings {
	/** Device pixel ratio multiplier */
	dpr: number | [number, number];
	/** Shadow map size (0 = disabled) */
	shadowMapSize: number;
	/** Shadow view distance in meters */
	shadowDistance: number;
	/** LOD bias multiplier (higher = switch to lower LOD sooner) */
	lodBias: number;
	/** Reflection probe resolution */
	reflectionProbeRes: number;
	/** Antialias (multisampling) */
	antialias: boolean;
	/** Post-processing effect settings */
	postprocessing: PostProcessingSettings;
}

export interface PostProcessingSettings {
	/** Vignette settings (null = disabled) */
	vignette: { offset: number; darkness: number } | null;
	/** Bloom settings (null = disabled) */
	bloom: { intensity: number; threshold: number; smoothing: number } | null;
	/** Film grain/noise settings (null = disabled) */
	noise: { opacity: number } | null;
	/** Chromatic aberration settings (null = disabled) */
	chromaticAberration: { offset: number } | null;
	/** SSAO settings (null = disabled) */
	ssao: { intensity: number; radius: number } | null;
	/** Depth of field settings (null = disabled) */
	depthOfField: { focusDistance: number; focalLength: number; bokehScale: number } | null;
	/** Tone mapping mode */
	toneMapping: boolean;
	/** EffectComposer multisampling level */
	multisampling: number;
}

// =============================================================================
// Quality Tier Presets
// =============================================================================

export const QUALITY_PRESETS: Record<Exclude<QualityTier, "auto">, QualitySettings> = {
	low: {
		dpr: 1.0,
		shadowMapSize: 0,
		shadowDistance: 0,
		lodBias: 1.5,
		reflectionProbeRes: 64,
		antialias: false,
		postprocessing: {
			vignette: { offset: 0.3, darkness: 0.25 },
			bloom: null,
			noise: null,
			chromaticAberration: null,
			ssao: null,
			depthOfField: null,
			toneMapping: true,
			multisampling: 0,
		},
	},
	medium: {
		dpr: 1.5,
		shadowMapSize: 1024,
		shadowDistance: 20,
		lodBias: 1.0,
		reflectionProbeRes: 128,
		antialias: true,
		postprocessing: {
			vignette: { offset: 0.3, darkness: 0.35 },
			bloom: { intensity: 0.3, threshold: 0.9, smoothing: 0.9 },
			noise: null,
			chromaticAberration: null,
			ssao: null,
			depthOfField: null,
			toneMapping: true,
			multisampling: 0,
		},
	},
	high: {
		dpr: [1.5, 2.0],
		shadowMapSize: 2048,
		shadowDistance: 40,
		lodBias: 0.8,
		reflectionProbeRes: 256,
		antialias: true,
		postprocessing: {
			vignette: { offset: 0.3, darkness: 0.4 },
			bloom: { intensity: 0.5, threshold: 0.8, smoothing: 0.9 },
			noise: { opacity: 0.05 },
			chromaticAberration: { offset: 0.001 },
			ssao: { intensity: 1.0, radius: 0.05 },
			depthOfField: { focusDistance: 0.02, focalLength: 0.05, bokehScale: 2 },
			toneMapping: true,
			multisampling: 4,
		},
	},
};

/**
 * Get quality settings for a given tier.
 * For "auto", this returns medium as default; actual tier is determined
 * by the auto-tuning system after sampling frames.
 */
export function getQualitySettings(tier: QualityTier): QualitySettings {
	if (tier === "auto") {
		return QUALITY_PRESETS.medium;
	}
	return QUALITY_PRESETS[tier];
}

// =============================================================================
// Auto-Tuning System
// =============================================================================

interface FrameSample {
	frameTime: number;
	timestamp: number;
}

interface AutoTuneState {
	samples: FrameSample[];
	currentTier: Exclude<QualityTier, "auto">;
	sampleCount: number;
	lastAdjustment: number;
	isMobile: boolean;
}

const AUTO_TUNE_CONFIG = {
	/** Number of samples to collect before evaluating */
	sampleWindow: 60,
	/** Interval between samples in ms */
	sampleInterval: 16.67, // ~60fps
	/** P95 threshold for downgrade (ms) */
	downgradeThreshold: 20,
	/** P95 threshold for upgrade (ms) */
	upgradeThreshold: 12,
	/** Minimum time between adjustments (ms) */
	adjustmentCooldown: 5000,
};

/**
 * Create an auto-tune state instance.
 * @param isMobile - If true, never auto-upgrade (battery concern per spec)
 */
export function createAutoTuneState(isMobile: boolean): AutoTuneState {
	return {
		samples: [],
		currentTier: "medium",
		sampleCount: 0,
		lastAdjustment: 0,
		isMobile,
	};
}

/**
 * Record a frame time sample and return any tier adjustment.
 * @returns New tier if adjustment needed, null otherwise
 */
export function recordFrameSample(
	state: AutoTuneState,
	frameTimeMs: number
): Exclude<QualityTier, "auto"> | null {
	const now = performance.now();

	// Add sample
	state.samples.push({ frameTime: frameTimeMs, timestamp: now });
	state.sampleCount++;

	// Keep only recent samples
	const cutoff = now - AUTO_TUNE_CONFIG.sampleWindow * AUTO_TUNE_CONFIG.sampleInterval;
	state.samples = state.samples.filter((s) => s.timestamp > cutoff);

	// Check if we have enough samples and cooldown has passed
	if (
		state.samples.length < AUTO_TUNE_CONFIG.sampleWindow ||
		now - state.lastAdjustment < AUTO_TUNE_CONFIG.adjustmentCooldown
	) {
		return null;
	}

	// Calculate P95 frame time
	const sortedTimes = [...state.samples.map((s) => s.frameTime)].sort((a, b) => a - b);
	const p95Index = Math.floor(sortedTimes.length * 0.95);
	const p95 = sortedTimes[p95Index] ?? 16.67; // Default to ~60fps if undefined

	let newTier: Exclude<QualityTier, "auto"> | null = null;

	// Check for downgrade
	if (p95 > AUTO_TUNE_CONFIG.downgradeThreshold) {
		if (state.currentTier === "high") {
			newTier = "medium";
		} else if (state.currentTier === "medium") {
			newTier = "low";
		}
	}
	// Check for upgrade (never on mobile)
	else if (p95 < AUTO_TUNE_CONFIG.upgradeThreshold && !state.isMobile) {
		if (state.currentTier === "low") {
			newTier = "medium";
		} else if (state.currentTier === "medium") {
			newTier = "high";
		}
	}

	if (newTier) {
		state.currentTier = newTier;
		state.lastAdjustment = now;
		state.samples = []; // Reset samples after adjustment
	}

	return newTier;
}

/**
 * Get the current auto-tuned tier.
 */
export function getAutoTunedTier(state: AutoTuneState): Exclude<QualityTier, "auto"> {
	return state.currentTier;
}

// =============================================================================
// Canvas Configuration
// =============================================================================

/**
 * Get R3F Canvas configuration for a quality tier.
 */
export function getCanvasConfig(settings: QualitySettings) {
	return {
		dpr: settings.dpr,
		gl: {
			antialias: settings.antialias,
			alpha: false,
			stencil: false,
			depth: true,
			powerPreference: "high-performance" as const,
			// Use sRGB color space for proper color handling
			outputColorSpace: "srgb" as const,
		},
		// Tone mapping and color management
		flat: false, // Enable color management
	};
}

/**
 * Apply reduced motion overrides to quality settings.
 * Disables motion effects when user prefers reduced motion.
 */
export function applyReducedMotion(settings: QualitySettings): QualitySettings {
	return {
		...settings,
		postprocessing: {
			...settings.postprocessing,
			noise: null,
			chromaticAberration: null,
			depthOfField: null,
		},
	};
}
