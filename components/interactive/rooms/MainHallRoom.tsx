"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
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
		label: "Exterior",
	},
	{
		id: "door-library",
		position: [-9, 2, 0],
		targetRoom: "library",
		spawnPosition: [6, 0, 5],
		spawnRotation: Math.PI,
		label: "Library",
	},
	{
		id: "door-gym",
		position: [9, 2, 0],
		targetRoom: "gym",
		spawnPosition: [-8, 0, 0],
		spawnRotation: -Math.PI / 2,
		label: "Gym",
	},
	{
		id: "door-projects",
		position: [0, 2, -12],
		targetRoom: "projects",
		spawnPosition: [0, 0, 8],
		spawnRotation: Math.PI,
		label: "Projects",
	},
];

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Floor with decorative marble-like pattern.
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
					roughness={0.4}
					metalness={0.4}
				/>
			</mesh>

			{/* Center medallion - outer ring */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, 0]}
				receiveShadow
			>
				<ringGeometry args={[3.5, 4.2, 64]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					roughness={0.3}
					metalness={0.7}
				/>
			</mesh>

			{/* Center medallion - inner circle */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, 0.01, 0]}
				receiveShadow
			>
				<circleGeometry args={[3.5, 64]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					roughness={0.5}
					metalness={0.5}
					transparent
					opacity={0.25}
				/>
			</mesh>

			{/* Decorative floor lines */}
			{[-6, 6].map((x) => (
				<mesh
					key={x}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[x, 0.005, 0]}
					receiveShadow
				>
					<planeGeometry args={[0.1, HALL_DEPTH - 2]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						roughness={0.4}
						metalness={0.6}
						transparent
						opacity={0.4}
					/>
				</mesh>
			))}
		</group>
	);
}

/**
 * Wall panel decoration.
 */
function WallPanel({ position, rotation = 0, width = 4, height = 5 }: {
	position: [number, number, number];
	rotation?: number;
	width?: number;
	height?: number;
}) {
	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Panel frame */}
			<mesh position={[0, 0, 0.02]}>
				<planeGeometry args={[width, height]} />
				<meshStandardMaterial
					color="#252538"
					roughness={0.6}
					metalness={0.4}
				/>
			</mesh>
			{/* Inner border */}
			<mesh position={[0, 0, 0.03]}>
				<planeGeometry args={[width - 0.4, height - 0.4]} />
				<meshStandardMaterial
					color="#1a1a2e"
					roughness={0.7}
					metalness={0.3}
				/>
			</mesh>
			{/* Accent line at top */}
			<mesh position={[0, height / 2 - 0.3, 0.04]}>
				<planeGeometry args={[width - 0.6, 0.08]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					emissive={THREE_COLORS.warm}
					emissiveIntensity={0.2}
					roughness={0.3}
					metalness={0.7}
				/>
			</mesh>
		</group>
	);
}

/**
 * Walls with doorway cutouts and decorative panels.
 */
function Walls() {
	return (
		<group>
			{/* Back wall (with door to exterior) */}
			<mesh position={[0, HALL_HEIGHT / 2, HALL_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[HALL_WIDTH, HALL_HEIGHT, 0.5]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
			{/* Back wall panels */}
			<WallPanel position={[-6, 4, HALL_DEPTH / 2 - 0.2]} />
			<WallPanel position={[6, 4, HALL_DEPTH / 2 - 0.2]} />

			{/* Front wall (with door to projects) */}
			<mesh position={[0, HALL_HEIGHT / 2, -HALL_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[HALL_WIDTH, HALL_HEIGHT, 0.5]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
			{/* Front wall panels */}
			<WallPanel position={[-6, 4, -HALL_DEPTH / 2 + 0.2]} rotation={Math.PI} />
			<WallPanel position={[6, 4, -HALL_DEPTH / 2 + 0.2]} rotation={Math.PI} />

			{/* Left wall (with door to library) */}
			<mesh position={[-HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.5, HALL_HEIGHT, HALL_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
			{/* Left wall panels */}
			<WallPanel position={[-HALL_WIDTH / 2 + 0.2, 4, -6]} rotation={Math.PI / 2} />
			<WallPanel position={[-HALL_WIDTH / 2 + 0.2, 4, 6]} rotation={Math.PI / 2} />

			{/* Right wall (with door to gym) */}
			<mesh position={[HALL_WIDTH / 2, HALL_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.5, HALL_HEIGHT, HALL_DEPTH]} />
				<meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
			</mesh>
			{/* Right wall panels */}
			<WallPanel position={[HALL_WIDTH / 2 - 0.2, 4, -6]} rotation={-Math.PI / 2} />
			<WallPanel position={[HALL_WIDTH / 2 - 0.2, 4, 6]} rotation={-Math.PI / 2} />
		</group>
	);
}

/**
 * Ornate chandelier with crystal-like elements.
 */
function Chandelier() {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!groupRef.current) return;
		// Gentle sway
		groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.02;
	});

	return (
		<group ref={groupRef} position={[0, HALL_HEIGHT - 1.5, 0]}>
			{/* Chain */}
			<mesh position={[0, 1, 0]}>
				<cylinderGeometry args={[0.04, 0.04, 2, 8]} />
				<meshStandardMaterial color="#666" metalness={0.9} roughness={0.2} />
			</mesh>

			{/* Main ring */}
			<mesh rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[1.2, 0.08, 8, 32]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					metalness={0.85}
					roughness={0.15}
				/>
			</mesh>

			{/* Inner ring */}
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
				<torusGeometry args={[0.7, 0.06, 8, 24]} />
				<meshStandardMaterial
					color={THREE_COLORS.warm}
					metalness={0.85}
					roughness={0.15}
				/>
			</mesh>

			{/* Crystal drops on outer ring */}
			{Array.from({ length: 8 }).map((_, i) => {
				const angle = (i / 8) * Math.PI * 2;
				const x = Math.cos(angle) * 1.2;
				const z = Math.sin(angle) * 1.2;
				return (
					<group key={i} position={[x, -0.4, z]}>
						<mesh>
							<octahedronGeometry args={[0.12, 0]} />
							<meshStandardMaterial
								color="#ffffff"
								transparent
								opacity={0.7}
								metalness={0.1}
								roughness={0.1}
							/>
						</mesh>
						{/* Small light at each crystal */}
						<pointLight
							intensity={0.15}
							color={THREE_COLORS.warm}
							distance={4}
							decay={2}
						/>
					</group>
				);
			})}

			{/* Center gem */}
			<mesh position={[0, -0.5, 0]}>
				<octahedronGeometry args={[0.25, 0]} />
				<meshStandardMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={0.8}
					emissive={THREE_COLORS.accent}
					emissiveIntensity={0.3}
				/>
			</mesh>
		</group>
	);
}

/**
 * Ceiling with decorative molding.
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

			{/* Ceiling molding - outer border */}
			<mesh position={[0, HALL_HEIGHT - 0.1, 0]}>
				<boxGeometry args={[HALL_WIDTH - 0.5, 0.2, 0.3]} />
				<meshStandardMaterial color="#252530" roughness={0.6} metalness={0.3} />
			</mesh>
			<mesh position={[0, HALL_HEIGHT - 0.1, HALL_DEPTH / 2 - 0.5]}>
				<boxGeometry args={[HALL_WIDTH - 0.5, 0.2, 0.3]} />
				<meshStandardMaterial color="#252530" roughness={0.6} metalness={0.3} />
			</mesh>
			<mesh position={[0, HALL_HEIGHT - 0.1, -HALL_DEPTH / 2 + 0.5]}>
				<boxGeometry args={[HALL_WIDTH - 0.5, 0.2, 0.3]} />
				<meshStandardMaterial color="#252530" roughness={0.6} metalness={0.3} />
			</mesh>

			{/* Chandelier */}
			<Chandelier />
		</group>
	);
}

/**
 * Door frame with 3D text label.
 */
function DoorFrame({
	position,
	rotation = 0,
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

			{/* Label background */}
			<mesh position={[0, 3, 0.2]}>
				<planeGeometry args={[3, 0.7]} />
				<meshStandardMaterial
					color="#0B1020"
					roughness={0.5}
					metalness={0.3}
				/>
			</mesh>

			{/* 3D Text label */}
			<Text
				position={[0, 3, 0.25]}
				fontSize={0.35}
				color={THREE_COLORS.accent}
				anchorX="center"
				anchorY="middle"
				font="/fonts/inter-medium.woff"
				characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
			>
				{label}
			</Text>
		</group>
	);
}

/**
 * Decorative pillars with ornate capitals.
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
					{/* Base - stepped */}
					<mesh position={[0, 0.15, 0]} castShadow>
						<boxGeometry args={[1.4, 0.3, 1.4]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>
					<mesh position={[0, 0.4, 0]} castShadow>
						<boxGeometry args={[1.2, 0.2, 1.2]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>

					{/* Column shaft */}
					<mesh position={[0, HALL_HEIGHT / 2, 0]} castShadow>
						<cylinderGeometry args={[0.35, 0.45, HALL_HEIGHT - 1.5, 12]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.4}
							metalness={0.6}
						/>
					</mesh>

					{/* Capital - ornate top */}
					<mesh position={[0, HALL_HEIGHT - 0.5, 0]} castShadow>
						<boxGeometry args={[1.2, 0.2, 1.2]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>
					<mesh position={[0, HALL_HEIGHT - 0.25, 0]} castShadow>
						<boxGeometry args={[1.4, 0.3, 1.4]} />
						<meshStandardMaterial
							color="#2a2a3a"
							roughness={0.5}
							metalness={0.5}
						/>
					</mesh>

					{/* Accent ring */}
					<mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
						<torusGeometry args={[0.48, 0.04, 8, 16]} />
						<meshStandardMaterial
							color={THREE_COLORS.warm}
							metalness={0.8}
							roughness={0.2}
						/>
					</mesh>
				</group>
			))}
		</group>
	);
}

/**
 * Ambient floating particles for atmosphere.
 */
function AmbientParticles() {
	const count = 50;
	const positions = useMemo(() => {
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			pos[i * 3] = (Math.random() - 0.5) * HALL_WIDTH * 0.8;
			pos[i * 3 + 1] = Math.random() * HALL_HEIGHT * 0.8 + 1;
			pos[i * 3 + 2] = (Math.random() - 0.5) * HALL_DEPTH * 0.8;
		}
		return pos;
	}, []);

	const pointsRef = useRef<THREE.Points>(null);

	useFrame((state) => {
		if (!pointsRef.current) return;
		const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
		for (let i = 0; i < count; i++) {
			positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
		}
		pointsRef.current.geometry.attributes.position.needsUpdate = true;
	});

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					count={count}
					array={positions}
					itemSize={3}
				/>
			</bufferGeometry>
			<pointsMaterial
				size={0.05}
				color={THREE_COLORS.accent}
				transparent
				opacity={0.4}
				sizeAttenuation
			/>
		</points>
	);
}

/**
 * Central pedestal with improved holographic mansion.
 */
function CentralPedestal() {
	const holoRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (!holoRef.current) return;
		holoRef.current.rotation.y = state.clock.elapsedTime * 0.3;
	});

	return (
		<group position={[0, 0, 0]}>
			{/* Pedestal base - stepped */}
			<mesh position={[0, 0.2, 0]} castShadow>
				<cylinderGeometry args={[2, 2.2, 0.4, 16]} />
				<meshStandardMaterial
					color="#2a2a3a"
					roughness={0.4}
					metalness={0.7}
				/>
			</mesh>
			<mesh position={[0, 0.6, 0]} castShadow>
				<cylinderGeometry args={[1.6, 1.8, 0.4, 16]} />
				<meshStandardMaterial
					color="#252535"
					roughness={0.4}
					metalness={0.7}
				/>
			</mesh>
			<mesh position={[0, 0.9, 0]} castShadow>
				<cylinderGeometry args={[1.3, 1.5, 0.2, 16]} />
				<meshStandardMaterial
					color="#1a1a2a"
					roughness={0.3}
					metalness={0.8}
				/>
			</mesh>

			{/* Holographic mansion model */}
			<Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
				<group ref={holoRef} position={[0, 1.8, 0]}>
					{/* Main building */}
					<mesh>
						<boxGeometry args={[1.2, 0.7, 0.8]} />
						<meshStandardMaterial
							color={THREE_COLORS.accent}
							transparent
							opacity={0.5}
							emissive={THREE_COLORS.accent}
							emissiveIntensity={0.4}
						/>
					</mesh>
					{/* Roof */}
					<mesh position={[0, 0.5, 0]}>
						<coneGeometry args={[0.7, 0.4, 4]} />
						<meshStandardMaterial
							color={THREE_COLORS.accent}
							transparent
							opacity={0.5}
							emissive={THREE_COLORS.accent}
							emissiveIntensity={0.4}
						/>
					</mesh>
					{/* Wings */}
					<mesh position={[-0.8, -0.1, 0]}>
						<boxGeometry args={[0.5, 0.5, 0.6]} />
						<meshStandardMaterial
							color={THREE_COLORS.accent}
							transparent
							opacity={0.4}
							emissive={THREE_COLORS.accent}
							emissiveIntensity={0.3}
						/>
					</mesh>
					<mesh position={[0.8, -0.1, 0]}>
						<boxGeometry args={[0.5, 0.5, 0.6]} />
						<meshStandardMaterial
							color={THREE_COLORS.accent}
							transparent
							opacity={0.4}
							emissive={THREE_COLORS.accent}
							emissiveIntensity={0.3}
						/>
					</mesh>
				</group>
			</Float>

			{/* Glow ring */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.05, 0]}>
				<ringGeometry args={[1.0, 1.3, 32]} />
				<meshBasicMaterial
					color={THREE_COLORS.accent}
					transparent
					opacity={0.25}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Hologram base light */}
			<pointLight
				position={[0, 1.5, 0]}
				intensity={0.5}
				color={THREE_COLORS.accent}
				distance={5}
				decay={2}
			/>
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Collision bodies for main hall - floor, walls, pillars, pedestal.
 */
function HallColliders() {
	const wallThickness = 0.5;
	const wallHeight = HALL_HEIGHT;
	const pillarPositions: [number, number][] = [
		[-HALL_WIDTH / 2 + 2, -HALL_DEPTH / 2 + 2],
		[HALL_WIDTH / 2 - 2, -HALL_DEPTH / 2 + 2],
		[-HALL_WIDTH / 2 + 2, HALL_DEPTH / 2 - 2],
		[HALL_WIDTH / 2 - 2, HALL_DEPTH / 2 - 2],
	];

	return (
		<>
			{/* Floor */}
			<RigidBody type="fixed" position={[0, -0.25, 0]}>
				<CuboidCollider args={[HALL_WIDTH / 2, 0.25, HALL_DEPTH / 2]} />
			</RigidBody>

			{/* Back wall (negative Z) */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, -HALL_DEPTH / 2 - wallThickness / 2]}>
				<CuboidCollider args={[HALL_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Front wall (positive Z) */}
			<RigidBody type="fixed" position={[0, wallHeight / 2, HALL_DEPTH / 2 + wallThickness / 2]}>
				<CuboidCollider args={[HALL_WIDTH / 2, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Left wall (negative X) */}
			<RigidBody type="fixed" position={[-HALL_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, HALL_DEPTH / 2]} />
			</RigidBody>

			{/* Right wall (positive X) */}
			<RigidBody type="fixed" position={[HALL_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, HALL_DEPTH / 2]} />
			</RigidBody>

			{/* Pillars */}
			{pillarPositions.map(([x, z], i) => (
				<RigidBody key={i} type="fixed" position={[x, wallHeight / 2, z]}>
					<CuboidCollider args={[0.4, wallHeight / 2, 0.4]} />
				</RigidBody>
			))}

			{/* Central pedestal */}
			<RigidBody type="fixed" position={[0, 0.75, 0]}>
				<CuboidCollider args={[1.5, 0.75, 1.5]} />
			</RigidBody>
		</>
	);
}

export function MainHallRoom({ debug = false, onDoorActivate }: MainHallRoomProps) {
	return (
		<group name="room-mainhall">
			{/* Collision bodies */}
			<HallColliders />

			{/* Structure */}
			<Floor />
			<Walls />
			<Ceiling />
			<Pillars />

			{/* Central feature */}
			<CentralPedestal />

			{/* Ambient particles */}
			<AmbientParticles />

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

			{/* Lighting - improved */}
			<ambientLight intensity={0.15} color="#8888aa" />
			<pointLight
				position={[0, HALL_HEIGHT - 2, 0]}
				intensity={0.8}
				color={THREE_COLORS.warm}
				distance={25}
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
					intensity={0.25}
					color={THREE_COLORS.accent}
					distance={6}
					decay={2}
				/>
			))}

			{/* Subtle floor accent lights at pillars */}
			{[
				[-7, 0.5, -8],
				[7, 0.5, -8],
				[-7, 0.5, 8],
				[7, 0.5, 8],
			].map((pos, i) => (
				<pointLight
					key={`pillar-${i}`}
					position={pos as [number, number, number]}
					intensity={0.1}
					color={THREE_COLORS.warm}
					distance={3}
					decay={2}
				/>
			))}
		</group>
	);
}
