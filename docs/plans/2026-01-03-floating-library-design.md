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
- **Drifters**: Books without topics drift lazily through the void on slow curved trajectories

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

- Filter controls float as minimal HUD in top-left corner (status, topic, sort)
- When filter applied:
  - Matching books drift together and regroup into temporary cluster
  - Non-matching books fade to transparent and drift away
  - Animation is smooth, ~800ms, eased
- Clear filter: books drift back to their home nebulae

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
| Book cover fails to load | Show `GenerativeBookCover` component (existing fallback) |
| books.json fails to load | Show error state: "Couldn't load the library. Please refresh." with retry button |
| Performance < 30fps for 3 seconds | Prompt: "Running slow? Switch to classic view" with toggle |

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

1. `books.json` loaded at build time (existing)
2. Books grouped by primary topic → constellation assignments
3. Constellation positions calculated (spread in 3D space, no overlap)
4. Book positions within constellation (clustered, slight randomness)
5. Drifters identified (books with no topics) → assigned drift paths

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
| Texture management | Lazy-load covers on zoom, or use texture atlas |
| Reduced motion | Respect `prefers-reduced-motion` — disable animations, instant transitions |
| Throttled raycasting | Debounce hover detection |

**Target**: 60fps on devices from 2020+ (M1 Mac, iPhone 12, mid-range Android).

**Graceful Degradation** (when fps drops):
1. First: Reduce particle count by 50%
2. Then: Disable post-processing effects (bloom, blur)
3. Then: Simplify book rendering (flat sprites instead of 3D)
4. Finally: Prompt user to switch to classic grid view

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

## Schema Changes Required

Add to `Book` type in `lib/books/types.ts`:
```typescript
amazonUrl?: string  // URL to Amazon product page
```

Populate URLs in `content/library/books.json` after implementation (separate task).

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

## Future Enhancements (Out of Scope)

- Sound design (ambient space sounds, book selection sounds)
- Keyboard navigation within 3D space
- Sharing deep links to specific books/constellations
- VR/AR support
