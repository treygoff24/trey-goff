# Interactive World - Build Context

**Last Updated**: Phase 4 - Loading UX + Character Controller (STARTING)

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

Phase 4 - Loading UX + Character Controller: Implementing loading sequence and player movement.

---

## Implementation Progress

- [x] Phase 0: Route Isolation + Entry Flow
- [x] Phase 1: R3F Infrastructure
- [x] Phase 2: Asset Pipeline + CI Gates
- [x] Phase 3: State Management + Telemetry
- [ ] Phase 4: Loading UX + Character Controller
- [ ] Phase 5: Camera + Interaction System
- [ ] Phase 6: Chunk Streaming State Machine
- [ ] Phase 7: Exterior + Main Hall
- [ ] Phase 8: Content Manifests
- [ ] Phase 9: Library Room
- [ ] Phase 10: Gym Room
- [ ] Phase 11: Projects Room
- [ ] Phase 12: Post-Processing + Polish
- [ ] Phase 13: Mobile Optimization
- [ ] Phase 14: Settings + Accessibility
- [ ] Phase 15: QA + Launch Verification
- [ ] Phase 16: Codex Final Cross-Check + Launch

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
