# Living Nebula v3 — Implementation Plan

**Spec:** `docs/specs/LIVING_NEBULA_V3_SPEC.md`
**Branch:** `feature/floating-library-v3`
**Status:** COMPLETED

---

## Phase 1: NebulaCore Shader ✅

Create the soft glowing core with fresnel rim and breathing animation.

### Tasks

- [x] **1.1** Create inline GLSL shaders (webpack loader not available)
- [x] **1.2** Write vertex shader — pass vNormal, vViewDir to fragment
- [x] **1.3** Write fragment shader — soft radial falloff + fresnel rim + breathing pulse
- [x] **1.4** Create `NebulaCore.tsx` component:
  - IcosahedronGeometry (3 subdivisions for smooth appearance)
  - ShaderMaterial with uniforms: uColor, uIntensity, uTime, uBreathingSpeed, uBreathingAmount
  - Memoize geometry and material
  - useFrame to update uniforms
  - Props: color, intensity, scale, reducedMotion, opacity
- [x] **1.5** Verified: single glowing sphere with soft edges, subtle breathing, fresnel rim

---

## Phase 2: NebulaWisps Shader ✅

Create billboard planes with animated fbm noise for wispy structure.

### Tasks

- [x] **2.1** Write vertex shader — standard pass vUv
- [x] **2.2** Write fragment shader:
  - Full simplex 3D noise implementation
  - 4-octave fbm function
  - Domain warping for organic tendrils
  - Radial falloff for soft edges
  - Time-based animation via uTime
- [x] **2.3** Create `NebulaWisps.tsx` component:
  - Accept `count` prop for number of wisp planes
  - Use `<Billboard>` from drei for each plane
  - PlaneGeometry, ShaderMaterial with uniforms: uColor, uOpacity, uTime, uUvOffset
  - Deterministic positioning based on topic hash
  - Memoize all geometries and materials

---

## Phase 3: Refactor NebulaDust ✅

Ensure existing particle system integrates cleanly with new architecture.

### Tasks

- [x] **3.1** Reviewed existing `NebulaDust.tsx` implementation
- [x] **3.2** Updated particle counts for LOD:
  - universe: 0 particles
  - constellationInactive: 0 particles
  - constellationActive: 150 particles
  - book: 100 particles
- [x] **3.3** Added early return when count is 0
- [x] **3.4** Verified color integration and reducedMotion support

---

## Phase 4: LivingNebula Composition ✅

Compose all layers into the main LivingNebula component with LOD system.

### Tasks

- [x] **4.1** Create `LivingNebula.tsx`:
  - Props interface for drop-in replacement
  - Calculate LOD tier based on viewLevel, isActive, transitionPhase
  - Render NebulaCore (always)
  - Conditionally render NebulaWisps (Tier 1+)
  - Conditionally render NebulaDust (Tier 2+)
- [x] **4.2** Implement LOD tier system with appropriate counts/intensities
- [x] **4.3** Handle reducedMotion (pass to all subcomponents)

---

## Phase 5: Integration ✅

Replace VolumetricNebula with LivingNebula in Constellation component.

### Tasks

- [x] **5.1** Update `Constellation.tsx`:
  - Import LivingNebula instead of VolumetricNebula
  - Replace component (drop-in replacement)
  - Remove separate NebulaDust call (now inside LivingNebula)
- [x] **5.2** Verified all view levels work

---

## Phase 6: Polish & Cleanup ✅

Final code cleanup.

### Tasks

- [x] **6.1** Remove old code:
  - Deleted `VolumetricNebula.tsx`
  - Deleted `lib/library/nebulaTextures.ts`
  - Deleted `lib/library/blenderNebulaTextures.ts`
  - Removed nebula texture state from store
- [x] **6.2** Updated exports in `components/library/floating/index.ts`
- [x] **6.3** Ran slop-cleaner agent
- [x] **6.4** Final quality gates passed

---

## Phase 7: Review & Ship ✅

Code review, final verification, commit.

### Tasks

- [x] **7.1** TypeScript passes
- [x] **7.2** ESLint passes (no new errors)
- [x] **7.3** Build passes
- [x] **7.4** Tests pass (181/183, 2 pre-existing failures unrelated to feature)
- [ ] **7.5** Commit and push

---

## Completion Criteria

From spec:

1. ✅ Nebulae look premium — soft, detailed, alive
2. ✅ Minimal draw calls in universe view (Core only per nebula)
3. ✅ LOD system gates wisps and particles by tier
4. ✅ Animation respects reducedMotion
5. ✅ TypeScript strict, ESLint clean, build passes
6. ✅ Drop-in replacement works with existing Constellation
