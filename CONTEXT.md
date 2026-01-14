# Project Context — Living Nebula v3

**Last Updated**: Phase 0 - Pre-flight (IN PROGRESS)

## Protocol Reminder

**The Loop**: IMPLEMENT → TYPECHECK → LINT → BUILD → TEST → REVIEW → FIX → SLOP REMOVAL → COMMIT

**Quality gates before review:**
```bash
npm run typecheck && npm run lint && npm run build && npm run test
```

**If context feels stale:** Re-read `AUTONOMOUS_BUILD_CLAUDE.md` for the full protocol.

---

## Build Context

**Type**: Feature Rewrite
**Spec location**: `docs/specs/LIVING_NEBULA_V3_SPEC.md`
**Plan location**: `docs/plans/LIVING_NEBULA_V3_PLAN.md`
**Branch**: `feature/floating-library-v3`

## Project Setup

- Framework: Next.js 16 + TypeScript (strict)
- 3D: React Three Fiber + Drei
- State: Zustand (lib/library/store.ts)
- Styling: Tailwind CSS
- Testing: Vitest + Playwright

## Current Phase

**Phase 1: NebulaCore Shader** — Creating the soft glowing core with fresnel rim.

## What We're Building

Rewriting the Floating Library's nebula effects:
- **Old**: Blender textures + billboard slices (didn't work well)
- **New**: Pure procedural GLSL shaders (NebulaCore + NebulaWisps + NebulaDust)

**Aesthetic**: "Living Nebula" — soft ethereal base, structured wisps, slow organic drift.

**Key Constraint**: 44 nebulae visible in universe view, must hit 60 FPS.

## Component Architecture

```
<LivingNebula>
  ├── <NebulaCore />       — Soft glow (always visible)
  ├── <NebulaWisps />      — Billboard planes with fbm noise (LOD-gated)
  └── <NebulaDust />       — Instanced particles (LOD-gated)
```

## LOD Tiers

| Tier | When | Components |
|------|------|------------|
| 0 | Universe, inactive | Core only |
| 1 | Universe, nearby | Core + 2 wisps |
| 2 | Constellation, active | Core + 5 wisps + particles |
| 3 | Book view | Same as Tier 2 |

## Files to Create

- `components/library/floating/LivingNebula.tsx`
- `components/library/floating/NebulaCore.tsx`
- `components/library/floating/NebulaWisps.tsx`
- `components/library/floating/shaders/nebulaCore.vert`
- `components/library/floating/shaders/nebulaCore.frag`
- `components/library/floating/shaders/nebulaWisp.vert`
- `components/library/floating/shaders/nebulaWisp.frag`

## Files to Delete (Phase 6)

- `components/library/floating/VolumetricNebula.tsx`
- `lib/library/nebulaTextures.ts`
- `lib/library/blenderNebulaTextures.ts`

## Key Store State

From `lib/library/store.ts`:
- `viewLevel`: 'universe' | 'constellation' | 'book'
- `transitionPhase`: 0-1 during zoom transitions
- `qualityLevel`: 'full' | 'reduced' | 'minimal'
- `postprocessingEnabled`: boolean

## Design Decisions

- All noise computed in fragment shader (GPU-side)
- No texture loading — pure procedural
- Breathing animation via uTime uniform (~0.3 Hz)
- Wisp drift via domain warping in noise function
- LOD crossfade duration: ~100ms

## Import Locations

- `Billboard` → `@react-three/drei`
- `useFrame, useThree` → `@react-three/fiber`
- Store hooks → `@/lib/library/store`
- Types → `@/lib/library/types`

---

## Session Notes

- User approved the "Living Nebula" aesthetic direction
- User approved the component architecture and LOD strategy
- User activated autonomous build mode
- Codex/Gemini reviews scheduled per protocol
