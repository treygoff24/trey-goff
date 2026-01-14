"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";

// =============================================================================
// Types
// =============================================================================

interface ExteriorRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const GROUND_SIZE = 100;
const MANSION_WIDTH = 20;
const MANSION_DEPTH = 15;
const MANSION_HEIGHT = 12;

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Sky with O'Neill cylinder sprites as distant background.
 * Placeholder: simple gradient dome with floating cylinders.
 */
function Sky() {
	const cylinderPositions: [number, number, number][] = [
		[-80, 40, -150],
		[60, 50, -180],
		[20, 35, -200],
	];

	return (
		<group>
			{/* Sky dome - simple hemisphere */}
			<mesh rotation={[0, 0, 0]} position={[0, -10, 0]}>
				<sphereGeometry args={[200, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
				<meshBasicMaterial color="#0a1020" side={THREE.BackSide} />
			</mesh>

			{/* O'Neill cylinders as distant sprites */}
			{cylinderPositions.map((pos, i) => (
				<mesh key={i} position={pos} rotation={[0, 0, Math.PI / 6 + i * 0.2]}>
					<cylinderGeometry args={[3, 3, 25, 16]} />
					<meshBasicMaterial
						color={THREE_COLORS.accent}
						transparent
						opacity={0.3}
					/>
				</mesh>
			))}

			{/* Stars */}
			<Stars />
		</group>
	);
}

/**
 * Mountain backdrop as simple geometry.
 */
function Mountains() {
	const mountainData = [
		{ pos: [-60, 0, -80], scale: [30, 25, 15] },
		{ pos: [-20, 0, -90], scale: [25, 30, 12] },
		{ pos: [30, 0, -85], scale: [35, 22, 18] },
		{ pos: [70, 0, -75], scale: [28, 28, 14] },
	];

	return (
		<group>
			{mountainData.map((m, i) => (
				<mesh
					key={i}
					position={m.pos as [number, number, number]}
					scale={m.scale as [number, number, number]}
				>
					<coneGeometry args={[1, 1, 4]} />
					<meshStandardMaterial
						color="#1a2030"
						roughness={0.9}
						metalness={0.1}
					/>
				</mesh>
			))}
		</group>
	);
}

/**
 * Placeholder mansion facade.
 * Will be replaced with actual GLB model.
 */
function MansionFacade() {
	return (
		<group position={[0, 0, -20]}>
			{/* Main building */}
			<mesh position={[0, MANSION_HEIGHT / 2, 0]} castShadow receiveShadow>
				<boxGeometry args={[MANSION_WIDTH, MANSION_HEIGHT, MANSION_DEPTH]} />
				<meshStandardMaterial
					color="#2a2a3a"
					roughness={0.7}
					metalness={0.3}
				/>
			</mesh>

			{/* Roof */}
			<mesh position={[0, MANSION_HEIGHT + 2, 0]} castShadow>
				<coneGeometry args={[MANSION_WIDTH * 0.7, 4, 4]} />
				<meshStandardMaterial
					color="#1a1a2a"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>

			{/* Entrance door frame */}
			<mesh position={[0, 2, MANSION_DEPTH / 2 + 0.1]}>
				<boxGeometry args={[4, 4, 0.3]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.4}
					metalness={0.6}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.2}
				/>
			</mesh>

			{/* Windows */}
			{[-6, 6].map((x) =>
				[3, 7].map((y) => (
					<mesh key={`${x}-${y}`} position={[x, y, MANSION_DEPTH / 2 + 0.1]}>
						<planeGeometry args={[2, 2.5]} />
						<meshBasicMaterial
							color={THREE_COLORS.accent}
							transparent
							opacity={0.6}
						/>
					</mesh>
				))
			)}
		</group>
	);
}

/**
 * Goff Industries Mech placeholder.
 * Will be replaced with actual GLB model with LOD.
 */
function MechPlaceholder({ reducedMotion = false }: { reducedMotion?: boolean }) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!groupRef.current || reducedMotion) return;
		// Gentle idle animation
		groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
		groupRef.current.position.y = 4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
	});

	return (
		<group ref={groupRef} position={[25, 4, -10]}>
			{/* Torso */}
			<mesh castShadow>
				<boxGeometry args={[4, 5, 3]} />
				<meshStandardMaterial
					color="#3a3a4a"
					roughness={0.3}
					metalness={0.8}
				/>
			</mesh>

			{/* Head */}
			<mesh position={[0, 3.5, 0]} castShadow>
				<boxGeometry args={[2, 2, 2]} />
				<meshStandardMaterial
					color="#2a2a3a"
					roughness={0.3}
					metalness={0.8}
				/>
			</mesh>

			{/* Eyes */}
			<mesh position={[0, 3.5, 1.1]}>
				<planeGeometry args={[1.5, 0.5]} />
				<meshBasicMaterial color={THREE_COLORS.warm} />
			</mesh>

			{/* Arms */}
			{[-3, 3].map((x) => (
				<group key={x} position={[x, 0, 0]}>
					{/* Upper arm */}
					<mesh position={[0, -1, 0]} castShadow>
						<boxGeometry args={[1.5, 3, 1.5]} />
						<meshStandardMaterial
							color="#3a3a4a"
							roughness={0.3}
							metalness={0.8}
						/>
					</mesh>
					{/* Lower arm */}
					<mesh position={[0, -4, 0]} castShadow>
						<boxGeometry args={[1.2, 3, 1.2]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.3}
							metalness={0.8}
						/>
					</mesh>
				</group>
			))}

			{/* Legs */}
			{[-1.5, 1.5].map((x) => (
				<group key={x} position={[x, -4, 0]}>
					<mesh castShadow>
						<boxGeometry args={[1.5, 4, 1.5]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.3}
							metalness={0.8}
						/>
					</mesh>
				</group>
			))}

			{/* Goff Industries label */}
			<mesh position={[0, 1, 1.6]}>
				<planeGeometry args={[3, 0.8]} />
				<meshBasicMaterial color={THREE_COLORS.accent} transparent opacity={0.8} />
			</mesh>
		</group>
	);
}

/**
 * Ground plane with path to mansion.
 */
function Ground() {
	return (
		<group>
			{/* Main ground */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0, 0]}
				receiveShadow
				name="ground"
			>
				<planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
				<meshStandardMaterial
					color="#1a1a2e"
					roughness={0.9}
					metalness={0.1}
				/>
			</mesh>

			{/* Path to mansion */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, -5]}
				receiveShadow
			>
				<planeGeometry args={[4, 20]} />
				<meshStandardMaterial
					color="#2a2a3e"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>

			{/* Grid overlay */}
			<gridHelper
				args={[GROUND_SIZE, 50, "#333355", "#222244"]}
				position={[0, 0.02, 0]}
				name="grid"
			/>
		</group>
	);
}

/**
 * Garage structure placeholder.
 */
function Garage() {
	return (
		<group position={[-25, 0, -15]}>
			<mesh position={[0, 3, 0]} castShadow receiveShadow>
				<boxGeometry args={[10, 6, 8]} />
				<meshStandardMaterial
					color="#252535"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>

			{/* Garage door */}
			<mesh position={[0, 2.5, 4.1]}>
				<planeGeometry args={[6, 5]} />
				<meshStandardMaterial
					color="#1a1a2a"
					roughness={0.6}
					metalness={0.4}
				/>
			</mesh>
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ExteriorRoom - The outdoor area with mansion facade, mech, and entry to main hall.
 */
/**
 * Collision bodies for exterior - ground and mansion wall.
 */
function ExteriorColliders() {
	// Garage is at [-25, 0, -15], mesh is 10x6x8
	const garagePos: [number, number, number] = [-25, 3, -15];
	const garageSize: [number, number, number] = [5, 3, 4]; // half-extents

	return (
		<>
			{/* Ground */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[GROUND_SIZE / 2, 0.25, GROUND_SIZE / 2]} />
			</RigidBody>

			{/* Mansion building - full bounding box */}
			<RigidBody type="fixed" position={[0, MANSION_HEIGHT / 2, -20]}>
				<CuboidCollider args={[MANSION_WIDTH / 2, MANSION_HEIGHT / 2, MANSION_DEPTH / 2]} />
			</RigidBody>

			{/* Garage structure */}
			<RigidBody type="fixed" position={garagePos}>
				<CuboidCollider args={garageSize} />
			</RigidBody>

			{/* Mech (don't walk through it) */}
			<RigidBody type="fixed" position={[25, 4, -10]}>
				<CuboidCollider args={[4, 8, 3]} />
			</RigidBody>
		</>
	);
}

export function ExteriorRoom({ debug = false, onDoorActivate }: ExteriorRoomProps) {
	return (
		<group name="room-exterior">
			{/* Collision bodies */}
			<ExteriorColliders />

			{/* Environment */}
			<Sky />
			<Mountains />
			<Ground />

			{/* Structures */}
			<MansionFacade />
			<Garage />
			<MechPlaceholder />

			{/* Lighting */}
			<ambientLight intensity={0.3} color="#8888aa" />
			<directionalLight
				position={[30, 50, 20]}
				intensity={1}
				color="#ffe8d0"
				castShadow
				shadow-mapSize={[2048, 2048]}
				shadow-camera-far={100}
				shadow-camera-left={-50}
				shadow-camera-right={50}
				shadow-camera-top={50}
				shadow-camera-bottom={-50}
			/>

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[0, 2, -12.5]}
				targetRoom="mainhall"
				spawnPosition={[0, 0, 8]}
				spawnRotation={Math.PI}
				onActivate={onDoorActivate}
				debug={debug}
				label="Enter Mansion"
				labelRotation={0}
			/>

			{/* Fog for atmosphere */}
			<fog attach="fog" args={["#070A0F", 20, 100]} />
		</group>
	);
}
