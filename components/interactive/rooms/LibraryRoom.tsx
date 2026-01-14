"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { THREE_COLORS } from "@/lib/interactive/colors";
import { DoorTrigger } from "../DoorTrigger";
import type { RoomId } from "@/lib/interactive/types";
import type { BooksManifest, BookManifestEntry } from "@/lib/interactive/manifest-types";
import type { OverlayContent } from "../ContentOverlay";

// =============================================================================
// Types
// =============================================================================

interface LibraryRoomProps {
	/** Show debug visualizations */
	debug?: boolean;
	/** Callback when door is activated */
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
	/** Callback when content is selected for overlay */
	onContentSelect?: (content: OverlayContent) => void;
}

// =============================================================================
// Constants
// =============================================================================

const ROOM_WIDTH = 18;
const ROOM_DEPTH = 16;
const ROOM_HEIGHT = 7;

// Bookshelf dimensions
const SHELF_WIDTH = 3;
const SHELF_HEIGHT = 5;
const SHELF_DEPTH = 0.8;
const SHELF_LEVELS = 4;
const SHELF_SPACING = 1.1; // Space between shelf levels

// Book dimensions (randomized slightly)
const BOOK_BASE_WIDTH = 0.15;
const BOOK_BASE_HEIGHT = 0.9;
const BOOK_BASE_DEPTH = 0.6;

// Colors for book covers (tier-based)
const TIER_COLORS: Record<string, string> = {
	favorites: "#7C5CFF",    // Accent purple
	recommended: "#FFB86B",  // Warm gold
	read: "#4a5568",         // Dark slate
	reading: "#48bb78",      // Green
	want: "#718096",         // Light slate
};

// Color cache to avoid allocations
const colorCache = new Map<string, THREE.Color>();
function getCachedColor(hex: string): THREE.Color {
	if (!colorCache.has(hex)) {
		colorCache.set(hex, new THREE.Color(hex));
	}
	return colorCache.get(hex)!;
}

// Dust particle settings
const DUST_PARTICLE_COUNT = 80;
const DUST_DRIFT_SPEED = 0.08;
const DUST_SEED = 42;

// Seeded random generator for deterministic particle placement
function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

// Pre-generate dust particle data at module level for purity
const dustParticleData = (() => {
	const rng = seededRandom(DUST_SEED);
	const pos = new Float32Array(DUST_PARTICLE_COUNT * 3);
	const siz = new Float32Array(DUST_PARTICLE_COUNT);
	const vel = new Float32Array(DUST_PARTICLE_COUNT * 3);

	for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
		pos[i * 3] = (rng() - 0.5) * (ROOM_WIDTH - 4);
		pos[i * 3 + 1] = 1 + rng() * (ROOM_HEIGHT - 2);
		pos[i * 3 + 2] = (rng() - 0.5) * (ROOM_DEPTH - 4);
		siz[i] = 0.02 + rng() * 0.03;
		vel[i * 3] = (rng() - 0.5) * 0.1;
		vel[i * 3 + 1] = (rng() - 0.5) * 0.05;
		vel[i * 3 + 2] = (rng() - 0.5) * 0.1;
	}

	return { positions: pos, sizes: siz, velocities: vel };
})();

// =============================================================================
// Visual Enhancement Components
// =============================================================================

/**
 * Floating dust motes that catch the light.
 * Uses Points geometry for efficient rendering.
 */
function DustMotes() {
	const pointsRef = useRef<THREE.Points>(null);
	const timeRef = useRef(0);

	const { positions, sizes, velocities } = dustParticleData;

	const geometry = useMemo(() => {
		const geom = new THREE.BufferGeometry();
		geom.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
		geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
		return geom;
	}, [positions, sizes]);

	useFrame((_, delta) => {
		if (!pointsRef.current) return;

		timeRef.current += delta * DUST_DRIFT_SPEED;
		const posAttr = pointsRef.current.geometry.getAttribute("position");

		for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
			const baseX = positions[i * 3]!;
			const baseY = positions[i * 3 + 1]!;
			const baseZ = positions[i * 3 + 2]!;

			// Gentle sinusoidal drift
			const t = timeRef.current + i * 0.1;
			const driftX = Math.sin(t * velocities[i * 3]!) * 0.3;
			const driftY = Math.sin(t * 0.5 + i) * 0.15;
			const driftZ = Math.cos(t * velocities[i * 3 + 2]!) * 0.3;

			posAttr.setXYZ(i, baseX + driftX, baseY + driftY, baseZ + driftZ);
		}

		posAttr.needsUpdate = true;
	});

	return (
		<points ref={pointsRef}>
			<primitive object={geometry} attach="geometry" />
			<pointsMaterial
				color="#ffddaa"
				size={0.04}
				transparent
				opacity={0.4}
				sizeAttenuation
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}

/**
 * Decorative floor rug with pattern.
 */
function FloorRug() {
	return (
		<group position={[0, 0.01, 0]}>
			{/* Main rug body */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[8, 10]} />
				<meshStandardMaterial
					color="#3d1a1a"
					roughness={0.9}
					metalness={0}
				/>
			</mesh>

			{/* Decorative border */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
				<ringGeometry args={[3.2, 3.6, 32]} />
				<meshStandardMaterial
					color="#8b6914"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>

			{/* Inner pattern circle */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
				<ringGeometry args={[1.5, 1.8, 32]} />
				<meshStandardMaterial
					color="#8b6914"
					roughness={0.8}
					metalness={0.2}
				/>
			</mesh>

			{/* Center medallion */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
				<circleGeometry args={[0.8, 16]} />
				<meshStandardMaterial
					color="#5c3d1e"
					roughness={0.85}
					metalness={0.1}
				/>
			</mesh>
		</group>
	);
}

/**
 * Animated fireplace with flickering flames.
 */
function Fireplace() {
	const flameRef = useRef<THREE.Mesh>(null);
	const lightRef = useRef<THREE.PointLight>(null);

	useFrame((state) => {
		const t = state.clock.elapsedTime;

		// Animate flame mesh scale
		if (flameRef.current) {
			const flicker = 0.9 + Math.sin(t * 8) * 0.05 + Math.sin(t * 13) * 0.05;
			flameRef.current.scale.y = flicker;
			flameRef.current.scale.x = 0.95 + Math.sin(t * 10) * 0.05;
		}

		// Animate light intensity
		if (lightRef.current) {
			const intensity = 0.8 + Math.sin(t * 6) * 0.15 + Math.sin(t * 11) * 0.1;
			lightRef.current.intensity = intensity;
		}
	});

	return (
		<group position={[ROOM_WIDTH / 2 - 0.5, 0, -2]}>
			{/* Fireplace frame */}
			<mesh position={[0, 1.5, 0]} castShadow>
				<boxGeometry args={[0.3, 3, 2.5]} />
				<meshStandardMaterial color="#2d1a10" roughness={0.9} metalness={0} />
			</mesh>

			{/* Mantle */}
			<mesh position={[-0.1, 2.8, 0]} castShadow>
				<boxGeometry args={[0.5, 0.2, 3]} />
				<meshStandardMaterial color="#4a3728" roughness={0.7} metalness={0.1} />
			</mesh>

			{/* Firebox opening */}
			<mesh position={[0.05, 1, 0]}>
				<boxGeometry args={[0.25, 1.6, 1.8]} />
				<meshBasicMaterial color="#050505" />
			</mesh>

			{/* Flame glow mesh */}
			<mesh ref={flameRef} position={[-0.05, 0.8, 0]}>
				<coneGeometry args={[0.4, 0.8, 8]} />
				<meshBasicMaterial
					color="#ff6622"
					transparent
					opacity={0.7}
				/>
			</mesh>

			{/* Ember glow */}
			<mesh position={[-0.05, 0.35, 0]}>
				<sphereGeometry args={[0.5, 8, 8]} />
				<meshStandardMaterial
					color="#ff4400"
					emissive="#ff2200"
					emissiveIntensity={2}
					transparent
					opacity={0.5}
				/>
			</mesh>

			{/* Flickering fire light */}
			<pointLight
				ref={lightRef}
				position={[-0.3, 1.2, 0]}
				intensity={0.8}
				color="#ff6633"
				distance={8}
				decay={2}
				castShadow
			/>

			{/* Fireplace collider */}
			<RigidBody type="fixed" position={[0, 1.5, 0]}>
				<CuboidCollider args={[0.3, 1.5, 1.3]} />
			</RigidBody>
		</group>
	);
}

/**
 * Window with moonlight beam.
 */
function MoonlitWindow() {
	return (
		<group position={[ROOM_WIDTH / 2 - 0.15, 4, 4]}>
			{/* Window frame */}
			<mesh>
				<boxGeometry args={[0.3, 2.5, 2]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Window glass (emissive for moonlight) */}
			<mesh position={[0.05, 0, 0]}>
				<planeGeometry args={[0.1, 2, 1.5]} />
				<meshStandardMaterial
					color="#aabbdd"
					emissive="#6688bb"
					emissiveIntensity={0.3}
					transparent
					opacity={0.6}
				/>
			</mesh>

			{/* Window panes divider */}
			<mesh position={[0.1, 0, 0]}>
				<boxGeometry args={[0.05, 2.2, 0.05]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>
			<mesh position={[0.1, 0, 0]}>
				<boxGeometry args={[0.05, 0.05, 1.7]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Moonlight beam (subtle spotlight) */}
			<spotLight
				position={[2, 2, 0]}
				angle={0.5}
				penumbra={0.8}
				intensity={0.25}
				color="#99aacc"
				distance={10}
				decay={2}
				target-position={[-3, -4, 0]}
			/>

			{/* Ambient moonlight fill */}
			<pointLight
				position={[0.5, 0, 0]}
				intensity={0.15}
				color="#8899bb"
				distance={6}
				decay={2}
			/>
		</group>
	);
}

// =============================================================================
// Book Instance Data
// =============================================================================

interface BookInstance {
	book: BookManifestEntry;
	position: [number, number, number];
	scale: [number, number, number];
	color: THREE.Color;
	shelfIndex: number;
	slotIndex: number;
}

function generateBookInstances(books: BookManifestEntry[]): BookInstance[] {
	const instances: BookInstance[] = [];

	// Shelf positions (back wall and side walls)
	const shelfPositions: Array<{
		position: [number, number, number];
		rotation: number;
		capacity: number;
	}> = [
		// Back wall shelves
		{ position: [-5, 0, -ROOM_DEPTH / 2 + 0.5], rotation: 0, capacity: 8 },
		{ position: [-1.5, 0, -ROOM_DEPTH / 2 + 0.5], rotation: 0, capacity: 8 },
		{ position: [2, 0, -ROOM_DEPTH / 2 + 0.5], rotation: 0, capacity: 8 },
		{ position: [5.5, 0, -ROOM_DEPTH / 2 + 0.5], rotation: 0, capacity: 8 },
		// Side wall shelves (left)
		{ position: [-ROOM_WIDTH / 2 + 0.5, 0, -3], rotation: Math.PI / 2, capacity: 8 },
		{ position: [-ROOM_WIDTH / 2 + 0.5, 0, 3], rotation: Math.PI / 2, capacity: 8 },
	];

	let bookIndex = 0;
	for (const shelf of shelfPositions) {
		if (bookIndex >= books.length) break;

		for (let level = 0; level < SHELF_LEVELS; level++) {
			if (bookIndex >= books.length) break;
			const levelY = 0.5 + level * SHELF_SPACING;

			for (let slot = 0; slot < shelf.capacity; slot++) {
				if (bookIndex >= books.length) break;
				const book = books[bookIndex];
				if (!book) break;

				// Slight random variations
				const widthVariation = 0.8 + Math.random() * 0.4;
				const heightVariation = 0.85 + Math.random() * 0.3;

				// Position within slot
				const slotOffset = (slot - shelf.capacity / 2 + 0.5) * 0.35;
				const x = shelf.position[0] + (shelf.rotation === 0 ? slotOffset : 0);
				const y = shelf.position[1] + levelY;
				const z = shelf.position[2] + (shelf.rotation !== 0 ? slotOffset : 0);

				instances.push({
					book,
					position: [x, y, z],
					scale: [
						BOOK_BASE_WIDTH * widthVariation,
						BOOK_BASE_HEIGHT * heightVariation,
						BOOK_BASE_DEPTH,
					],
					color: getCachedColor(TIER_COLORS[book.tier] ?? "#4a5568"),
					shelfIndex: shelfPositions.indexOf(shelf),
					slotIndex: slot,
				});

				bookIndex++;
			}
		}
	}

	return instances;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Library floor with wood texture appearance.
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
				color="#2d2418"
				roughness={0.7}
				metalness={0.1}
			/>
		</mesh>
	);
}

/**
 * Library walls.
 */
function Walls() {
	return (
		<group>
			{/* Back wall (bookshelves are against this) */}
			<mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#1a150f" roughness={0.9} metalness={0.1} />
			</mesh>

			{/* Front wall (with door to main hall) */}
			<mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} receiveShadow>
				<boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.3]} />
				<meshStandardMaterial color="#1a150f" roughness={0.9} metalness={0.1} />
			</mesh>

			{/* Left wall */}
			<mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#1a150f" roughness={0.9} metalness={0.1} />
			</mesh>

			{/* Right wall */}
			<mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} receiveShadow>
				<boxGeometry args={[0.3, ROOM_HEIGHT, ROOM_DEPTH]} />
				<meshStandardMaterial color="#1a150f" roughness={0.9} metalness={0.1} />
			</mesh>
		</group>
	);
}

/**
 * Ceiling with warm lighting.
 */
function Ceiling() {
	return (
		<mesh
			rotation={[Math.PI / 2, 0, 0]}
			position={[0, ROOM_HEIGHT, 0]}
		>
			<planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
			<meshStandardMaterial color="#1a150f" roughness={0.9} metalness={0.1} />
		</mesh>
	);
}

/**
 * Room collision bodies - floor, walls, and furniture.
 */
function RoomColliders() {
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

			{/* Front wall (positive Z) - with door opening */}
			<RigidBody type="fixed" position={[-3, wallHeight / 2, ROOM_DEPTH / 2 + wallThickness / 2]}>
				<CuboidCollider args={[6, wallHeight / 2, wallThickness / 2]} />
			</RigidBody>

			{/* Left wall (negative X) */}
			<RigidBody type="fixed" position={[-ROOM_WIDTH / 2 - wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>

			{/* Right wall (positive X) */}
			<RigidBody type="fixed" position={[ROOM_WIDTH / 2 + wallThickness / 2, wallHeight / 2, 0]}>
				<CuboidCollider args={[wallThickness / 2, wallHeight / 2, ROOM_DEPTH / 2]} />
			</RigidBody>
		</>
	);
}

/**
 * Bookshelf collision (separate from visual for simpler hitbox).
 */
function BookshelfCollider({
	position,
	rotation = 0,
}: {
	position: [number, number, number];
	rotation?: number;
}) {
	return (
		<RigidBody type="fixed" position={position} rotation={[0, rotation, 0]}>
			<CuboidCollider args={[SHELF_WIDTH / 2, SHELF_HEIGHT / 2, SHELF_DEPTH / 2]} position={[0, SHELF_HEIGHT / 2, 0]} />
		</RigidBody>
	);
}

/**
 * Bookshelf unit.
 */
function Bookshelf({
	position,
	rotation = 0,
}: {
	position: [number, number, number];
	rotation?: number;
}) {
	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Back panel */}
			<mesh position={[0, SHELF_HEIGHT / 2, -SHELF_DEPTH / 2 + 0.05]}>
				<boxGeometry args={[SHELF_WIDTH, SHELF_HEIGHT, 0.1]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Sides */}
			<mesh position={[-SHELF_WIDTH / 2 + 0.05, SHELF_HEIGHT / 2, 0]}>
				<boxGeometry args={[0.1, SHELF_HEIGHT, SHELF_DEPTH]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>
			<mesh position={[SHELF_WIDTH / 2 - 0.05, SHELF_HEIGHT / 2, 0]}>
				<boxGeometry args={[0.1, SHELF_HEIGHT, SHELF_DEPTH]} />
				<meshStandardMaterial color="#3d2b1f" roughness={0.8} metalness={0.1} />
			</mesh>

			{/* Shelves */}
			{Array.from({ length: SHELF_LEVELS + 1 }).map((_, i) => (
				<mesh key={i} position={[0, i * SHELF_SPACING + 0.3, 0]}>
					<boxGeometry args={[SHELF_WIDTH - 0.1, 0.05, SHELF_DEPTH]} />
					<meshStandardMaterial color="#4a3728" roughness={0.7} metalness={0.1} />
				</mesh>
			))}
		</group>
	);
}

/**
 * Reading nook with chair and lamp.
 */
function ReadingNook() {
	const lampFlickerRef = useRef<THREE.PointLight>(null);

	// Subtle lamp flicker for cozy atmosphere
	useFrame((state) => {
		if (lampFlickerRef.current) {
			const t = state.clock.elapsedTime;
			lampFlickerRef.current.intensity = 0.5 + Math.sin(t * 3) * 0.02;
		}
	});

	return (
		<group position={[5, 0, 3]}>
			{/* Chair base */}
			<mesh position={[0, 0.4, 0]} castShadow>
				<boxGeometry args={[1.2, 0.2, 1.2]} />
				<meshStandardMaterial color="#4a3728" roughness={0.6} metalness={0.2} />
			</mesh>

			{/* Chair cushion */}
			<mesh position={[0, 0.55, 0]} castShadow>
				<boxGeometry args={[1.1, 0.1, 1.1]} />
				<meshStandardMaterial color="#5c3d3d" roughness={0.9} metalness={0} />
			</mesh>

			{/* Chair back */}
			<mesh position={[0, 1, -0.5]} castShadow>
				<boxGeometry args={[1.2, 1.2, 0.2]} />
				<meshStandardMaterial color="#4a3728" roughness={0.6} metalness={0.2} />
			</mesh>

			{/* Chair back cushion */}
			<mesh position={[0, 1, -0.35]} castShadow>
				<boxGeometry args={[1, 0.9, 0.1]} />
				<meshStandardMaterial color="#5c3d3d" roughness={0.9} metalness={0} />
			</mesh>

			{/* Armrests */}
			<mesh position={[-0.55, 0.7, -0.1]} castShadow>
				<boxGeometry args={[0.1, 0.4, 0.8]} />
				<meshStandardMaterial color="#4a3728" roughness={0.6} metalness={0.2} />
			</mesh>
			<mesh position={[0.55, 0.7, -0.1]} castShadow>
				<boxGeometry args={[0.1, 0.4, 0.8]} />
				<meshStandardMaterial color="#4a3728" roughness={0.6} metalness={0.2} />
			</mesh>

			{/* Reading lamp */}
			<group position={[1.5, 0, 0]}>
				{/* Lamp base */}
				<mesh position={[0, 0.05, 0]}>
					<cylinderGeometry args={[0.15, 0.18, 0.1, 16]} />
					<meshStandardMaterial color="#brass" metalness={0.9} roughness={0.2} />
				</mesh>

				{/* Lamp pole */}
				<mesh position={[0, 1.2, 0]}>
					<cylinderGeometry args={[0.03, 0.03, 2.3, 8]} />
					<meshStandardMaterial color="#brass" metalness={0.8} roughness={0.3} />
				</mesh>

				{/* Lamp shade */}
				<mesh position={[0, 2.2, 0]}>
					<coneGeometry args={[0.3, 0.4, 8, 1, true]} />
					<meshStandardMaterial
						color={THREE_COLORS.warm}
						roughness={0.5}
						emissive={THREE_COLORS.warm}
						emissiveIntensity={0.4}
						side={THREE.DoubleSide}
					/>
				</mesh>

				{/* Lamp light with subtle flicker */}
				<pointLight
					ref={lampFlickerRef}
					position={[0, 2, 0]}
					intensity={0.5}
					color={THREE_COLORS.warm}
					distance={6}
					decay={2}
				/>
			</group>

			{/* Small side table with book */}
			<group position={[-1.2, 0, 0]}>
				<mesh position={[0, 0.4, 0]} castShadow>
					<cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
					<meshStandardMaterial color="#3d2b1f" roughness={0.7} metalness={0.1} />
				</mesh>

				{/* Open book on table */}
				<mesh position={[0, 0.85, 0]} rotation={[-0.1, 0.3, 0]} castShadow>
					<boxGeometry args={[0.25, 0.03, 0.2]} />
					<meshStandardMaterial color="#e8e0d0" roughness={0.9} metalness={0} />
				</mesh>
			</group>
		</group>
	);
}

/**
 * Interactive book mesh.
 */
function Book({
	instance,
	isHovered,
	onClick,
	onPointerEnter,
	onPointerLeave,
}: {
	instance: BookInstance;
	isHovered: boolean;
	onClick: () => void;
	onPointerEnter: () => void;
	onPointerLeave: () => void;
}) {
	const meshRef = useRef<THREE.Mesh>(null);

	// Hover animation - only animate when needed
	useFrame(() => {
		if (!meshRef.current) return;
		const currentOffset = meshRef.current.position.z - instance.position[2];
		const targetOffset = isHovered ? 0.1 : 0;

		// Skip if already at target (within tolerance)
		if (Math.abs(currentOffset - targetOffset) < 0.001) return;

		meshRef.current.position.z = instance.position[2] + currentOffset + (targetOffset - currentOffset) * 0.1;
	});

	return (
		<mesh
			ref={meshRef}
			position={instance.position}
			scale={instance.scale}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			onPointerEnter={(e) => {
				e.stopPropagation();
				onPointerEnter();
				document.body.style.cursor = "pointer";
			}}
			onPointerLeave={(e) => {
				e.stopPropagation();
				onPointerLeave();
				document.body.style.cursor = "auto";
			}}
			userData={{ type: "book", book: instance.book }}
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial
				color={instance.color}
				roughness={0.7}
				metalness={0.1}
				emissive={isHovered ? instance.color : "#000000"}
				emissiveIntensity={isHovered ? 0.3 : 0}
			/>
		</mesh>
	);
}

/**
 * Books rendered from manifest.
 */
function Books({
	books,
	onBookSelect,
}: {
	books: BookManifestEntry[];
	onBookSelect?: (book: BookManifestEntry) => void;
}) {
	const [hoveredBook, setHoveredBook] = useState<string | null>(null);

	const instances = useMemo(() => generateBookInstances(books), [books]);

	// Cleanup cursor on unmount (in case hover was active during transition)
	useEffect(() => {
		return () => {
			document.body.style.cursor = "auto";
		};
	}, []);

	return (
		<group>
			{instances.map((instance) => (
				<Book
					key={instance.book.id}
					instance={instance}
					isHovered={hoveredBook === instance.book.id}
					onClick={() => onBookSelect?.(instance.book)}
					onPointerEnter={() => setHoveredBook(instance.book.id)}
					onPointerLeave={() => setHoveredBook(null)}
				/>
			))}
		</group>
	);
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * LibraryRoom - Displays books from the manifest on bookshelves.
 */
export function LibraryRoom({ debug = false, onDoorActivate, onContentSelect }: LibraryRoomProps) {
	const [books, setBooks] = useState<BookManifestEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const spotTargetRef = useRef<THREE.Object3D>(null);

	// Load books manifest with abort cleanup
	useEffect(() => {
		const controller = new AbortController();

		async function loadBooks() {
			try {
				const response = await fetch("/manifests/books.manifest.json", {
					signal: controller.signal,
				});
				const manifest: BooksManifest = await response.json();
				setBooks(manifest.entries);
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("[LibraryRoom] Failed to load books manifest:", error);
			} finally {
				setLoading(false);
			}
		}

		loadBooks();
		return () => controller.abort();
	}, []);

	// Convert book to overlay content
	const handleBookSelect = useCallback((book: BookManifestEntry) => {
		if (!onContentSelect) return;

		const tierLabels: Record<string, string> = {
			favorites: "⭐ Favorites",
			recommended: "Recommended",
			read: "Read",
			reading: "Currently Reading",
			want: "Want to Read",
		};

		const content: OverlayContent = {
			type: "book",
			title: book.title,
			subtitle: `by ${book.author}`,
			description: book.blurb,
			image: book.coverImage,
			readMoreUrl: `/library?book=${book.id}`,
			meta: {
				...(book.rating ? { Rating: `${book.rating}/5` } : {}),
				Tier: tierLabels[book.tier] ?? book.tier,
				...(book.year ? { Year: String(book.year) } : {}),
			},
			tags: book.topics,
		};

		onContentSelect(content);
	}, [onContentSelect]);

	return (
		<group name="room-library">
			{/* Collision bodies */}
			<RoomColliders />
			<BookshelfCollider position={[-5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<BookshelfCollider position={[-1.5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<BookshelfCollider position={[2, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<BookshelfCollider position={[5.5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<BookshelfCollider position={[-ROOM_WIDTH / 2 + 0.5, 0, -3]} rotation={Math.PI / 2} />
			<BookshelfCollider position={[-ROOM_WIDTH / 2 + 0.5, 0, 3]} rotation={Math.PI / 2} />

			{/* Structure */}
			<Floor />
			<FloorRug />
			<Walls />
			<Ceiling />

			{/* Visual enhancements */}
			<DustMotes />
			<Fireplace />
			<MoonlitWindow />

			{/* Bookshelves */}
			<Bookshelf position={[-5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<Bookshelf position={[-1.5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<Bookshelf position={[2, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<Bookshelf position={[5.5, 0, -ROOM_DEPTH / 2 + 0.5]} />
			<Bookshelf position={[-ROOM_WIDTH / 2 + 0.5, 0, -3]} rotation={Math.PI / 2} />
			<Bookshelf position={[-ROOM_WIDTH / 2 + 0.5, 0, 3]} rotation={Math.PI / 2} />

			{/* Books */}
			{!loading && books.length > 0 && (
				<Books books={books} onBookSelect={handleBookSelect} />
			)}

			{/* Reading nook */}
			<ReadingNook />

			{/* Door to Main Hall */}
			<DoorTrigger
				position={[6, 2, ROOM_DEPTH / 2 - 1]}
				targetRoom="mainhall"
				spawnPosition={[-7, 0, 0]}
				spawnRotation={-Math.PI / 2}
				onActivate={onDoorActivate}
				debug={debug}
			/>

			{/* Door frame */}
			<group position={[6, 2, ROOM_DEPTH / 2]}>
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

			{/* Lighting */}
			<ambientLight intensity={0.12} color="#ffddaa" />

			{/* Main ceiling lights - warm, reduced intensity due to fireplace */}
			<pointLight
				position={[0, ROOM_HEIGHT - 1, 0]}
				intensity={0.6}
				color="#ffcc88"
				distance={15}
				decay={2}
				castShadow
			/>
			<pointLight
				position={[-4, ROOM_HEIGHT - 1, -3]}
				intensity={0.35}
				color="#ffcc88"
				distance={10}
				decay={2}
			/>
			<pointLight
				position={[4, ROOM_HEIGHT - 1, -3]}
				intensity={0.35}
				color="#ffcc88"
				distance={10}
				decay={2}
			/>

			{/* Accent light on featured shelf - using target ref */}
			<object3D ref={spotTargetRef} position={[-2, 2, -7]} />
			<spotLight
				position={[-2, 5, -5]}
				angle={0.3}
				penumbra={0.5}
				intensity={0.3}
				color={THREE_COLORS.accent}
				target={spotTargetRef.current ?? undefined}
			/>
		</group>
	);
}
