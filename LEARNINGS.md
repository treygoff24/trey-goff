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

---

## 2025-12-27 - Downloads & Media

**What Worked:**
- Following the phased plan kept the downloads and media work organized.
- Reusing existing card and typography patterns fit the site styling quickly.

**What Failed:**
- Claude CLI reviews hung without returning output.

**Patterns:**
- `pnpm build` runs prebuild and regenerates `public/search-index.json`.
