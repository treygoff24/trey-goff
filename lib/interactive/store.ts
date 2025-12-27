/**
 * Zustand store for Interactive route state management.
 * Handles chunk loading states, player position, settings, and persistence.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
	RoomId,
	ChunkState,
	ChunkInfo,
	InteractiveSettings,
	InteractiveStoreState,
	InteractiveStore,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";
import type { QualityTier } from "./capabilities";

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = "trey-interactive-state";
const MAX_DORMANT_CHUNKS = 2;

/** Rooms in load priority order */
const ROOM_IDS: RoomId[] = [
	"exterior",
	"mainhall",
	"library",
	"gym",
	"projects",
	"garage",
];

// =============================================================================
// Initial State
// =============================================================================

function createInitialChunkStates(): Map<RoomId, ChunkInfo> {
	const map = new Map<RoomId, ChunkInfo>();
	for (const id of ROOM_IDS) {
		map.set(id, {
			id,
			state: "unloaded",
			loadedAt: null,
			lastActiveAt: null,
			memoryEstimate: 0,
		});
	}
	return map;
}

const initialState: InteractiveStoreState = {
	// Chunks
	chunkStates: createInitialChunkStates(),
	activeChunk: null,

	// Quality
	qualityTier: "auto",
	effectiveQualityTier: "medium",

	// Player
	player: {
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		currentRoom: null,
		isMoving: false,
		isInteracting: false,
	},

	// Settings
	settings: { ...DEFAULT_SETTINGS },

	// Loading
	isLoading: true,
	loadingProgress: 0,
	loadingStatus: "Initializing...",

	// Error
	error: null,

	// Session
	sessionStartTime: Date.now(),
	lastInteractionTime: Date.now(),
};

// =============================================================================
// Persistence Helpers
// =============================================================================

interface PersistedState {
	qualityTier: QualityTier;
	settings: InteractiveSettings;
	lastRoom: RoomId | null;
	lastPosition: [number, number, number] | null;
	lastRotation: [number, number, number] | null;
}

function saveToLocalStorage(state: InteractiveStoreState): void {
	if (typeof window === "undefined") return;

	const persisted: PersistedState = {
		qualityTier: state.qualityTier,
		settings: state.settings,
		lastRoom: state.player.currentRoom,
		lastPosition: state.player.position,
		lastRotation: state.player.rotation,
	};

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
	} catch {
		// Storage quota exceeded or private mode
	}
}

function loadFromLocalStorage(): Partial<InteractiveStoreState> | null {
	if (typeof window === "undefined") return null;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;

		const persisted = JSON.parse(stored) as PersistedState;

		return {
			qualityTier: persisted.qualityTier,
			settings: { ...DEFAULT_SETTINGS, ...persisted.settings },
			player: {
				...initialState.player,
				currentRoom: persisted.lastRoom,
				position: persisted.lastPosition ?? [0, 0, 0],
				rotation: persisted.lastRotation ?? [0, 0, 0],
			},
		};
	} catch {
		return null;
	}
}

function getUrlRoom(): RoomId | null {
	if (typeof window === "undefined") return null;

	const params = new URLSearchParams(window.location.search);
	const room = params.get("room");

	if (room && ROOM_IDS.includes(room as RoomId)) {
		return room as RoomId;
	}
	return null;
}

function updateUrlRoom(room: RoomId | null): void {
	if (typeof window === "undefined") return;

	const url = new URL(window.location.href);
	if (room) {
		url.searchParams.set("room", room);
	} else {
		url.searchParams.delete("room");
	}

	// Use replaceState to avoid adding to history
	window.history.replaceState({}, "", url.toString());
}

// =============================================================================
// Store Creation
// =============================================================================

export const useInteractiveStore = create<InteractiveStore>()(
	subscribeWithSelector((set, get) => ({
		...initialState,

		// =========================================================================
		// Chunk Management
		// =========================================================================

		setChunkState: (room: RoomId, state: ChunkState) => {
			set((s) => {
				const newChunkStates = new Map(s.chunkStates);
				const info = newChunkStates.get(room);
				if (info) {
					newChunkStates.set(room, {
						...info,
						state,
						loadedAt: state === "loaded" ? Date.now() : info.loadedAt,
						lastActiveAt: state === "active" ? Date.now() : info.lastActiveAt,
					});
				}
				return { chunkStates: newChunkStates };
			});
		},

		activateChunk: (room: RoomId) => {
			const initialState = get();

			// Mark previous active chunk as dormant
			if (initialState.activeChunk && initialState.activeChunk !== room) {
				get().setChunkState(initialState.activeChunk, "dormant");
			}

			// Activate new chunk
			get().setChunkState(room, "active");
			set({ activeChunk: room });

			// Enforce dormant limit - use fresh state after updates
			const freshState = get();
			const dormantChunks: { id: RoomId; lastActiveAt: number }[] = [];
			for (const [id, info] of freshState.chunkStates) {
				if (info.state === "dormant" && info.lastActiveAt) {
					dormantChunks.push({ id, lastActiveAt: info.lastActiveAt });
				}
			}

			if (dormantChunks.length > MAX_DORMANT_CHUNKS) {
				// Dispose oldest dormant chunks
				dormantChunks.sort((a, b) => a.lastActiveAt - b.lastActiveAt);
				const toDispose = dormantChunks.slice(
					0,
					dormantChunks.length - MAX_DORMANT_CHUNKS
				);
				for (const chunk of toDispose) {
					get().disposeChunk(chunk.id);
				}
			}
		},

		disposeChunk: (room: RoomId) => {
			set((s) => {
				const newChunkStates = new Map(s.chunkStates);
				const info = newChunkStates.get(room);
				if (info) {
					newChunkStates.set(room, {
						...info,
						state: "disposed",
						memoryEstimate: 0,
					});
				}
				return { chunkStates: newChunkStates };
			});

			// Reset to unloaded after disposal for potential reload
			setTimeout(() => {
				get().setChunkState(room, "unloaded");
			}, 100);
		},

		// =========================================================================
		// Quality
		// =========================================================================

		setQualityTier: (tier: QualityTier) => {
			set({ qualityTier: tier });
			get().saveToStorage();
		},

		setEffectiveQualityTier: (tier: Exclude<QualityTier, "auto">) => {
			set({ effectiveQualityTier: tier });
		},

		// =========================================================================
		// Player
		// =========================================================================

		setPlayerPosition: (position) => {
			set((s) => ({
				player: { ...s.player, position },
			}));
		},

		setPlayerRotation: (rotation) => {
			set((s) => ({
				player: { ...s.player, rotation },
			}));
		},

		setCurrentRoom: (room) => {
			set((s) => ({
				player: { ...s.player, currentRoom: room },
			}));
			updateUrlRoom(room);
			get().saveToStorage();
		},

		setIsMoving: (isMoving) => {
			set((s) => ({
				player: { ...s.player, isMoving },
			}));
		},

		setIsInteracting: (isInteracting) => {
			set((s) => ({
				player: { ...s.player, isInteracting },
			}));
		},

		// =========================================================================
		// Settings
		// =========================================================================

		updateSettings: (partial) => {
			set((s) => ({
				settings: { ...s.settings, ...partial },
			}));
			get().saveToStorage();
		},

		resetSettings: () => {
			set({ settings: { ...DEFAULT_SETTINGS } });
			get().saveToStorage();
		},

		// =========================================================================
		// Loading
		// =========================================================================

		setLoading: (isLoading) => {
			set({ isLoading });
		},

		setLoadingProgress: (progress, status) => {
			set((s) => ({
				loadingProgress: progress,
				loadingStatus: status ?? s.loadingStatus,
			}));
		},

		// =========================================================================
		// Error
		// =========================================================================

		setError: (error) => {
			set({ error });
		},

		// =========================================================================
		// Session
		// =========================================================================

		recordInteraction: () => {
			set({ lastInteractionTime: Date.now() });
		},

		// =========================================================================
		// Persistence
		// =========================================================================

		saveToStorage: () => {
			saveToLocalStorage(get());
		},

		loadFromStorage: () => {
			// First check URL for room
			const urlRoom = getUrlRoom();

			// Then load from localStorage
			const stored = loadFromLocalStorage();

			if (stored || urlRoom) {
				set((s) => ({
					...s,
					...stored,
					player: {
						...(stored?.player ?? s.player),
						// URL room takes precedence
						currentRoom: urlRoom ?? stored?.player?.currentRoom ?? null,
					},
				}));
			}
		},
	}))
);

// =============================================================================
// Selectors (for optimized subscriptions)
// =============================================================================

export const selectChunkState = (room: RoomId) => (state: InteractiveStore) =>
	state.chunkStates.get(room);

export const selectActiveChunk = (state: InteractiveStore) => state.activeChunk;

export const selectQualityTier = (state: InteractiveStore) => state.qualityTier;

export const selectEffectiveQualityTier = (state: InteractiveStore) =>
	state.effectiveQualityTier;

export const selectPlayerPosition = (state: InteractiveStore) =>
	state.player.position;

export const selectCurrentRoom = (state: InteractiveStore) =>
	state.player.currentRoom;

export const selectSettings = (state: InteractiveStore) => state.settings;

export const selectIsLoading = (state: InteractiveStore) => state.isLoading;

export const selectLoadingProgress = (state: InteractiveStore) =>
	state.loadingProgress;

export const selectError = (state: InteractiveStore) => state.error;
