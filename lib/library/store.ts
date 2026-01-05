/**
 * Zustand store for Floating Library state management.
 * Handles view level, camera state, filters, and performance settings.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Book } from '@/lib/books/types'
import type {
  ViewLevel,
  Position3D,
  FilterState,
  SortBy,
  QualityLevel,
} from './types'

// =============================================================================
// Constants
// =============================================================================

/** Default camera position for universe view (far out) */
const UNIVERSE_CAMERA_POSITION: Position3D = [0, 0, 100]
const UNIVERSE_CAMERA_TARGET: Position3D = [0, 0, 0]

/** Minimum search query length to trigger filtering */
const MIN_SEARCH_LENGTH = 2

// =============================================================================
// Nebula Texture Types
// =============================================================================

export type NebulaTextureMode = 'procedural' | 'blender'

// =============================================================================
// Store State Interface
// =============================================================================

interface LibraryStoreState {
  // View state
  viewLevel: ViewLevel
  activeConstellation: string | null
  selectedBook: Book | null

  // Camera
  cameraPosition: Position3D
  cameraTarget: Position3D
  isTransitioning: boolean
  transitionPhase: number // 0-1, progress of camera transition

  // Animation flags (v2)
  isUvPanning: boolean // Active nebula UV animation
  isParticleDrifting: boolean // Particle drift animation
  hasBookLerps: boolean // Book position animations in progress

  // Filters
  statusFilter: Book['status'] | null
  topicFilter: string | null
  searchQuery: string
  sortBy: SortBy

  // Performance
  qualityLevel: QualityLevel
  showClassicFallback: boolean
  postprocessingEnabled: boolean // v2: false when degraded for performance

  // Nebula textures (Blender integration)
  nebulaTextureMode: NebulaTextureMode
  blenderTexturesLoaded: boolean
  nebulaTextureModeManual: boolean // true if user manually set mode
}

interface LibraryStoreActions {
  // Navigation
  zoomToConstellation: (
    topic: string,
    position: Position3D,
    targetOffset?: Position3D
  ) => void
  selectBook: (book: Book | null, position?: Position3D) => void
  stepBack: () => void
  goToUniverse: () => void

  // Camera
  setCameraPosition: (position: Position3D) => void
  setCameraTarget: (target: Position3D) => void
  setIsTransitioning: (transitioning: boolean) => void
  setTransitionPhase: (phase: number) => void

  // Animation (v2)
  setIsUvPanning: (panning: boolean) => void
  setIsParticleDrifting: (drifting: boolean) => void
  setHasBookLerps: (lerping: boolean) => void
  setPostprocessingEnabled: (enabled: boolean) => void

  // Filters
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  setStatusFilter: (status: Book['status'] | null) => void
  setTopicFilter: (topic: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: SortBy) => void

  // Performance
  setQualityLevel: (level: QualityLevel) => void
  setShowClassicFallback: (show: boolean) => void

  // Nebula textures (Blender integration)
  setNebulaTextureMode: (mode: NebulaTextureMode) => void
  setBlenderTexturesLoaded: (loaded: boolean) => void

  // Reset
  reset: () => void
}

export interface LibraryStore extends LibraryStoreState, LibraryStoreActions {
  // Derived state (computed on access)
  isFiltered: boolean
  isAnimating: boolean // v2: true when any animation is active
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: LibraryStoreState = {
  // View state
  viewLevel: 'universe',
  activeConstellation: null,
  selectedBook: null,

  // Camera
  cameraPosition: UNIVERSE_CAMERA_POSITION,
  cameraTarget: UNIVERSE_CAMERA_TARGET,
  isTransitioning: false,
  transitionPhase: 0,

  // Animation flags (v2)
  isUvPanning: false,
  isParticleDrifting: false,
  hasBookLerps: false,

  // Filters
  statusFilter: null,
  topicFilter: null,
  searchQuery: '',
  sortBy: 'rating',

  // Performance
  qualityLevel: 'full',
  showClassicFallback: false,
  postprocessingEnabled: true,

  // Nebula textures (Blender integration)
  // Default to 'blender' for full quality, but don't load until component mounts
  nebulaTextureMode: 'blender',
  blenderTexturesLoaded: false,
  nebulaTextureModeManual: false,
}

// =============================================================================
// Store
// =============================================================================

export const useLibraryStore = create<LibraryStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // =========================================================================
    // Derived State
    // =========================================================================

    get isFiltered(): boolean {
      const state = get()
      return (
        state.statusFilter !== null ||
        state.topicFilter !== null ||
        state.searchQuery.trim().length >= MIN_SEARCH_LENGTH
      )
    },

    get isAnimating(): boolean {
      const state = get()
      return (
        state.isTransitioning ||
        state.isUvPanning ||
        state.isParticleDrifting ||
        state.hasBookLerps
      )
    },

    // =========================================================================
    // Navigation Actions
    // =========================================================================

    zoomToConstellation: (topic, position, targetOffset = [0, 0, 0]) => {
      // Calculate camera position to be inside the constellation looking at center
      const cameraPosition: Position3D = [
        position[0] + targetOffset[0],
        position[1] + targetOffset[1] + 5, // Slightly above
        position[2] + targetOffset[2] + 25, // In front
      ]

      set({
        viewLevel: 'constellation',
        activeConstellation: topic,
        selectedBook: null,
        cameraPosition,
        cameraTarget: position,
        isTransitioning: true,
      })
    },

    selectBook: (book, position) => {
      if (book === null) {
        // Deselecting - go back to constellation or universe
        const state = get()
        if (state.activeConstellation) {
          // Return camera to constellation view
          set({
            viewLevel: 'constellation',
            selectedBook: null,
            isTransitioning: true,
          })
        } else {
          // Return to universe
          set({
            viewLevel: 'universe',
            selectedBook: null,
            cameraPosition: UNIVERSE_CAMERA_POSITION,
            cameraTarget: UNIVERSE_CAMERA_TARGET,
            isTransitioning: true,
          })
        }
        return
      }

      // Selecting a book
      const cameraPosition: Position3D = position
        ? [position[0], position[1] + 2, position[2] + 8]
        : get().cameraPosition

      const cameraTarget: Position3D = position ?? get().cameraTarget

      set({
        viewLevel: 'book',
        selectedBook: book,
        cameraPosition,
        cameraTarget,
        isTransitioning: true,
      })
    },

    stepBack: () => {
      const state = get()

      switch (state.viewLevel) {
        case 'book':
          // Book -> Constellation (or Universe if no active constellation)
          if (state.activeConstellation) {
            set({
              viewLevel: 'constellation',
              selectedBook: null,
              isTransitioning: true,
            })
          } else {
            set({
              viewLevel: 'universe',
              selectedBook: null,
              cameraPosition: UNIVERSE_CAMERA_POSITION,
              cameraTarget: UNIVERSE_CAMERA_TARGET,
              isTransitioning: true,
            })
          }
          break

        case 'constellation':
          // Constellation -> Universe
          set({
            viewLevel: 'universe',
            activeConstellation: null,
            selectedBook: null,
            cameraPosition: UNIVERSE_CAMERA_POSITION,
            cameraTarget: UNIVERSE_CAMERA_TARGET,
            isTransitioning: true,
          })
          break

        case 'universe':
          // Already at top level - no-op
          break
      }
    },

    goToUniverse: () => {
      set({
        viewLevel: 'universe',
        activeConstellation: null,
        selectedBook: null,
        cameraPosition: UNIVERSE_CAMERA_POSITION,
        cameraTarget: UNIVERSE_CAMERA_TARGET,
        isTransitioning: true,
      })
    },

    // =========================================================================
    // Camera Actions
    // =========================================================================

    setCameraPosition: (position) => {
      set({ cameraPosition: position })
    },

    setCameraTarget: (target) => {
      set({ cameraTarget: target })
    },

    setIsTransitioning: (transitioning) => {
      set({ isTransitioning: transitioning })
    },

    setTransitionPhase: (phase) => {
      set({ transitionPhase: phase })
    },

    // =========================================================================
    // Animation Actions (v2)
    // =========================================================================

    setIsUvPanning: (panning) => {
      set({ isUvPanning: panning })
    },

    setIsParticleDrifting: (drifting) => {
      set({ isParticleDrifting: drifting })
    },

    setHasBookLerps: (lerping) => {
      set({ hasBookLerps: lerping })
    },

    setPostprocessingEnabled: (enabled) => {
      set({ postprocessingEnabled: enabled })
    },

    // =========================================================================
    // Filter Actions
    // =========================================================================

    setFilters: (filters) => {
      const state = get()

      // When filters change, zoom out to universe view if not already there
      const shouldZoomOut =
        state.viewLevel !== 'universe' &&
        (filters.statusFilter !== undefined ||
          filters.topicFilter !== undefined ||
          filters.searchQuery !== undefined)

      set((s) => ({
        statusFilter:
          filters.statusFilter !== undefined
            ? filters.statusFilter
            : s.statusFilter,
        topicFilter:
          filters.topicFilter !== undefined
            ? filters.topicFilter
            : s.topicFilter,
        searchQuery:
          filters.searchQuery !== undefined
            ? filters.searchQuery
            : s.searchQuery,
        sortBy: filters.sortBy !== undefined ? filters.sortBy : s.sortBy,
        ...(shouldZoomOut
          ? {
              viewLevel: 'universe' as ViewLevel,
              activeConstellation: null,
              selectedBook: null,
              cameraPosition: UNIVERSE_CAMERA_POSITION,
              cameraTarget: UNIVERSE_CAMERA_TARGET,
              isTransitioning: true,
            }
          : {}),
      }))
    },

    clearFilters: () => {
      set({
        statusFilter: null,
        topicFilter: null,
        searchQuery: '',
        sortBy: 'rating',
      })
    },

    setStatusFilter: (status) => {
      get().setFilters({ statusFilter: status })
    },

    setTopicFilter: (topic) => {
      get().setFilters({ topicFilter: topic })
    },

    setSearchQuery: (query) => {
      get().setFilters({ searchQuery: query })
    },

    setSortBy: (sortBy) => {
      set({ sortBy })
    },

    // =========================================================================
    // Performance Actions
    // =========================================================================

    setQualityLevel: (level) => {
      const state = get()
      const updates: Partial<LibraryStoreState> = { qualityLevel: level }

      // Only auto-update nebula texture mode if user hasn't manually set it
      if (!state.nebulaTextureModeManual) {
        updates.nebulaTextureMode = level === 'full' ? 'blender' : 'procedural'
      }

      set(updates)
    },

    setShowClassicFallback: (show) => {
      set({ showClassicFallback: show })
    },

    // =========================================================================
    // Nebula Texture Actions (Blender integration)
    // =========================================================================

    setNebulaTextureMode: (mode) => {
      set({
        nebulaTextureMode: mode,
        nebulaTextureModeManual: true, // User override - persists across quality changes
      })
    },

    setBlenderTexturesLoaded: (loaded) => {
      set({ blenderTexturesLoaded: loaded })
    },

    // =========================================================================
    // Reset
    // =========================================================================

    reset: () => {
      set(initialState)
    },
  }))
)

// =============================================================================
// Selectors (for optimized subscriptions)
// =============================================================================

export const selectViewLevel = (state: LibraryStore) => state.viewLevel
export const selectActiveConstellation = (state: LibraryStore) =>
  state.activeConstellation
export const selectSelectedBook = (state: LibraryStore) => state.selectedBook
export const selectCameraPosition = (state: LibraryStore) =>
  state.cameraPosition
export const selectCameraTarget = (state: LibraryStore) => state.cameraTarget
export const selectIsTransitioning = (state: LibraryStore) =>
  state.isTransitioning
export const selectStatusFilter = (state: LibraryStore) => state.statusFilter
export const selectTopicFilter = (state: LibraryStore) => state.topicFilter
export const selectSearchQuery = (state: LibraryStore) => state.searchQuery
export const selectSortBy = (state: LibraryStore) => state.sortBy
export const selectQualityLevel = (state: LibraryStore) => state.qualityLevel
export const selectShowClassicFallback = (state: LibraryStore) =>
  state.showClassicFallback

/**
 * Check if any filters are active.
 * Note: This is a derived value, computed from filter state.
 */
export const selectIsFiltered = (state: LibraryStore) =>
  state.statusFilter !== null ||
  state.topicFilter !== null ||
  state.searchQuery.trim().length >= MIN_SEARCH_LENGTH

// Animation selectors (v2)
export const selectTransitionPhase = (state: LibraryStore) =>
  state.transitionPhase
export const selectIsUvPanning = (state: LibraryStore) => state.isUvPanning
export const selectIsParticleDrifting = (state: LibraryStore) =>
  state.isParticleDrifting
export const selectHasBookLerps = (state: LibraryStore) => state.hasBookLerps
export const selectPostprocessingEnabled = (state: LibraryStore) =>
  state.postprocessingEnabled

/**
 * Check if any animation is active.
 * Note: This is a derived value, computed from animation flags.
 */
export const selectIsAnimating = (state: LibraryStore) =>
  state.isTransitioning ||
  state.isUvPanning ||
  state.isParticleDrifting ||
  state.hasBookLerps

// Nebula texture selectors (Blender integration)
export const selectNebulaTextureMode = (state: LibraryStore) =>
  state.nebulaTextureMode
export const selectBlenderTexturesLoaded = (state: LibraryStore) =>
  state.blenderTexturesLoaded
