"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { QualityTier } from "@/lib/interactive/capabilities";

// =============================================================================
// Types
// =============================================================================

export interface FogConfig {
	/** Fog color */
	color: string;
	/** Near distance where fog starts */
	near: number;
	/** Far distance where fog is fully opaque */
	far: number;
}

export interface AtmosphericConfig {
	/** Fog configuration */
	fog?: FogConfig;
	/** Number of dust particles (0 = disabled) */
	dustCount?: number;
	/** Dust particle bounds */
	dustBounds?: { width: number; height: number; depth: number };
	/** Dust drift speed */
	dustSpeed?: number;
	/** Dust particle size */
	dustSize?: number;
	/** Dust color */
	dustColor?: string;
	/** Dust opacity */
	dustOpacity?: number;
}

interface AtmosphericEffectsProps {
	/** Current quality tier */
	qualityTier: QualityTier;
	/** Whether reduced motion is preferred */
	reducedMotion: boolean;
	/** Atmospheric configuration */
	config?: AtmosphericConfig;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: Required<AtmosphericConfig> = {
	fog: {
		color: "#070A0F",
		near: 20,
		far: 100,
	},
	dustCount: 200,
	dustBounds: { width: 60, height: 30, depth: 60 },
	dustSpeed: 0.15,
	dustSize: 0.08,
	dustColor: "#ffffff",
	dustOpacity: 0.3,
};

// Quality tier multipliers for dust count
const DUST_COUNT_MULTIPLIERS: Record<Exclude<QualityTier, "auto">, number> = {
	low: 0,
	medium: 0.5,
	high: 1,
};

// =============================================================================
// Dust Particles Component
// =============================================================================

interface DustParticlesProps {
	count: number;
	bounds: { width: number; height: number; depth: number };
	speed: number;
	size: number;
	color: string;
	opacity: number;
	reducedMotion: boolean;
}

// Seeded random function for deterministic particle generation
function seededRandom(seed: number): number {
	const x = Math.sin(seed * 9999) * 10000;
	return x - Math.floor(x);
}

function DustParticles({
	count,
	bounds,
	speed,
	size,
	color,
	opacity,
	reducedMotion,
}: DustParticlesProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const { camera } = useThree();

	// Reusable temp vector for position updates
	const tempVec = useMemo(() => new THREE.Vector3(), []);

	// Generate initial particle positions and velocities using seeded random
	const { positions, velocities, phases } = useMemo(() => {
		const pos = new Float32Array(count * 3);
		const vel = new Float32Array(count * 3);
		const ph = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			const i3 = i * 3;
			// Seeded random position within bounds
			pos[i3] = (seededRandom(i * 7 + 1) - 0.5) * bounds.width;
			pos[i3 + 1] = seededRandom(i * 7 + 2) * bounds.height;
			pos[i3 + 2] = (seededRandom(i * 7 + 3) - 0.5) * bounds.depth;

			// Seeded random drift velocity (very slow)
			vel[i3] = (seededRandom(i * 7 + 4) - 0.5) * 0.3;
			vel[i3 + 1] = seededRandom(i * 7 + 5) * 0.2 + 0.1; // Slight upward bias
			vel[i3 + 2] = (seededRandom(i * 7 + 6) - 0.5) * 0.3;

			// Seeded random phase for sine wave drift
			ph[i] = seededRandom(i * 7 + 7) * Math.PI * 2;
		}

		return { positions: pos, velocities: vel, phases: ph };
	}, [count, bounds]);

	// Create geometry with position attribute
	const geometry = useMemo(() => {
		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		return geo;
	}, [positions]);

	// Create material
	const material = useMemo(() => {
		return new THREE.PointsMaterial({
			size,
			color: new THREE.Color(color),
			transparent: true,
			opacity,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			sizeAttenuation: true,
		});
	}, [size, color, opacity]);

	// Animate particles
	useFrame((state) => {
		if (!pointsRef.current || reducedMotion) return;

		const positionAttribute = pointsRef.current.geometry.getAttribute(
			"position"
		) as THREE.BufferAttribute;
		const posArray = positionAttribute.array as Float32Array;
		const time = state.clock.elapsedTime;

		// Get camera position for relative positioning
		camera.getWorldPosition(tempVec);

		for (let i = 0; i < count; i++) {
			const i3 = i * 3;

			// Apply velocity with sine wave modulation for organic drift
			const phase = phases[i] ?? 0;
			const sineFactor = Math.sin(time * 0.5 + phase) * 0.5;

			const velX = velocities[i3] ?? 0;
			const velY = velocities[i3 + 1] ?? 0;
			const velZ = velocities[i3 + 2] ?? 0;

			posArray[i3] = (posArray[i3] ?? 0) + velX * speed * (0.016 + sineFactor * 0.008);
			posArray[i3 + 1] = (posArray[i3 + 1] ?? 0) + velY * speed * 0.016;
			posArray[i3 + 2] = (posArray[i3 + 2] ?? 0) + velZ * speed * (0.016 + sineFactor * 0.008);

			// Wrap around bounds (relative to camera)
			const halfWidth = bounds.width / 2;
			const halfDepth = bounds.depth / 2;

			const posX = posArray[i3] ?? 0;
			const posY = posArray[i3 + 1] ?? 0;
			const posZ = posArray[i3 + 2] ?? 0;

			// X wrapping
			if (posX > tempVec.x + halfWidth) {
				posArray[i3] = tempVec.x - halfWidth;
			} else if (posX < tempVec.x - halfWidth) {
				posArray[i3] = tempVec.x + halfWidth;
			}

			// Y wrapping (always wrap to bottom when too high)
			if (posY > bounds.height) {
				posArray[i3 + 1] = 0;
			} else if (posY < 0) {
				posArray[i3 + 1] = bounds.height;
			}

			// Z wrapping
			if (posZ > tempVec.z + halfDepth) {
				posArray[i3 + 2] = tempVec.z - halfDepth;
			} else if (posZ < tempVec.z - halfDepth) {
				posArray[i3 + 2] = tempVec.z + halfDepth;
			}
		}

		positionAttribute.needsUpdate = true;
	});

	if (count === 0) return null;

	return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// =============================================================================
// Fog Component
// =============================================================================

interface SceneFogProps {
	color: string;
	near: number;
	far: number;
}

function SceneFog({ color, near, far }: SceneFogProps) {
	return <fog attach="fog" args={[color, near, far]} />;
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * AtmosphericEffects - Adds fog and floating dust particles for depth and ambiance.
 *
 * Effects are gated by quality tier:
 * - Low: Fog only (no dust particles)
 * - Medium: Fog + 50% dust particles
 * - High: Fog + 100% dust particles
 *
 * Reduced motion disables particle animation.
 */
export function AtmosphericEffects({
	qualityTier,
	reducedMotion,
	config = {},
}: AtmosphericEffectsProps) {
	// Merge config with defaults
	const mergedConfig = useMemo(
		() => ({
			...DEFAULT_CONFIG,
			...config,
			fog: config.fog ?? DEFAULT_CONFIG.fog,
			dustBounds: config.dustBounds ?? DEFAULT_CONFIG.dustBounds,
		}),
		[config]
	);

	// Calculate dust count based on quality tier
	const effectiveTier = qualityTier === "auto" ? "medium" : qualityTier;
	const dustMultiplier = DUST_COUNT_MULTIPLIERS[effectiveTier];
	const effectiveDustCount = Math.floor(mergedConfig.dustCount * dustMultiplier);

	return (
		<>
			{/* Scene fog */}
			{mergedConfig.fog && (
				<SceneFog
					color={mergedConfig.fog.color}
					near={mergedConfig.fog.near}
					far={mergedConfig.fog.far}
				/>
			)}

			{/* Floating dust particles */}
			{effectiveDustCount > 0 && (
				<DustParticles
					count={effectiveDustCount}
					bounds={mergedConfig.dustBounds}
					speed={mergedConfig.dustSpeed}
					size={mergedConfig.dustSize}
					color={mergedConfig.dustColor}
					opacity={mergedConfig.dustOpacity}
					reducedMotion={reducedMotion}
				/>
			)}
		</>
	);
}

// =============================================================================
// Preset Configurations
// =============================================================================

/** Exterior atmosphere - light fog, subtle dust */
export const EXTERIOR_ATMOSPHERE: AtmosphericConfig = {
	fog: {
		color: "#070A0F",
		near: 20,
		far: 100,
	},
	dustCount: 150,
	dustBounds: { width: 80, height: 40, depth: 80 },
	dustSpeed: 0.1,
	dustSize: 0.06,
	dustColor: "#aabbcc",
	dustOpacity: 0.2,
};

/** Interior atmosphere - denser fog, visible dust motes */
export const INTERIOR_ATMOSPHERE: AtmosphericConfig = {
	fog: {
		color: "#0a0c12",
		near: 8,
		far: 40,
	},
	dustCount: 100,
	dustBounds: { width: 30, height: 15, depth: 30 },
	dustSpeed: 0.08,
	dustSize: 0.04,
	dustColor: "#ffeecc",
	dustOpacity: 0.25,
};

/** Library atmosphere - warm, dusty */
export const LIBRARY_ATMOSPHERE: AtmosphericConfig = {
	fog: {
		color: "#0c0a08",
		near: 6,
		far: 35,
	},
	dustCount: 120,
	dustBounds: { width: 25, height: 12, depth: 25 },
	dustSpeed: 0.06,
	dustColor: "#ffd090",
	dustOpacity: 0.3,
	dustSize: 0.05,
};

/** Gym atmosphere - cleaner, less dust */
export const GYM_ATMOSPHERE: AtmosphericConfig = {
	fog: {
		color: "#080a0f",
		near: 10,
		far: 45,
	},
	dustCount: 60,
	dustBounds: { width: 20, height: 10, depth: 20 },
	dustSpeed: 0.05,
	dustColor: "#ccddff",
	dustOpacity: 0.15,
	dustSize: 0.03,
};

/** Projects room atmosphere - tech/clean */
export const PROJECTS_ATMOSPHERE: AtmosphericConfig = {
	fog: {
		color: "#050810",
		near: 10,
		far: 50,
	},
	dustCount: 80,
	dustBounds: { width: 25, height: 12, depth: 25 },
	dustSpeed: 0.04,
	dustColor: "#88aaff",
	dustOpacity: 0.2,
	dustSize: 0.04,
};
