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
	/** Enable bloom effect */
	bloom: boolean;
	/** Enable vignette */
	vignette: boolean;
	/** Enable film grain */
	filmGrain: boolean;
	/** LOD bias multiplier (higher = switch to lower LOD sooner) */
	lodBias: number;
	/** Reflection probe resolution */
	reflectionProbeRes: number;
	/** Enable SSAO */
	ssao: boolean;
	/** Antialias (multisampling) */
	antialias: boolean;
}

// =============================================================================
// Quality Tier Presets
// =============================================================================

export const QUALITY_PRESETS: Record<Exclude<QualityTier, "auto">, QualitySettings> = {
	low: {
		dpr: 1.0,
		shadowMapSize: 0, // No shadows
		shadowDistance: 0,
		bloom: false,
		vignette: false,
		filmGrain: false,
		lodBias: 1.5, // Aggressive LOD switching
		reflectionProbeRes: 64,
		ssao: false,
		antialias: false,
	},
	medium: {
		dpr: 1.5,
		shadowMapSize: 1024,
		shadowDistance: 20,
		bloom: true,
		vignette: true,
		filmGrain: false,
		lodBias: 1.0, // Normal LOD
		reflectionProbeRes: 128,
		ssao: false,
		antialias: true,
	},
	high: {
		dpr: [1.5, 2.0], // Adaptive DPR, max 2.0
		shadowMapSize: 2048,
		shadowDistance: 40,
		bloom: true,
		vignette: true,
		filmGrain: true,
		lodBias: 0.8, // Quality-biased LOD
		reflectionProbeRes: 256,
		ssao: true,
		antialias: true,
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
		filmGrain: false, // Disable film grain animation
		// Note: Camera sway and transitions handled separately
	};
}
