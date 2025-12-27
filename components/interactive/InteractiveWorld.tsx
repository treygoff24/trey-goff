"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { QualityTier } from "@/lib/interactive/capabilities";
import { RendererRoot } from "./RendererRoot";

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
// Placeholder Scene Components
// =============================================================================

/**
 * Animated cube for visual feedback during development.
 * Will be replaced by actual scene content in later phases.
 */
function PlaceholderCube({ reducedMotion }: { reducedMotion: boolean }) {
	const meshRef = useRef<THREE.Mesh>(null);

	useFrame((_, delta) => {
		if (!meshRef.current || reducedMotion) return;
		meshRef.current.rotation.x += delta * 0.3;
		meshRef.current.rotation.y += delta * 0.5;
	});

	return (
		<mesh ref={meshRef} position={[0, 1, 0]}>
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
 */
function Ground() {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
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
 */
function Grid() {
	return (
		<gridHelper
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
}: {
	qualityTier: QualityTier;
	reducedMotion: boolean;
}) {
	return (
		<Suspense fallback={null}>
			<Ground />
			<Grid />
			<PlaceholderCube reducedMotion={reducedMotion} />
			<FloatingOrbs reducedMotion={reducedMotion} />
			<StatusDisplay qualityTier={qualityTier} reducedMotion={reducedMotion} />

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
 * Future phases will add:
 * - Phase 4: Character controller
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
	return (
		<div className="h-full w-full">
			<RendererRoot
				qualityTier={qualityTier}
				reducedMotion={reducedMotion}
				isMobile={isMobile}
				onReady={onReady}
				onError={onError}
				onTierChange={onTierChange}
			>
				<SceneContent qualityTier={qualityTier} reducedMotion={reducedMotion} />
			</RendererRoot>
		</div>
	);
}
