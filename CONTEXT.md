# Floating Library - Build Context

**Last Updated**: Phase 0 - Pre-implementation (STARTING)

## Protocol Reminder (Re-read on every phase start)

**The Loop**: IMPLEMENT → TYPECHECK → LINT → BUILD → TEST → REVIEW → FIX → REPEAT → COMMIT

**Cross-agent checkpoints (mandatory):**
- Spec creation → Codex reviews ✅
- Implementation plan creation → Codex reviews ✅
- Phase completion → Dual code review (Claude subagent + Codex)
- Final completion → Codex cross-check
- Stuck in error loop → Call Codex for fresh perspective

**How to call Codex:**
```bash
codex exec \
  --model gpt-5.2-codex \
  --config model_reasoning_effort="xhigh" \
  --yolo \
  "[PROMPT]"
```

**Be patient:** Codex may take up to 30 minutes for complex reviews.

**Quality gates before review:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

---

## What This Is

Transform the `/library` page from a standard grid layout into an explorable 3D cosmos where books float as constellations organized by topic (nebulae). Built with React Three Fiber.

Key features:
- **Universe view**: All topic constellations visible from distance
- **Constellation view**: Zoom into a nebula to browse books
- **Book view**: Select a book to see details + Amazon link
- **Drifters**: Books without topics float lazily through the void
- **Stats constellation**: Reading metrics as floating artifacts

---

## Build Context

**Type**: Feature addition
**Spec location**: `docs/plans/2026-01-03-floating-library-design.md`
**Plan location**: `IMPLEMENTATION_PLAN.md`
**Feature branch**: `feature/floating-library`

---

## Tech Stack

**Existing (reuse):**
- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS v4 with CSS-first tokens
- State: Zustand patterns from `/lib/interactive/store.ts`
- 3D: React Three Fiber + drei + postprocessing (already installed)
- Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

**New for Floating Library:**
- `/lib/library/store.ts` - Zustand store for library-specific state
- `/lib/library/types.ts` - Topic colors, constellation types
- `/lib/library/constellation.ts` - Grouping and positioning utilities
- `/components/library/floating/` - All 3D library components

---

## Current Phase

**Phase 1: Foundation - Store and Types**

Tasks:
1. [ ] Create Zustand store (`lib/library/store.ts`)
2. [ ] Define types and topic colors (`lib/library/types.ts`)
3. [ ] Create constellation grouping utilities (`lib/library/constellation.ts`)

---

## Implementation Progress

- [x] Phase 0: Spec and Plan (approved by Codex)
- [ ] Phase 1: Foundation - Store and Types
- [ ] Phase 2: Canvas Infrastructure
- [ ] Phase 3: Book Rendering (incl. cover LOD)
- [ ] Phase 4: Constellations and Nebulae
- [ ] Phase 5: View Transitions and Detail
- [ ] Phase 6: Filtering and Search
- [ ] Phase 7: Polish, Performance, Accessibility

---

## Hook Signatures

### useLibraryStore() (to be created)
```typescript
Returns: {
  // View state
  viewLevel: 'universe' | 'constellation' | 'book'
  activeConstellation: string | null
  selectedBook: Book | null

  // Camera
  cameraTarget: [number, number, number]
  cameraPosition: [number, number, number]
  isTransitioning: boolean

  // Filters
  statusFilter: BookStatus | null
  topicFilter: string | null
  searchQuery: string
  sortBy: 'rating' | 'title' | 'author' | 'year'

  // Derived (getter)
  isFiltered: boolean

  // Performance
  qualityLevel: 'full' | 'reduced' | 'minimal'
  showClassicFallback: boolean

  // Actions
  zoomToConstellation: (topic: string) => void
  selectBook: (book: Book | null) => void
  stepBack: () => void
  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void
}
```

---

## Import Locations

**Existing:**
- `Book`, `BookStatus` → `@/lib/books/types`
- `getAllBooks()`, `getAllTopics()` → `@/lib/books`
- `getReadingStats()`, `getBooksReadByYear()` → `@/lib/books`
- `useReducedMotion()` → `@/hooks/useReducedMotion`
- `cn()` → `@/lib/utils`

**To be created:**
- `useLibraryStore()` → `@/lib/library/store`
- `TOPIC_COLORS` → `@/lib/library/types`
- `ConstellationData`, `BookWithPosition` → `@/lib/library/types`
- `groupBooksIntoConstellations()` → `@/lib/library/constellation`
- `isValidAmazonUrl()` → `@/lib/library/amazon`

---

## Design Decisions

- Books grouped by **primary topic** (first in `topics[]` array) for constellation assignment
- **Single-book topics** become drifters (no nebula for 1 book)
- **Topic filter** matches ANY topic in array (not just primary)
- **Sort only repositions when filtered** — unfiltered keeps seeded positions
- `isFiltered` is DERIVED from filter state, not stored separately
- Topic labels use `drei/Html` (CSS) instead of `drei/Text` (no font files needed)
- Camera controls disabled during scripted transitions
- Cover textures loaded locally at multiple LOD resolutions to avoid CORS issues

---

## Topic Colors (from spec)

```typescript
const TOPIC_COLORS: Record<string, string> = {
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
const DEFAULT_TOPIC_COLOR = '#6B7280'
```

---

## Performance Targets

- 60fps on modern devices (2020+: M1 Mac, iPhone 12, mid-range Android)
- < 150MB GPU texture memory
- Graceful degradation with hysteresis:
  - < 45fps for 2s: reduce particles 50%
  - < 35fps for 2s: disable post-processing
  - < 25fps for 2s: simplify to flat sprites
  - < 20fps for 3s: prompt for classic view

---

## Files That Don't Exist

- There is no `LibraryStore` class — use `useLibraryStore()` hook
- There is no `amazonUrl` in books yet — field exists in type but not populated
- Cover LOD files don't exist yet — Phase 3 task to generate them
- `/public/covers/` directory doesn't exist yet

---

## Notes

(Update as work progresses)

### Phase 0 Notes
- Spec went through 5 Codex review cycles before approval
- Key issues addressed: Amazon URL validation, drifter criteria, filter behavior, search/sort semantics
- Implementation plan went through 2 Codex review cycles
- Key additions: manual navigation controls, local cover LOD generation, book-view 3D visuals

---

## Acceptance Criteria Summary (from spec)

1. [ ] Universe view with labeled topic nebulae + stats constellation
2. [ ] Drifter books floating lazily
3. [ ] Smooth zoom into constellation (600ms)
4. [ ] Book covers with hover tilt + glow
5. [ ] Book detail panel with Amazon link
6. [ ] Navigation: breadcrumb, Escape, backdrop click, back button
7. [ ] Filter regrouping animation (800ms)
8. [ ] Mobile: touch/pinch, bottom sheet detail
9. [ ] 60fps with graceful degradation
10. [ ] Reduced motion support
11. [ ] `/library` shows new experience
