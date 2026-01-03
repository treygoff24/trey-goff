# The Floating Library — Design Spec

**Date**: 2026-01-03
**Status**: Ready for implementation
**Author**: Trey + Claude

---

## Overview

Transform the `/library` page from a standard grid layout into an explorable 3D cosmos where books float as constellations organized by topic. Built with React Three Fiber.

---

## Core Concept

The library exists as an explorable 3D universe. At the top level, users see **topic constellations** (nebulae) floating in a dark star-field void. Each nebula is labeled with its topic name and contains that topic's books as floating covers within a soft glowing cloud.

### Hierarchy of Views

1. **Universe view** — See all constellations from a distance, labeled nebulae
2. **Constellation view** — Zoomed into one nebula, books spread out, warm magical atmosphere
3. **Book view** — One book pulled forward, details displayed, background blurred

### Special Elements

- **Topic Nebulae**: One constellation for each topic with 2+ books
- **Stats Constellation**: A "Reading Stats" nebula showing statistics as floating artifacts
- **Drifters**: Books that drift lazily through the void on slow curved trajectories. A book becomes a drifter if:
  - It has no topics, OR
  - Its primary topic (first in array) has only 1 book total (single-book topics don't form nebulae)

Books with multiple topics appear in their primary topic's nebula (first topic in array).

---

## Visual Design

### Universe View (Zoomed Out)

- Deep black void with subtle star field (small white dots, slight twinkle)
- Nebulae are soft, glowing clouds — color derived from topic:
  | Topic | Color | Hex |
  |-------|-------|-----|
  | philosophy | Deep purple | #8B5CF6 |
  | economics | Amber | #F59E0B |
  | governance | Teal | #14B8A6 |
  | technology | Electric blue | #3B82F6 |
  | science | Green | #22C55E |
  | history | Warm brown | #A16207 |
  | fiction | Rose | #F43F5E |
  | biography | Coral | #FB7185 |
  | self-help | Gold | #EAB308 |
  | libertarianism | Orange | #EA580C |
  | futurism | Cyan | #06B6D4 |
  | default (unmapped) | Neutral gray | #6B7280 |
- Topic labels float near each nebula in Satoshi font, softly glowing
- Books inside nebulae visible as tiny bright points from distance
- Drifter books move slowly on gentle curved paths through the void
- Ambient particle dust very sparse, just enough to feel alive

### Constellation View (Zoomed In)

- **Transition**: Camera flies smoothly into nebula (600ms ease-out), other constellations fade and blur
- **Atmosphere**: Warm glow version of the nebula's own color (not universal amber)
- Books spread out in 3D space, covers facing camera
- Gentle floating animation — books bob slightly, subtle rotation
- Faint connecting lines between books by same author (optional flourish)
- Particle dust denser here, warm-colored, drifting slowly — magical/cozy feel

### Book View (Selected)

- Selected book scales up and pulls toward camera center
- Other books blur and dim
- Book cover has subtle 3D depth (slightly extruded, like a real book)
- Details panel appears to the right (or below on mobile)
- Soft spotlight effect on the selected book

---

## Interaction Model

### Navigation

| Input | Action |
|-------|--------|
| Mouse drag | Pan around |
| Scroll | Zoom in/out |
| Click nebula label | Fly into that constellation |
| Click book | Pull book forward, show details |
| Click backdrop | Step back one level |
| Press Escape | Step back one level |
| Back button (UI) | Step back one level |
| Breadcrumb | Jump to any level (Library → Philosophy → Book Title) |

### Filtering & Search

**Filter Controls** (float as minimal HUD in top-left corner):
- Status dropdown: All / Read / Reading / Want to Read
- Topic dropdown: All / [list of topics]
- Sort dropdown: Rating / Title / Author / Year
- Search input: Text field for title/author search

**Search Behavior:**
- Searches book titles and author names (case-insensitive substring match)
- Minimum 2 characters to trigger search
- Debounced 300ms to avoid excessive re-renders
- Search triggers regrouping (same as filters) — see Filter Scope below

**Filter Scope:**
- Filters AND search apply to the **entire universe**, regardless of current view
- If viewing a constellation when filter/search is applied, camera zooms out to universe view
- Matching books from ALL nebulae regroup into a temporary "Search Results" cluster at center
- Non-matching books fade to 10% opacity (still visible as dim points)
- Stats constellation updates to reflect filtered subset (e.g., "5-Star Books" shows only filtered 5-star books)

**Topic Filter Semantics:**
- Topic filter matches books that have the selected topic **anywhere in their topics array** (not just primary)
- This means a book tagged `["philosophy", "governance"]` appears when filtering by either topic
- However, for constellation assignment (home nebula), only the **primary topic (first in array)** is used

**Sorting Behavior:**
- Sort affects book order **within the regrouped cluster** (or within constellations when unfiltered)
- Books reposition along a spiral or grid layout based on sort order
- Default sort: Rating (highest first)
- Sort changes trigger smooth ~500ms reposition animation

**Filter/Search While in Book View:**
- If user applies filter/search while viewing a book detail:
  - Detail panel closes
  - Camera zooms out to Universe view
  - Filter/search is then applied with normal regrouping animation
- This ensures the user sees the full filtered result

**Animation:**
- Filter/search animations are smooth, ~800ms, ease-out
- Clear filter: books drift back to their home nebulae over ~1000ms

### Hover States

- **Book**: Slight scale-up (1.1x), gentle tilt toward cursor, soft glow intensifies
- **Nebula label**: Brightens, subtle pulse

### Mobile

- Breakpoint: < 768px (md breakpoint)
- Touch to select (no hover states)
- Pinch to zoom, drag to pan
- Detail panel slides up from bottom instead of side

---

## Loading & Error States

### Loading State

- Initial load: Dark void with pulsing particles, "Loading library..." text fades in/out
- Book covers: Show colored placeholder (book's topic color) while cover image loads, fade in cover when ready
- Stats: Show skeleton numbers that pulse until calculated

### Error States

| Error | Behavior |
|-------|----------|
| WebGL not supported | Fall back to existing grid layout with message: "Your browser doesn't support 3D. Showing classic view." |
| Book cover fails to load | Show solid color placeholder (topic color) as WebGL texture. The DOM-based `GenerativeBookCover` cannot be used in WebGL context. |
| Performance < 20fps for 3 seconds | Prompt: "Running slow? Switch to classic view" with toggle (see hysteresis table in Performance section) |

**Note:** Book data is loaded at build time and passed as props, so runtime data loading errors are not possible. Cover images are loaded at runtime and may fail.

### Empty States

| State | Behavior |
|-------|----------|
| No books in library | Single floating text: "No books yet" |
| Filter returns zero results | Books fade out, text appears: "No books match filters" with "Clear filters" button |
| Topic has no books (after filter) | Nebula dims and shows "(empty)" label |

---

## Stats Constellation

A special "Reading Stats" nebula floating among topic nebulae. Contents when zoomed in:

| Stat | Visual Representation |
|------|----------------------|
| Total Books | Large glowing number floating in space |
| 5-Star Books | Golden cluster of those book covers arranged as mini-constellation |
| Average Rating | Floating stars (e.g., 4.2 = 4 full + 1 partial) |
| Books by Year | Horizontal timeline with books positioned by year read |
| Topic Breakdown | Mini-nebulae showing relative sizes of each topic |

Stats feel like artifacts floating in space, not a traditional dashboard. Interactive — click "5-Star Books" cluster to highlight/pull those books forward.

---

## Book Details

When a book is selected, the detail panel shows:

- Cover image (large)
- Title
- Author
- Year published
- Rating (stars)
- Status badge (read/reading/want to read)
- Topics (as tags)
- "Why I Love It" notes (if present)
- **Amazon link** — "Buy on Amazon" button (URLs to be populated later)

---

## Technical Architecture

### Stack

- React Three Fiber (already in project)
- `@react-three/drei` for helpers (Text, Billboard, effects)
- `@react-three/postprocessing` for bloom/blur effects
- Zustand for state (camera state, selected book, current view, filters)

### Component Structure

```
app/library/page.tsx              — Entry point, metadata
components/library/
  FloatingLibrary.tsx             — Main R3F Canvas wrapper
  Universe.tsx                    — Top-level scene, manages camera, constellations
  Constellation.tsx               — Single nebula: cloud effect + contained books
  FloatingBook.tsx                — Individual book: cover texture, hover/select
  Drifter.tsx                     — Orphan book with slow drift animation
  StatsConstellation.tsx          — The dashboard nebula
  LibraryHUD.tsx                  — Filter controls, breadcrumb (HTML overlay)
  BookDetailPanel.tsx             — Selected book info (HTML overlay)
```

### Data Flow

1. `books.json` loaded at build time via `getAllBooks()` (existing pattern)
2. Books passed as props to client component (no runtime fetch needed)
3. Books grouped by primary topic → constellation assignments
4. Constellation positions calculated deterministically (seeded by topic name hash, spread in 3D space)
5. Book positions within constellation (seeded by book ID hash, clustered with collision avoidance)
6. Drifters identified (books with no topics OR single-book topics) → assigned drift paths

**Note:** Since data is loaded at build time, the "books.json fails to load" error state only applies during development/build. At runtime, data is always available via props. The retry UI is for cover image loading failures, not data loading.

### Camera System

- Three camera states: Universe, Constellation, Book
- Smooth animated transitions using lerp or spring physics
- Camera target + position stored in Zustand

---

## Performance Strategy

| Technique | Purpose |
|-----------|---------|
| LOD (Level of Detail) | Books at distance = simple sprites, full covers only when close |
| Frustum culling | R3F default, ensure distant books skip animation computation |
| InstancedMesh | Star field particles use instancing |
| Texture management | Lazy-load covers on zoom, use compressed textures |
| Reduced motion | Respect `prefers-reduced-motion` — disable animations, instant transitions |
| Throttled raycasting | Debounce hover detection (16ms throttle) |

**Texture Resolution Budgets:**

| Context | Max Resolution | Format |
|---------|---------------|--------|
| Universe view (distant) | 64x96 (thumbnail) | WebP/JPEG |
| Constellation view | 256x384 | WebP/JPEG |
| Book detail view | 512x768 (full) | WebP/JPEG |
| Mobile (all views) | 50% of above | WebP/JPEG |

**Memory Budget:**
- Target: < 150MB GPU memory for textures
- With 250 books at max quality: 250 × 512 × 768 × 4 bytes ≈ 390MB (too high)
- Strategy: Only load full-res for visible books; distant books use LOD thumbnails
- Unload textures for books outside frustum after 5 seconds

**Target**: 60fps on devices from 2020+ (M1 Mac, iPhone 12, mid-range Android).

**Graceful Degradation** (with hysteresis to prevent oscillation):

| Threshold | Action | Recovery Threshold |
|-----------|--------|-------------------|
| < 45fps for 2s | Reduce particle count by 50% | > 55fps for 5s to restore |
| < 35fps for 2s | Disable post-processing (bloom, blur) | > 50fps for 5s to restore |
| < 25fps for 2s | Simplify books to flat sprites | > 45fps for 5s to restore |
| < 20fps for 3s | Show prompt: "Running slow? Switch to classic view" | User must manually re-enable |

**Hysteresis:** Recovery thresholds are higher than degradation thresholds to prevent rapid oscillation between quality levels.

---

## Reuse from Existing Codebase

- Existing R3F setup patterns (Canvas config, camera, lighting)
- `useReducedMotion` hook
- Zustand store patterns
- `BookDetail` panel content (reuse markup/styling)
- Cover loading logic (`cover-map.json`)
- Book types and utilities from `lib/books/`
- Design tokens from `globals.css`

---

## Assets to Create

- Nebula cloud shader/texture (or use drei's Cloud)
- Star field particle system
- Topic → color mapping (defined above)
- Drifter path curves

---

## Schema Notes

**Existing fields in `Book` type (`lib/books/types.ts`) used by this feature:**
- `rating?: 1 | 2 | 3 | 4 | 5` — used for average and 5-star cluster
- `status: BookStatus` — used for filtering
- `year: number` — publication year
- `dateRead?: string` — ISO date, used for "Books by Year" timeline
- `topics: string[]` — used for constellation grouping

**New field required:**
```typescript
amazonUrl?: string  // URL to Amazon product page
```

**Note on dateRead:** Many books may not have this field populated. The "Books by Year" timeline should gracefully handle missing dates by excluding books without `dateRead` from the timeline.

**Populate `amazonUrl`** values in `content/library/books.json` after implementation (separate task).

**Link Security:** All `amazonUrl` links must:
- Be validated by parsing the URL and checking hostname matches this pattern:
  - Exactly `amazon.com`, OR
  - Ends with `.amazon.com` (e.g., `www.amazon.com`, `smile.amazon.com`), OR
  - Regional domains: `amazon.co.uk`, `amazon.de`, `amazon.fr`, `amazon.ca`, `amazon.co.jp`, etc.
- Implementation: `hostname === 'amazon.com' || hostname.endsWith('.amazon.com') || /^amazon\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname)`
- This rejects lookalikes like `evilamazon.com` or `amazon.com.evil.com`
- Include `rel="noopener noreferrer"` and `target="_blank"` attributes
- Invalid URLs should be ignored (no link shown)

---

## Definition of Done

1. [ ] Universe view renders with labeled topic nebulae + stats constellation
2. [ ] Drifter books float lazily through the void
3. [ ] Click nebula → smooth zoom into warm-glow constellation view
4. [ ] Books display as covers, hover shows tilt + glow
5. [ ] Click book → pulls forward, detail panel shows with Amazon link placeholder
6. [ ] Breadcrumb + Escape + backdrop click + back button all work
7. [ ] Filters cause smooth regrouping animation
8. [ ] Mobile: touch/pinch works, detail panel slides from bottom
9. [ ] Performance: 60fps on modern devices, graceful degradation
10. [ ] Reduced motion: respects system preference
11. [ ] Existing library URL (`/library`) shows new experience

---

## Open Questions (Resolved)

- ~~What to do with uncategorized books?~~ → Drifters on lazy orbits
- ~~Stats location?~~ → Stats constellation
- ~~Tech approach?~~ → React Three Fiber (already in stack)

---

## Accessibility

**Screen Reader Support:**
- The 3D canvas is marked with `aria-hidden="true"` since it's not navigable by screen readers
- A visually-hidden but SR-accessible list of all books is rendered in the DOM alongside the canvas
- This list is a simple `<ul>` with book titles as links, grouped by topic headings
- The list provides equivalent access to all book information for SR users
- When a book is selected in 3D view, focus moves to the detail panel (which is fully accessible HTML)

**Keyboard Navigation:**
- Tab navigates to filter controls, breadcrumb, and detail panel (all HTML overlays)
- Escape closes detail view and steps back one level
- Full keyboard navigation within 3D space is out of scope for v1, but the SR-accessible list provides an alternative

**Reduced Motion:**
- `prefers-reduced-motion: reduce` disables all animations
- Camera transitions become instant cuts
- Floating/bobbing animations are disabled
- Particle effects are disabled

---

## Future Enhancements (Out of Scope)

- Sound design (ambient space sounds, book selection sounds)
- Full keyboard navigation within 3D space (arrow keys to move between books)
- Sharing deep links to specific books/constellations
- VR/AR support
