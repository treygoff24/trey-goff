# Learnings

## 2026-01-04 - Floating Library v2 (Volumetric Nebulae & Postprocessing)

**What Worked:**
- Slice-volume approach for nebulae (8-48 stacked billboards with parallax) - looks great, performs well
- AnimationDriver pattern: single component at Canvas root handles centralized invalidation
- `frameloop="demand"` + selective `invalidate()` saves massive GPU power when scene is idle
- Multi-layer parallax star fields (3 layers with different parallax factors) add depth without complexity
- HDR workflow: `toneMapped={false}` on emissive materials + EffectComposer with ToneMapping effect
- Derived Zustand selectors (selectIsAnimating) cleanly compute from multiple flags
- LOD crossfade (300ms opacity transition) prevents jarring LOD pops
- Performance monitor with outlier rejection (ignore >100ms deltas from tab switches)
- Recovery hysteresis: require 55+ fps for 3s before stepping up quality

**What Failed:**
- Passing ref values directly in JSX render caused "Cannot access refs during render" lint error
  - Fix: Have each child component manage its own ref internally
- Initial parallax tracking in parent component was awkward
  - Fix: Each StarLayer tracks its own parallax offset
- EffectComposer conditional children (per quality tier) don't work well
  - Fix: Use separate components or conditionally include entire EffectComposer

**Patterns:**
- AnimationDriver at Canvas root: `if (isAnimating) invalidate()` in useFrame
- transitionPhase (0-1) enables progress-based effects (warp stretch, nebula brightening)
- Quality toggle with Full/Reduced/Minimal presets gives user control
- Slice positioning: ellipsoid distribution with seeded random and per-topic axis ratios
- Procedural textures: simplex noise + radial falloff, cached per topic (12 textures total)
- Focus trap in modals: store previousFocus, Tab/Shift+Tab wrap, restore on close

**Performance Tips:**
- Gate sampling in PerformanceMonitor to when isAnimating is true
- Continue sampling for 3s after animations stop (recovery period)
- Disable raycast on mostly-transparent meshes (opacity < 0.3)
- Cap DPR at 2x even on high-DPI displays
- Use single THREE.Color instance, not string per frame

---

## 2025-12-28 - Interactive 3D World

**What Worked:**
- Phased implementation plan kept scope manageable across 16 phases
- Bundle isolation check in postbuild catches Three.js leaking to Normal routes
- Content manifest generation at build time avoids runtime JSON parsing
- Code review agent catches memory leaks and performance issues before they ship
- useCallback + dependency arrays prevent useEffect re-runs in R3F components
- Color caching (THREE.Color) prevents per-frame allocations
- AbortController cleanup pattern works well for fetch in React effects
- Separate EffectComposer components per quality tier solves TypeScript conditional children issues

**What Failed:**
- Initial useEffect without dependency array caused stale closures in DoorTrigger
- Trying to use store method that didn't exist (setCameraMode vs updateSettings)
- EffectComposer doesn't accept conditional children - need separate components

**Patterns:**
- R3F useFrame should early-exit when not animating to save CPU
- Store selectors: read with `(s) => s.field`, write with separate action
- Settings that need persistence: use Zustand store with localStorage
- Settings that are session-only: use local React state
- For room content: lazy() + Suspense + RoomRegistry pattern enables code splitting

**Performance Tips:**
- Reusable Vector3 refs avoid per-frame allocations
- Throttle telemetry but update position every frame
- Skip useFrame body when at target position
- Use cursor cleanup effect on component unmount

## 2025-12-28 - Core Mechanics (Physics & Camera)

**What Worked:**
- Rapier character controller provides smooth movement with collision
- Kinematic RigidBody gives full control over player position while respecting collisions
- Separating colliders from visual geometry (simple boxes for complex meshes)
- Named constants (MAX_PITCH) improve code readability

**What Failed:**
- Initial collider positions didn't match visual geometry (mansion at z=-20 vs collider at z=0)
- Per-frame Vector3 allocation in useFrame (fixed with reusable ref)
- Type mismatch with `@dimforge/rapier3d-compat` (fixed with ReturnType inference)

**Patterns:**
- Use `ReturnType<typeof hook>["property"]` to infer types from library functions (avoids version mismatches)
- Collider positions should be computed from visual geometry positions, not assumed
- Character controller needs explicit gravity since kinematic bodies don't respond to Physics gravity

---

## 2025-12-27 - Downloads & Media

**What Worked:**
- Following the phased plan kept the downloads and media work organized.
- Reusing existing card and typography patterns fit the site styling quickly.

**What Failed:**
- Claude CLI reviews hung without returning output.

**Patterns:**
- `pnpm build` runs prebuild and regenerates `public/search-index.json`.
