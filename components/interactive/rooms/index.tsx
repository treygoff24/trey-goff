"use client";

import { Suspense, lazy, type ComponentType } from "react";
import type { RoomId } from "@/lib/interactive/types";
import type { QualityTier } from "@/lib/interactive/capabilities";
import type { OverlayContent } from "../ContentOverlay";
import { DoorTrigger } from "../DoorTrigger";

// =============================================================================
// Types
// =============================================================================

export interface RoomProps {
	debug?: boolean;
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
	onContentSelect?: (content: OverlayContent) => void;
	/** Quality tier for atmospheric effects */
	qualityTier?: QualityTier;
	/** Whether reduced motion is preferred */
	reducedMotion?: boolean;
}

export interface RoomConfig {
	/** The room component */
	Component: ComponentType<RoomProps>;
	/** Default spawn position when entering this room */
	defaultSpawn: [number, number, number];
	/** Default spawn rotation (Y-axis) when entering this room */
	defaultRotation: number;
	/** Display name for UI */
	displayName: string;
	/** Whether room is ready (has real assets vs placeholder) */
	isPlaceholder: boolean;
}

// =============================================================================
// Lazy-loaded Room Components
// =============================================================================

const ExteriorRoom = lazy(() =>
	import("./ExteriorRoom").then((m) => ({ default: m.ExteriorRoom }))
);

const MainHallRoom = lazy(() =>
	import("./MainHallRoom").then((m) => ({ default: m.MainHallRoom }))
);

const LibraryRoom = lazy(() =>
	import("./LibraryRoom").then((m) => ({ default: m.LibraryRoom }))
);

const GymRoom = lazy(() =>
	import("./GymRoom").then((m) => ({ default: m.GymRoom }))
);

const ProjectsRoom = lazy(() =>
	import("./ProjectsRoom").then((m) => ({ default: m.ProjectsRoom }))
);

// Return door positions for each placeholder room (position in mainhall when returning)
const PLACEHOLDER_RETURN_DOORS: Record<string, { doorPos: [number, number, number]; returnPos: [number, number, number]; returnRot: number }> = {
	library: { doorPos: [6, 2, 0], doorRot: -Math.PI / 2, returnPos: [-7, 0, 0], returnRot: -Math.PI / 2 },
	gym: { doorPos: [-6, 2, 0], doorRot: Math.PI / 2, returnPos: [7, 0, 0], returnRot: Math.PI / 2 },
	projects: { doorPos: [0, 2, 6], doorRot: 0, returnPos: [0, 0, -10], returnRot: 0 },
	garage: { doorPos: [0, 2, -6], doorRot: Math.PI, returnPos: [0, 0, 5], returnRot: Math.PI },
} as Record<string, { doorPos: [number, number, number]; doorRot?: number; returnPos: [number, number, number]; returnRot: number }>;

// Placeholder component for rooms not yet built
function PlaceholderRoom({ roomId, onDoorActivate, debug }: { roomId: RoomId } & RoomProps) {
	const doorConfig = PLACEHOLDER_RETURN_DOORS[roomId] ?? {
		doorPos: [0, 2, 6] as [number, number, number],
		returnPos: [0, 0, 0] as [number, number, number],
		returnRot: 0,
	};

	return (
		<group name={`room-${roomId}-placeholder`}>
			{/* Simple room box */}
			<mesh position={[0, 4, 0]}>
				<boxGeometry args={[15, 8, 15]} />
				<meshStandardMaterial
					color="#1a1a2e"
					transparent
					opacity={0.3}
					side={2} // DoubleSide
				/>
			</mesh>

			{/* Floor */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} name="ground">
				<planeGeometry args={[15, 15]} />
				<meshStandardMaterial color="#1a1a28" />
			</mesh>

			{/* Room label */}
			<mesh position={[0, 5, 0]}>
				<planeGeometry args={[6, 1]} />
				<meshBasicMaterial color="#7C5CFF" transparent opacity={0.8} />
			</mesh>

			{/* Return door to Main Hall */}
			<DoorTrigger
				position={doorConfig.doorPos}
				targetRoom="mainhall"
				spawnPosition={doorConfig.returnPos}
				spawnRotation={doorConfig.returnRot}
				onActivate={onDoorActivate}
				debug={debug}
			/>

			{/* Basic lighting */}
			<ambientLight intensity={0.3} />
			<pointLight position={[0, 6, 0]} intensity={0.5} />
		</group>
	);
}

// =============================================================================
// Room Registry
// =============================================================================

/**
 * Registry of all rooms with their configurations.
 * Rooms are lazy-loaded to enable code splitting.
 */
export const ROOM_REGISTRY: Record<RoomId, RoomConfig> = {
	exterior: {
		Component: ExteriorRoom,
		defaultSpawn: [0, 0, 10],
		defaultRotation: Math.PI, // Facing mansion
		displayName: "Exterior",
		isPlaceholder: false,
	},
	mainhall: {
		Component: MainHallRoom,
		defaultSpawn: [0, 0, 8],
		defaultRotation: Math.PI, // Facing into hall
		displayName: "Main Hall",
		isPlaceholder: false,
	},
	library: {
		Component: LibraryRoom,
		defaultSpawn: [6, 0, 5],
		defaultRotation: Math.PI,
		displayName: "Library",
		isPlaceholder: false,
	},
	gym: {
		Component: GymRoom,
		defaultSpawn: [-8, 0, 0],
		defaultRotation: -Math.PI / 2,
		displayName: "Gym",
		isPlaceholder: false,
	},
	projects: {
		Component: ProjectsRoom,
		defaultSpawn: [0, 0, 6],
		defaultRotation: Math.PI,
		displayName: "Projects",
		isPlaceholder: false,
	},
	garage: {
		Component: (props: RoomProps) => <PlaceholderRoom roomId="garage" {...props} />,
		defaultSpawn: [0, 0, 5],
		defaultRotation: 0,
		displayName: "Garage",
		isPlaceholder: true,
	},
};

// =============================================================================
// Room Renderer Component
// =============================================================================

interface RoomRendererProps {
	roomId: RoomId;
	debug?: boolean;
	onDoorActivate?: (targetRoom: RoomId, spawnPosition: [number, number, number], spawnRotation: number) => void;
	onContentSelect?: (content: OverlayContent) => void;
	/** Quality tier for atmospheric effects */
	qualityTier?: QualityTier;
	/** Whether reduced motion is preferred */
	reducedMotion?: boolean;
}

/**
 * Renders a room by ID with Suspense boundary.
 * Used by the chunk system to render active rooms.
 */
export function RoomRenderer({
	roomId,
	debug,
	onDoorActivate,
	onContentSelect,
	qualityTier,
	reducedMotion,
}: RoomRendererProps) {
	const config = ROOM_REGISTRY[roomId];

	if (!config) {
		console.warn(`[RoomRenderer] Unknown room: ${roomId}`);
		return null;
	}

	const { Component } = config;

	return (
		<Suspense fallback={null}>
			<Component
				debug={debug}
				onDoorActivate={onDoorActivate}
				onContentSelect={onContentSelect}
				qualityTier={qualityTier}
				reducedMotion={reducedMotion}
			/>
		</Suspense>
	);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the default spawn position for a room.
 */
export function getRoomSpawn(roomId: RoomId): [number, number, number] {
	return ROOM_REGISTRY[roomId]?.defaultSpawn ?? [0, 0, 0];
}

/**
 * Get the default spawn rotation for a room.
 */
export function getRoomRotation(roomId: RoomId): number {
	return ROOM_REGISTRY[roomId]?.defaultRotation ?? 0;
}

/**
 * Check if a room has real assets or is a placeholder.
 */
export function isRoomReady(roomId: RoomId): boolean {
	return !ROOM_REGISTRY[roomId]?.isPlaceholder;
}

/**
 * Get all room IDs that are ready (not placeholders).
 */
export function getReadyRooms(): RoomId[] {
	return (Object.keys(ROOM_REGISTRY) as RoomId[]).filter(
		(id) => !ROOM_REGISTRY[id].isPlaceholder
	);
}
