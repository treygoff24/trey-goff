# Floating Library Implementation Plan

**Spec Reference**: `docs/plans/2026-01-03-floating-library-design.md`
**Last Updated**: 2026-01-03
**Complexity**: Very High
**Estimated Phases**: 7

---

## Executive Summary

Transform `/library` from a grid layout into a 3D cosmic exploration experience using React Three Fiber. Books float as constellations organized by topic (nebulae), with smooth camera transitions between Universe, Constellation, and Book views.

### Critical Path

1. Zustand store for library state
2. Basic Canvas with camera system
3. Book textures and FloatingBook component
4. Constellation (nebula) grouping
5. Universe view with star field
6. Filters, search, and animations
7. Polish: stats constellation, performance, accessibility

---

## Phase 1: Foundation - Store and Types

**Goal**: Create the state management infrastructure for the floating library.
**Dependencies**: None
**Estimated Effort**: S

### Tasks

#### 1.1 Create Library State Store

- **Description**: Create a Zustand store for library view state (camera state, selected book, filters, view level). Pattern follows `lib/interactive/store.ts`.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/lib/library/store.ts`
- **Technical approach**:
  ```typescript
  // Key state shape
  interface LibraryStore {
    // View state
    viewLevel: 'universe' | 'constellation' | 'book'
    activeConstellation: string | null  // topic name
    selectedBook: Book | null

    // Camera targets (for animation)
    cameraTarget: [number, number, number]
    cameraPosition: [number, number, number]

    // Filters
    statusFilter: BookStatus | null
    topicFilter: string | null
    searchQuery: string
    sortBy: 'rating' | 'title' | 'author' | 'year'
    // Note: `isFiltered` should be DERIVED (getter) not stored, to avoid state drift
    // isFiltered = statusFilter !== null || topicFilter !== null || searchQuery.length >= 2

    // Performance
    qualityLevel: 'full' | 'reduced' | 'minimal'
    showClassicFallback: boolean

    // Actions
    zoomToConstellation: (topic: string) => void
    selectBook: (book: Book | null) => void
    stepBack: () => void
    setFilters: (...) => void
    clearFilters: () => void
  }
  ```
- **Acceptance criteria**:
  - Store exports `useLibraryStore` hook
  - All state transitions work correctly
  - `stepBack()` correctly navigates: book -> constellation -> universe
- **Edge cases**:
  - Stepping back from universe should no-op
  - Selecting book while filtered should work correctly

#### 1.2 Create Library Types

- **Description**: Type definitions for constellation data, book positions, topic colors.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/lib/library/types.ts`
- **Technical approach**:
  ```typescript
  export const TOPIC_COLORS: Record<string, string> = {
    philosophy: '#8B5CF6',
    economics: '#F59E0B',
    governance: '#14B8A6',
    technology: '#3B82F6',
    science: '#22C55E',
    history: '#A16207',
    fiction: '#F43F5E',
    biography: '#FB7185',
    'self-help': '#EAB308',
    libertarianism: '#EA580C',
    futurism: '#06B6D4',
  }
  export const DEFAULT_TOPIC_COLOR = '#6B7280'

  export interface ConstellationData {
    topic: string
    color: string
    position: [number, number, number]
    books: BookWithPosition[]
  }

  export interface BookWithPosition extends Book {
    position: [number, number, number]
    isDrifter: boolean
  }
  ```
- **Acceptance criteria**:
  - All 11 topic colors from spec are defined
  - Types are exported and usable

#### 1.3 Create Constellation Grouping Utilities

- **Description**: Functions to group books by primary topic, identify drifters, calculate positions.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/lib/library/constellation.ts`
- **Technical approach**:
  - Hash function for deterministic positions (seeded by topic/book ID)
  - Group books by first topic in `topics[]` array
  - Single-book topics become drifters
  - Books with no topics become drifters
  - Spread constellations in 3D space (spherical distribution)
  - Position books within constellation with collision avoidance
- **Acceptance criteria**:
  - `groupBooksIntoConstellations(books)` returns `ConstellationData[]`
  - `getDrifterBooks(books)` returns `BookWithPosition[]`
  - Positions are deterministic (same input = same output)
  - No overlapping positions within constellation

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Store can be imported and used in a test component
- [ ] Constellation grouping produces correct output for sample data

---

## Phase 2: Canvas Infrastructure

**Goal**: Set up R3F Canvas with camera system and basic scene.
**Dependencies**: Phase 1
**Estimated Effort**: M

### Tasks

#### 2.1 Create FloatingLibrary Canvas Wrapper

- **Description**: Main R3F Canvas component that wraps the 3D scene. Handles WebGL detection, reduced motion, error boundaries.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingLibrary.tsx`
- **Technical approach**:
  - Pattern follows `components/interactive/RendererRoot.tsx`
  - Detect WebGL support, fall back to existing `LibraryClient` if unsupported
  - Pass `reducedMotion` from `useReducedMotion()` hook
  - Use `Suspense` for async loading with fallback
  - Canvas config: dark background (#070A0F), appropriate camera FOV
- **Acceptance criteria**:
  - Canvas renders on WebGL-capable browsers
  - Falls back gracefully on unsupported browsers
  - Shows loading state during initialization

#### 2.2 Create Camera Controller with Navigation Controls

- **Description**: Camera system with animated transitions AND manual navigation (drag to pan, scroll/pinch to zoom).
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/CameraController.tsx`
- **Technical approach**:
  - Use `@react-three/drei` `OrbitControls` or `MapControls` for manual navigation
  - Subscribe to store's `cameraPosition` and `cameraTarget`
  - **Manual controls** (when NOT in scripted transition):
    - Mouse drag: pan around scene
    - Scroll wheel: zoom in/out
    - Touch: drag to pan, pinch to zoom
  - **Scripted transitions** (disable manual controls during these):
    - Use `useFrame` with lerp for smooth transitions (600ms)
    - Set `controls.enabled = false` during transition
    - Re-enable controls when transition completes
  - Instant transitions when `reducedMotion` is true
  - Camera modes:
    - Universe: far away, sees all constellations (controls enabled)
    - Constellation: inside nebula, books spread out (controls enabled, limited zoom range)
    - Book: focused on single book (controls disabled)
  - Store `isTransitioning` flag in Zustand to coordinate
- **Acceptance criteria**:
  - Camera smoothly animates between positions on scripted transitions
  - Manual drag/scroll/pinch works when not transitioning
  - Controls disabled during transitions (no interference)
  - Reduced motion disables animation
  - Touch controls work on mobile

#### 2.3 Create Universe Component

- **Description**: Top-level scene component that renders constellations, drifters, and background.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/Universe.tsx`
- **Technical approach**:
  - Receive grouped constellation data as props
  - Render each `Constellation` component at its position
  - Render `Drifter` components for orphan books
  - Render star field background (instanced particles)
  - Handle click on backdrop (step back navigation)
- **Acceptance criteria**:
  - All constellations render at correct positions
  - Drifters are visible and moving
  - Backdrop click triggers `stepBack()`

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Canvas renders without errors in browser
- [ ] Console shows no WebGL warnings

---

## Phase 3: Book Rendering

**Goal**: Render individual books as 3D objects with covers.
**Dependencies**: Phase 2
**Estimated Effort**: L

### Tasks

#### 3.0 Generate Local Cover Assets (Pre-requisite)

- **Description**: Extend cover resolution script to download covers locally and generate LOD versions.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/scripts/resolve-book-covers.ts`
- **Files to create**:
  - Local cover assets in `public/covers/[book-id]/` at multiple resolutions
- **Technical approach**:
  - Download covers from remote URLs to `public/covers/[book-id]/full.jpg`
  - Generate LOD versions: `thumb.jpg` (64x96), `medium.jpg` (256x384), `full.jpg` (512x768)
  - Use sharp or similar for image processing
  - Update `cover-map.json` format to include LOD URLs:
    ```json
    {
      "book-id": {
        "thumb": "/covers/book-id/thumb.jpg",
        "medium": "/covers/book-id/medium.jpg",
        "full": "/covers/book-id/full.jpg"
      }
    }
    ```
  - Add `pnpm covers:lod` script for this task
- **Acceptance criteria**:
  - Local covers exist for all books with remote URLs
  - Three resolution versions per book
  - No CORS issues when loading from `/covers/`
  - Covers survive build and deploy
- **Why critical**: WebGL `TextureLoader` requires CORS-safe URLs. Remote Google Books/Open Library URLs may fail. Local assets guarantee reliability.

#### 3.1 Create Texture Loading System

- **Description**: Load book cover textures with LOD support and placeholder handling.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/lib/library/textures.ts`
- **Technical approach**:
  - Use `THREE.TextureLoader` for cover images
  - Create colored placeholder texture from topic color
  - LOD buckets per spec: 64x96 (distant), 256x384 (constellation), 512x768 (detail)
  - Lazy-load higher res on zoom
  - Unload textures for off-screen books after 5s
  - Track memory usage, target < 150MB GPU
- **Acceptance criteria**:
  - Covers load from `cover-map.json` URLs
  - Failed covers show topic-colored placeholder
  - Memory budget is respected
  - LOD switching works based on camera distance

#### 3.2 Create FloatingBook Component

- **Description**: Individual book as a 3D plane with cover texture, hover/select states.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingBook.tsx`
- **Technical approach**:
  - Plane geometry with book aspect ratio (roughly 2:3)
  - Apply cover texture from texture system
  - Subtle floating animation (bob + slight rotation) via `useFrame`
  - Disable animation when `reducedMotion`
  - Hover: scale 1.1x, tilt toward cursor, glow intensifies
  - Click: call `selectBook(book)` in store
  - Throttled raycasting (16ms) for hover detection
- **Acceptance criteria**:
  - Books render with correct covers
  - Hover state works smoothly
  - Click selects book and updates store
  - Animation respects reduced motion

#### 3.3 Create Drifter Component

- **Description**: Orphan book with slow curved trajectory through void.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/Drifter.tsx`
- **Technical approach**:
  - Extends `FloatingBook` with path animation
  - Use Bezier or elliptical orbit for curved path
  - Very slow movement (period: 60-120 seconds)
  - Path seeded by book ID for determinism
- **Acceptance criteria**:
  - Drifters move along curved paths
  - Movement is continuous and smooth
  - Path is consistent across page loads

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Books render with covers in browser
- [ ] Hover states work
- [ ] Click selection works
- [ ] Drifters animate along paths

---

## Phase 4: Constellations and Nebulae

**Goal**: Create the nebula visual effect and topic grouping.
**Dependencies**: Phase 3
**Estimated Effort**: M

### Tasks

#### 4.1 Create Constellation Component

- **Description**: Single nebula containing books for one topic.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/Constellation.tsx`
- **Technical approach**:
  - Receives topic, color, books, position as props
  - Renders nebula cloud effect (see 4.2)
  - Renders contained books at their sub-positions
  - **Topic label**: Use `@react-three/drei` `Html` component instead of `Text` to avoid font asset dependency
    - Renders as DOM element positioned in 3D space
    - Can use CSS with site's design tokens (font-family: var(--font-satoshi))
    - Add glow/pulse effect via CSS animation
    - Click handler calls `zoomToConstellation(topic)`
  - When zoomed in: denser particle dust, warm glow
- **Acceptance criteria**:
  - Nebula is visible from universe view
  - Label is readable and clickable (uses site's Satoshi font via CSS)
  - Books are positioned within nebula bounds
  - Visual changes when constellation is active

#### 4.2 Create Nebula Effect

- **Description**: Glowing cloud effect for constellation background.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/NebulaCloud.tsx`
- **Technical approach**:
  - Options: drei `Cloud` component, or custom particle system
  - Color from topic's assigned color
  - Soft edges, slight animation (if motion allowed)
  - Bloom post-processing for glow effect
  - Lower opacity when viewing from distance
- **Acceptance criteria**:
  - Nebula has correct topic color
  - Soft, glowing appearance
  - Not too dense (books visible inside)

#### 4.3 Create Star Field Background

- **Description**: Subtle star field with slight twinkle.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/StarField.tsx`
- **Technical approach**:
  - Use `InstancedMesh` for performance (1000-5000 particles)
  - Small white points scattered in sphere around scene
  - Subtle brightness variation (twinkle) via shader or opacity animation
  - Disable twinkle when `reducedMotion`
- **Acceptance criteria**:
  - Stars visible throughout scene
  - Performance impact minimal
  - Twinkle effect present (motion allowed)

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Nebulae render with correct colors
- [ ] Star field visible
- [ ] Labels clickable and trigger zoom

---

## Phase 5: View Transitions and Detail Panel

**Goal**: Implement smooth camera transitions and book detail overlay.
**Dependencies**: Phase 4
**Estimated Effort**: M

### Tasks

#### 5.1 Implement View Level Transitions

- **Description**: Camera animations between Universe/Constellation/Book views.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/CameraController.tsx`
  - `/Users/treygoff/Code/trey-goff/lib/library/store.ts`
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingBook.tsx`
- **Technical approach**:
  - Store actions calculate target positions:
    - `zoomToConstellation`: move camera inside nebula, warm glow atmosphere
    - `selectBook`: move camera to book position
    - `stepBack`: reverse to previous level
  - Camera controller lerps to targets (600ms ease-out)
  - Non-active constellations fade/blur during constellation view
  - **Book view visuals** (per spec):
    - Selected book scales up and pulls toward camera center
    - **Other books dim** to ~20% opacity (not just blur background)
    - **Spotlight effect** on selected book (point light or emissive material)
    - **3D depth**: selected book uses BoxGeometry (slight thickness) instead of flat plane
    - Post-processing depth-of-field for background blur
  - Disable manual camera controls during book view
- **Acceptance criteria**:
  - Smooth 600ms transition to constellation
  - Book selection pulls book forward with 3D depth
  - Other books dim when book is selected
  - Spotlight illuminates selected book
  - Background blurs when book selected
  - `stepBack` reverses correctly

#### 5.2 Create BookDetailPanel Component and Amazon URL Validation

- **Description**: HTML overlay showing selected book details, plus centralized Amazon URL validation.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/BookDetailPanel.tsx`
  - `/Users/treygoff/Code/trey-goff/lib/library/amazon.ts` (validation helper)
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/BookDetail.tsx` (add validation to classic fallback too)
- **Technical approach**:
  - Create `isValidAmazonUrl(url: string): boolean` helper in `lib/library/amazon.ts`
    - Parse URL, check hostname matches `amazon.com`, `*.amazon.com`, or regional domains
    - Regex: `/^([\w-]+\.)?amazon(\.[a-z]{2,3}){1,2}$/`
  - Reuse markup/styling from existing `BookDetail.tsx`
  - Position: right side on desktop, bottom sheet on mobile
  - Show when `selectedBook !== null`
  - Amazon link: only render if URL passes `isValidAmazonUrl()`, add `rel="noopener noreferrer" target="_blank"`
  - Close button calls `selectBook(null)`
  - **Also update `BookDetail.tsx`** to use the same validation (for classic fallback)
- **Acceptance criteria**:
  - Panel shows all book info (title, author, rating, topics, whyILoveIt)
  - Amazon link validates URL hostname (rejects lookalikes)
  - Both new panel AND classic BookDetail validate Amazon URLs
  - Close button works
  - Panel slides from right (desktop) or bottom (mobile)

#### 5.3 Implement Navigation Controls

- **Description**: Breadcrumb, Escape key, and back button handling.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/LibraryBreadcrumb.tsx`
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingLibrary.tsx`
- **Technical approach**:
  - Breadcrumb: "Library" > "Philosophy" > "Book Title"
  - Click any level to jump there
  - Escape key listener calls `stepBack()`
  - Browser back button should work (consider URL state)
- **Acceptance criteria**:
  - Breadcrumb shows current navigation path
  - Clicking breadcrumb levels works
  - Escape key steps back
  - All methods documented in spec work

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Click nebula label -> zoom in works
- [ ] Click book -> detail panel shows
- [ ] Escape key steps back
- [ ] Breadcrumb navigation works

---

## Phase 6: Filtering, Search, and Animations

**Goal**: Implement filter controls and regrouping animations.
**Dependencies**: Phase 5
**Estimated Effort**: L

### Tasks

#### 6.1 Create LibraryHUD Component

- **Description**: Filter controls floating over the 3D scene.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/LibraryHUD.tsx`
- **Technical approach**:
  - HTML overlay in top-left corner
  - Controls: Status dropdown, Topic dropdown, Sort dropdown, Search input
  - Style: minimal, semi-transparent background, matches site design tokens
  - **Search semantics** (per spec):
    - Minimum 2 characters to trigger search
    - Case-insensitive substring match on title AND author
    - Debounce 300ms
  - **Sort semantics** (per spec):
    - Rating: highest first (5 → 1), unrated last
    - Title: A → Z
    - Author: A → Z (by last name if parseable, else full string)
    - Year: newest first
    - **Sort only repositions when filtered** (unfiltered keeps seeded positions)
  - On filter/search change: update store, zoom out to universe if in constellation/book view
- **Acceptance criteria**:
  - All four controls work
  - Search requires min 2 chars, debounces correctly
  - Sort directions match spec
  - Filter change zooms out to universe view
  - Controls are accessible via keyboard

#### 6.2 Implement Filter Regrouping Animation

- **Description**: Books regroup into central cluster when filtered; nebulae are hidden.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/Universe.tsx`
  - `/Users/treygoff/Code/trey-goff/lib/library/constellation.ts`
- **Technical approach**:
  - When `isFiltered`:
    - **Hide all nebulae** (fade out NebulaCloud components)
    - Calculate "Search Results" cluster positions at scene center
    - Non-matching books fade to 10% opacity and drift outward
    - Matching books animate to cluster center (800ms ease-out)
    - Sort affects position within cluster (spiral layout)
    - Show "No books match filters" with clear button if zero matches
  - Clear filter: nebulae fade back in, books animate back to home nebulae (1000ms)
  - **Stats update**: pass filtered book list to StatsConstellation when filtered
- **Acceptance criteria**:
  - Filter hides nebulae (per spec)
  - Matching books shown in central cluster
  - Non-matching books dim to 10% opacity
  - Empty state shows message with clear action
  - Stats update to reflect filtered subset
  - Clear filter animates books back and restores nebulae

#### 6.3 Implement Book Position Animations

- **Description**: Smooth position transitions for regrouping.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingBook.tsx`
- **Technical approach**:
  - Book receives target position, animates with lerp
  - Animation duration: ~800ms for filter, ~500ms for sort
  - Stagger animation start slightly per book for organic feel
  - Respect `reducedMotion` (instant position change)
- **Acceptance criteria**:
  - Books animate smoothly to new positions
  - No position glitches or jumps
  - Reduced motion makes changes instant

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Status filter works
- [ ] Topic filter works (matches any topic in array)
- [ ] Search filters by title/author
- [ ] Sort reorders filtered cluster
- [ ] Clear filter animates books back

---

## Phase 7: Polish, Performance, and Accessibility

**Goal**: Stats constellation, performance optimization, accessibility, and final polish.
**Dependencies**: Phase 6
**Estimated Effort**: L

### Tasks

#### 7.1 Create StatsConstellation Component

- **Description**: Special nebula showing reading statistics as floating artifacts.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/StatsConstellation.tsx`
- **Technical approach**:
  - Position among topic nebulae
  - Contents (when zoomed in):
    - Total Books: large glowing 3D text
    - 5-Star Books: golden cluster of those book covers
    - Average Rating: floating star icons
    - Books by Year: horizontal timeline with positioned books
    - Topic Breakdown: mini-nebulae with relative sizes
  - Use existing stats utilities from `lib/books/index.ts`
  - Interactive: click 5-star cluster to highlight those books
- **Acceptance criteria**:
  - Stats constellation visible in universe view
  - All five stat displays render correctly
  - Interactive elements work
  - Handles empty/missing data gracefully

#### 7.2 Implement Performance Optimization

- **Description**: LOD, graceful degradation, FPS monitoring.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/lib/library/performance.ts`
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingLibrary.tsx`
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingBook.tsx`
- **Technical approach**:
  - FPS sampling (use existing pattern from `lib/interactive/quality.ts`)
  - Hysteresis thresholds per spec:
    - < 45fps for 2s: reduce particles 50%
    - < 35fps for 2s: disable post-processing
    - < 25fps for 2s: simplify to flat sprites
    - < 20fps for 3s: prompt for classic view
  - Store quality level in library store
  - LOD for book textures based on camera distance
  - Frustum culling (R3F default, verify working)
- **Acceptance criteria**:
  - 60fps on modern devices (M1, iPhone 12+)
  - Graceful degradation when performance drops
  - No oscillation between quality levels (hysteresis)
  - Memory stays under 150MB GPU textures

#### 7.3 Implement Accessibility

- **Description**: Screen reader support, keyboard navigation, reduced motion.
- **Files to create**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/AccessibleBookList.tsx`
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingLibrary.tsx`
- **Technical approach**:
  - Canvas: `aria-hidden="true"`
  - Render hidden `<ul>` with all books grouped by topic (SR-accessible)
  - Focus management: move focus to detail panel when book selected
  - Tab navigation: filter controls, breadcrumb, detail panel
  - Escape: close detail, step back
  - `prefers-reduced-motion`: disable all animations, instant transitions
- **Acceptance criteria**:
  - Screen reader can navigate book list
  - Focus moves to detail panel on selection
  - Keyboard navigation works for overlays
  - Reduced motion disables all animation

#### 7.4 Update Library Page Entry Point

- **Description**: Integrate floating library into `/library` page.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/app/library/page.tsx`
- **Technical approach**:
  - Import `FloatingLibrary` component
  - Pass book data from `getAllBooks()`
  - Wrap in error boundary
  - Keep existing `LibraryClient` as fallback option
  - Full viewport canvas with overlays
- **Acceptance criteria**:
  - `/library` shows 3D experience by default
  - Falls back to grid on WebGL error
  - SEO metadata and structured data preserved
  - Page loads without hydration errors

#### 7.5 Mobile Optimization

- **Description**: Touch controls and mobile-specific UI.
- **Files to modify**:
  - `/Users/treygoff/Code/trey-goff/components/library/floating/FloatingLibrary.tsx`
  - `/Users/treygoff/Code/trey-goff/components/library/floating/BookDetailPanel.tsx`
- **Technical approach**:
  - Touch to select (no hover states on mobile)
  - Pinch to zoom, drag to pan (drei controls)
  - Detail panel slides from bottom (< 768px)
  - Reduce texture resolution on mobile (50%)
  - Touch-friendly filter controls
- **Acceptance criteria**:
  - Touch controls work smoothly
  - Detail panel is bottom sheet on mobile
  - Performance acceptable on mid-range mobile

### Phase Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] Stats constellation renders correctly
- [ ] Performance monitor shows 60fps on capable devices
- [ ] Graceful degradation triggers correctly
- [ ] Screen reader can navigate all books
- [ ] Mobile touch controls work
- [ ] `/library` URL loads new experience

---

## Integration Points

### Data Flow

```
books.json (build time)
    |
    v
getAllBooks() -> groupBooksIntoConstellations()
    |
    v
Universe component receives ConstellationData[]
    |
    v
Each Constellation renders its books
    |
    v
FloatingBook loads texture, handles interaction
    |
    v
User click -> store.selectBook() -> BookDetailPanel renders
```

### Component Hierarchy

```
app/library/page.tsx
  |
  +-- FloatingLibrary (Canvas wrapper)
        |
        +-- CameraController
        +-- Universe
        |     +-- StarField
        |     +-- Constellation[] (one per topic)
        |     |     +-- NebulaCloud
        |     |     +-- FloatingBook[]
        |     |     +-- TopicLabel
        |     +-- StatsConstellation
        |     +-- Drifter[]
        |
        +-- LibraryHUD (HTML overlay)
        +-- LibraryBreadcrumb (HTML overlay)
        +-- BookDetailPanel (HTML overlay)
        +-- AccessibleBookList (hidden, SR only)
```

### Store Connections

| Component | Store Usage |
|-----------|-------------|
| CameraController | Reads `cameraPosition`, `cameraTarget` |
| Universe | Reads `viewLevel`, `activeConstellation`, `isFiltered` |
| FloatingBook | Calls `selectBook()` |
| Constellation | Calls `zoomToConstellation()` |
| BookDetailPanel | Reads `selectedBook`, calls `selectBook(null)` |
| LibraryHUD | Reads/writes filters, calls `setFilters()`, `clearFilters()` |
| LibraryBreadcrumb | Reads view state, calls `stepBack()`, `zoomToConstellation()` |

---

## Testing Strategy

### Unit Tests

- Constellation grouping logic (determinism, drifter detection)
- Amazon URL validation
- Position calculation functions

### Integration Tests

- Store state transitions
- Filter application and clearing
- Navigation flow (universe -> constellation -> book -> back)

### E2E Tests (Playwright)

- Load library page, verify canvas renders
- Click constellation label, verify zoom
- Click book, verify detail panel
- Use filters, verify regrouping
- Test keyboard navigation (Escape, Tab)
- Mobile touch interaction

### Performance Tests

- FPS benchmark on target devices
- Memory usage monitoring
- Texture loading time

---

## Rollout Considerations

### Feature Flag

Consider adding a feature flag to enable/disable 3D library:

```typescript
// lib/library/config.ts
export const ENABLE_FLOATING_LIBRARY = true
```

### Migration

- No database migration needed
- `amazonUrl` field already exists in Book type
- Cover map already exists

### Rollback

- Keep `LibraryClient` component intact
- Feature flag can disable 3D mode
- Query param `?view=classic` for manual override

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebGL compatibility issues | Medium | High | Comprehensive fallback to grid view |
| Performance on low-end devices | Medium | Medium | Aggressive graceful degradation |
| Texture memory overflow | Low | High | Strict LOD and unloading policy |
| Complex animation state bugs | Medium | Medium | Thorough testing, reduced motion fallback |

### Dependencies

- `@react-three/fiber` ^9.4.2 (already installed)
- `@react-three/drei` ^10.7.7 (already installed)
- `@react-three/postprocessing` ^3.0.4 (already installed)
- `three` ^0.182.0 (already installed)
- `zustand` ^5.0.9 (already installed)

All dependencies are already in `package.json`. No new packages required.

### Performance Considerations

- Initial load: lazy-load textures, show loading state
- Texture budget: 150MB max, enforce with unloading
- Draw calls: instanced star field, batch similar materials
- Memory leaks: proper disposal of textures/geometries

---

## Definition of Done (from spec)

1. [ ] Universe view renders with labeled topic nebulae + stats constellation
2. [ ] Drifter books float lazily through the void
3. [ ] Click nebula -> smooth zoom into warm-glow constellation view
4. [ ] Books display as covers, hover shows tilt + glow
5. [ ] Click book -> pulls forward, detail panel shows with Amazon link placeholder
6. [ ] Breadcrumb + Escape + backdrop click + back button all work
7. [ ] Filters cause smooth regrouping animation
8. [ ] Mobile: touch/pinch works, detail panel slides from bottom
9. [ ] Performance: 60fps on modern devices, graceful degradation
10. [ ] Reduced motion: respects system preference
11. [ ] Existing library URL (`/library`) shows new experience
