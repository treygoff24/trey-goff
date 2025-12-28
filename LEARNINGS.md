# Learnings

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
