# Floating Library v2 — Visual Upgrade Spec

> Transform the floating library nebulae from "colored soap bubbles" into volumetric space clouds with cinematic postprocessing.

---

## Problem Statement

The current floating library (v1) works functionally but the nebulae look basic:
- Nebulae are just two concentric transparent spheres — they read as "UI bubbles," not space clouds
- No postprocessing effects (bloom, DOF, etc.) — scene feels flat
- No visual feedback for transitions — camera just moves
- Star field is static points — no parallax or depth

**Goal:** Make the nebulae and scene **visually stunning** while maintaining performance. Treat universe view as a LOD overview with cheap impostors, constellation view as a hero shot where we spend the rendering budget on the active nebula.

---

## Scope

### In Scope
1. **Postprocessing pipeline** — Bloom, DOF, vignette, film grain
2. **Volumetric nebulae** — Slice-volume approach (stacked sprites with parallax)
3. **Nebula LOD** — Cheap in universe view, expensive in constellation view
4. **Star field upgrade** — Multi-layer parallax, varied sizes
5. **Interaction polish** — Warp transitions, nebula hover reactions
6. **Shape language** — Irregular nebula silhouettes (not perfect spheres)

### Explicitly Out of Scope
- **Book LOD/3D meshes** — Current flat tiles with covers work fine for v2; defer to v3
- **Raymarched volumetrics** — Too expensive for 12+ nebulae
- **Cross-topic bridges / gravitational arcs** — Nice to have, not MVP
- **God rays** — High complexity, diminishing returns
- **Texture compression (KTX2)** — Premature optimization
- **Color grading / LUT** — Nice to have, defer to polish pass

---

## Technical Approach

### 1. Postprocessing Pipeline

Use `@react-three/postprocessing` (already installed):

```tsx
<EffectComposer>
  <Bloom
    luminanceThreshold={0.9}
    luminanceSmoothing={0.3}
    intensity={0.4}
    mipmapBlur
  />
  <DepthOfField
    focusDistance={0}  // Dynamic based on view
    focalLength={0.02}
    bokehScale={2}
  />
  <Vignette offset={0.3} darkness={0.4} />
  <Noise opacity={0.02} />
</EffectComposer>
```

**Tone Mapping Strategy:**
- **Default:** Disable renderer tone mapping (`gl.toneMapping = THREE.NoToneMapping`), use postprocessing `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />` as final effect
- **Fallback when postprocessing disabled:** Re-enable renderer tone mapping (`gl.toneMapping = THREE.ACESFilmicToneMapping`) AND clamp HDR material emissive values to 1.0 to prevent blowout
- Toggle via `useEffect` watching `postprocessingEnabled` store flag
- This ensures single tone-mapping pass in normal operation, graceful fallback when degraded

**HDR Workflow:**
- Nebula cores emit HDR colors (RGB > 1.0) with `toneMapped={false}` on materials
- Selected books emit HDR with `toneMapped={false}`
- Bloom threshold at 0.9 catches only HDR elements
- Regular scene elements stay in 0-1 range

**Per-View Tuning:**
- **Universe view:** Light bloom (0.3), wide DOF (focalLength=0.01), everything mostly in focus
- **Constellation view:** Medium bloom (0.5), DOF focuses on nebula center (focalLength=0.02)
- **Book view:** Strong bloom (0.6) on selected book, tight DOF (focalLength=0.04)

### 2. Slice-Volume Nebulae

Replace current `NebulaCloud` (2 spheres) with a slice-volume approach.

**Structure:**
- 8-48 camera-facing planes (billboards) distributed within nebula bounds
- Planes share a single procedural texture per topic (NOT per slice)
- Planes at different depths + UV offsets create parallax
- Additive blending for proper light accumulation

**Texture Strategy (GPU memory efficient):**
- Generate ONE 512x512 procedural texture per topic at init (12 textures total)
- Each slice samples the same texture with randomized UV offset + scale
- Texture generated via canvas with simplex noise
- **Platform compatibility:** Use `OffscreenCanvas` if available, fall back to regular `HTMLCanvasElement` if not (iOS Safari < 16.4 lacks OffscreenCanvas)
- Feature detection: `typeof OffscreenCanvas !== 'undefined'`
- Radial falloff baked into texture alpha
- Topic color applied as material color (tint the grayscale noise texture)

**LOD by View Level:**
| View | Slice Count | Animation | Notes |
|------|-------------|-----------|-------|
| Universe | 8 | Static | Cheap impostors |
| Constellation (inactive) | 12 | Static | Medium detail, dimmed |
| Constellation (active) | 48 | Animated UV pan | Full quality hero |
| Book | 24 | Static | Dimmed background |

**Shape Language:**
- Use ellipsoids (not spheres) with per-topic axis ratios (0.8-1.2 variance)
- Noise-displaced slice positions via seeded random
- Optional: 2 overlapping volumes for complex silhouettes

**Crossfade for LOD Transitions:**
- When LOD changes, opacity-fade over 300ms to prevent popping
- New slices fade in as old slices fade out

### 3. Particle Dust Layer

Add GPU particles for "wisps" and embedded stars:

**Per Nebula:**
- 200-1000 particles (LOD-dependent)
- Single shared soft sprite texture (64x64 gaussian blob)
- Distributed in nebula volume with density falloff from center
- Color varies across topic color ramp (hue shift ±10deg)
- Slow drift via 3D noise field (constellation view only, when active)

**Implementation:**
- Use `THREE.Points` with `PointsMaterial` + custom vertex shader for soft particles
- Soft particles: read depth buffer, fade alpha when close to geometry
- Requires `depthTexture` from EffectComposer (react-postprocessing provides this automatically when DOF is enabled)
- Instance attributes: position (vec3), size (float), opacity (float), phase (float)

**LOD by View:**
| View | Particle Count | Animation |
|------|----------------|-----------|
| Universe | 200 | Static |
| Constellation (active) | 1000 | Drifting |
| Constellation (inactive) | 400 | Static |
| Book | 600 | Subtle drift |

### 4. Star Field Upgrade

Upgrade from single layer to multi-layer parallax:

**Layers:**
| Layer | Count | Size Range | Depth | Parallax Factor |
|-------|-------|------------|-------|-----------------|
| Far | 2000 | 0.2-0.5 | 800-1000 | 0.1x |
| Mid | 1000 | 0.4-0.8 | 400-600 | 0.3x |
| Near | 300 | 0.6-1.2 | 200-300 | 0.6x |

**Features:**
- Subtle color variation (90% white, 5% warm tint, 5% cool tint)
- Occasional bright star (1 in 50, size 1.5x, opacity 1.0)
- Twinkle: disabled by default, only for 1 in 200 stars, 0.5% amplitude, only when NOT in reduced motion

**Parallax Implementation:**
- Each layer is a separate `<instancedMesh>`
- On camera move, offset layer positions by `cameraMoveDelta * parallaxFactor`
- Wrap positions to avoid stars drifting out of view

### 5. Warp Transitions

Enhance camera transitions with visual feedback:

**Universe → Constellation (600ms total):**
- 0-200ms: Stars stretch slightly toward camera (scale Z by 1.5)
- 0-400ms: Target nebula brightens (emissive +50%)
- 0-600ms: Other nebulae fade to 30% opacity
- 400-600ms: Stars settle back (scale Z returns to 1.0)

**Constellation → Book (400ms total):**
- 0-200ms: Scene dims to 40% except selected book region
- 0-400ms: Selected book emissive ramps to HDR (triggers bloom spike)
- 200-400ms: Soft "lock-in" ease (camera settles)

**Implementation:**
- Store `transitionPhase: number` (0-1) in store
- CameraController updates phase during transitions
- Pass phase to StarField, VolumetricNebula for shader uniforms
- Use `invalidate()` during transitions to drive animation

### 6. Animation Invalidation Strategy

**Critical:** With `frameloop="demand"`, animations only run when `invalidate()` is called.

**Always invalidating (continuous render during):**
- Camera transitions (already handled by CameraController)
- Active nebula UV panning (when constellation view active)
- Particle drift (when constellation view active)
- Book position lerps (already handled)

**Implementation:**
- Add animation flag booleans to store (see Store Additions)
- `isAnimating` is derived: `isTransitioning || isUvPanning || isParticleDrifting || hasBookLerps`
- Each animation source sets/clears only its own flag (no race conditions)
- **Root-level invalidation:** Create `<AnimationDriver />` component inside Canvas (sibling to Universe, always mounted)
- AnimationDriver reads derived `isAnimating` and calls `invalidate()` in useFrame when true
- This ensures animations work in all views regardless of component mount state

**Reduced Motion:**
- Skip all continuous animations
- Only call `invalidate()` for discrete state changes
- This maximizes GPU savings

### 7. Nebula Hover Reactions (Nice to Have)

When hovering a nebula (universe view):
- Core emissive increases 30% (0.2s ease)
- Particle drift speed increases 2x
- Triggers `invalidate()` for animation

When clicking a nebula:
- Brief emissive spike (0.15s)
- Syncs with zoom transition

---

## Component Changes

### New Files
- `components/library/floating/PostProcessingEffects.tsx` — EffectComposer wrapper with view-based config
- `components/library/floating/VolumetricNebula.tsx` — New slice-volume nebula
- `components/library/floating/NebulaDust.tsx` — GPU particle dust layer
- `lib/library/noise.ts` — Simplex noise utility for texture generation
- `lib/library/nebulaTextures.ts` — Procedural texture generator

### Modified Files
- `FloatingLibrary.tsx` — Add PostProcessingEffects, disable renderer toneMapping
- `Universe.tsx` — Swap NebulaCloud for VolumetricNebula, add isAnimating logic
- `StarField.tsx` — Multi-layer parallax, warp stretch uniform
- `Constellation.tsx` — Integrate NebulaDust, pass LOD config
- `CameraController.tsx` — Expose transitionPhase to store
- `lib/library/store.ts` — Add transitionPhase, isAnimating

### Kept as Fallback
- `NebulaCloud.tsx` — Keep for performance fallback (LOD trigger < 25fps)

---

## Data Model

### PostProcessingConfig
```typescript
interface PostProcessingConfig {
  bloom: { threshold: number; intensity: number; smoothing: number }
  dof: { focusDistance: number; focalLength: number; bokehScale: number } | null
  vignette: { offset: number; darkness: number }
  noise: { opacity: number }
}

const VIEW_POSTPROCESSING: Record<ViewLevel, PostProcessingConfig> = {
  universe: {
    bloom: { threshold: 0.9, intensity: 0.3, smoothing: 0.3 },
    dof: { focusDistance: 0, focalLength: 0.01, bokehScale: 1 },
    vignette: { offset: 0.3, darkness: 0.3 },
    noise: { opacity: 0.015 }
  },
  constellation: {
    bloom: { threshold: 0.9, intensity: 0.5, smoothing: 0.3 },
    dof: { focusDistance: 0, focalLength: 0.02, bokehScale: 2 },
    vignette: { offset: 0.3, darkness: 0.4 },
    noise: { opacity: 0.02 }
  },
  book: {
    bloom: { threshold: 0.85, intensity: 0.6, smoothing: 0.4 },
    dof: { focusDistance: 0, focalLength: 0.04, bokehScale: 3 },
    vignette: { offset: 0.2, darkness: 0.5 },
    noise: { opacity: 0.02 }
  }
}
```

### Store Additions
```typescript
// Add to useLibraryStore
transitionPhase: number        // 0-1, progress of current camera transition
postprocessingEnabled: boolean // False when degraded for performance

// Animation flags (individual sources, not single boolean)
isTransitioning: boolean       // Camera transition in progress
isUvPanning: boolean           // Active nebula UV animation
isParticleDrifting: boolean    // Particle drift animation
hasBookLerps: boolean          // Book position animations in progress

// Derived getter (computed, not stored)
get isAnimating(): boolean {
  return this.isTransitioning || this.isUvPanning || this.isParticleDrifting || this.hasBookLerps
}

// Actions
setTransitionPhase: (phase: number) => void
setIsTransitioning: (v: boolean) => void
setIsUvPanning: (v: boolean) => void
setIsParticleDrifting: (v: boolean) => void
setHasBookLerps: (v: boolean) => void
setPostprocessingEnabled: (v: boolean) => void
```

**Why derived:** Each animation source manages its own flag. AnimationDriver reads the derived `isAnimating` getter. No race conditions from components clearing a shared flag.

---

## Acceptance Criteria

### Must Have (Measurable)
1. [ ] Bloom visible: nebula cores and selected books have visible glow halo (> 2px blur radius)
2. [ ] DOF active in book view: background nebulae are visibly blurred compared to selected book (qualitative check)
3. [ ] Nebulae parallax: moving camera 10 units sideways causes visible slice shift (> 0.5 unit)
4. [ ] Nebulae non-spherical: at least 3 topics have visibly elliptical shapes
5. [ ] Particle dust visible: > 100 particles visible per nebula in constellation view
6. [ ] Star parallax: 3 distinct layers visible, camera pan causes differential motion
7. [ ] Transition feedback: zooming to constellation triggers visible nebula brightening or star stretch
8. [ ] Performance: `performance.now()` frame time < 20ms rolling 60-frame average on M1 Mac Chrome
9. [ ] Reduced motion: setting `prefers-reduced-motion: reduce` disables UV pan, particle drift, warp stretch

10. [ ] LOD crossfade: slice count changes fade over 300ms (no popping)

### Nice to Have
1. [ ] Nebula hover reaction (brightness increase on pointer enter)
2. [ ] Star twinkle on brightest stars

---

## Performance Budget

### GPU Memory (Revised)
| Asset | Count | Size | Memory |
|-------|-------|------|--------|
| Nebula textures | 12 topics | 512×512 RGBA | 12MB |
| Particle sprite | 1 | 64×64 RGBA | 16KB |
| Depth texture | 1 | Canvas size @2x DPR | ~16MB (1080p @2x) |
| Postprocessing RT | 3 passes | Canvas size @2x DPR | ~48MB (bloom mipmaps, DOF, composite) |
| **Total GPU memory** | | | ~76MB |

**DPR cap:** Already set to `dpr={[1, 2]}` in v1 Canvas config. Max 2x, prevents 3x+ Retina blowout.

*Well within 150MB budget from v1 spec.*

### Draw Calls

**Universe View (worst case: 12 topics, 50 books):**
| Element | Calls |
|---------|-------|
| Stars (3 instanced layers) | 3 |
| Nebulae (12 × 8 slices) | 96 |
| Particles (12 instanced) | 12 |
| Books (instanced) | 1 |
| Postprocessing passes | 6 |
| **Total** | ~118 |

**Constellation View (1 active, 11 dimmed):**
| Element | Calls |
|---------|-------|
| Stars | 3 |
| Active nebula (48 slices) | 48 |
| Inactive nebulae (11 × 8) | 88 |
| Particles (active: 1000, inactive: 11×200) | 12 |
| Books | 1 |
| Postprocessing | 6 |
| **Total** | ~158 |

*Target: < 200 draw calls for 60fps on M1.*

### LOD Triggers
Hysteresis prevents oscillation (must sustain threshold for full duration):
| Condition | Action | Recovery |
|-----------|--------|----------|
| < 45fps for 2s | Particle count 50% | > 55fps for 3s |
| < 35fps for 2s | Disable postprocessing | > 50fps for 3s |
| < 25fps for 2s | Fall back to NebulaCloud | Manual toggle in HUD |
| < 20fps for 3s | Prompt classic view | Manual toggle in HUD |

**Manual toggle location:** Existing LibraryHUD component has a toggle button (gear icon). Add "Quality: Full / Reduced / Classic" option. Setting persisted in localStorage via store.

### FPS Measurement Method
- Use `performance.now()` delta in `useFrame` callback
- **Gating:** Only sample when `isAnimating` is true (ignore idle frames between invalidations)
- **Outlier rejection:** Ignore deltas > 100ms (happens after tab switches, indicates pause not slowness)
- Compute rolling average over 60 valid samples
- Recovery sampling: continue measuring for 3s after `isAnimating` becomes false to allow upgrade triggers
- Store in `lib/library/performance.ts` (already exists from v1)
- Log to console in dev mode for manual verification

---

## Edge Cases

### Performance Degradation
- If postprocessing causes < 35fps, disable EffectComposer entirely (graceful degradation)
- If VolumetricNebula too expensive (< 25fps), swap to NebulaCloud (v1 spheres)
- NebulaCloud.tsx kept as fallback component, not deleted

### Reduced Motion
- **Disable:** star twinkle, particle drift, UV pan animation, warp stretch, hover reactions
- **Keep:** static bloom, static DOF, static nebula shapes, instant transitions

### Filter/Search Active
- Nebulae hidden (opacity 0), particles hidden
- Only filtered books in central cluster
- Postprocessing stays active but DOF disabled (everything in focus)

### Mobile
- Detect via `navigator.maxTouchPoints > 0`
- Reduce slice count by 50% (max 24)
- Reduce particle count by 50% (max 500)
- Disable DOF entirely (performance)
- Lighter bloom (intensity 0.2)

---

## Non-Functional Requirements

### Performance
- **Target:** 60fps (16.7ms frame time) on M1 Mac, iPhone 14, Pixel 7
- **Acceptable:** 45fps (22ms) on 2020 devices
- **Measurement:** Rolling 60-frame average via performance.now()
- `frameloop="demand"` maintained; continuous render only during active animations

### Accessibility
- All new animations respect `useReducedMotion()` hook
- No flashing: bloom spikes < 0.2s duration, < 3 flashes per second
- Existing AccessibleBookList unchanged

### Browser Support
- WebGL2 required (same as v1)
- Falls back to classic grid if WebGL unavailable

---

## Implementation Phases

1. **Phase 1: Postprocessing** — EffectComposer with bloom, DOF, vignette, noise. Tone mapping fix. Per-view config.
2. **Phase 2: Nebula Textures** — Procedural texture generator. One texture per topic.
3. **Phase 3: Volumetric Nebula** — Slice-volume component. LOD by view. Replace NebulaCloud usage.
4. **Phase 4: Particle Dust** — GPU particles with soft particle shader. Per-nebula instances.
5. **Phase 5: Star Field Upgrade** — Multi-layer parallax. Warp stretch shader uniform.
6. **Phase 6: Transitions & Polish** — transitionPhase in store. Warp effects. Hover reactions (if time).
7. **Phase 7: Performance & Testing** — LOD tuning. Mobile testing. Crossfade polish.

---

## Resolved Questions

**Q: Per-slice textures vs shared texture?**
A: Shared — one 512×512 texture per topic, slices use UV offsets. 12 textures total vs 576.

**Q: Soft particles without DOF?**
A: Skip soft particle depth fade when DOF disabled; use simple alpha falloff instead.

**Q: Warp effect complexity?**
A: Keep simple — star Z scale only. Skip radial blur (too expensive).

**Q: NebulaCloud removal?**
A: Keep as fallback. Only VolumetricNebula used by default, but NebulaCloud available for < 25fps devices.
