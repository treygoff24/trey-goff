"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger, type DoorConfig } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";

// =============================================================================
// Types
// =============================================================================

interface MainHallRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
}

// =============================================================================
// Constants
// =============================================================================

const HALL_WIDTH = 20;
const HALL_DEPTH = 25;
const HALL_HEIGHT = 8;

// Door configurations for all connected rooms
const DOOR_CONFIGS: DoorConfig[] = [
	{
		id: "door-exterior",
		position: [0, 2, 12],
		targetRoom: "exterior",
		spawnPosition: [0, 0, -5],
		spawnRotation: 0,
	},
	{
		id: "door-library",
		position: [-9, 2, 0],
		targetRoom: "library",
		spawnPosition: [8, 0, 0],
		spawnRotation: Math.PI / 2,
	},
	{
		id: "door-gym",
		position: [9, 2, 0],
		targetRoom: "gym",
		spawnPosition: [-8, 0, 0],
		spawnRotation: -Math.PI / 2,
	},
	{
		id: "door-projects",
		position: [0, 2, -12],
		targetRoom: "projects",
		spawnPosition: [0, 0, 8],
		spawnRotation: Math.PI,
	},
];

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Floor with decorative pattern.
 */
function Floor() {
	return (
		<group>
			{/* Main floor */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0, 0]}
				receiveShadow
				name="ground"
			>
				<planeGeometry args={[HALL_WIDTH, HALL_DEPTH]} />
				<meshStandardMaterial
					color="#1a1a28"
					roughness={0.6}
					metalness={0.3}
				/>
			</mesh>

			{/* Center medallion */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, 0]}
				receiveShadow
			>
				<circleGeometry args={[4, 32]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					roughness={0.5}
					metalness={0.5}
					transparent
					opacity={0.3}
				/>
			</mesh>
		</group>
	);
}

/**
 * Walls with doorway cutouts.
 */
function Walls() {
	return (
		<group>
			{/* Back wall (with door to exterior) */}
			<mesh position={[0, HALL_HEIGHT / 2, HALL_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[HALL_WIDTH, HALL_HEIGHT, 0.5]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Front wall (with door to projects) */}
			<mesh position={[0, HALL_HEIGHT / 2, -HALL_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[HALL_WIDTH, HALL_HEIGHT, 0.5]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Left wall (with door to library) */}
			<mesh position={[-HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.5, HALL_HEIGHT, HALL_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>

			{/* Right wall (with door to gym) */}
			<mesh position={[HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.5, HALL_HEIGHT, HALL_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
		</group>
	);
}

/**
 * Ceiling with central light fixture.
 */
function Ceiling() {
	return (
		<group>
			{/* Ceiling plane */}
			<mesh
				rotation={[Math.PI / 2, 0, 0]}
				position={[0, HALL_HEIGHT, 0]}
			>
				<planeGeometry args={[HALL_WIDTH, HALL_DEPTH]} />
				<meshStandardMaterial color="#0a0a15" roughness={0.9} metalness={0.1} />
			</mesh>

			{/* Central chandelier placeholder */}
			<group position={[0, HALL_HEIGHT - 1.5, 0]}>
				{/* Chain */}
				<mesh position={[0, 0.75, 0]}>
					<cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
					<meshStandardMaterial color="#555" metalness={0.9} roughness={0.2} />
				</mesh>

				{/* Main body */}
				<mesh>
					<cylinderGeometry args={[0.8, 1.2, 1, 8]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						metalness={0.8}
						roughness={0.3}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.3}
					/>
				</mesh>
			</group>
		</group>
	);
}

/**
 * Door frame with label signage.
 * TODO: Use drei Text component to render label above door
 */
function DoorFrame({
	position,
	rotation = 0,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Will use with drei Text
	label,
}: {
	position: [number, number, number];
	rotation?: number;
	label: string;
}) {
	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Door frame */}
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

			{/* Door opening (dark) */}
			<mesh position={[0, 0, 0.1]}>
				<boxGeometry args={[2.5, 4, 0.2]} />
				<meshBasicMaterial color="#050510" />
			</mesh>

			{/* Label above door */}
			<mesh position={[0, 3, 0.2]}>
				<planeGeometry args={[3, 0.6]} />
				<meshBasicMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={0.9}
				/>
			</mesh>

			{/* Label text placeholder - in production would use drei Text */}
			<mesh position={[0, 3, 0.25]}>
				<planeGeometry args={[2.8, 0.4]} />
				<meshBasicMaterial color="#0B1020" />
			</mesh>
		</group>
	);
}

/**
 * Decorative pillars.
 */
function Pillars() {
	const pillarPositions: [number, number, number][] = [
		[-7, 0, -8],
		[7, 0, -8],
		[-7, 0, 8],
		[7, 0, 8],
	];

	return (
		<group>
			{pillarPositions.map((pos, i) => (
				<group key={i} position={pos}>
					{/* Base */}
					<mesh position={[0, 0.3, 0]} castShadow>
						<boxGeometry args={[1.2, 0.6, 1.2]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>

					{/* Column */}
					<mesh position={[0, HALL_HEIGHT / 2, 0]} castShadow>
						<cylinderGeometry args={[0.4, 0.5, HALL_HEIGHT - 1, 8]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.4}
							metalness={0.6}
						/>
					</mesh>

					{/* Capital */}
					<mesh position={[0, HALL_HEIGHT - 0.3, 0]} castShadow>
						<boxGeometry args={[1.2, 0.6, 1.2]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}

/**
 * Central pedestal with holographic map hint.
 */
function CentralPedestal() {
	const holoRef = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!holoRef.current) return;
		holoRef.current.rotation.y = state.clock.elapsedTime * 0.3;
	});

	return (
		<group position={[0, 0, 0]}>
			{/* Pedestal base */}
			<mesh position={[0, 0.5, 0]} castShadow>
				<cylinderGeometry args={[1.5, 1.8, 1, 8]} />
				<meshStandardMaterial
					color="#2a2a3a"
					roughness={0.4}
					metalness={0.7}
				/>
			</mesh>

			{/* Holographic mansion model */}
			<group position={[0, 1.5, 0]}>
				<mesh ref={holoRef}>
					<boxGeometry args={[1.5, 0.8, 1]} />
					<meshStandardMaterial
						color={THREE_COLORS.accent}
						transparent
						opacity={0.6}
						emissive={THREE_COLORS.accent}
						emissiveIntensity={0.5}
					/>
				</mesh>

				{/* Glow ring */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
					<ringGeometry args={[1.2, 1.5, 32]} />
					<meshBasicMaterial
						color={THREE_COLORS.accent}
						transparent
						opacity={0.3}
						side={THREE.DoubleSide}
					/>
				</mesh>
			</group>
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * MainHallRoom - The central hub connecting all other rooms.
 */
export function MainHallRoom({ debug = false, onDoorActivate }: MainHallRoomProps) {
	return (
		<group name="room-mainhall">
			{/* Structure */}
			<Floor />
			<Walls />
			<Ceiling />
			<Pillars />

			{/* Central feature */}
			<CentralPedestal />

			{/* Door frames with labels */}
			<DoorFrame position={[0, 2, 12.25]} rotation={0} label="Exterior" />
			<DoorFrame position={[-9.75, 2, 0]} rotation={Math.PI / 2} label="Library" />
			<DoorFrame position={[9.75, 2, 0]} rotation={-Math.PI / 2} label="Gym" />
			<DoorFrame position={[0, 2, -12.25]} rotation={Math.PI} label="Projects" />

			{/* Door triggers */}
			{DOOR_CONFIGS.map((door) => (
				<DoorTrigger
					key={door.id}
					position={door.position}
					targetRoom={door.targetRoom}
					spawnPosition={door.spawnPosition}
					spawnRotation={door.spawnRotation}
					onActivate={onDoorActivate}
					debug={debug}
				/>
			))}

			{/* Lighting */}
			<ambientLight intensity={0.2} color="#8888aa" />
			<pointLight
				position={[0, HALL_HEIGHT - 2, 0]}
				intensity={1}
				color={THREE_COLORS.warm}
				distance={20}
				decay={2}
				castShadow
			/>

			{/* Accent lights near doors */}
			{[
				[0, 4, 10],
				[-8, 4, 0],
				[8, 4, 0],
				[0, 4, -10],
			].map((pos, i) => (
				<pointLight
					key={i}
					position={pos as [number, number, number]}
					intensity={0.3}
					color={THREE_COLORS.accent}
					distance={8}
					decay={2}
				/>
			))}
		</group>
	);
}
