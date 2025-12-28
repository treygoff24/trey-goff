"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";
import type { LiftsManifest, LiftsManifestEntry, LiftName, LiftRecord } from "@/lib/interactive/manifest-types";

// =============================================================================
// Types
// =============================================================================

interface GymRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ROOM_WIDTH = 20;
const ROOM_DEPTH = 18;
const ROOM_HEIGHT = 6;

// Standard plate weights (lb)
const PLATE_WEIGHTS = [45, 35, 25, 10, 5, 2.5] as const;
const BAR_WEIGHT = 45;

// Plate colors
const PLATE_COLORS: Record<number, string> = {
	45: "#e53e3e",  // Red
	35: "#f6e05e",  // Yellow
	25: "#48bb78",  // Green
	10: "#4299e1",  // Blue
	5: "#a0aec0",   // Gray
	2.5: "#a0aec0", // Gray
};

// Lift display names - TODO: use with drei Text component
const _LIFT_NAMES: Record<LiftName, string> = {
	squat: "SQUAT",
	bench: "BENCH",
	deadlift: "DEADLIFT",
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate plates needed for a given weight.
 * Returns an array of plate weights (for one side of the bar).
 */
function calculatePlates(weight: number): number[] {
	// Guard: if weight is at or below bar weight, no plates needed
	if (weight <= BAR_WEIGHT) return [];

	const plates: number[] = [];
	let remaining = (weight - BAR_WEIGHT) / 2;

	for (const plateWeight of PLATE_WEIGHTS) {
		while (remaining >= plateWeight) {
			plates.push(plateWeight);
			remaining -= plateWeight;
		}
	}

	return plates;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Gym floor with rubber mat appearance.
 */
function Floor() {
	return (
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[0, 0, 0]}
			receiveShadow
			name="ground"
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<meshStandardMaterial
				color="#1a1a1a"
				roughness={0.9}
				metalness={0.1}
			/>
		</mesh>
	);
}

/**
 * Gym walls with industrial style.
 */
function Walls() {
	return (
		<group>
			{/* Back wall */}
			<mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Front wall (with door to main hall) */}
			<mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Left wall (door from main hall) */}
			<mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Right wall */}
			<mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.2} />
			</mesh>
		</group>
	);
}

/**
 * Industrial ceiling.
 */
function Ceiling() {
	return (
		<mesh
			rotation={[Math.PI / 2, 0, 0]}
			position={[0, ROOM_HEIGHT, 0]}
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<meshStandardMaterial color="#1a202c" roughness={0.9} metalness={0.1} />
		</mesh>
	);
}

/**
 * A single plate on a barbell.
 */
function Plate({
	weight,
	position,
	rotation = 0,
}: {
	weight: number;
	position: [number, number, number];
	rotation?: number;
}) {
	// Plate radius based on weight
	const radius = weight >= 45 ? 0.45 : weight >= 25 ? 0.35 : 0.25;
	const thickness = weight >= 35 ? 0.05 : 0.03;

	return (
		<mesh position={position} rotation={[0, 0, rotation]}>
			<cylinderGeometry args={[radius, radius, thickness, 32]} />
			<meshStandardMaterial
				color={PLATE_COLORS[weight] ?? "#718096"}
				roughness={0.5}
				metalness={0.3}
			/>
		</mesh>
	);
}

/**
 * Barbell with plates loaded for a given weight.
 */
function Barbell({
	weight,
	position,
	rotation = 0,
}: {
	weight: number;
	position: [number, number, number];
	rotation?: number;
}) {
	const plates = useMemo(() => calculatePlates(weight), [weight]);
	const barLength = 2.2;
	const sleeveLength = 0.4;

	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Main bar */}
			<mesh rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, barLength, 16]} />
				<meshStandardMaterial color="#a0aec0" roughness={0.3} metalness={0.8} />
			</mesh>

			{/* Left sleeve */}
			<mesh position={[-(barLength / 2 + sleeveLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, sleeveLength, 16]} />
				<meshStandardMaterial color="#718096" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* Right sleeve */}
			<mesh position={[(barLength / 2 + sleeveLength / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.025, 0.025, sleeveLength, 16]} />
				<meshStandardMaterial color="#718096" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* Plates - left side */}
			{plates.map((plateWeight, i) => {
				const offset = 0.06 + i * 0.08;
				return (
					<Plate
						key={`left-${i}`}
						weight={plateWeight}
						position={[-(barLength / 2 + offset), 0, 0]}
						rotation={Math.PI / 2}
					/>
				);
			})}

			{/* Plates - right side (mirror) */}
			{plates.map((plateWeight, i) => {
				const offset = 0.06 + i * 0.08;
				return (
					<Plate
						key={`right-${i}`}
						weight={plateWeight}
						position={[(barLength / 2 + offset), 0, 0]}
						rotation={Math.PI / 2}
					/>
				);
			})}
		</group>
	);
}

/**
 * Squat rack with barbell.
 */
function SquatRack({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Uprights */}
			<mesh position={[-0.6, 1.1, 0]} castShadow>
				<boxGeometry args={[0.1, 2.2, 0.15]} />
				<meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.6} />
			</mesh>
			<mesh position={[0.6, 1.1, 0]} castShadow>
				<boxGeometry args={[0.1, 2.2, 0.15]} />
				<meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.6} />
			</mesh>

			{/* J-hooks */}
			<mesh position={[-0.55, 1.4, 0.08]}>
				<boxGeometry args={[0.08, 0.06, 0.1]} />
				<meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.7} />
			</mesh>
			<mesh position={[0.55, 1.4, 0.08]}>
				<boxGeometry args={[0.08, 0.06, 0.1]} />
				<meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.7} />
			</mesh>

			{/* Barbell */}
			<Barbell weight={weight} position={[0, 1.4, 0.08]} />
		</group>
	);
}

/**
 * Bench press station with barbell.
 */
function BenchStation({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Bench */}
			<mesh position={[0, 0.25, 0.3]} castShadow>
				<boxGeometry args={[0.4, 0.1, 1.2]} />
				<meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Bench supports */}
			<mesh position={[-0.15, 0.1, 0]} castShadow>
				<boxGeometry args={[0.08, 0.2, 0.08]} />
				<meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.6} />
			</mesh>
			<mesh position={[0.15, 0.1, 0.6]} castShadow>
				<boxGeometry args={[0.08, 0.2, 0.08]} />
				<meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.6} />
			</mesh>

			{/* Uprights */}
			<mesh position={[-0.55, 0.6, -0.3]} castShadow>
				<boxGeometry args={[0.08, 1.2, 0.1]} />
				<meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.6} />
			</mesh>
			<mesh position={[0.55, 0.6, -0.3]} castShadow>
				<boxGeometry args={[0.08, 1.2, 0.1]} />
				<meshStandardMaterial color="#2d3748" roughness={0.5} metalness={0.6} />
			</mesh>

			{/* Barbell */}
			<Barbell weight={weight} position={[0, 1, -0.3]} />
		</group>
	);
}

/**
 * Deadlift platform with barbell on ground.
 */
function DeadliftPlatform({
	weight,
	position,
}: {
	weight: number;
	position: [number, number, number];
}) {
	return (
		<group position={position}>
			{/* Platform */}
			<mesh position={[0, 0.02, 0]} receiveShadow>
				<boxGeometry args={[2.5, 0.04, 1.5]} />
				<meshStandardMaterial color="#4a3728" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Barbell on ground */}
			<Barbell weight={weight} position={[0, 0.48, 0]} />
		</group>
	);
}

/**
 * PR Plaque showing lift stats.
 */
function PRPlaque({
	lift: _lift,
	pr,
	position,
}: {
	lift: LiftName;
	pr: LiftRecord;
	position: [number, number, number];
}) {
	const meshRef = useRef<THREE.Mesh>(null);

	// Subtle float animation
	useFrame((state) => {
		if (!meshRef.current) return;
		meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
	});

	// Format date - TODO: use with drei Text component
	const _dateStr = new Date(pr.date).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});

	return (
		<group position={position}>
			{/* Plaque background */}
			<mesh ref={meshRef} castShadow>
				<boxGeometry args={[1.8, 1.2, 0.1]} />
				<meshStandardMaterial
					color="#1a202c"
					roughness={0.3}
					metalness={0.7}
				/>
			</mesh>

			{/* Accent border */}
			<mesh position={[0, 0, 0.06]}>
				<planeGeometry args={[1.6, 1]} />
				<meshBasicMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={0.2}
				/>
			</mesh>

			{/* Lift name indicator */}
			<mesh position={[0, 0.35, 0.06]}>
				<planeGeometry args={[1.4, 0.25]} />
				<meshBasicMaterial color={THREE_COLORS.warm} />
			</mesh>

			{/* Weight display area */}
			<mesh position={[0, -0.05, 0.06]}>
				<planeGeometry args={[1.4, 0.45]} />
				<meshBasicMaterial color="#2d3748" />
			</mesh>

			{/* Date indicator */}
			<mesh position={[0, -0.42, 0.06]}>
				<planeGeometry args={[0.8, 0.2]} />
				<meshBasicMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={0.5}
				/>
			</mesh>

			{/* Glow effect behind */}
			<pointLight
				position={[0, 0, 0.5]}
				intensity={0.2}
				color={THREE_COLORS.warm}
				distance={2}
				decay={2}
			/>
		</group>
	);
}

/**
 * Wall of PR plaques.
 */
function PlaqueWall({
	lifts,
	total: _total,
}: {
	lifts: LiftsManifestEntry[];
	total: { weight: number; date: string };
}) {
	// Find each lift's PR
	const squat = lifts.find((l) => l.lift === "squat");
	const bench = lifts.find((l) => l.lift === "bench");
	const deadlift = lifts.find((l) => l.lift === "deadlift");

	return (
		<group position={[0, 2.5, -ROOM_DEPTH / 2 + 0.5]}>
			{/* Title plaque */}
			<mesh position={[0, 1.2, 0]} castShadow>
				<boxGeometry args={[6, 0.6, 0.1]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.4}
					metalness={0.6}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.2}
				/>
			</mesh>

			{/* Individual lift plaques */}
			{squat && <PRPlaque lift="squat" pr={squat.pr} position={[-2.5, 0, 0]} />}
			{bench && <PRPlaque lift="bench" pr={bench.pr} position={[0, 0, 0]} />}
			{deadlift && <PRPlaque lift="deadlift" pr={deadlift.pr} position={[2.5, 0, 0]} />}

			{/* Total plaque */}
			<mesh position={[0, -1.5, 0]} castShadow>
				<boxGeometry args={[3, 0.8, 0.1]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					roughness={0.3}
					metalness={0.7}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.3}
				/>
			</mesh>
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collision bodies for gym - floor, walls, and equipment.
 */
function GymColliders() {
	const wallThickness = 0.5;
	const wallHeight = ROOM_HEIGHT;

	return (
		<>
			{/* Floor */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, 0.25, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Back wall (negative Z) */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, -ROOM_DEPTH / 2 - wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Front wall (positive Z) */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, ROOM_DEPTH / 2 + wallThickness / 2]}>
				<CuboidCollider args={[ROOM_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Left wall (negative X) */}
			<RigidBody type="fixed" position={[-ROOM_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Right wall (positive X) */}
			<RigidBody type="fixed" position={[ROOM_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Equipment colliders */}
			{/* Squat rack */}
			<RigidBody type="fixed" position={[-5, 1.5, 0]}>
				<CuboidCollider args={[1.5, 1.5, 1]} />
			</RigidBody>
			{/* Bench station */}
			<RigidBody type="fixed" position={[0, 0.5, 2]}>
				<CuboidCollider args={[1, 0.5, 1.5]} />
			</RigidBody>
			{/* Deadlift platform */}
			<RigidBody type="fixed" position={[5, 0.15, 0]}>
				<CuboidCollider args={[1.5, 0.15, 2]} />
			</RigidBody>
		</>
	);
}

/**
 * GymRoom - Displays powerlifting PRs with data-driven visualization.
 */
export function GymRoom({ debug = false, onDoorActivate }: GymRoomProps) {
	const [liftsData, setLiftsData] = useState<LiftsManifest | null>(null);
	const [loading, setLoading] = useState(true);

	// Load lifts manifest with abort cleanup
	useEffect(() => {
		const controller = new AbortController();

		async function loadLifts() {
			try {
				const response = await fetch("/manifests/lifts.manifest.json", {
					signal: controller.signal,
				});
				const manifest: LiftsManifest = await response.json();
				setLiftsData(manifest);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("[GymRoom] Failed to load lifts manifest:", error);
			} finally {
				setLoading(false);
			}
		}

		loadLifts();
		return () => controller.abort();
	}, []);

	// Get PR weights for visualization
	const squatPR = liftsData?.lifts.find((l) => l.lift === "squat")?.pr.weight ?? 135;
	const benchPR = liftsData?.lifts.find((l) => l.lift === "bench")?.pr.weight ?? 135;
	const deadliftPR = liftsData?.lifts.find((l) => l.lift === "deadlift")?.pr.weight ?? 135;

	return (
		<group name="room-gym">
			{/* Collision bodies */}
			<GymColliders />

			{/* Structure */}
			<Floor />
			<Walls />
			<Ceiling />

			{/* Equipment stations - arranged in a row */}
			<SquatRack weight={squatPR} position={[-5, 0, 0]} />
			<BenchStation weight={benchPR} position={[0, 0, 2]} />
			<DeadliftPlatform weight={deadliftPR} position={[5, 0, 0]} />

			{/* PR Wall */}
			{!loading && liftsData && (
				<PlaqueWall
					lifts={liftsData.lifts}
					total={liftsData.total}
				/>
			)}

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[-ROOM_WIDTH / 2 + 1, 2, 0]}
				targetRoom="mainhall"
				spawnPosition={[7, 0, 0]}
				spawnRotation={Math.PI / 2}
				onActivate={onDoorActivate}
				debug={debug}
			/>

			{/* Door frame */}
			<group position={[-ROOM_WIDTH / 2 + 0.15, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
				<mesh>
					<boxGeometry args={[3.5, 4.5, 0.3]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						roughness={0.4}
						metalness={0.6}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.1}
					/>
				</mesh>
				<mesh position={[0, 0, -0.1]}>
					<boxGeometry args={[2.5, 4, 0.2]} />
					<meshBasicMaterial color="#050510" />
				</mesh>
			</group>

			{/* Lighting - industrial style */}
			<ambientLight intensity={0.15} color="#ffffff" />

			{/* Overhead industrial lights */}
			<pointLight
				position={[-5, ROOM_HEIGHT - 0.5, 0]}
				intensity={0.6}
				color="#ffffff"
				distance={10}
				decay={2}
				castShadow
			/>
			<pointLight
				position={[0, ROOM_HEIGHT - 0.5, 0]}
				intensity={0.6}
				color="#ffffff"
				distance={10}
				decay={2}
				castShadow
			/>
			<pointLight
				position={[5, ROOM_HEIGHT - 0.5, 0]}
				intensity={0.6}
				color="#ffffff"
				distance={10}
				decay={2}
				castShadow
			/>

			{/* Accent lighting on PR wall */}
			<spotLight
				position={[0, 5, -4]}
				angle={0.4}
				penumbra={0.5}
				intensity={0.5}
				color={THREE_COLORS.warm}
				target-position={[0, 2.5, -ROOM_DEPTH / 2]}
			/>
		</group>
	);
}
