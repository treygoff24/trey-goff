# Floating Library v2 — Implementation Plan

> Visual upgrade: volumetric nebulae, postprocessing, enhanced star field

**Spec:** `docs/plans/FLOATING_LIBRARY_V2_SPEC.md`
**Branch:** `feature/floating-library-v2`

---

## Phase 0: Store Foundation

**Goal:** Add all animation/transition state to store before components need them.

### Tasks

0.1. **Add animation flags to store**
- File: `lib/library/store.ts`
- Add: `postprocessingEnabled: boolean` (default true)
- Add: `transitionPhase: number` (0-1, progress of camera transition)
- Add: `isTransitioning: boolean` (camera transition in progress)
- Add: `isUvPanning: boolean` (active nebula UV animation)
- Add: `isParticleDrifting: boolean` (particle drift animation)
- Add: `hasBookLerps: boolean` (book position animations)
- Add derived getter: `get isAnimating(): boolean` (OR of above flags)
- Add setters: `setTransitionPhase`, `setIsTransitioning`, `setIsUvPanning`, `setIsParticleDrifting`, `setHasBookLerps`, `setPostprocessingEnabled`

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```

### Commit
`feat(library): add animation and transition state to store`

---

## Phase 1: Postprocessing Pipeline

**Goal:** Add EffectComposer with bloom, DOF, vignette, noise. Fix tone mapping chain.

### Tasks

1.1. **Create PostProcessingEffects component**
- File: `components/library/floating/PostProcessingEffects.tsx`
- Wrap EffectComposer with Bloom, DepthOfField, Vignette, Noise, ToneMapping
- Accept `viewLevel` prop, apply VIEW_POSTPROCESSING config
- Accept `enabled` prop for graceful degradation

1.2. **Add PostProcessingConfig types**
- File: `lib/library/types.ts`
- Add `PostProcessingConfig` interface
- Add `VIEW_POSTPROCESSING` constant with per-view configs

1.3. **Integrate into FloatingLibrary**
- File: `components/library/floating/FloatingLibrary.tsx`
- Disable renderer tone mapping in `onCreated`: `gl.toneMapping = THREE.NoToneMapping`
- Add PostProcessingEffects inside Canvas, passing viewLevel and postprocessingEnabled
- **Fallback when postprocessing disabled:**
  - Re-enable renderer tone mapping: `gl.toneMapping = THREE.ACESFilmicToneMapping`
  - Clamp HDR emissive values to 1.0 to prevent blowout
- Use useEffect watching `postprocessingEnabled` to toggle

1.4. **HDR materials setup**
- Update NebulaCloud core material: `emissive` with value > 1.0, `toneMapped={false}`
- Update FloatingBook selected state: emissive > 1.0, `toneMapped={false}`
- **Add emissive clamp helper:** When postprocessing disabled, set emissive to max 1.0

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Visual: Bloom visible on nebula cores in dev server
- Visual: DOF blur visible in book view
- Visual: No blowout when postprocessing disabled (toggle via dev console)

### Commit
`feat(library): add postprocessing pipeline with bloom, DOF, vignette`

---

## Phase 2: Nebula Texture Generation

**Goal:** Procedural texture generator for nebula slices. One texture per topic.

### Tasks

2.1. **Create simplex noise utility**
- File: `lib/library/noise.ts`
- Implement 2D simplex noise function (pure JS, no dependencies)
- Export `simplex2D(x, y, seed)` function

2.2. **Create nebula texture generator**
- File: `lib/library/nebulaTextures.ts`
- `generateNebulaTexture(topicColor: string, seed: number): THREE.Texture`
- **Platform compatibility:** Use OffscreenCanvas if available, fallback to HTMLCanvasElement
- Feature detection: `typeof OffscreenCanvas !== 'undefined'`
- 512x512, grayscale noise with radial falloff
- Cache textures by topic (Map<string, THREE.Texture>)
- Export `getNebulaTexture(topic: string): THREE.Texture`

2.3. **Integrate texture loading**
- Update lib/library/types.ts with topic-to-seed mapping (hash topic name)
- Pre-generate textures on first constellation render

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Log texture generation in dev console
- Test on iOS Safari to verify fallback works

### Commit
`feat(library): add procedural nebula texture generator`

---

## Phase 3: Volumetric Nebula Component

**Goal:** Replace NebulaCloud spheres with slice-volume approach.

### Tasks

3.1. **Create VolumetricNebula component**
- File: `components/library/floating/VolumetricNebula.tsx`
- Props: `color`, `radius`, `position`, `sliceCount`, `isActive`, `opacity`, `reducedMotion`, `transitionPhase`, `viewLevel`
- Render N camera-facing planes (billboards) distributed in ellipsoid
- Each plane: shared topic texture, randomized UV offset/scale, additive blending
- **HDR for bloom:** Slice materials use `emissive` > 1.0 with `toneMapped={false}` (required for bloom to catch nebula cores)
- Use seeded random for deterministic slice positions

3.2. **Implement LOD by view**
- Accept `viewLevel` and compute sliceCount internally
- Universe: 8 slices, Constellation (inactive): 12, Constellation (active): 48, Book: 24

3.3. **Add UV animation for active nebula**
- Only animate when: `isActive && viewLevel === 'constellation' && !reducedMotion`
- Book view is static per spec (no UV pan even when constellation is active)
- Call `setIsUvPanning(true)` when starting, `setIsUvPanning(false)` when stopping

3.4. **Shape language: ellipsoid bounds**
- Per-topic axis ratios (hash topic name → ratios 0.8-1.2)
- Slice positions distributed within ellipsoid, not sphere

3.5. **Update Constellation to use VolumetricNebula**
- File: `components/library/floating/Constellation.tsx`
- Replace `<NebulaCloud>` with `<VolumetricNebula>`
- Pass isActive based on `activeConstellation === topic`
- Pass transitionPhase from store

3.6. **Add LOD crossfade**
- Track previous sliceCount, opacity-fade old slices out / new slices in over 300ms

3.7. **Transition brightening**
- When transitioning to this nebula: increase emissive by 50% based on transitionPhase

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Visual: Nebulae have parallax when camera moves
- Visual: Active nebula has UV animation
- Visual: No popping on LOD transitions
- Visual: Target nebula brightens during approach

### Commit
`feat(library): add volumetric slice-based nebula with LOD`

---

## Phase 4: Particle Dust Layer

**Goal:** GPU particles for "wisps" inside nebulae.

### Tasks

4.1. **Create NebulaDust component**
- File: `components/library/floating/NebulaDust.tsx`
- Props: `topicColor`, `radius`, `position`, `particleCount`, `isActive`, `reducedMotion`
- Use THREE.Points with custom PointsMaterial
- **Shared sprite texture:** 64x64 gaussian blob, generated once
- **Per-particle attributes:** position (vec3), size (float), opacity (float), phase (float)
- **Color variation:** hue shift ±10deg from topic color
- Particles distributed in ellipsoid with density falloff from center

4.2. **Soft particle shader (optional)**
- If DOF is enabled, depth texture is available
- Add alpha fade based on depth difference (soft particles)
- Fallback: simple alpha falloff without depth read

4.3. **Particle drift animation**
- When `isActive && !reducedMotion`: drift particles via 3D noise in useFrame
- Call `setIsParticleDrifting(true/false)` when starting/stopping

4.4. **LOD particle counts**
- Universe: 200 particles
- Constellation (active): 1000 particles
- Constellation (inactive): 400 particles
- Book view: 600 particles with subtle drift

4.5. **Integrate into Constellation**
- Add `<NebulaDust>` as child of Constellation group
- Pass particleCount based on viewLevel and isActive

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Visual: Particles visible in constellation view
- Visual: Particles drift when nebula is active
- Visual: Color varies slightly across particles

### Commit
`feat(library): add GPU particle dust layer to nebulae`

---

## Phase 5: Star Field Upgrade

**Goal:** Multi-layer parallax star field with warp stretch.

### Tasks

5.1. **Refactor StarField for multiple layers**
- File: `components/library/floating/StarField.tsx`
- Create 3 instancedMesh layers with explicit specs:
  - **Far:** 2000 stars, size 0.2-0.5, depth 800-1000, parallax 0.1x
  - **Mid:** 1000 stars, size 0.4-0.8, depth 400-600, parallax 0.3x
  - **Near:** 300 stars, size 0.6-1.2, depth 200-300, parallax 0.6x

5.2. **Implement parallax**
- Track camera position delta between frames
- Offset each layer by `delta * parallaxFactor`
- Wrap star positions to prevent drift out of view

5.3. **Add warp stretch uniform**
- Accept `transitionPhase` from store
- In vertex shader: scale Z by `1.0 + (transitionPhase * 0.5)` during universe→constellation
- Ramp up 0-0.3s (phase 0-0.5), settle 0.4-0.6s (phase 0.67-1.0)

5.4. **Color variation**
- 90% white (#FFFFFF)
- 5% warm (#FFE4B5)
- 5% cool (#B0E0E6)
- Bright stars (1 in 50): size 1.5x, full opacity

5.5. **Optional twinkle (nice-to-have)**
- Only for 1 in 200 stars, 0.5% opacity amplitude
- Disabled when reducedMotion

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Visual: 3 layers visible, parallax on camera pan
- Visual: Stars stretch during zoom transition

### Commit
`feat(library): multi-layer parallax star field with warp effect`

---

## Phase 6: Transitions & Animation Driver

**Goal:** Warp transitions, animation invalidation system, scene dimming.

### Tasks

6.1. **Create AnimationDriver component**
- File: `components/library/floating/AnimationDriver.tsx`
- Reads derived `isAnimating` from store
- Calls `invalidate()` in useFrame when true
- Always mounted inside Canvas (sibling to Universe)

6.2. **Integrate AnimationDriver**
- Add to FloatingLibrary.tsx inside Canvas

6.3. **Update CameraController for transitionPhase**
- Track transition progress 0-1 during camera animations
- Call `setTransitionPhase(phase)` in useFrame
- Call `setIsTransitioning(true/false)` at start/end

6.4. **Universe → Constellation transition (600ms)**
- 0-200ms: Stars stretch (handled by StarField via transitionPhase)
- 0-400ms: Target nebula brightens (handled by VolumetricNebula)
- 0-600ms: Other nebulae fade to 30% opacity

6.5. **Constellation → Book transition (400ms)**
- 0-200ms: Scene dims to **40%** except selected book region
- 0-400ms: Selected book emissive ramps to HDR (triggers bloom spike)
- 200-400ms: Soft "lock-in" ease (camera easing already handles this)

6.6. **Scene dimming implementation**
- Pass `selectedBook` to Universe/Constellation components
- When book selected: non-active nebulae opacity → 40%, non-selected books opacity → 40%

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Visual: Star stretch visible during zoom
- Visual: Target nebula brightens during approach
- Visual: Scene dims to 40% in book view
- GPU: Scene static when idle (check dev tools)

### Commit
`feat(library): add animation driver and warp transitions`

---

## Phase 7: Performance & Polish

**Goal:** LOD tuning, FPS measurement, mobile optimization, quality toggle, edge cases.

### Tasks

7.1. **Update FPS measurement**
- File: `lib/library/performance.ts`
- Gate sampling: only when `isAnimating` true
- Outlier rejection: ignore deltas > 100ms
- Recovery sampling: continue 3s after animations stop

7.2. **Implement LOD triggers**
- < 45fps for 2s: reduce particle count 50%
- < 35fps for 2s: disable postprocessing (set `postprocessingEnabled = false`)
- < 25fps for 2s: swap VolumetricNebula → NebulaCloud fallback
- < 20fps for 3s: prompt classic view

7.3. **Add hysteresis for recovery**
- > 55fps for 3s: restore particle count
- > 50fps for 3s: re-enable postprocessing

7.4. **Add quality toggle to HUD**
- File: `components/library/floating/LibraryHUD.tsx`
- Add "Quality" dropdown: Full / Reduced / Classic
- Persist in localStorage via store

7.5. **Mobile optimizations**
- Detect via `navigator.maxTouchPoints > 0`
- Max 24 slices, max 500 particles
- Disable DOF, lighter bloom (0.2)

7.6. **Filter/search edge case**
- When filter or search active:
  - Hide nebulae (opacity → 0)
  - Hide particles (don't render NebulaDust)
  - Disable DOF (set dof config to null)
  - Keep postprocessing active (bloom, vignette, noise)
  - Only show filtered books in central cluster

7.7. **Reduced motion final pass**
- Verify all animations check `reducedMotion`
- UV pan, particle drift, warp stretch, star twinkle all disabled

7.8. **Accessibility: flashing limits**
- Verify bloom spikes < 0.2s duration
- Verify < 3 flashes per second
- Bloom spike on book select: 0.15s, single flash ✓

7.9. **Manual testing checklist**
- [ ] M1 Mac Chrome: 60fps in universe view
- [ ] M1 Mac Chrome: 60fps in constellation view
- [ ] iPhone 14 Safari: 45fps minimum
- [ ] Reduced motion: no continuous animations
- [ ] Filter active: nebulae hidden, DOF disabled, books clustered

### Verification
```bash
pnpm typecheck && pnpm lint && pnpm build
```
- Console: FPS logging shows expected values
- Visual: Quality toggle works
- Visual: Filter hides nebulae correctly

### Commit
`feat(library): add performance LOD system and quality toggle`

---

## Deferred (Nice-to-Have)

These features are in the spec but explicitly deferred to avoid scope creep:

- **Nebula hover reactions** (brightness increase, particle speed up on hover)
- **Star twinkle** (very subtle, only on bright stars)

Can be added in a follow-up PR if time permits.

---

## Final Verification

After all phases:

```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm dev
```

### Acceptance Criteria Checklist

1. [ ] Bloom visible on nebula cores and selected books
2. [ ] DOF blur visible in book view (background blurred vs selected book)
3. [ ] Nebulae have parallax when camera moves
4. [ ] At least 3 topics have elliptical shapes
5. [ ] > 100 particles visible per nebula in constellation view
6. [ ] Star parallax: 3 layers with differential motion
7. [ ] Transition feedback visible (star stretch or nebula brighten)
8. [ ] Performance < 20ms frame time (rolling 60-frame avg) on M1 Mac
9. [ ] Reduced motion disables all continuous animations
10. [ ] LOD crossfade: no popping on slice count changes

### Codex Final Cross-Check

```bash
codex exec \
  --model gpt-5.2-codex \
  --config model_reasoning_effort="xhigh" \
  --yolo \
  "Final cross-check. Read docs/plans/FLOATING_LIBRARY_V2_SPEC.md and IMPLEMENTATION_PLAN_V2.md. Verify: all acceptance criteria met, all phases complete, no obvious gaps. Output: Verification results / Any gaps / Final verdict (ship it or fix issues)."
```

---

## Summary

| Phase | Focus | Est. Files Changed |
|-------|-------|-------------------|
| 0 | Store Foundation | 1 modified |
| 1 | Postprocessing | 3 new, 3 modified |
| 2 | Nebula Textures | 2 new, 1 modified |
| 3 | Volumetric Nebula | 1 new, 2 modified |
| 4 | Particle Dust | 1 new, 1 modified |
| 5 | Star Field | 1 modified |
| 6 | Transitions | 1 new, 3 modified |
| 7 | Performance | 2 modified |

**Total:** ~8 new files, ~12 modified files
