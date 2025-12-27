"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { QualityTier } from "@/lib/interactive/capabilities";
import {
	getQualitySettings,
	getCanvasConfig,
	applyReducedMotion,
	createAutoTuneState,
	recordFrameSample,
	type QualitySettings,
} from "@/lib/interactive/quality";
import { initializeLoaders, disposeLoaders } from "@/lib/interactive/loaders";

// =============================================================================
// Types
// =============================================================================

interface RendererRootProps {
	qualityTier: QualityTier;
	reducedMotion: boolean;
	onReady: () => void;
	onError: (error: Error) => void;
	onTierChange?: (tier: Exclude<QualityTier, "auto">) => void;
	isMobile: boolean;
	children: React.ReactNode;
}

// =============================================================================
// Shader Warmup System
// =============================================================================

/**
 * Materials to pre-compile for shader warmup.
 * Add materials used in the scene to prevent first-frame jank.
 */
function getWarmupMaterials(): THREE.Material[] {
	return [
		// Basic materials
		new THREE.MeshBasicMaterial({ color: 0xffffff }),
		// PBR materials with common configurations
		new THREE.MeshStandardMaterial({
			color: 0x888888,
			roughness: 0.5,
			metalness: 0.0,
		}),
		new THREE.MeshStandardMaterial({
			color: 0x888888,
			roughness: 0.3,
			metalness: 1.0,
		}),
		// Physical materials for more advanced effects
		new THREE.MeshPhysicalMaterial({
			color: 0x888888,
			roughness: 0.1,
			metalness: 0.9,
			clearcoat: 1.0,
		}),
		// Line materials
		new THREE.LineBasicMaterial({ color: 0xffffff }),
		// Point materials
		new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 }),
	];
}

/**
 * Pre-compile shaders by rendering materials off-screen.
 * This prevents shader compilation stutter on first visible render.
 */
function warmupShaders(
	gl: THREE.WebGLRenderer,
	scene: THREE.Scene,
	camera: THREE.Camera
): void {
	const warmupMaterials = getWarmupMaterials();
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const meshes: THREE.Mesh[] = [];

	// Create and add meshes with warmup materials
	for (const material of warmupMaterials) {
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(0, 0, -10000); // Off-screen
		scene.add(mesh);
		meshes.push(mesh);
	}

	// Render once to compile all shaders
	gl.compile(scene, camera);

	// Clean up
	for (const mesh of meshes) {
		scene.remove(mesh);
		mesh.geometry.dispose();
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((m) => m.dispose());
		} else {
			mesh.material.dispose();
		}
	}
	geometry.dispose();

	// Dispose warmup materials
	warmupMaterials.forEach((m) => m.dispose());
}

// =============================================================================
// Setup Component (runs inside Canvas)
// =============================================================================

interface SetupProps {
	qualityTier: QualityTier;
	isMobile: boolean;
	onReady: () => void;
	onError: (error: Error) => void;
	onTierChange?: (tier: Exclude<QualityTier, "auto">) => void;
}

function Setup({
	qualityTier,
	isMobile,
	onReady,
	onError,
	onTierChange,
}: SetupProps) {
	const { gl, scene, camera } = useThree();
	const isInitialized = useRef(false);
	const autoTuneState = useRef<ReturnType<typeof createAutoTuneState> | null>(null);
	const lastTime = useRef(0);

	// Initialize auto-tune state once on mount
	useEffect(() => {
		if (qualityTier === "auto" && !autoTuneState.current) {
			autoTuneState.current = createAutoTuneState(isMobile);
		}
		lastTime.current = performance.now();
	}, [qualityTier, isMobile]);

	// Initialize loaders and warm up shaders
	useEffect(() => {
		if (isInitialized.current) return;

		try {
			// Initialize GLTF loaders with renderer
			initializeLoaders(gl);

			// Warm up shaders
			warmupShaders(gl, scene, camera);

			isInitialized.current = true;
			onReady();
		} catch (err) {
			onError(err instanceof Error ? err : new Error(String(err)));
		}

		return () => {
			disposeLoaders();
		};
	}, [gl, scene, camera, onReady, onError]);

	// Handle WebGL context loss
	useEffect(() => {
		const canvas = gl.domElement;

		const handleContextLost = (event: Event) => {
			event.preventDefault();
			onError(new Error("WebGL context lost"));
		};

		const handleContextRestored = () => {
			// Re-initialize loaders after context restore
			initializeLoaders(gl);
		};

		canvas.addEventListener("webglcontextlost", handleContextLost);
		canvas.addEventListener("webglcontextrestored", handleContextRestored);

		return () => {
			canvas.removeEventListener("webglcontextlost", handleContextLost);
			canvas.removeEventListener("webglcontextrestored", handleContextRestored);
		};
	}, [gl, onError]);

	// Auto-tuning frame sampling
	useFrame(() => {
		if (!autoTuneState.current) return;

		const now = performance.now();
		const frameTime = now - lastTime.current;
		lastTime.current = now;

		const newTier = recordFrameSample(autoTuneState.current, frameTime);
		if (newTier && onTierChange) {
			onTierChange(newTier);
		}
	});

	return null;
}

// =============================================================================
// Performance Monitor (optional, for debugging)
// =============================================================================

function PerformanceMonitor() {
	const { gl } = useThree();

	useFrame(() => {
		// Log performance every 5 seconds in development
		if (process.env.NODE_ENV === "development") {
			const info = gl.info;
			// Throttle logging
			if (Math.random() < 0.003) {
				console.log("[Perf]", {
					calls: info.render.calls,
					triangles: info.render.triangles,
					geometries: info.memory.geometries,
					textures: info.memory.textures,
				});
			}
		}
	});

	return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function RendererRoot({
	qualityTier,
	reducedMotion,
	onReady,
	onError,
	onTierChange,
	isMobile,
	children,
}: RendererRootProps) {
	const [isSetupComplete, setIsSetupComplete] = useState(false);

	// Get quality settings with reduced motion applied if needed
	let settings = getQualitySettings(qualityTier);
	if (reducedMotion) {
		settings = applyReducedMotion(settings);
	}

	const canvasConfig = getCanvasConfig(settings);

	const handleSetupReady = useCallback(() => {
		setIsSetupComplete(true);
		onReady();
	}, [onReady]);

	return (
		<Canvas
			{...canvasConfig}
			camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 2, 10] }}
			style={{ background: "#070A0F" }}
			onCreated={({ gl }) => {
				// Configure renderer on creation
				gl.setClearColor(0x070a0f, 1);
				gl.toneMapping = THREE.ACESFilmicToneMapping;
				gl.toneMappingExposure = 1.0;
				gl.shadowMap.enabled = settings.shadowMapSize > 0;
				if (gl.shadowMap.enabled) {
					gl.shadowMap.type = THREE.PCFSoftShadowMap;
				}
			}}
		>
			<Setup
				qualityTier={qualityTier}
				isMobile={isMobile}
				onReady={handleSetupReady}
				onError={onError}
				onTierChange={onTierChange}
			/>

			{/* Default lighting - will be overridden by scene-specific lighting */}
			<ambientLight intensity={0.3} />
			<directionalLight
				position={[10, 10, 5]}
				intensity={1}
				castShadow={settings.shadowMapSize > 0}
				shadow-mapSize-width={settings.shadowMapSize}
				shadow-mapSize-height={settings.shadowMapSize}
				shadow-camera-far={settings.shadowDistance}
			/>

			{/* Optional perf monitor in development */}
			{process.env.NODE_ENV === "development" && <PerformanceMonitor />}

			{/* Scene content */}
			{isSetupComplete && children}
		</Canvas>
	);
}

// =============================================================================
// Helper Hook for Quality Settings
// =============================================================================

/**
 * Hook to get current quality settings inside Canvas.
 */
export function useQualitySettings(
	tier: QualityTier,
	reducedMotion: boolean
): QualitySettings {
	let settings = getQualitySettings(tier);
	if (reducedMotion) {
		settings = applyReducedMotion(settings);
	}
	return settings;
}
