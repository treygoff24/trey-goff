"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
	EffectComposer,
	Bloom,
	Vignette,
	Noise,
} from "@react-three/postprocessing";
import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// =============================================================================
// Configuration Constants
// =============================================================================

/** Design token colors aligned with globals.css @theme */
const COLORS = {
	// Base
	background: "#070A0F", // --color-bg-0
	// Stars
	starBase: "#f0f4ff",
	shootingStar: "#fffaf0",
	// Nebula (derived from accent/warm palette)
	nebulaPurple: "#7c3aed",
	nebulaCyan: "#06b6d4",
	nebulaWarm: "#f97316",
	// Planets
	planetBlue: "#60a5fa",
	planetPink: "#f472b6",
	planetGreen: "#34d399", // --color-success
	// Lights
	lightPurple: "#818cf8",
	lightPink: "#f472b6",
	lightGold: "#fbbf24", // --color-warning
} as const;

/** Tunable parameters for scene elements */
const CONFIG = {
	// Stars
	stars: {
		count: 4000,
		fieldSize: 800,
		baseSpeed: 80,
		warpMultiplier: 12,
		respawnThreshold: 100,
		respawnDepth: { min: -500, range: 300 },
		radius: 0.15,
		opacity: 0.85,
	},
	// Shooting stars
	shootingStars: {
		count: 5,
		spawnArea: { x: 400, y: 200, z: { min: -100, range: 200 } },
		speed: { min: 200, range: 300 },
		respawnDelay: { min: 8, range: 12 },
	},
	// Camera
	camera: {
		baseFov: 60,
		warpFovBoost: 35,
		shakeThreshold: 0.3,
		shakeIntensity: 0.08,
		parallaxStrength: 3,
	},
	// Planets
	planets: {
		respawnThreshold: 80,
		respawnDepth: { min: -700, range: 200 },
		edgeZone: { min: 150, range: 250 },
		verticalZone: { min: 80, range: 120 },
		warpMultiplier: 8,
		moveSpeed: 25,
	},
	// Post-processing
	postProcessing: {
		bloom: { threshold: 0.15, intensity: 1.0, radius: 0.7 },
		noise: { opacity: 0.04 },
		vignette: { offset: 0.1, darkness: 0.55 },
		fog: { near: 50, far: 600 },
	},
	// Warp hint UI
	warpHint: {
		showDelay: 2000,
		autoDismiss: 10000,
		checkInterval: 100,
		activationThreshold: 0.1,
	},
} as const;

// =============================================================================
// Shared State Store (external to React for R3F performance)
// This pattern is standard in R3F - useFrame runs outside React's render cycle
// =============================================================================
const sceneState = {
	warp: {
		active: false,
		factor: 0,
	},
	mouse: {
		x: 0,
		y: 0,
		targetX: 0,
		targetY: 0,
	},
};

/** Reset sceneState to initial values - called on unmount */
function resetSceneState() {
	sceneState.warp.active = false;
	sceneState.warp.factor = 0;
	sceneState.mouse.x = 0;
	sceneState.mouse.y = 0;
	sceneState.mouse.targetX = 0;
	sceneState.mouse.targetY = 0;
}

// =============================================================================
// Seeded Random for Deterministic Generation (fixes react-hooks/purity)
// =============================================================================
function createSeededRandom(seed: number) {
	return () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
}

// Pre-generate star data outside React (fixes useMemo purity issues)
const starSeed = createSeededRandom(42);
const starData = {
	positions: new Float32Array(CONFIG.stars.count * 3),
	speeds: new Float32Array(CONFIG.stars.count),
	colors: new Float32Array(CONFIG.stars.count * 3),
};

// Initialize star data once at module load
(() => {
	const colorObj = new THREE.Color();
	const { count, fieldSize } = CONFIG.stars;
	for (let i = 0; i < count; i++) {
		const ix = i * 3;
		starData.positions[ix] = (starSeed() - 0.5) * fieldSize;
		starData.positions[ix + 1] = (starSeed() - 0.5) * fieldSize;
		starData.positions[ix + 2] = starSeed() * fieldSize - fieldSize / 2;
		starData.speeds[i] = starSeed() * 2 + 0.5;

		// Color variety: mix of cool blues, warm whites, and occasional gold
		const colorType = starSeed();
		if (colorType < 0.7) {
			// Cool blue/white stars
			colorObj.setHSL(0.6 + starSeed() * 0.1, 0.3 + starSeed() * 0.5, 0.7 + starSeed() * 0.3);
		} else if (colorType < 0.9) {
			// Warm white stars
			colorObj.setHSL(0.1 + starSeed() * 0.05, 0.2, 0.9 + starSeed() * 0.1);
		} else {
			// Rare golden/amber stars
			colorObj.setHSL(0.08 + starSeed() * 0.04, 0.8, 0.6 + starSeed() * 0.2);
		}
		starData.colors[ix] = colorObj.r;
		starData.colors[ix + 1] = colorObj.g;
		starData.colors[ix + 2] = colorObj.b;
	}
})();

// Pre-generate shooting star data
const shootingStarSeed = createSeededRandom(123);
const shootingStarData = Array.from({ length: CONFIG.shootingStars.count }, () => {
	const { spawnArea, speed } = CONFIG.shootingStars;
	return {
		x: (shootingStarSeed() - 0.5) * spawnArea.x * 1.5,
		y: (shootingStarSeed() - 0.5) * spawnArea.y * 2,
		z: spawnArea.z.min * 2 - shootingStarSeed() * spawnArea.z.range * 1.5,
		speed: speed.min + shootingStarSeed() * speed.range,
		delay: shootingStarSeed() * 15,
		rotX: shootingStarSeed() * 0.01,
		rotY: shootingStarSeed() * 0.01,
	};
});

// Pre-generate planet rotation speeds
const planetSeed = createSeededRandom(456);
const planetRotations = [
	{ x: planetSeed() * 0.008, y: planetSeed() * 0.012 },
	{ x: planetSeed() * 0.006, y: planetSeed() * 0.01 },
	{ x: planetSeed() * 0.01, y: planetSeed() * 0.008 },
];

// =============================================================================
// Camera Controller - handles warp FOV, shake, and mouse parallax
// =============================================================================
function CameraController() {
	const { camera } = useThree();
	const basePosition = useRef(new THREE.Vector3(0, 0, 10));
	const shakeOffset = useRef({ x: 0, y: 0 });
	const shakeTime = useRef(0);

	useFrame((_, delta) => {
		/* eslint-disable react-hooks/immutability -- R3F pattern: camera mutations in useFrame are standard */
		const cam = camera as THREE.PerspectiveCamera;

		// Smoothly interpolate warp factor
		const targetFactor = sceneState.warp.active ? 1 : 0;
		sceneState.warp.factor = THREE.MathUtils.lerp(
			sceneState.warp.factor,
			targetFactor,
			delta * 2.5
		);

		// Dynamic FOV for warp effect
		const targetFov = CONFIG.camera.baseFov + sceneState.warp.factor * CONFIG.camera.warpFovBoost;
		cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, delta * 3);
		cam.updateProjectionMatrix();

		// Smooth mouse tracking for parallax
		sceneState.mouse.x = THREE.MathUtils.lerp(
			sceneState.mouse.x,
			sceneState.mouse.targetX,
			delta * 2
		);
		sceneState.mouse.y = THREE.MathUtils.lerp(
			sceneState.mouse.y,
			sceneState.mouse.targetY,
			delta * 2
		);

		// Camera shake during warp (deterministic using time-based noise)
		if (sceneState.warp.factor > CONFIG.camera.shakeThreshold) {
			shakeTime.current += delta * 20;
			const intensity = sceneState.warp.factor * CONFIG.camera.shakeIntensity;
			shakeOffset.current.x = Math.sin(shakeTime.current * 1.1) * Math.cos(shakeTime.current * 0.7) * intensity;
			shakeOffset.current.y = Math.cos(shakeTime.current * 0.9) * Math.sin(shakeTime.current * 1.3) * intensity;
		} else {
			shakeOffset.current.x *= 0.9;
			shakeOffset.current.y *= 0.9;
			shakeTime.current = 0;
		}

		// Apply mouse parallax + shake
		const parallaxStrength = CONFIG.camera.parallaxStrength * (1 - sceneState.warp.factor * 0.5);
		camera.position.x = THREE.MathUtils.lerp(
			camera.position.x,
			basePosition.current.x + sceneState.mouse.x * parallaxStrength + shakeOffset.current.x,
			delta * 4
		);
		camera.position.y = THREE.MathUtils.lerp(
			camera.position.y,
			basePosition.current.y + sceneState.mouse.y * parallaxStrength + shakeOffset.current.y,
			delta * 4
		);
	});

	return null;
}

// =============================================================================
// Star Field - instanced mesh for performance
// =============================================================================
function StarField() {
	const mesh = useRef<THREE.InstancedMesh>(null);
	const dummy = useRef(new THREE.Object3D());
	// Use ref for mutable position data (fixes react-hooks/immutability)
	const positions = useRef(new Float32Array(starData.positions));

	useFrame((_, delta) => {
		if (!mesh.current) return;

		const { baseSpeed, warpMultiplier, respawnThreshold, respawnDepth, fieldSize, count } = CONFIG.stars;
		const warpFactor = 1 + sceneState.warp.factor * warpMultiplier;

		for (let i = 0; i < count; i++) {
			const ix = i * 3;
			let z = positions.current[ix + 2]!;

			// Move stars toward camera
			z += baseSpeed * delta * starData.speeds[i]! * warpFactor;

			// Respawn behind camera
			if (z > respawnThreshold) {
				z = respawnDepth.min - Math.random() * respawnDepth.range;
				positions.current[ix] = (Math.random() - 0.5) * fieldSize;
				positions.current[ix + 1] = (Math.random() - 0.5) * fieldSize;
			}

			positions.current[ix + 2] = z;

			dummy.current.position.set(
				positions.current[ix]!,
				positions.current[ix + 1]!,
				z
			);

			// Streak effect based on speed + warp
			const streakFactor = 1 + starData.speeds[i]! * 1.5 + sceneState.warp.factor * 25;
			dummy.current.scale.set(1, 1, streakFactor);

			dummy.current.updateMatrix();
			mesh.current.setMatrixAt(i, dummy.current.matrix);
		}
		mesh.current.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={mesh} args={[undefined, undefined, CONFIG.stars.count]}>
			<sphereGeometry args={[CONFIG.stars.radius, 6, 6]} />
			<meshBasicMaterial
				color={COLORS.starBase}
				transparent
				opacity={CONFIG.stars.opacity}
				toneMapped={false}
			/>
		</instancedMesh>
	);
}

// =============================================================================
// Shooting Stars - occasional bright streaks across the sky
// =============================================================================
function ShootingStars() {
	const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
	const timers = useRef(shootingStarData.map((d) => d.delay));
	const active = useRef(shootingStarData.map(() => false));
	const trailPositions = useRef(shootingStarData.map((d) => ({
		x: d.x,
		y: d.y,
		z: d.z,
	})));

	useFrame((_, delta) => {
		const warpMultiplier = 1 + sceneState.warp.factor * 3;
		const { count, spawnArea, respawnDelay } = CONFIG.shootingStars;

		for (let i = 0; i < count; i++) {
			const mesh = meshRefs.current[i];
			if (!mesh) continue;

			timers.current[i]! -= delta;

			if (timers.current[i]! <= 0 && !active.current[i]) {
				// Activate shooting star
				active.current[i] = true;
				const pos = {
					x: (Math.random() - 0.5) * spawnArea.x,
					y: spawnArea.y / 2 + Math.random() * spawnArea.y,
					z: spawnArea.z.min - Math.random() * spawnArea.z.range,
				};
				trailPositions.current[i] = pos;
				mesh.position.set(pos.x, pos.y, pos.z);
				mesh.visible = true;
				mesh.scale.set(0.3, 0.3, 15 + Math.random() * 10);
				// Angle downward
				mesh.rotation.x = -0.3 - Math.random() * 0.4;
				mesh.rotation.z = (Math.random() - 0.5) * 0.5;
			}

			if (active.current[i]) {
				const data = shootingStarData[i]!;
				// Move diagonally down and toward camera
				mesh.position.y -= data.speed * delta * 0.8 * warpMultiplier;
				mesh.position.z += data.speed * delta * warpMultiplier;
				mesh.position.x += data.speed * delta * 0.3 * (i % 2 === 0 ? 1 : -1);

				// Fade out and reset
				if (mesh.position.y < -300 || mesh.position.z > 50) {
					active.current[i] = false;
					mesh.visible = false;
					timers.current[i] = respawnDelay.min + Math.random() * respawnDelay.range;
				}
			}
		}
	});

	return (
		<>
			{shootingStarData.map((_, i) => (
				<mesh
					key={i}
					ref={(el) => { meshRefs.current[i] = el; }}
					visible={false}
				>
					<cylinderGeometry args={[0.05, 0.2, 1, 8]} />
					<meshBasicMaterial
						color={COLORS.shootingStar}
						transparent
						opacity={0.9}
						toneMapped={false}
					/>
				</mesh>
			))}
		</>
	);
}

// =============================================================================
// Floating Planet - with constrained spawn zones
// =============================================================================
function FloatingPlanet({
	color,
	size,
	initialPosition,
	speed,
	ring,
	rotationIndex,
}: {
	color: string;
	size: number;
	initialPosition: [number, number, number];
	speed: number;
	ring?: boolean;
	rotationIndex: number;
}) {
	const ref = useRef<THREE.Group>(null);
	const rotSpeed = planetRotations[rotationIndex] || { x: 0.005, y: 0.008 };

	useFrame((_, delta) => {
		if (!ref.current) return;
		const { warpMultiplier, moveSpeed, respawnThreshold, respawnDepth, edgeZone, verticalZone } = CONFIG.planets;
		const warpFactor = 1 + sceneState.warp.factor * warpMultiplier;

		ref.current.position.z += speed * moveSpeed * delta * warpFactor;
		ref.current.rotation.y += rotSpeed.y;
		ref.current.rotation.x += rotSpeed.x;

		// Respawn at edges only (not center where content is)
		if (ref.current.position.z > respawnThreshold) {
			ref.current.position.z = respawnDepth.min - Math.random() * respawnDepth.range;
			// Spawn in edge zones: left or right
			const side = Math.random() > 0.5 ? 1 : -1;
			ref.current.position.x = side * (edgeZone.min + Math.random() * edgeZone.range);
			// Vertical: top or bottom
			const vSide = Math.random() > 0.5 ? 1 : -1;
			ref.current.position.y = vSide * (verticalZone.min + Math.random() * verticalZone.range);
		}
	});

	return (
		<group ref={ref} position={initialPosition}>
			<mesh>
				<sphereGeometry args={[size, 32, 32]} />
				<meshStandardMaterial
					color={color}
					metalness={0.5}
					roughness={0.5}
					emissive={color}
					emissiveIntensity={0.4}
					toneMapped={false}
				/>
			</mesh>
			{ring && (
				<mesh rotation={[1.5, 0.2, 0]}>
					<ringGeometry args={[size * 1.4, size * 2.0, 64]} />
					<meshBasicMaterial
						color={color}
						side={THREE.DoubleSide}
						transparent
						opacity={0.25}
						toneMapped={false}
					/>
				</mesh>
			)}
		</group>
	);
}

// =============================================================================
// Nebula Clouds - subtle colored fog patches
// =============================================================================
function NebulaClouds() {
	const cloudsRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (!cloudsRef.current) return;
		// Gentle rotation
		cloudsRef.current.rotation.z += delta * 0.01;
	});

	return (
		<group ref={cloudsRef}>
			{/* Purple nebula */}
			<mesh position={[-200, 100, -400]}>
				<sphereGeometry args={[120, 16, 16]} />
				<meshBasicMaterial
					color={COLORS.nebulaPurple}
					transparent
					opacity={0.03}
					toneMapped={false}
				/>
			</mesh>
			{/* Cyan nebula */}
			<mesh position={[250, -80, -350]}>
				<sphereGeometry args={[100, 16, 16]} />
				<meshBasicMaterial
					color={COLORS.nebulaCyan}
					transparent
					opacity={0.025}
					toneMapped={false}
				/>
			</mesh>
			{/* Warm nebula */}
			<mesh position={[0, 150, -500]}>
				<sphereGeometry args={[150, 16, 16]} />
				<meshBasicMaterial
					color={COLORS.nebulaWarm}
					transparent
					opacity={0.02}
					toneMapped={false}
				/>
			</mesh>
		</group>
	);
}

// =============================================================================
// Main Space Scene
// =============================================================================
function SpaceScene() {
	return (
		<>
			<CameraController />

			{/* Lighting */}
			<ambientLight intensity={0.15} />
			<pointLight position={[100, 80, -100]} intensity={1.5} color={COLORS.lightPurple} />
			<pointLight position={[-100, -60, -150]} intensity={1.5} color={COLORS.lightPink} />
			<pointLight position={[0, 0, -300]} intensity={0.8} color={COLORS.lightGold} />

			<NebulaClouds />
			<StarField />
			<ShootingStars />

			{/* Planets at edges only */}
			<FloatingPlanet
				color={COLORS.planetBlue}
				size={8}
				initialPosition={[-280, 120, -450]}
				speed={1.0}
				ring
				rotationIndex={0}
			/>
			<FloatingPlanet
				color={COLORS.planetPink}
				size={12}
				initialPosition={[300, -100, -380]}
				speed={0.7}
				rotationIndex={1}
			/>
			<FloatingPlanet
				color={COLORS.planetGreen}
				size={6}
				initialPosition={[-220, -140, -550]}
				speed={1.3}
				ring
				rotationIndex={2}
			/>

			{/* Post Processing */}
			<EffectComposer>
				<Bloom
					luminanceThreshold={CONFIG.postProcessing.bloom.threshold}
					mipmapBlur
					intensity={CONFIG.postProcessing.bloom.intensity}
					radius={CONFIG.postProcessing.bloom.radius}
				/>
				<Noise opacity={CONFIG.postProcessing.noise.opacity} />
				<Vignette
					eskil={false}
					offset={CONFIG.postProcessing.vignette.offset}
					darkness={CONFIG.postProcessing.vignette.darkness}
				/>
			</EffectComposer>

			<fog attach="fog" args={[COLORS.background, CONFIG.postProcessing.fog.near, CONFIG.postProcessing.fog.far]} />
		</>
	);
}

// =============================================================================
// Warp Hint Component
// =============================================================================
function WarpHint({ visible }: { visible: boolean }) {
	const [show, setShow] = useState(false);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (dismissed) return;
		const { showDelay, autoDismiss } = CONFIG.warpHint;
		// Show hint after a short delay
		const timer = setTimeout(() => setShow(true), showDelay);
		// Auto-hide after showing for a while
		const hideTimer = setTimeout(() => {
			setShow(false);
			setDismissed(true);
		}, autoDismiss);
		return () => {
			clearTimeout(timer);
			clearTimeout(hideTimer);
		};
	}, [dismissed]);

	// Hide when warp is activated - check periodically
	useEffect(() => {
		if (dismissed) return;
		const { checkInterval, activationThreshold } = CONFIG.warpHint;
		const interval = setInterval(() => {
			if (sceneState.warp.factor > activationThreshold) {
				setShow(false);
				setDismissed(true);
			}
		}, checkInterval);
		return () => clearInterval(interval);
	}, [dismissed]);

	if (!visible || !show || dismissed) return null;

	return (
		<div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
			<div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md animate-pulse">
				<div className="h-2 w-2 rounded-full bg-warm/70 animate-ping" />
				<span className="text-xs text-text-3 font-light tracking-wide">
					Hold anywhere for warp speed
				</span>
			</div>
		</div>
	);
}

// =============================================================================
// Main Export
// =============================================================================
export function StarfieldBackground() {
	const reducedMotion = useReducedMotion();
	const [mounted, setMounted] = useState(false);
	const [isWarping, setIsWarping] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
		return () => {
			// Clean up global state on unmount to prevent stale state on remount
			resetSceneState();
		};
	}, []);

	// Mouse move handler for parallax (scoped to container)
	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		// Normalize to -1 to 1
		sceneState.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
		sceneState.mouse.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
	}, []);

	// Warp handlers (only trigger on background, not UI)
	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		// Only activate if clicking directly on the canvas container
		if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "CANVAS") {
			sceneState.warp.active = true;
			setIsWarping(true);
		}
	}, []);

	const handlePointerUp = useCallback(() => {
		sceneState.warp.active = false;
		setIsWarping(false);
	}, []);

	const handlePointerLeave = useCallback(() => {
		sceneState.warp.active = false;
		setIsWarping(false);
		// Reset mouse position
		sceneState.mouse.targetX = 0;
		sceneState.mouse.targetY = 0;
	}, []);

	if (reducedMotion || !mounted) {
		return (
			<div className="fixed inset-0 -z-10 bg-bg-0">
				<div className="absolute inset-0 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 -z-10 h-full w-full bg-bg-0"
			onMouseMove={handleMouseMove}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerLeave}
		>
			<Canvas
				camera={{ position: [0, 0, 10], fov: CONFIG.camera.baseFov }}
				gl={{
					antialias: false,
					alpha: false,
					powerPreference: "high-performance",
					stencil: false,
					depth: true,
				}}
				dpr={[1, 2]}
				style={{ pointerEvents: "none" }}
			>
				<color attach="background" args={[COLORS.background]} />
				<SpaceScene />
			</Canvas>

			<WarpHint visible={!isWarping} />

			{/* Warp speed lines overlay for extra effect */}
			<div
				className="pointer-events-none absolute inset-0 transition-opacity duration-300"
				style={{
					opacity: isWarping ? 0.1 : 0,
					background: "radial-gradient(circle at center, transparent 0%, rgba(255,184,107,0.1) 100%)",
				}}
			/>
		</div>
	);
}
