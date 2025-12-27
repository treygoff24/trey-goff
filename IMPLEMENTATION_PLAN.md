# Interactive World - Implementation Plan (v5)

## Current Status

**Phase**: 0 - Route Isolation + Entry Flow
**Working on**: Creating `/app/interactive/` route structure
**Cross-agent reviews completed**: Codex plan review (v1-v4 → revise, v5 → APPROVED)
**Blockers**: None
**Runtime**: Starting implementation

---

## Overview

Build an immersive 3D "secret level" at `/interactive` that maps to site content. The world includes a mansion exterior and interior rooms (Library, Gym, Projects) visualizing blog posts, books, and PRs.

**Spec location**: `/treygoff-interactive-world-spec-v1.2.md`

**MVP Scope (per spec):**
- Exterior: mansion, sky with O'Neill cylinders, garage, "Goff Industries" mech
- Main Hall: hub with wayfinding to rooms
- Library: books from reviews/posts
- Gym: PR visualization with plates
- Projects Room: museum exhibits

**Deferred to V1.1 (per spec):**
- Study Room with Knowledge Graph Hologram
- Audio (ambient + positional)
- Gaussian Splat integration

---

## Phase 0: Route Isolation + Entry Flow

**Objective:** Establish isolated `/interactive` route with Normal site integration

**Dependencies:** None

**Tasks:**

### 0.1 Route Structure (~30 min)
- [ ] Create `/app/interactive/` directory
- [ ] Create `page.tsx` - client-only entry (no SSR)
- [ ] Create `layout.tsx` - minimal chrome, no TopNav/Footer
- [ ] Use Client Component boundary with `dynamic()` for code splitting
- [ ] Verify route loads without errors

### 0.2 Normal Site Entry Flow (~45 min)
- [ ] Add "Explore Interactive" link to homepage with `prefetch={false}`
- [ ] Implement high-intent prefetch: hover >500ms or explicit click triggers `router.prefetch()`
- [ ] Add capability detection (WebGL2, device memory heuristics, reduced-motion preference)
- [ ] Show dual choice: "Fast (Normal)" vs "Explore (Interactive)"
- [ ] Quality tier selection before load: Auto (default) / Low / Medium / High
- [ ] Manual tier overrides auto-detection

### 0.3 Return to Normal (~20 min)
- [ ] Add persistent "Return to Normal" button in Interactive UI
- [ ] Never hidden, always accessible
- [ ] Link back to last Normal page or homepage

### 0.4 Non-WebGL Fallback (~30 min)
- [ ] Detect WebGL2 unavailability
- [ ] Show fallback UI: guided tour mode (static screenshots + content)
- [ ] Always-available link to Normal site

**Acceptance Criteria:**
- [ ] `/interactive` route loads client-only
- [ ] Normal site has no Three.js imports (verify manually)
- [ ] Entry flow shows capability detection
- [ ] Fallback works when WebGL disabled
- [ ] "Return to Normal" always visible

**Complexity:** Moderate

---

## Phase 1: R3F Infrastructure

**Objective:** Set up React Three Fiber canvas with proper configuration

**Dependencies:** Phase 0 complete

**Tasks:**

### 1.1 Canvas Setup (~30 min)
- [ ] Create `/components/interactive/RendererRoot.tsx`
- [ ] Configure R3F Canvas with WebGL2 context
- [ ] Set up color management (sRGB output, ACES tone mapping)
- [ ] Configure for performance: antialias off, stencil off

### 1.2 GLTF Loader Configuration (~30 min)
- [ ] Configure GLTFLoader with KTX2Loader
- [ ] Set up MeshoptDecoder
- [ ] Create loader wrapper utility
- [ ] Test with placeholder cube GLB

### 1.3 Quality Tier System (~45 min)
- [ ] Create `/lib/interactive/quality.ts`
- [ ] Define Low/Medium/High tier settings per spec:
  - DPR: 1.0 / 1.5 / min(2.0, native)
  - Shadow map: none / 1024 / 2048
  - Shadow distance: none / 20m / 40m
  - Post-FX: minimal / standard / full
  - LOD bias: aggressive / normal / quality
  - Reflection probe res: 64 / 128 / 256
- [ ] Auto tier: start Medium, sample first 60 frames
- [ ] Thresholds: P95 >20ms → drop to Low, P95 <12ms → allow High
- [ ] Never auto-upgrade on mobile (battery concern)

### 1.4 Shader Warmup (~30 min)
- [ ] Create shader warmup phase
- [ ] Render all unique materials off-screen during load
- [ ] Prevent first-frame jank from shader compilation

**Acceptance Criteria:**
- [ ] Canvas renders test scene
- [ ] GLTFLoader loads KTX2/Meshopt assets
- [ ] Quality tier selection works
- [ ] No shader compilation stutter on first render

**Complexity:** Moderate

---

## Phase 2: Asset Pipeline + CI Gates

**Objective:** Establish compression pipeline and budget enforcement

**Dependencies:** Phase 1 complete

**Tasks:**

### 2.1 Asset Directory Structure (~30 min)
- [ ] Create `/public/assets/chunks/` for room GLB files:
  - `exterior.glb` - mansion exterior, sky elements
  - `mainhall.glb` - entry hall, hub area
  - `library.glb` - shelves, furniture, book slots
  - `gym.glb` - equipment, plates, plaques
  - `projects.glb` - pedestals, terminals
  - `garage.glb` - vehicles, tools, props (separate for streaming)
- [ ] Create `/public/assets/props/` for shared/LOD-managed props:
  - `mech.glb` - hero mech (separate for LOD management)
  - `books-atlas.glb` - instanced book geometry + spine atlas
  - `plates.glb` - weight plate instances
- [ ] Create `/public/manifests/` for runtime JSON
- [ ] Document naming convention: `chunk-[name]-[hash].glb`

### 2.2 Compression Pipeline (~45 min)
- [ ] Add glTF Transform CLI as dev dependency
- [ ] Create script: `scripts/compress-assets.ts`
- [ ] Apply KTX2 texture compression (UASTC for hero, ETC1S for background)
- [ ] Apply Meshopt geometry compression
- [ ] Generate hashed filenames

### 2.3 Budget Validation (~45 min)
- [ ] Create script: `scripts/validate-asset-budgets.ts`
- [ ] Enforce per-chunk budgets:
  - Compressed download: <2MB
  - Triangles: <100K
  - Draw calls contribution: <30
  - Textures: <10 unique
  - Estimated VRAM: <50MB
- [ ] Enforce scene-wide budgets:
  - Total triangles in view: <300K
  - Total draw calls: <100
  - Peak memory (JS heap + GPU): <500MB with 2 chunks loaded
- [ ] Check for missing KTX2 textures (all textures must be .ktx2)
- [ ] Check for missing Meshopt compression (verify extension present)
- [ ] Validate manifest→asset references (all manifest assets exist)
- [ ] Fail build on any budget violation
- [ ] Add to prebuild script

### 2.4 Bundle Analysis (~30 min)
- [ ] Add bundle analyzer to verify Normal routes
- [ ] Create CI check: zero Three.js bytes in Normal bundles
- [ ] Document verification process

**Acceptance Criteria:**
- [ ] Assets compress with KTX2 + Meshopt
- [ ] Budget validation runs in prebuild
- [ ] Missing compression/textures detected and fail build
- [ ] Manifest→asset references validated
- [ ] Bundle analysis confirms route isolation
- [ ] Placeholder exterior chunk created and compressed

**Complexity:** Moderate

---

## Phase 3: State Management + Telemetry

**Objective:** Create Zustand store and early telemetry infrastructure

**Dependencies:** Phase 2 complete

**Tasks:**

### 3.1 Interactive Store (~45 min)
- [ ] Create `/lib/interactive/store.ts` with Zustand
- [ ] Chunk states: unloaded/preloading/loaded/active/dormant/disposed
- [ ] Quality tier state
- [ ] Settings: camera mode, sensitivity, reduced motion
- [ ] Current room + spawn position

### 3.2 State Restoration (~30 min)
- [ ] Save to localStorage: last room, spawn position, quality, settings
- [ ] Save to URL query params: room (for shareable links)
- [ ] Restore on load with fallback handling
- [ ] Show toast on restoration failure: "Couldn't restore position—starting from main hall"

### 3.3 Telemetry Foundation (~60 min)
- [ ] Create `/lib/interactive/telemetry.ts`
- [ ] Track load milestones per spec:
  - Capability check complete
  - Download start (per chunk)
  - Download complete (per chunk)
  - Shader warmup complete
  - First render
  - First input received
  - First Controllable Frame (FCF)
- [ ] Track engagement events per spec:
  - Entry choice: Normal vs Interactive
  - Room entered (with dwell time)
  - Book opened (which book)
  - Project viewed (which project)
  - Quality tier changed
  - "Return to Normal" clicked
- [ ] Performance sampling: FPS buckets (0-15, 15-30, 30-45, 45-60, 60+) every 5s
  - Include quality tier (initial + current) in sampling events
- [ ] Long frame detection (>50ms)
- [ ] Memory warnings (via Performance.memory on Chrome)
- [ ] WebGL context lost events (telemetry, not just UI)
- [ ] Note: Graph-mode engagement events deferred to V1.1 with Study room

### 3.4 Error Handling (~45 min)
- [ ] WebGL context lost → log to telemetry + show recovery UI with reload button
- [ ] Chunk load failure → retry 2x with backoff → show error UI
- [ ] Memory exhaustion → auto-downgrade quality tier; if still failing, prompt reload
- [ ] Shader compilation failure → fall back to basic materials
- [ ] Tab suspension recovery: detect hidden→visible transition, verify context
- [ ] Log all errors to telemetry

**Acceptance Criteria:**
- [ ] Store persists across page navigation
- [ ] State restores from localStorage + query params
- [ ] All telemetry events fire correctly per spec
- [ ] Error recovery UI works for all failure modes
- [ ] Shader fallback works gracefully

**Complexity:** Moderate

---

## Phase 4: Loading UX + Character Controller

**Objective:** Implement loading sequence and player movement

**Dependencies:** Phase 3 complete

**Tasks:**

### 4.1 Loading Sequence (~45 min)
- [ ] Create styled progress bar component
- [ ] Status text phases: "Initializing...", "Loading assets...", "Warming shaders..."
- [ ] Fade-in transition to gameplay
- [ ] Skippable intro cinematic (placeholder)

### 4.2 Pathfinding Library Decision (~20 min)
- [ ] Evaluate recast-navigation-js vs three-pathfinding
- [ ] Consider: WASM load time, Safari stability, navmesh generation
- [ ] Decision: use three-pathfinding (simpler, no WASM)
- [ ] Document decision in CONTEXT.md

### 4.3 Character Controller - Desktop (~45 min)
- [ ] Install and configure `ecctrl`
- [ ] WASD/Arrow key movement
- [ ] Mouse-look (pointer lock optional, not required)
- [ ] `E` key / left click interaction raycast
- [ ] Spawn point system

### 4.4 Character Controller - Mobile (~45 min)
- [ ] Tap-to-move on navmesh with smooth autopilot
- [ ] Drag-to-look camera rotation
- [ ] Tap objects directly for interaction
- [ ] Optional on-screen joystick (settings toggle)
- [ ] Room label tap targets for navigation

**Acceptance Criteria:**
- [ ] Loading sequence completes smoothly
- [ ] Desktop movement with WASD works
- [ ] Mobile tap-to-move works
- [ ] Interaction raycast detects objects

**Complexity:** Complex

---

## Phase 5: Camera + Interaction System

**Objective:** Polish camera behavior and interaction feedback

**Dependencies:** Phase 4 complete

**Tasks:**

### 5.1 Camera System (~45 min)
- [ ] Third-person follow camera (default)
- [ ] First-person mode (settings option)
- [ ] Smooth transitions with easing
- [ ] Camera collision avoidance (never clips geometry)
- [ ] Reduced motion: disable sway, use instant cuts

### 5.2 Interaction Feedback (~30 min)
- [ ] Hover highlight on interactables (subtle outline/glow)
- [ ] Tap highlight on mobile (brief flash on tap-down)
- [ ] "Press E" / "Tap to open" hints near interactables
- [ ] Settings: `Esc` opens settings menu

### 5.3 Diegetic UI System (~30 min)
- [ ] In-world text rendering for labels
- [ ] Monitor/screen rendering for project displays
- [ ] Holographic text for gym PRs

### 5.4 Overlay System (~30 min)
- [ ] Clean DOM overlay panel for long-form content
- [ ] "Read more" links to Normal route
- [ ] Persistent "Return to Interactive" from Normal

**Acceptance Criteria:**
- [ ] Camera follows smoothly without clipping
- [ ] Interaction hints appear correctly
- [ ] Diegetic UI renders in-world text
- [ ] Overlay opens for detailed content

**Complexity:** Moderate

---

## Phase 6: Chunk Streaming State Machine

**Objective:** Implement room loading/unloading with memory management

**Dependencies:** Phase 5 complete

**Tasks:**

### 6.1 State Machine Core (~45 min)
- [ ] Implement state flow: unloaded → preloading → loaded → active → dormant → disposed
- [ ] State transition logging for debugging
- [ ] Memory tracking via `renderer.info.memory`

### 6.2 Preload Triggers (~30 min)
- [ ] Door proximity trigger (15m distance)
- [ ] Start preloading target room chunk
- [ ] Cancel preload if player moves away

### 6.3 Activation + Transition (~30 min)
- [ ] Room entry activates chunk
- [ ] Mark previous room as dormant
- [ ] Fade to black (0.3s) to mask chunk swap
- [ ] Spawn at door position after transition

### 6.4 Disposal Protocol (~45 min)
- [ ] Traverse chunk scene graph on dispose
- [ ] Dispose: geometry, materials, textures
- [ ] Handle ImageBitmap cleanup for KTX2
- [ ] Keep max 2 dormant chunks
- [ ] Dispose oldest dormant on memory pressure
- [ ] Verify cleanup with `renderer.info.memory`

**Acceptance Criteria:**
- [ ] Chunks preload on door proximity
- [ ] Transitions are smooth (no pop-in)
- [ ] Memory returns to baseline after disposal
- [ ] 10-minute session shows stable memory

**Complexity:** Complex

---

## Phase 7: Exterior + Main Hall

**Objective:** Build the entry area and hub room

**Dependencies:** Phase 6 complete

**Tasks:**

### 7.1 Exterior Geometry (~45 min)
- [ ] Create exterior chunk with mansion facade
- [ ] Ground plane with grid/path texture
- [ ] Sky: O'Neill cylinders as distant sprites in skybox
- [ ] Mountains as distant backdrop

### 7.2 Exterior Props + LOD (~60 min)
- [ ] Garage structure (separate chunk for streaming)
- [ ] "Goff Industries Prototype" mech (separate prop for LOD management)
- [ ] Approach path to mansion entrance
- [ ] Lighting: directional sun + ambient
- [ ] LOD setup per spec:
  - Mech: LOD0 (full detail), LOD1 (50% tris), LOD2 (25% tris)
  - Exterior props: LOD0, LOD1 (50%), LOD2 (billboard/impostor)
  - Interior furniture: LOD0 (full), LOD1 (60%), N/A (culled when not in room)
- [ ] Calibrate LOD transition distances

### 7.3 Main Hall Geometry (~30 min)
- [ ] Hub layout with clear sightlines to all doors
- [ ] Room label signage at each doorway
- [ ] Spawn point at entrance

### 7.4 Door/Portal System (~30 min)
- [ ] Door triggers to each room
- [ ] Door interaction (approach + E / tap)
- [ ] Visual feedback when door is activatable
- [ ] Mobile: room labels as tap-to-navigate targets

**Acceptance Criteria:**
- [ ] Exterior renders with all required elements
- [ ] Mech is visible and looks premium
- [ ] Main hall has clear wayfinding
- [ ] All doors are interactive

**Complexity:** Moderate

---

## Phase 8: Content Manifests

**Objective:** Generate runtime manifests from content sources

**Dependencies:** Phase 7 complete

**Tasks:**

### 8.1 Source Alignment (~20 min)
- [ ] Map spec paths to actual codebase paths:
  - Spec `/content/blog/` → Actual `/content/essays/` (MDX)
  - Spec `/content/books/` → Actual `/content/library/books.json`
  - Spec `/content/projects/` → Actual `/content/projects/` (create if needed)
  - Spec `/data/lifts.json` → Create `/data/lifts.json` with PR data
  - Spec `/data/knowledge-graph.json` → Deferred to V1.1
- [ ] Document path mapping in CONTEXT.md

### 8.2 Manifest Generator (~45 min)
- [ ] Create `/scripts/generate-interactive-manifests.ts`
- [ ] Generate `blog.manifest.json` from essays
- [ ] Generate `books.manifest.json` from library data
- [ ] Generate `projects.manifest.json` from projects
- [ ] Generate `lifts.manifest.json` from lifts data

### 8.3 Manifest Schema (~30 min)
- [ ] Define TypeScript types for each manifest
- [ ] Include required fields per spec:
  - Blog: id, slug, title, excerpt, tags, coverImage, publishedAt
  - Books: id, title, author, rating, reviewSlug, coverImage, tier
  - Projects: id, title, summary, links, images, tags
  - Lifts: squat, bench, deadlift, total with weight/unit/date

### 8.4 Build Integration (~20 min)
- [ ] Add manifest generation to prebuild script
- [ ] Validate manifests have required fields
- [ ] Output to `/public/manifests/`

**Acceptance Criteria:**
- [ ] All manifests generate correctly
- [ ] Manifests have all required fields
- [ ] Build includes manifest generation
- [ ] TypeScript types match manifest structure

**Complexity:** Simple

---

## Phase 9: Library Room

**Objective:** Build the Library with interactive book visualization

**Dependencies:** Phase 8 complete

**Tasks:**

### 9.1 Library Geometry (~30 min)
- [ ] Create library room chunk
- [ ] Bookshelf layout with slots
- [ ] Reading nook area
- [ ] Warm ambient lighting

### 9.2 Book Instances (~45 min)
- [ ] Create book mesh template
- [ ] Generate InstancedMesh from books.manifest
- [ ] Per-instance variation (color, size, position in slot)
- [ ] Spine text atlas (placeholder or build-time generated)

### 9.3 Book Interaction (~45 min)
- [ ] Hover highlight on books
- [ ] Click opens book inspection mode
- [ ] Book animates to inspect position
- [ ] Overlay shows book details + review excerpt
- [ ] "Read Review" links to Normal site

**Acceptance Criteria:**
- [ ] Library loads with books from manifest
- [ ] Books display correctly on shelves
- [ ] Book interaction shows details
- [ ] Navigation to Normal preserves return state

**Complexity:** Moderate

---

## Phase 10: Gym Room

**Objective:** Build the Gym with data-driven PR visualization

**Dependencies:** Phase 9 complete

**Tasks:**

### 10.1 Gym Geometry (~30 min)
- [ ] Create gym room chunk
- [ ] Barbell station centerpiece
- [ ] Achievement plaque wall
- [ ] Industrial/gym lighting

### 10.2 Plate Visualization (~45 min)
- [ ] Load lifts.manifest.json
- [ ] Calculate plate counts: `floor((weight - 45) / (2 * plateWeight))`
- [ ] InstancedMesh for plates (45lb, 25lb, 10lb, etc.)
- [ ] Plates render correctly on bar

### 10.3 PR Display (~30 min)
- [ ] Holographic text for PR numbers
- [ ] Date plaques for achievements
- [ ] Squat, Bench, Deadlift, Total displayed

**Acceptance Criteria:**
- [ ] Gym shows accurate PR data from manifest
- [ ] Plates visualize weight correctly
- [ ] PR display is readable and impressive

**Complexity:** Simple

---

## Phase 11: Projects Room

**Objective:** Build the Projects room with museum-style exhibits

**Dependencies:** Phase 10 complete

**Tasks:**

### 11.1 Projects Geometry (~30 min)
- [ ] Create projects room chunk
- [ ] Pedestal layout for exhibits
- [ ] Terminal/screen displays
- [ ] Museum-like lighting

### 11.2 Project Exhibits (~45 min)
- [ ] Load projects.manifest.json
- [ ] Generate pedestals from project data
- [ ] Project thumbnail on terminal screens
- [ ] Holographic project name labels

### 11.3 Project Interaction (~30 min)
- [ ] Click opens detail overlay
- [ ] Links to live project / GitHub
- [ ] "View Project" navigates to Normal site

**Acceptance Criteria:**
- [ ] Projects room shows all projects
- [ ] Project interactions work
- [ ] Links to external sites work

**Complexity:** Simple

---

## Phase 12: Post-Processing + Polish

**Objective:** Add cinematic post-processing and visual polish

**Dependencies:** Phase 11 complete

**Tasks:**

### 12.1 Post-Processing Stack (~45 min)
- [ ] Tone mapping (ACES) - all tiers
- [ ] Color grading (shader-based, no LUT)
- [ ] Selective bloom (Medium/High only, emissive >1.0)
- [ ] Vignette (Medium/High)
- [ ] Film grain (High only, optional)
- [ ] Gate by quality tier and reduced-motion

### 12.2 Lighting Polish (~30 min)
- [ ] Consistent lighting across rooms
- [ ] Baked lightmap placeholders (or real bakes if time)
- [ ] Reflection probes per room

### 12.3 Material Polish (~30 min)
- [ ] Verify PBR consistency
- [ ] Add surface detail: edge wear, dust, roughness variation
- [ ] No flat/plastic look

### 12.4 Reduced Motion (~20 min)
- [ ] Respect `prefers-reduced-motion`
- [ ] Provide explicit toggle in settings
- [ ] Skip: motion blur, camera sway, long transitions
- [ ] Use instant camera cuts

**Acceptance Criteria:**
- [ ] Post-processing looks cinematic
- [ ] Lighting is consistent and flattering
- [ ] Materials look premium
- [ ] Reduced motion respected

**Complexity:** Moderate

---

## Phase 13: Mobile Optimization

**Objective:** Ensure smooth mobile experience

**Dependencies:** Phase 12 complete

**Tasks:**

### 13.1 Mobile Quality Tier (~30 min)
- [ ] Auto-detect mobile devices
- [ ] Default to Low tier on mobile
- [ ] Never auto-upgrade on mobile (battery)
- [ ] Larger tap targets for interactions

### 13.2 Mobile Input Polish (~30 min)
- [ ] Tap-to-move as primary
- [ ] Room label waypoints work correctly
- [ ] No pointer lock requirement
- [ ] No browser gesture conflicts

### 13.3 Performance Verification (~45 min)
- [ ] Test on iPhone 12 Safari
- [ ] Test on mid-range Android Chrome
- [ ] Verify 30fps at Low tier
- [ ] Verify FCF <5s

**Acceptance Criteria:**
- [ ] Mobile experience is smooth
- [ ] 30fps on target mobile devices
- [ ] No gesture conflicts
- [ ] Tap-to-move works reliably

**Complexity:** Simple

---

## Phase 14: Settings + Accessibility

**Objective:** Complete settings menu and accessibility features

**Dependencies:** Phase 13 complete

**Tasks:**

### 14.1 Settings Menu (~45 min)
- [ ] Quality tier: Auto/Low/Medium/High
- [ ] Reduced motion toggle
- [ ] Camera: Third-person/First-person
- [ ] Sensitivity, invert Y, camera distance
- [ ] Mobile: joystick toggle
- [ ] Debug overlay (dev only): FPS, frame time, chunk state, draw calls, triangle count, texture count, VRAM estimate, JS heap size

### 14.2 Keyboard Navigation (~30 min)
- [ ] Menus accessible via keyboard
- [ ] Visible focus states
- [ ] Esc opens settings menu

### 14.3 Screen Reader Fallback (~30 min)
- [ ] Canvas is aria-hidden
- [ ] Provide accessible summary of room content
- [ ] Link to Normal site for full content

### 14.4 Security (~20 min)
- [ ] Sanitize any CMS HTML in overlays
- [ ] Verify CSP constraints
- [ ] External links: rel="noopener noreferrer"

**Acceptance Criteria:**
- [ ] Settings work and persist
- [ ] Keyboard navigation functional
- [ ] Accessibility basics covered
- [ ] No security vulnerabilities

**Complexity:** Simple

---

## Phase 15: QA + Launch Verification

**Objective:** Full testing and launch readiness

**Dependencies:** Phase 14 complete

**Tasks:**

### 15.1 Device Matrix Testing (~60 min)
- [ ] MacBook Air M1 - Chrome, Safari
- [ ] iPhone 12+ - Safari (P0)
- [ ] Pixel 6 / Samsung S21 - Chrome (P0)
- [ ] Windows laptop - Chrome, Edge (P1)
- [ ] iPad - Safari (P1)

### 15.2 Performance Verification (~30 min)
- [ ] FCF <5s on 50Mbps
- [ ] 60fps on M1 at Medium tier
- [ ] 30fps on iPhone 12 at Low tier
- [ ] Memory stable over 10-minute session
- [ ] No memory leaks from disposal

### 15.3 Normal Site Verification (~20 min)
- [ ] No prefetch of /interactive from Normal links
- [ ] No regression in Core Web Vitals
- [ ] Zero Three.js bytes in Normal bundles (bundle analysis)

### 15.4 Functionality Verification (~30 min)
- [ ] All rooms reachable and functional
- [ ] All content interactions work
- [ ] State restoration works after Normal navigation
- [ ] Settings persist across sessions
- [ ] Error recovery UI works

### 15.5 Testing (~60 min)
- [ ] Unit tests:
  - Manifest generation schema validation
  - Capability detection logic
  - Quality tier selection logic
  - Chunk state machine transitions
- [ ] Integration tests:
  - GLTFLoader with KTX2/Meshopt loads correctly
  - Disposal actually frees memory (verify with renderer.info)
  - State restoration from localStorage + query params
  - Tab suspension recovery (simulate visibility change, verify context)
- [ ] E2E tests:
  - Enter Interactive from Normal
  - Navigate to each room
  - Open content overlay
  - Navigate to Normal and return
  - Complete flow on mobile viewport

### 15.6 Device Matrix Completion (~30 min)
- [ ] Firefox desktop (P2 priority)
- [ ] Verify all P1/P2 devices pass basic functionality

**Acceptance Criteria:**
- [ ] All P0 devices pass testing
- [ ] All performance targets met
- [ ] All functionality works
- [ ] All unit/integration/e2e tests pass
- [ ] Firefox P2 verified

**Complexity:** Moderate

---

## Phase 16: Codex Final Cross-Check + Launch

**Objective:** Get final approval and ship

**Dependencies:** Phase 15 complete

**Tasks:**

### 16.1 Pre-Launch Checklist (~30 min)
- [ ] All phases complete in this plan
- [ ] All quality gates pass (typecheck, lint, build)
- [ ] All tests pass
- [ ] Manual verification on device matrix complete

### 16.2 Codex Final Cross-Check (~60 min)
- [ ] Call Codex for final review
- [ ] Address any issues found
- [ ] Get "ship it" verdict

### 16.3 Capture Learnings (~20 min)
- [ ] Update LEARNINGS.md with:
  - What worked
  - What failed
  - Patterns for future

### 16.4 Ship (~10 min)
- [ ] All commits pushed
- [ ] PR opened (if on feature branch)
- [ ] Celebrate

**Acceptance Criteria:**
- [ ] Codex verdict: "ship it"
- [ ] All commits pushed
- [ ] Learnings captured

**Complexity:** Simple

---

## Post-Launch (V1.1 - Deferred)

Per spec, these are explicitly deferred:

- **Study Room + Knowledge Graph Hologram** (moved from MVP)
- Audio (ambient + positional)
- Gaussian Splat integration
- Additional rooms
- WebGPU exploration
- Animation polish

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Asset weight exceeds budgets | CI gates in Phase 2, aggressive KTX2/Meshopt |
| Mobile Safari performance | Early device testing Phase 4, default Low tier |
| Shader compilation jank | Warmup phase in Phase 1 |
| Memory leaks | Disposal protocol Phase 6, monitoring throughout |
| Three.js leaks to Normal | Bundle analysis Phase 2, manual prefetch Phase 0 |
| Art quality shortfall | Clear texel density targets, PBR discipline |

---

## Definition of Done

1. All 16 phases marked complete
2. All cross-agent reviews passed (plan + phase + final)
3. All quality gates pass (typecheck, lint, build)
4. Codex final verdict: "ship it"
5. Manual verification on P0 device matrix
6. All commits pushed
7. Learnings captured in LEARNINGS.md
