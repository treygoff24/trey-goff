# Interactive World - Build Context

**Last Updated**: Phase 16 - COMPLETE

## Protocol Reminder (Re-read on every phase start)

**The Loop**: IMPLEMENT → TYPECHECK → LINT → BUILD → TEST → REVIEW → FIX → REPEAT → COMMIT

**Cross-agent checkpoints (mandatory):**
- After drafting implementation plan → Codex reviews
- After completing each phase → Dual code review (subagent + Codex)
- Before declaring complete → Codex final cross-check
- Stuck in error loop (3+ attempts) → Call Codex for perspective

**How to call Codex:**
```bash
codex exec \
  --model gpt-5.2-codex \
  --config model_reasoning_effort="xhigh" \
  --yolo \
  "<YOUR_TASK_PROMPT>"
```

**Quality gates before review:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

If context feels stale, re-read `AUTONOMOUS_BUILD_CLAUDE_v2.md` and this file.

---

## What This Is

Interactive 3D "secret level" at `/interactive` - a mansion with rooms mapping to site content:
- **Library**: Blog posts and book reviews as physical books
- **Gym**: Powerlifting PRs as plates on a bar + plaques
- **Study**: Holographic 3D knowledge graph
- **Projects Room**: Museum-like exhibits for projects
- **Exterior**: Mountains, O'Neill cylinders, Goff Industries mech

---

## Build Context

**Type**: Feature addition
**Spec location**: `/treygoff-interactive-world-spec-v1.2.md`
**Plan location**: `/IMPLEMENTATION_PLAN.md`

---

## Tech Stack

**Existing:**
- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS v4 with CSS-first tokens
- Content: Content Collections + MDX
- UI: shadcn/ui (Radix-based) + cmdk

**New for Interactive:**
- Rendering: React Three Fiber (R3F v9) + Three.js
- Physics: @react-three/rapier (collision only)
- Character: ecctrl (pmndrs capsule controller)
- Post-processing: @react-three/postprocessing
- State: Zustand (interactive-specific store)
- Knowledge Graph: r3f-forcegraph
- Pathfinding: recast-navigation-js or three-pathfinding (decide in Phase 1)

---

## Current Phase

**BUILD COMPLETE** - All phases implemented and passing quality gates.

---

## Implementation Progress

- [x] Phase 0: Route Isolation + Entry Flow
- [x] Phase 1: R3F Infrastructure
- [x] Phase 2: Asset Pipeline + CI Gates
- [x] Phase 3: State Management + Telemetry
- [x] Phase 4: Loading UX + Character Controller
- [x] Phase 5: Camera + Interaction System
- [x] Phase 6: Chunk Streaming State Machine
- [x] Phase 7: Exterior + Main Hall
- [x] Phase 8: Content Manifests
- [x] Phase 9: Library Room
- [x] Phase 10: Gym Room
- [x] Phase 11: Projects Room
- [x] Phase 12: Post-Processing + Polish
- [x] Phase 13: Mobile Optimization (already done in earlier phases)
- [x] Phase 14: Settings + Accessibility
- [x] Phase 15: QA + Launch Verification
- [x] Phase 16: Final Review

---

## Key Files

### Existing (to integrate with)
- `/app/layout.tsx` - Root layout with providers
- `/app/globals.css` - Tailwind v4 config and design tokens
- `/lib/fonts.ts` - Font configuration
- `/lib/utils.ts` - Shared utilities
- `/components/ui/StarfieldBackground.tsx` - Existing R3F patterns
- `/content-collections.ts` - Content Collections configuration

### New (to create)
- `/app/interactive/page.tsx` - Client-only entry point
- `/app/interactive/layout.tsx` - Minimal layout
- `/components/interactive/` - All 3D components
- `/lib/interactive/store.ts` - Zustand store
- `/lib/interactive/types.ts` - TypeScript types
- `/public/manifests/` - Runtime content manifests
- `/public/assets/chunks/` - GLB chunk files
- `/scripts/generate-interactive-manifests.ts` - Manifest generator

---

## Design Tokens (from globals.css)

- Background: #070A0F (bg-0), #0B1020 (bg-1)
- Surface: rgba(255,255,255,0.06), rgba(255,255,255,0.10)
- Text: rgba(255,255,255,0.92/0.72/0.52)
- Warm accent: #FFB86B
- Electric accent: #7C5CFF
- Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

---

## Performance Targets

- FCF (First Controllable Frame): <5s on 50Mbps
- Desktop (M1 MacBook Air): 60fps at Medium tier
- Mobile (iPhone 12): 30fps at Low tier
- Memory: <500MB peak with 2 chunks loaded
- Normal site: Zero Three.js bytes in bundles

---

## Quality Tiers

| Setting | Low | Medium | High |
|---------|-----|--------|------|
| DPR | 1.0 | 1.5 | min(2.0, native) |
| Shadows | None | 1024px | 2048px |
| Post-FX | Minimal | Standard | Full |
| LOD Bias | Aggressive | Normal | Quality |

---

## Chunk State Machine

```
unloaded → preloading → loaded → active → dormant → disposed
    ↑                                         │
    └─────────────────────────────────────────┘
```

- Door proximity (15m) → preload target room
- Room entry → activate chunk, mark previous dormant
- Memory pressure → dispose oldest dormant (keep max 2)

---

## Hook Signatures

<!-- Add every custom hook with exact return type as created -->

### useInteractiveStore()
```typescript
Returns: {
  // Chunk state
  chunkStates: Map<ChunkId, ChunkState>;
  activeChunk: ChunkId | null;

  // Quality
  qualityTier: 'low' | 'medium' | 'high' | 'auto';
  setQualityTier: (tier: QualityTier) => void;

  // Settings
  settings: InteractiveSettings;
  updateSettings: (partial: Partial<InteractiveSettings>) => void;

  // Navigation
  currentRoom: RoomId | null;
  spawnPosition: Vector3 | null;
  setCurrentRoom: (room: RoomId, spawn?: Vector3) => void;
}
```

---

## Import Locations

<!-- Track non-obvious imports to prevent errors -->

- `cn` → `@/lib/utils`
- `useReducedMotion` → `@/hooks/useReducedMotion`
- StarfieldBackground patterns → `@/components/ui/StarfieldBackground`
- Content data → `content-collections`

---

## Design Decisions

- **Route isolation:** `/interactive` is fully client-only, no SSR
- **No prefetch:** Normal site links use `prefetch={false}`
- **Chunk streaming:** Rooms loaded on-demand, max 2 dormant kept
- **Mobile-first input:** Tap-to-move default, joystick optional
- **Third-person default:** More cinematic, first-person in settings
- **Pre-computed graph:** Layout calculated at build time for instant render

---

## Notes

<!-- Update with important discoveries, decisions, and context as work progresses -->

- Existing StarfieldBackground.tsx at 756 lines shows R3F patterns
- Three.js and R3F already installed (three@0.182, @react-three/fiber@9.4.2)
- Dynamic import pattern established for code splitting
- useReducedMotion hook exists for accessibility
- @react-three/drei and three-stdlib added for GLTF/KTX2 loading

### Phase 1 Notes
- Created quality.ts with tier presets and auto-tuning system
- Created loaders.ts with GLTFLoader + KTX2 + Meshopt configuration
- Created RendererRoot.tsx with R3F Canvas, shader warmup, context loss handling
- Updated InteractiveWorld.tsx with actual R3F scene (placeholder content)
- Renderer config must be in onCreated callback (not useEffect) to satisfy strict ESLint rules
- Auto-tune state initialized in useEffect to avoid purity violations

### Phase 2 Notes
- Asset compression pipeline with KTX2 + Meshopt
- Budget validation enforces per-chunk and scene-wide limits
- Bundle isolation check confirms Three.js only loads for /interactive
- Empty manifest creation when no source assets (for CI)

### Phase 3 Notes
- Zustand store with chunk states, player position, settings
- State persistence to localStorage with URL room param support
- Telemetry for load milestones, engagement events, performance sampling
- Error classes with recovery strategies
- Memory monitoring and tab suspension detection

### Phase 4 Notes
- **Pathfinding decision:** Using `three-pathfinding` over `recast-navigation-js`
  - Simpler integration, no WASM dependency
  - Better Safari stability (no WebAssembly edge cases)
  - Lighter weight for mobile bundle
  - Sufficient for mansion-scale navigation mesh
- LoadingSequence.tsx created with progress bar, phase messages, hints
- Using ecctrl for character controller (capsule-based physics)
- @react-three/rapier for collision detection

### Phase 5 Notes
- **CameraController.tsx:** Third-person and first-person modes with collision detection
  - Tuple-based position input for stable React dependencies
  - Lerp-based smooth following with reduced motion support
  - Camera collision to prevent clipping through geometry
- **InteractionSystem.tsx:** Hover highlights and E key/tap interaction
  - Own raycaster ref to avoid mutating R3F's shared raycaster
  - useKeyboardControls for E key with edge detection
  - Touch handler for mobile tap-to-interact
- **ContentOverlay.tsx:** DOM-based modal for content display
  - Focus trap with Escape key handling
  - aria-labelledby for screen reader accessibility
  - Next.js Image with unoptimized for external URLs
- **Integration:** CameraIntegration reads player position from store
  - Demo interactable cube wired to ContentOverlay
  - Callback ref pattern for proper effect triggering

### Phase 5 Revision Notes (Codex Review Fixes)
- PlayerController no longer controls camera (CameraController handles it)
- Position/rotation updated every frame (not throttled) for smooth camera
- Camera collision skips ground/grid by name, player by parent name
- Multi-material transparent check for camera collision
- Touch/mouse coords use canvas rect, not window dimensions
- Player group named 'player' for collision filtering

### Phase 6 Notes
- **ChunkManager.tsx:** State machine for room loading/unloading
  - States: unloaded → preloading → loaded → active → dormant → disposed
  - Effect watches preloading state and triggers loadChunk
  - Abort in-flight loads on dispose (before checking chunk existence)
  - Check abort signal after load to dispose orphaned assets
  - Memory pressure monitoring in debug mode
- **DoorTrigger.tsx:** Proximity-based preloading
  - 15m preload distance, 3m activation distance (configurable)
  - Reusable Vector3 ref to avoid per-frame allocation
  - Hysteresis on preload reset (1.2x distance)
- **TransitionOverlay.tsx:** Fade to black for room transitions
  - Timeline: fading-out → black → fading-in → idle
  - onSwap callback for chunk swap during black frame
  - Reduced motion support (instant transitions)
- **Store fixes:** Fresh state for dormant eviction (fixes max 2 limit)
- **PlayerController:** disableInput prop for transitions
- **Codex review issues fixed:**
  - Preloading state didn't trigger actual loads
  - Dispose didn't abort in-flight loads
  - handleFadeOutComplete was no-op
  - Dormant eviction used stale snapshot
  - Vector allocation in useFrame

### Phase 7 Notes
- **ExteriorRoom.tsx:** Placeholder outdoor area
  - Mansion facade with windows and door frame
  - Sky dome with O'Neill cylinder sprites
  - Mountain backdrop, ground plane with grid
  - Goff Industries mech with idle animation
  - DoorTrigger to Main Hall
- **MainHallRoom.tsx:** Central hub connecting all rooms
  - 20x25x8 units with pillars at corners
  - Central pedestal with rotating holographic mansion
  - Door frames with labels for Exterior/Library/Gym/Projects
  - DoorTriggers for all connected rooms
- **rooms/index.tsx:** Room registry and rendering
  - Lazy-loaded components for code splitting
  - RoomConfig with spawn position/rotation, display name
  - PlaceholderRoom with return doors to Main Hall
  - RoomRenderer with Suspense boundary
- **PlayerController fixes:**
  - Single source of truth for yaw (passed to hooks as ref)
  - Per-frame allocation eliminated (only allocate on change)
  - Mobile getTarget returns ref directly (no clone)
- **Type safety:** Changed onDoorActivate to use RoomId instead of string
- **Store additions:** spawnPosition, spawnRotation setters

### Phase 8 Notes
- **Source Alignment:**
  - Spec `/content/blog/` → Actual `/content/essays/` (MDX via Content Collections)
  - Spec `/content/books/` → Actual `/content/library/books.json`
  - Spec `/content/projects/` → Actual `/content/projects/` (MDX via Content Collections)
  - Created `/data/lifts.json` for powerlifting PR data
- **lib/interactive/manifest-types.ts:** TypeScript types for 4 manifests
  - EssaysManifest: id, slug, title, excerpt, tags, publishedAt, readingTime, status
  - BooksManifest: id, title, author, rating, tier, blurb, topics, year, coverImage
  - ProjectsManifest: id, title, summary, links, images, tags, status, type, featuredRank
  - LiftsManifest: total + individual lift PRs with history
- **scripts/generate-interactive-manifests.ts:** Build-time generator
  - Reads from Content Collections and JSON sources
  - Graceful degradation for missing/malformed files
  - Type-safe sorting with explicit Record types
  - Outputs to `/public/manifests/`
- **Build integration:** Added to prebuild between search index and asset compression
- **Key decisions:**
  - BookTier derived from status + rating (favorites/recommended/read/reading/want)
  - Essays named "essays" not "blog" to match actual content directory
  - Cover images reference `/covers/{id}.jpg` (resolved by resolve-book-covers.ts)
