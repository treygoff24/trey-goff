"use client";

import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import Link from "next/link";
import * as THREE from "three";
import type { QualityTier } from "@/lib/interactive/capabilities";
import { useInteractiveStore } from "@/lib/interactive/store";
import { RendererRoot } from "./RendererRoot";
import { PlayerController, keyboardControlsMap } from "./PlayerController";
import { LoadingSequence, type LoadingPhase } from "./LoadingSequence";
import { CameraController } from "./CameraController";
import { InteractionSystem, type Interactable } from "./InteractionSystem";
import { ContentOverlay, useContentOverlay } from "./ContentOverlay";

// =============================================================================
// Types
// =============================================================================

interface InteractiveWorldProps {
	qualityTier: QualityTier;
	reducedMotion: boolean;
	isMobile: boolean;
	onReady: () => void;
	onError: (error: Error) => void;
	onTierChange?: (tier: Exclude<QualityTier, "auto">) => void;
}

// =============================================================================
// Camera Integration
// =============================================================================

/**
 * Connects the camera to the player position from the store.
 * Reads position/rotation tuples and passes them to CameraController.
 */
function CameraIntegration({
	reducedMotion,
}: {
	reducedMotion: boolean;
}) {
	const playerPosition = useInteractiveStore((s) => s.player.position);
	const playerRotation = useInteractiveStore((s) => s.player.rotation);
	const cameraMode = useInteractiveStore((s) => s.settings.cameraMode);

	return (
		<CameraController
			targetPosition={playerPosition}
			targetYaw={playerRotation[1]}
			mode={cameraMode ?? "third-person"}
			reducedMotion={reducedMotion}
		/>
	);
}

// =============================================================================
// Placeholder Scene Components
// =============================================================================

/**
 * Animated cube for visual feedback during development.
 * Will be replaced by actual scene content in later phases.
 * This cube is also used as a demo interactable.
 */
function PlaceholderCube({
	reducedMotion,
	meshRef,
}: {
	reducedMotion: boolean;
	meshRef: (node: THREE.Mesh | null) => void;
}) {
	const internalRef = useRef<THREE.Mesh>(null);

	// Call the callback ref when the mesh mounts/unmounts
	useEffect(() => {
		meshRef(internalRef.current);
		return () => meshRef(null);
	}, [meshRef]);

	useFrame((_, delta) => {
		if (!internalRef.current || reducedMotion) return;
		internalRef.current.rotation.x += delta * 0.3;
		internalRef.current.rotation.y += delta * 0.5;
	});

	return (
		<mesh ref={internalRef} position={[0, 1, 0]} name="demo-cube">
			<boxGeometry args={[1.5, 1.5, 1.5]} />
			<meshStandardMaterial
				color="#FFB86B"
				roughness={0.3}
				metalness={0.7}
				emissive="#FFB86B"
				emissiveIntensity={0.1}
			/>
		</mesh>
	);
}

/**
 * Ground plane for reference.
 * Named "ground" so camera collision skips it.
 */
function Ground() {
	return (
		<mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
			<planeGeometry args={[20, 20]} />
			<meshStandardMaterial
				color="#1a1a2e"
				roughness={0.8}
				metalness={0.2}
			/>
		</mesh>
	);
}

/**
 * Grid helper for spatial reference.
 * Named "grid" so camera collision skips it.
 */
function Grid() {
	return (
		<gridHelper
			name="grid"
			args={[20, 20, "#333355", "#222244"]}
			position={[0, 0.01, 0]}
		/>
	);
}

/**
 * Floating orbs to demonstrate shader warmup.
 */
function FloatingOrbs({ reducedMotion }: { reducedMotion: boolean }) {
	const group = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!group.current || reducedMotion) return;
		group.current.rotation.y = state.clock.elapsedTime * 0.1;
	});

	const positions: [number, number, number][] = [
		[-3, 2, -2],
		[3, 1.5, -1],
		[0, 3, -3],
		[-2, 1, 2],
		[2.5, 2.5, 1],
	];

	const colors = ["#7C5CFF", "#FFB86B", "#34d399", "#f472b6", "#60a5fa"];

	return (
		<group ref={group}>
			{positions.map((pos, i) => (
				<mesh key={i} position={pos} castShadow>
					<sphereGeometry args={[0.3, 16, 16]} />
					<meshPhysicalMaterial
						color={colors[i]}
						roughness={0.2}
						metalness={0.8}
						emissive={colors[i]}
						emissiveIntensity={0.2}
						clearcoat={0.5}
					/>
				</mesh>
			))}
		</group>
	);
}

/**
 * Scene status display using 3D text.
 * Placeholder for actual wayfinding signage.
 */
function StatusDisplay({
	qualityTier,
	reducedMotion,
}: {
	qualityTier: QualityTier;
	reducedMotion: boolean;
}) {
	// In production, this would use drei's Text or Text3D
	// For now, just a floating mesh indicator
	return (
		<group position={[0, 4, -5]}>
			<mesh>
				<planeGeometry args={[4, 1]} />
				<meshBasicMaterial
					color="#0B1020"
					opacity={0.8}
					transparent
				/>
			</mesh>
			{/* Quality tier indicator lights */}
			<group position={[-1.5, -0.7, 0.1]}>
				{["low", "medium", "high"].map((tier, i) => (
					<mesh key={tier} position={[i * 0.8, 0, 0]}>
						<circleGeometry args={[0.1, 16]} />
						<meshBasicMaterial
							color={
								qualityTier === tier || (qualityTier === "auto" && tier === "medium")
									? "#FFB86B"
									: "#333"
							}
						/>
					</mesh>
				))}
			</group>
			{/* Reduced motion indicator */}
			{reducedMotion && (
				<mesh position={[1.5, -0.7, 0.1]}>
					<circleGeometry args={[0.1, 16]} />
					<meshBasicMaterial color="#fbbf24" />
				</mesh>
			)}
		</group>
	);
}

// =============================================================================
// Main Scene Content
// =============================================================================

function SceneContent({
	qualityTier,
	reducedMotion,
	isMobile,
	onInteract,
}: {
	qualityTier: QualityTier;
	reducedMotion: boolean;
	isMobile: boolean;
	onInteract: (content: { type: "generic"; title: string; description: string }) => void;
}) {
	// State for demo interactable cube (using state instead of ref for proper effect triggering)
	const [cubeObject, setCubeObject] = useState<THREE.Mesh | null>(null);
	const cubeRef = useRef<THREE.Mesh | null>(null);

	// Callback ref to capture cube mesh and trigger state update
	const handleCubeRef = useCallback((node: THREE.Mesh | null) => {
		cubeRef.current = node;
		setCubeObject(node);
	}, []);

	// Interactables list built from scene objects
	const [interactables, setInteractables] = useState<Interactable[]>([]);

	// Build interactables when cube is available
	useEffect(() => {
		if (!cubeObject) {
			setInteractables([]);
			return;
		}
		
		setInteractables([
			{
				id: "demo-cube",
				object: cubeObject,
				type: "generic",
				label: "Demo Cube",
				onInteract: () => {
					onInteract({
						type: "generic",
						title: "Interactive Demo",
						description: "This is a demo interactable. In the full experience, books, projects, and doors will trigger content overlays like this one.",
					});
				},
			},
		]);
	}, [cubeObject, onInteract]);

	return (
		<Suspense fallback={null}>
			<Ground />
			<Grid />
			<PlaceholderCube reducedMotion={reducedMotion} meshRef={handleCubeRef} />
			<FloatingOrbs reducedMotion={reducedMotion} />
			<StatusDisplay qualityTier={qualityTier} reducedMotion={reducedMotion} />

			{/* Player Controller */}
			<PlayerController
				spawnPosition={[0, 0, 5]}
				isMobile={isMobile}
				reducedMotion={reducedMotion}
			/>

			{/* Camera System */}
			<CameraIntegration reducedMotion={reducedMotion} />

			{/* Interaction System */}
			<InteractionSystem
				interactables={interactables}
				isMobile={isMobile}
				reducedMotion={reducedMotion}
			/>

			{/* Fog for depth */}
			<fog attach="fog" args={["#070A0F", 10, 50]} />
		</Suspense>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * InteractiveWorld - The main 3D world component.
 *
 * Phase 1: Sets up R3F canvas with quality tiers and shader warmup.
 * Phase 4: Adds character controller and loading sequence.
 * Future phases will add:
 * - Phase 6: Chunk streaming
 * - Phase 7+: Actual room content
 */
export function InteractiveWorld({
	qualityTier,
	reducedMotion,
	isMobile,
	onReady,
	onError,
	onTierChange,
}: InteractiveWorldProps) {
	const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("initializing");
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [loadingStatus, setLoadingStatus] = useState("Initializing...");
	const [isWorldReady, setIsWorldReady] = useState(false);

	// Content overlay state
	const { content: overlayContent, openOverlay, closeOverlay } = useContentOverlay();

	// Memoized callback for scene interactions to prevent effect re-runs
	const handleSceneInteract = useCallback(
		(content: { type: "generic"; title: string; description: string }) => {
			openOverlay(content);
		},
		[openOverlay]
	);

	const handleRendererReady = useCallback(() => {
		setLoadingPhase("loading-assets");
		setLoadingProgress(40);
		setLoadingStatus("Loading assets...");

		// Simulate asset loading (will be replaced with real chunk loading)
		setTimeout(() => {
			setLoadingPhase("warming-shaders");
			setLoadingProgress(70);
			setLoadingStatus("Preparing graphics...");

			setTimeout(() => {
				setLoadingPhase("ready");
				setLoadingProgress(100);
				setLoadingStatus("Ready to explore");
			}, 500);
		}, 300);
	}, []);

	const handleEnterWorld = useCallback(() => {
		setLoadingPhase("complete");
		setIsWorldReady(true);
		onReady();
	}, [onReady]);

	return (
		<KeyboardControls map={keyboardControlsMap}>
			<div className="relative h-full w-full">
				{/* Loading overlay */}
				{loadingPhase !== "complete" && (
					<LoadingSequence
						phase={loadingPhase}
						progress={loadingProgress}
						status={loadingStatus}
						onComplete={handleEnterWorld}
						reducedMotion={reducedMotion}
					/>
				)}

				{/* 3D Canvas */}
				<div
					className={
						loadingPhase === "complete"
							? "h-full w-full"
							: "pointer-events-none h-full w-full opacity-0"
					}
				>
					<RendererRoot
						qualityTier={qualityTier}
						reducedMotion={reducedMotion}
						isMobile={isMobile}
						onReady={handleRendererReady}
						onError={onError}
						onTierChange={onTierChange}
					>
						<SceneContent
							qualityTier={qualityTier}
							reducedMotion={reducedMotion}
							isMobile={isMobile}
							onInteract={handleSceneInteract}
						/>
					</RendererRoot>
				</div>

				{/* Content Overlay (DOM-based modal) */}
				<ContentOverlay
					content={overlayContent}
					onClose={closeOverlay}
					reducedMotion={reducedMotion}
				/>

				{/* World Ready UI - return button etc */}
				{isWorldReady && (
					<div className="pointer-events-auto absolute left-4 top-4 z-10">
						<Link
							href="/"
							className="rounded-lg bg-surface-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1"
							aria-label="Return to main website"
						>
							← Return to Normal
						</Link>
					</div>
				)}
			</div>
		</KeyboardControls>
	);
}
