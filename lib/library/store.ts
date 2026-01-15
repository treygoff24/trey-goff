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

const UNIVERSE_CAMERA_POSITION: Position3D = [0, 0, 100]
const UNIVERSE_CAMERA_TARGET: Position3D = [0, 0, 0]
const MIN_SEARCH_LENGTH = 2

interface LibraryStoreState {
  viewLevel: ViewLevel
  activeConstellation: string | null
  selectedBook: Book | null

  cameraPosition: Position3D
  cameraTarget: Position3D
  isTransitioning: boolean
  transitionPhase: number

  isUvPanning: boolean
  isParticleDrifting: boolean

  statusFilter: Book['status'] | null
  topicFilter: string | null
  searchQuery: string
  sortBy: SortBy

  qualityLevel: QualityLevel
  showClassicFallback: boolean
  postprocessingEnabled: boolean
}

interface LibraryStoreActions {
  zoomToConstellation: (
    topic: string,
    position: Position3D,
    targetOffset?: Position3D
  ) => void
  selectBook: (book: Book | null, position?: Position3D) => void
  stepBack: () => void
  goToUniverse: () => void

  setIsTransitioning: (transitioning: boolean) => void
  setTransitionPhase: (phase: number) => void

  setIsUvPanning: (panning: boolean) => void
  setIsParticleDrifting: (drifting: boolean) => void
  setPostprocessingEnabled: (enabled: boolean) => void

  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
  setStatusFilter: (status: Book['status'] | null) => void
  setTopicFilter: (topic: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: SortBy) => void

  setQualityLevel: (level: QualityLevel) => void
  setShowClassicFallback: (show: boolean) => void

  reset: () => void
}

export interface LibraryStore extends LibraryStoreState, LibraryStoreActions {
  // Derived state (computed on access)
  isFiltered: boolean
  isAnimating: boolean // v2: true when any animation is active
}

const initialState: LibraryStoreState = {
  viewLevel: 'universe',
  activeConstellation: null,
  selectedBook: null,

  cameraPosition: UNIVERSE_CAMERA_POSITION,
  cameraTarget: UNIVERSE_CAMERA_TARGET,
  isTransitioning: false,
  transitionPhase: 0,

  isUvPanning: false,
  isParticleDrifting: false,

  statusFilter: null,
  topicFilter: null,
  searchQuery: '',
  sortBy: 'rating',

  qualityLevel: 'full',
  showClassicFallback: false,
  postprocessingEnabled: true,
}

export const useLibraryStore = create<LibraryStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

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
        state.isParticleDrifting
      )
    },

    zoomToConstellation: (topic, position, targetOffset = [0, 0, 0]) => {
      const cameraPosition: Position3D = [
        position[0] + targetOffset[0],
        position[1] + targetOffset[1] + 5,
        position[2] + targetOffset[2] + 25,
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
        const state = get()
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
        return
      }

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

    setIsTransitioning: (transitioning) => {
      set({ isTransitioning: transitioning })
    },

    setTransitionPhase: (phase) => {
      set({ transitionPhase: phase })
    },

    setIsUvPanning: (panning) => {
      set({ isUvPanning: panning })
    },

    setIsParticleDrifting: (drifting) => {
      set({ isParticleDrifting: drifting })
    },

    setPostprocessingEnabled: (enabled) => {
      set({ postprocessingEnabled: enabled })
    },

    setFilters: (filters) => {
      const state = get()
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

    setQualityLevel: (level) => {
      set({
        qualityLevel: level,
        postprocessingEnabled: level !== 'minimal',
      })
    },

    setShowClassicFallback: (show) => {
      set({ showClassicFallback: show })
    },

    reset: () => {
      set(initialState)
    },
  }))
)

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

export const selectIsFiltered = (state: LibraryStore) =>
  state.statusFilter !== null ||
  state.topicFilter !== null ||
  state.searchQuery.trim().length >= MIN_SEARCH_LENGTH

export const selectTransitionPhase = (state: LibraryStore) =>
  state.transitionPhase
export const selectIsUvPanning = (state: LibraryStore) => state.isUvPanning
export const selectIsParticleDrifting = (state: LibraryStore) =>
  state.isParticleDrifting
export const selectPostprocessingEnabled = (state: LibraryStore) =>
  state.postprocessingEnabled

export const selectIsAnimating = (state: LibraryStore) =>
  state.isTransitioning ||
  state.isUvPanning ||
  state.isParticleDrifting
