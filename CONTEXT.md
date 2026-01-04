# Floating Library v2 - Build Context

**Last Updated**: Phase 0 - Store Foundation (IN PROGRESS)

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

**Quality gates before review:**
```bash
pnpm typecheck && pnpm lint && pnpm build
```

---

## What This Is

Visual upgrade for the Floating Library:
- **Postprocessing pipeline** — Bloom, DOF, vignette, film grain
- **Volumetric nebulae** — Slice-volume approach (stacked sprites with parallax)
- **Particle dust** — GPU particles for wisps inside nebulae
- **Star field upgrade** — Multi-layer parallax with warp stretch
- **Transitions** — Warp effects, nebula brightening, scene dimming

---

## Build Context

**Type**: Feature enhancement
**Spec location**: `docs/plans/FLOATING_LIBRARY_V2_SPEC.md`
**Plan location**: `IMPLEMENTATION_PLAN_V2.md`
**Feature branch**: `feature/floating-library-v2`

---

## Tech Stack

**Existing (reuse):**
- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS v4 with CSS-first tokens
- State: Zustand patterns from `/lib/library/store.ts`
- 3D: React Three Fiber + drei + postprocessing (already installed)
- Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

**New for v2:**
- `/lib/library/noise.ts` - Simplex noise utility
- `/lib/library/nebulaTextures.ts` - Procedural texture generator
- `/components/library/floating/PostProcessingEffects.tsx` - EffectComposer wrapper
- `/components/library/floating/VolumetricNebula.tsx` - Slice-volume nebula
- `/components/library/floating/NebulaDust.tsx` - GPU particles
- `/components/library/floating/AnimationDriver.tsx` - Invalidation controller

---

## Current Phase

**Phase 0: Store Foundation**

Tasks:
1. [x] Add animation flags to store
2. [ ] Add transitionPhase
3. [ ] Add postprocessingEnabled
4. [ ] Add derived isAnimating getter
5. [ ] Add setters for all new state

---

## Implementation Progress

- [x] Spec (approved by Codex)
- [x] Implementation Plan (approved by Codex)
- [ ] Phase 0: Store Foundation
- [ ] Phase 1: Postprocessing Pipeline
- [ ] Phase 2: Nebula Textures
- [ ] Phase 3: Volumetric Nebula
- [ ] Phase 4: Particle Dust
- [ ] Phase 5: Star Field Upgrade
- [ ] Phase 6: Transitions & Animation Driver
- [ ] Phase 7: Performance & Polish

---

## Store Additions (Phase 0)

```typescript
// Animation flags
postprocessingEnabled: boolean        // Default true
transitionPhase: number               // 0-1, camera transition progress
isTransitioning: boolean              // Camera transition in progress
isUvPanning: boolean                  // Active nebula UV animation
isParticleDrifting: boolean           // Particle drift animation
hasBookLerps: boolean                 // Book position animations

// Derived getter
get isAnimating(): boolean {
  return this.isTransitioning || this.isUvPanning || this.isParticleDrifting || this.hasBookLerps
}

// Setters
setTransitionPhase: (phase: number) => void
setIsTransitioning: (v: boolean) => void
setIsUvPanning: (v: boolean) => void
setIsParticleDrifting: (v: boolean) => void
setHasBookLerps: (v: boolean) => void
setPostprocessingEnabled: (v: boolean) => void
```

---

## Import Locations

**Existing:**
- `Book`, `BookStatus` → `@/lib/books/types`
- `getAllBooks()`, `getAllTopics()` → `@/lib/books`
- `useLibraryStore` → `@/lib/library/store`
- `TOPIC_COLORS` → `@/lib/library/types`
- `useReducedMotion()` → `@/hooks/useReducedMotion`
- `cn()` → `@/lib/utils`

**To be created:**
- `PostProcessingEffects` → `@/components/library/floating/PostProcessingEffects`
- `VolumetricNebula` → `@/components/library/floating/VolumetricNebula`
- `NebulaDust` → `@/components/library/floating/NebulaDust`
- `AnimationDriver` → `@/components/library/floating/AnimationDriver`
- `simplex2D()` → `@/lib/library/noise`
- `getNebulaTexture()` → `@/lib/library/nebulaTextures`

---

## Design Decisions

- **Shared textures:** One 512×512 texture per topic (12 total), not per slice
- **OffscreenCanvas fallback:** Use HTMLCanvasElement on iOS Safari < 16.4
- **UV animation gating:** Only animate when `viewLevel === 'constellation'` AND `isActive`
- **HDR for bloom:** Nebula slices and selected books use `emissive > 1.0` with `toneMapped={false}`
- **Postprocessing fallback:** When disabled, re-enable renderer tone mapping + clamp emissive to 1.0
- **Animation invalidation:** Root-level AnimationDriver component calls `invalidate()` when `isAnimating`
- **LOD crossfade:** 300ms opacity fade to prevent popping

---

## Performance Targets

- 60fps (16.7ms frame time) on M1 Mac, iPhone 14, Pixel 7
- 45fps acceptable on 2020 devices
- Graceful degradation with hysteresis
- `frameloop="demand"` maintained

---

## Notes

(Update as work progresses)

### Phase 0 Notes
- Starting implementation of store additions
