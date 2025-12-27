/**
 * Type definitions for Interactive route.
 */

import type * as THREE from "three";
import type { QualityTier } from "./capabilities";

// =============================================================================
// Room & Chunk Types
// =============================================================================

/** Room identifiers */
export type RoomId =
	| "exterior"
	| "mainhall"
	| "library"
	| "gym"
	| "projects"
	| "garage";

/** Chunk loading states */
export type ChunkState =
	| "unloaded"
	| "preloading"
	| "loaded"
	| "active"
	| "dormant"
	| "disposed";

/** Chunk metadata */
export interface ChunkInfo {
	id: RoomId;
	state: ChunkState;
	loadedAt: number | null;
	lastActiveAt: number | null;
	memoryEstimate: number; // bytes
}

// =============================================================================
// Settings Types
// =============================================================================

/** Camera mode */
export type CameraMode = "third-person" | "first-person";

/** User settings that persist */
export interface InteractiveSettings {
	/** Quality tier preference */
	qualityTier: QualityTier;
	/** Camera mode */
	cameraMode: CameraMode;
	/** Camera sensitivity (0-100) */
	cameraSensitivity: number;
	/** Invert Y-axis */
	invertY: boolean;
	/** Camera distance for third-person */
	cameraDistance: number;
	/** Show mobile joystick */
	showJoystick: boolean;
	/** Respect reduced motion (auto-detect or explicit) */
	reducedMotion: boolean | "auto";
	/** Show debug overlay */
	showDebug: boolean;
}

/** Default settings */
export const DEFAULT_SETTINGS: InteractiveSettings = {
	qualityTier: "auto",
	cameraMode: "third-person",
	cameraSensitivity: 50,
	invertY: false,
	cameraDistance: 5,
	showJoystick: true,
	reducedMotion: "auto",
	showDebug: false,
};

// =============================================================================
// Spawn & Navigation Types
// =============================================================================

/** Spawn point definition */
export interface SpawnPoint {
	position: [number, number, number];
	rotation: [number, number, number];
	room: RoomId;
	label?: string;
}

/** Door/portal definition */
export interface Door {
	id: string;
	fromRoom: RoomId;
	toRoom: RoomId;
	position: [number, number, number];
	spawnPoint: SpawnPoint;
	label: string;
}

// =============================================================================
// Player State Types
// =============================================================================

/** Player position and state */
export interface PlayerState {
	position: THREE.Vector3Tuple;
	rotation: THREE.Vector3Tuple;
	currentRoom: RoomId | null;
	isMoving: boolean;
	isInteracting: boolean;
}

// =============================================================================
// Store State Types
// =============================================================================

/** Main store state shape */
export interface InteractiveStoreState {
	// Chunk states
	chunkStates: Map<RoomId, ChunkInfo>;
	activeChunk: RoomId | null;

	// Quality
	qualityTier: QualityTier;
	effectiveQualityTier: Exclude<QualityTier, "auto">;

	// Player
	player: PlayerState;

	// Settings
	settings: InteractiveSettings;

	// Loading
	isLoading: boolean;
	loadingProgress: number;
	loadingStatus: string;

	// Error state
	error: Error | null;

	// Session
	sessionStartTime: number;
	lastInteractionTime: number;
}

/** Store actions */
export interface InteractiveStoreActions {
	// Chunk management
	setChunkState: (room: RoomId, state: ChunkState) => void;
	activateChunk: (room: RoomId) => void;
	disposeChunk: (room: RoomId) => void;

	// Quality
	setQualityTier: (tier: QualityTier) => void;
	setEffectiveQualityTier: (tier: Exclude<QualityTier, "auto">) => void;

	// Player
	setPlayerPosition: (position: THREE.Vector3Tuple) => void;
	setPlayerRotation: (rotation: THREE.Vector3Tuple) => void;
	setCurrentRoom: (room: RoomId | null) => void;
	setIsMoving: (isMoving: boolean) => void;
	setIsInteracting: (isInteracting: boolean) => void;

	// Settings
	updateSettings: (partial: Partial<InteractiveSettings>) => void;
	resetSettings: () => void;

	// Loading
	setLoading: (isLoading: boolean) => void;
	setLoadingProgress: (progress: number, status?: string) => void;

	// Error
	setError: (error: Error | null) => void;

	// Session
	recordInteraction: () => void;

	// Persistence
	saveToStorage: () => void;
	loadFromStorage: () => void;
}

/** Complete store type */
export type InteractiveStore = InteractiveStoreState & InteractiveStoreActions;
