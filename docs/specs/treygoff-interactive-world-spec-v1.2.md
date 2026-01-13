# TreyGoff.com Interactive World

## Product Spec, Technical Architecture, and Art Pipeline

**Version:** 1.2 (Production Candidate)
**Date:** 2025-12-27
**Audience:** Senior engineer, technical artist, 3D artist, project lead
**Primary objective:** Ship an immersive 3D "secret level" personal website that feels like a high-end indie game, while keeping the Normal site fast, accessible, and unaffected.

---

## 1. Executive Summary

treygoff.com presents two experiences:

**Normal:** The existing fast 2D site—canonical content, best SEO, best Core Web Vitals. This is the primary experience for most visitors.

**Interactive:** `/interactive` loads a client-only 3D world (mansion exterior + interior rooms) that maps directly to site content and personal identity. This is the "secret level" for those who want to explore.

The Interactive world is intentionally small and curated—closer to a polished vertical slice than an open world. Rooms represent facets of identity:

| Room | Content Mapping |
|------|-----------------|
| **Library** | Blog posts and book reviews as physical books on shelves |
| **Gym** | Powerlifting PRs embodied as plates on a bar + plaques |
| **Study** | Holographic knowledge graph visualization |
| **Projects Room** | Museum-like exhibits for projects |
| **Exterior** | Mountains + sky with visible O'Neill cylinders; garage; custom "Goff Industries" mech |

**Quality mandate:** The Interactive route must avoid the "cheap WebGL demo" look. This requires a PBR pipeline aligned with glTF's metallic-roughness model, disciplined texel density, cinematic color grading, and restrained post-processing gated by quality tier and reduced-motion settings.

---

## 2. Goals, Non-goals, Success Criteria

### 2.1 Goals

**Delight and identity**
- The Interactive world should feel like a "secret level" that rewards exploration
- Visual identity target: "high-end sci-fi realism" with believable materials (wear, dust, micro-scratches)
- Every room should communicate something meaningful about who Trey is

**Performance**
- Normal route remains completely unaffected: no 3D dependencies in Normal bundles, no accidental background prefetch of `/interactive`
- Interactive hits stable framerate with graceful degradation:
  - Desktop/laptop (modern): target 60 FPS
  - Mobile (mid-range): target 30+ FPS with quality tier auto-selection

**Maintainability**
- Interactive is a visualization layer over canonical content
- Adding a blog post, project, or lift stat should not require 3D code changes
- Content flows from Normal site → build-time manifests → Interactive visualization

**Progressive enhancement**
- WebGL2 is baseline
- WebGPU is explicitly out of scope for launch (may be revisited post-launch if it provides measurable benefit)

### 2.2 Non-goals

- Multiplayer, combat, NPC crowds, complex physics sandboxing
- Large open world or AAA photoreal scope
- Long-form reading exclusively inside 3D—long reads route to Normal pages or clean overlay mode
- Audio at launch (explicitly deferred to post-launch)
- Gaussian Splat integration (explicitly deferred to V1.1)

### 2.3 Success Criteria

**Normal site**
- No regression in Core Web Vitals or JS payload compared to baseline
- "Explore Interactive" affordance must not automatically prefetch the heavy interactive bundle on page load
- Zero bytes of Three.js/R3F code in Normal bundles

**Interactive**
- **First Controllable Frame (FCF):** Under 5 seconds on 50 Mbps connection after loading minimal exterior chunk
- **Stability:** No crashes or severe memory growth during a 10-minute session on representative devices (iPhone 12 Safari, mid-range Android Chrome, M1 MacBook Air)
- **Reachability:** All rooms are reachable and core interactions work end-to-end
- **Memory:** Peak memory under 500MB at rest with 2 chunks loaded

**Post-launch**
- Measurable improvement in initial download size and GPU memory footprint through compression and stricter budgets

---

## 3. Principles and Hard Constraints

### 3.1 Route Isolation and "No Accidental Prefetch"

**Hard requirement:** Normal pages must not ship or prefetch Three.js/R3F bundles.

Implementation:
- The 3D app lives under `/interactive` as a client-only surface
- Any Normal-site `<Link href="/interactive">` must set `prefetch={false}` to prevent viewport-based background prefetch
- Manual prefetch occurs only after high-intent signals (hover >500ms, explicit "Load Interactive" click) using `router.prefetch()`

**Verification:** Bundle analysis in CI confirms zero Three.js imports in Normal route chunks.

### 3.2 "Works on Real Devices" Beats "Perfect on One Machine"

- Performance budgets, compression, chunking, and quality tiers are not optional
- Post effects are gated behind quality tiers and reduced-motion settings
- Every feature must be tested on the device matrix before merge

### 3.3 Memory and Disposal Discipline

Chunk streaming is a core strategy, which means unloading must actually free GPU and CPU resources. Three.js GLTF loading has special disposal considerations, including ImageBitmap handling that requires explicit cleanup.

### 3.4 Original IP Only

No third-party IP (Gundam, licensed vehicles, etc.). The mech is "Goff Industries Prototype"—an original design. All assets must be either original creations or properly licensed stock.

---

## 4. Known Limitations (Launch Scope)

These are explicit, intentional limitations for V1.0:

| Limitation | Rationale |
|------------|-----------|
| No audio | Complexity vs. value; deferred to post-launch |
| No Gaussian Splats | Bleeding-edge tech with unclear stability; deferred to V1.1 |
| No WebGPU | WebGL2 provides sufficient capability; WebGPU adds risk |
| No pointer lock requirement | Safari support is inconsistent; input works without it |
| Knowledge graph capped at 500 nodes | Performance cliff begins around 5K elements |
| No multiplayer or presence | Out of scope for personal portfolio |
| Mobile is "supported" not "optimized" | Desktop-first; mobile gets tap-to-move and reduced effects |

---

## 5. UX and Product Requirements

### 5.1 Entry Flow

1. **Landing (Normal):** User sees Normal site with clear choice: "Fast (Normal)" and "Explore (Interactive)"
2. **Interactive selection:**
   - Capability check (WebGL2, reduced motion, device memory heuristics)
   - Quality tier: Auto by default, with optional manual selection (Low/Med/High)
3. **Loading UX:**
   - Stylized progress bar with staged status text ("Initializing environment…", "Loading textures…", "Warming shaders…")
   - Shader warmup phase renders all materials off-screen to prevent first-frame stutter
4. **Cinematic intro (skippable):**
   - Fade from black, brief exterior sweep, settle into playable camera
5. **Always available:** "Return to Normal" affordance, never hidden

### 5.2 Controls

#### Desktop
- **Movement:** WASD / Arrow keys
- **Look:** Mouse look (pointer lock optional, not required)
- **Interact:** `E` or left click with reticle focus
- **Menu:** `Esc` opens settings

#### Mobile
Mobile is designed to feel premium and avoid fighting browser gestures:

- **Movement:** Tap-to-move on navmesh with smooth autopilot (default)
  - Tap ground to walk there
  - Tap room label signage to path directly to that room
- **Look:** Drag to pan camera
- **Interact:** Tap objects directly
- **Optional:** On-screen joystick available in settings for users who prefer it

### 5.3 Camera

**Default:** Third-person follow camera (cinematic, premium feel)
**Optional:** First-person mode available in settings

Rules:
- Camera transitions are smooth, using eased interpolation
- Reduced-motion mode disables camera sway, motion blur, aggressive zooms, and long cinematic sweeps
- Camera never clips through geometry

### 5.4 Interaction Design

**Goal:** Keep the world immersive without making content consumption miserable.

**Feedback states:**
- Hover highlight (desktop): Subtle outline/glow on interactables
- Tap highlight (mobile): Brief highlight on tap-down to confirm target
- Affordances: "Press E" / "Tap to open" hints near interactables

**Diegetic UI (preferred for short content):**
- Projects display on in-world monitors
- Books animate into inspect position, then offer "Open" and "Read"
- Gym PRs show as holographic text + physical plates

**Comfort UI (required for long reads):**
- Long-form content opens in clean DOM overlay panel, or
- Navigates to Normal route for that content
- Persistent "Return to Interactive" link restores last room/spawn

### 5.5 State Restoration

When navigating from Interactive → Normal → back to Interactive:

**Preserved state:**
- Last active room
- Last spawn position (within that room)
- Quality tier and settings
- Graph mode active/inactive (Study room)

**Storage mechanism:** Query params + localStorage (best-effort)

**Failure handling:** If restoration fails (localStorage cleared, chunk unavailable), spawn at main hall entrance with toast notification: "Couldn't restore your position—starting from the main hall."

### 5.6 Settings Menu

- Quality tier: Auto / Low / Medium / High
- Reduced motion toggle (in addition to respecting OS preference)
- Camera: Third-person (default) / First-person
- Input: Sensitivity, invert Y, camera distance
- Mobile: Enable joystick controls (off by default)
- Debug overlay (dev only): FPS, chunk state, draw calls, texture count, memory estimate

### 5.7 Accessibility

- Respect `prefers-reduced-motion` via CSS and JS; also provide explicit toggle
- Keyboard-accessible menus with visible focus states
- Non-WebGL fallback for unsupported devices:
  - Guided tour mode (video or screenshot gallery with same content hooks)
  - Always-available Normal site

---

## 6. World Design and Content Mapping

### 6.1 Spatial Layout

**Exterior**
- Mansion exterior with approach path and garage
- Sky: O'Neill cylinders visible as distant set dressing (static skybox elements)
- Hero prop: "Goff Industries Prototype" mech (original design)

**Interior**
- **Main Hall:** Hub with clear wayfinding to each room; acts as spawn point
- **Library:** Shelves with instanced books, reading nook, interactive book inspection
- **Gym:** Barbell station with data-driven plate counts, achievement plaques
- **Study:** Desk, hologram activator, knowledge graph mode
- **Projects Room:** Pedestals with project exhibits, in-world display terminals

### 6.2 Wayfinding

- Each doorway has readable signage
- Room labels double as tap-to-move navigation targets on mobile
- Subtle lighting and color temperature differences between rooms
- Main hall has clear sight lines to all doors

---

## 7. Technical Architecture

### 7.1 Platform and Rendering Strategy

- **Framework:** Next.js 16+ (App Router)
- **Interactive surface:** `/interactive` is client-only (no SSR for 3D scene)
- **Rendering baseline:** WebGL2
- **WebGPU:** Explicitly out of scope for V1.0

### 7.2 3D Stack

| Layer | Technology |
|-------|------------|
| Renderer | Three.js via React Three Fiber (R3F v9 + React 19) |
| Helpers | `@react-three/drei` |
| State | Zustand for app-level state (chunks, settings, UI) |
| Physics | `@react-three/rapier` (selective use for collision) |
| Character | `ecctrl` (pmndrs capsule controller) |
| Post-processing | `@react-three/postprocessing` (EffectComposer) |
| Pathfinding | `recast-navigation-js` (WASM) or `three-pathfinding` (decided in Sprint 1) |
| Knowledge Graph | `r3f-forcegraph` with pre-computed layout |

### 7.3 Bundle Control

- `/interactive` is a dedicated route segment with no shared imports from Normal UI
- Dynamic imports use Client Component boundaries (not Server Component dynamic imports, which don't code-split as expected)
- CI validates that Three.js never appears in Normal route bundles

### 7.4 Internal Module Decomposition

```
/interactive
├── InteractiveShell     # Capability detection, tier selection, loading UI, error boundaries
├── RendererRoot         # R3F Canvas config, WebGL context, shader warmup
├── WorldManager         # Chunk streaming state machine, spawn logic, door triggers
├── PlayerController     # Input routing, ecctrl integration, tap-to-move autopilot
├── InteractionSystem    # Raycast picking, hover/tap highlight, interactables registry
├── UIOverlaySystem      # Settings menu, content overlays, "Return to Normal"
├── rooms/
│   ├── Library          # Book instances, inspection mode
│   ├── Gym              # PR visualization, plates logic
│   ├── Study            # Hologram graph mode
│   └── Projects         # Exhibit pedestals, terminals
└── Telemetry            # Load milestones, engagement events, performance sampling
```

### 7.5 Renderer Configuration

R3F Canvas defaults provide a modern baseline (sRGB output, ACES filmic tone mapping). Preserve these defaults and ensure consistency across materials, environment maps, and post-processing.

**Shader warmup:** During loading phase, render all unique materials to an off-screen target to force shader compilation before the intro cinematic. This prevents first-frame jank.

### 7.6 Error Handling and Recovery

| Failure Mode | Detection | Recovery UX |
|--------------|-----------|-------------|
| WebGL context lost | `webglcontextlost` event | "Graphics context lost. [Reload Interactive]" button |
| Chunk load failure | Fetch error / timeout | Retry 2x with exponential backoff; then "Couldn't load [Room]. [Retry] [Return to Normal]" |
| Memory exhaustion | Performance.memory (Chrome) / heuristics | Auto-downgrade quality tier; if still failing, prompt reload |
| Shader compilation failure | GL error detection | Fall back to basic materials; log to telemetry |

---

## 8. Visual Pipeline and Art Direction

### 8.1 Art Direction Targets

**Style:** High-end sci-fi realism—believable wear, imperfect surfaces, cinematic lighting. Not photoreal, but grounded and tactile.

**Avoid:**
- Flat albedo-only assets
- "Clean plastic" untextured look
- Overly saturated or cartoonish colors
- Generic asset store aesthetic

### 8.2 PBR Workflow (glTF Metallic-Roughness)

All assets use glTF 2.0's core PBR metallic-roughness workflow.

**Authoring pipeline:**
1. **Modeling:** Blender (mid-poly with deliberate silhouette and normal detail)
2. **Texturing:** Substance Painter for hero assets and close-up props
3. **Material discipline:** Small, consistent set of master materials with instances

**Required surface detail:**
- Edge wear on metal and wood
- Dust accumulation in corners and crevices
- Fingerprint smudges on glass/screens
- Roughness variation (never uniform)

**Texture packing convention:**
- **Base Color:** sRGB, alpha channel for opacity if needed
- **Normal:** Linear, OpenGL format (green up)
- **ORM:** Linear, packed as R=AO, G=Roughness, B=Metalness

### 8.3 Texel Density Targets

| Asset Category | Target Density | Notes |
|----------------|----------------|-------|
| Hero close-up props (books, terminals) | 1024 px/m | Player can inspect these |
| Primary room surfaces (walls, floors) | 512 px/m | Tiling textures where appropriate |
| Background/exterior set dressing | 256 px/m | Never close to camera |

**Consistency rule:** Adjacent assets must have matching texel density to avoid jarring quality differences.

### 8.4 Lighting Strategy

- **Interiors:** Baked lightmaps for stable performance and rich GI
- **Exterior:** Single directional light with distance-limited real-time shadows
- **Real-time shadows:** Quality-tier gated (off on Low, limited on Medium, better on High)
- **Reflection probes:** One per room, compressed, modest resolution

### 8.5 Post-Processing Stack

Post-processing is gated by quality tier and reduced-motion preferences.

| Effect | Low | Medium | High | Reduced Motion |
|--------|-----|--------|------|----------------|
| Tone mapping (ACES) | ✓ | ✓ | ✓ | ✓ |
| Color grading (shader-based) | ✓ | ✓ | ✓ | ✓ |
| Selective bloom | ✗ | ✓ | ✓ | ✓ |
| Film grain | ✗ | ✗ | ✓ | ✗ |
| Motion blur | ✗ | ✗ | Optional | ✗ |
| Vignette | ✗ | ✓ | ✓ | ✓ |

**Color grading implementation:** Use shader-based color transform rather than 3D LUT texture to avoid precision issues on mobile GPUs.

**Bloom behavior:** Selective bloom triggered by emissive materials with values >1.0. Only screens, holograms, and accent lights should bloom.

---

## 9. Asset Strategy and Performance Architecture

### 9.1 Runtime Format

- **Format:** glTF 2.0 as `.glb` (binary container)
- **Extensions required:** `KHR_texture_basisu`, `EXT_meshopt_compression`
- **Extensions optional:** `KHR_draco_mesh_compression` (for exceptionally large meshes only)

### 9.2 Chunked Asset Structure

```
/assets/chunks/
├── exterior.glb        # Mansion exterior, sky elements, mech
├── mainhall.glb        # Entry hall, hub area
├── library.glb         # Shelves, furniture, book slots (books instanced separately)
├── gym.glb             # Equipment, plates, plaques
├── study.glb           # Desk, hologram projector base
├── projects.glb        # Pedestals, terminals
└── garage.glb          # Vehicles, tools, props

/assets/props/
├── books-atlas.glb     # Instanced book geometry + spine texture atlas
├── plates.glb          # Weight plate instances
└── mech.glb            # Hero mech (separate for LOD management)
```

### 9.3 Compression Pipeline

**Textures: KTX2 + Basis Universal**
- Hero assets: UASTC mode (higher quality, better for normals)
- Background assets: ETC1S mode (smaller, lower quality)
- Why: GPU-compressed textures reduce VRAM usage and upload time vs. PNG/JPEG which must be fully decompressed

**Geometry: Meshopt**
- Apply `EXT_meshopt_compression` to all chunks via glTF Transform CLI
- Fast decode, good compression ratio, no WASM decoder latency

**Draco:** Only for meshes >1M triangles where decode latency is acceptable

### 9.4 Loader Configuration

GLTFLoader must be configured before any loads:

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath('/basis/')
  .detectSupport(renderer);

const gltfLoader = new GLTFLoader()
  .setKTX2Loader(ktx2Loader)
  .setMeshoptDecoder(MeshoptDecoder);
```

### 9.5 Chunk Streaming State Machine

```
unloaded → preloading → loaded → active → dormant → disposed
    ↑                                         │
    └─────────────────────────────────────────┘
```

**State definitions:**
- **unloaded:** Not in memory, not requested
- **preloading:** Fetch initiated, not yet usable
- **loaded:** In memory, ready to activate
- **active:** Currently visible, player is in or near this chunk
- **dormant:** Recently active, kept in memory for quick return
- **disposed:** Explicitly freed (geometry, materials, textures disposed)

**Triggers:**
- Door proximity (15m): Start preloading target room
- Room entry: Activate room chunk, mark previous as dormant
- Memory pressure: Dispose oldest dormant chunks (keep max 2 dormant)

**Transition UX:** Fade to black (0.3s) to mask chunk activation; prevents pop-in

### 9.6 Disposal Protocol

When disposing a chunk:

1. Traverse all objects in chunk group
2. For each mesh:
   - `geometry.dispose()`
   - For each material: `material.dispose()`, dispose all texture maps
3. For textures created from ImageBitmap: call `texture.source.data.close()` if available
4. Remove from scene graph
5. Null references to allow GC

**Verification:** Monitor `renderer.info.memory` before/after disposal to confirm cleanup

### 9.7 Instancing Strategy

| Object Type | Count | Approach |
|-------------|-------|----------|
| Books (library) | 100-200 | InstancedMesh, per-instance color from atlas UV |
| Weight plates | 10-20 | InstancedMesh |
| Trophies/plaques | 5-10 | InstancedMesh |
| Repeated decor | Varies | InstancedMesh where >3 identical |

### 9.8 LOD Strategy

| Asset | LOD0 (near) | LOD1 (mid) | LOD2 (far) |
|-------|-------------|------------|------------|
| Mech | Full detail | 50% tris | 25% tris |
| Exterior props | Full | 50% | Billboard/impostor |
| Interior furniture | Full | 60% | N/A (culled) |

Transition distances calibrated during profiling.

### 9.9 Performance Budgets

**Per-chunk budgets (initial targets, calibrate after Sprint 2):**

| Metric | Budget | Enforcement |
|--------|--------|-------------|
| Compressed download | <2MB | CI gate |
| Triangles | <100K | CI gate |
| Draw calls contribution | <30 | Profiling check |
| Textures | <10 unique | CI gate |
| Estimated VRAM | <50MB | Profiling check |

**Scene-wide budgets:**

| Metric | Budget |
|--------|--------|
| Total triangles in view | <300K |
| Total draw calls | <100 |
| Peak memory (JS heap + GPU) | <500MB |
| Frame time | <16.6ms (60fps) on M1 MacBook Air |

### 9.10 Quality Tiers

| Setting | Low | Medium | High |
|---------|-----|--------|------|
| Device Pixel Ratio | 1.0 | 1.5 | min(2.0, native) |
| Shadow map size | None | 1024 | 2048 |
| Shadow distance | None | 20m | 40m |
| Post-processing | Minimal | Standard | Full |
| LOD bias | Aggressive | Normal | Quality |
| Reflection probe res | 64 | 128 | 256 |

**Auto tier behavior:**
1. Start at Medium
2. Sample frame time for first 60 frames
3. If P95 frame time >20ms, drop to Low
4. If P95 frame time <12ms consistently, allow upgrade to High
5. Never auto-upgrade on mobile (battery concern)

---

## 10. Data and Content Architecture

### 10.1 Canonical Sources

Interactive visualizes content from Normal site. These are the sources of truth:

| Content Type | Source | Format |
|--------------|--------|--------|
| Blog posts | `/content/blog/` | MDX with frontmatter |
| Book reviews | `/content/books/` | MDX with frontmatter |
| Projects | `/content/projects/` | MDX with frontmatter |
| Powerlifting stats | `/data/lifts.json` | JSON |
| Knowledge graph | `/data/knowledge-graph.json` | JSON (custom schema) |

### 10.2 Build-time Manifest Generation

Build script generates optimized manifests for Interactive consumption:

**`public/manifests/blog.manifest.json`**
```json
[
  {
    "id": "building-prospera",
    "slug": "building-prospera",
    "title": "Building Próspera",
    "excerpt": "How we're creating a new kind of jurisdiction...",
    "tags": ["governance", "zones", "startups"],
    "coverImage": "/images/blog/prospera-cover.jpg",
    "publishedAt": "2025-01-15"
  }
]
```

**`public/manifests/books.manifest.json`**
```json
[
  {
    "id": "book-sovereign-individual",
    "title": "The Sovereign Individual",
    "author": "Davidson & Rees-Mogg",
    "rating": 5,
    "reviewSlug": "sovereign-individual",
    "coverImage": "/images/books/sovereign-individual.jpg",
    "tier": "essential"
  }
]
```

**`public/manifests/projects.manifest.json`**
```json
[
  {
    "id": "project-sophon",
    "title": "Sophon HQ",
    "summary": "AI-powered productivity platform",
    "links": { "live": "https://sophon.app", "github": null },
    "images": ["/images/projects/sophon-1.jpg"],
    "tags": ["saas", "ai", "productivity"]
  }
]
```

**`public/manifests/lifts.manifest.json`**
```json
{
  "squat": { "weight": 500, "unit": "lbs", "date": "2023-06-15" },
  "bench": { "weight": 315, "unit": "lbs", "date": "2023-04-20" },
  "deadlift": { "weight": 545, "unit": "lbs", "date": "2023-07-01" },
  "total": { "weight": 1360, "unit": "lbs", "date": "2023-07-01" }
}
```

### 10.3 Room Data Binding

**Library:** Books generated from `books.manifest.json`. Spine labels rendered from pre-generated texture atlas (built from cover images at build time). Click opens overlay with review excerpt and "Read Full Review" link to Normal site.

**Gym:** Plate counts derived from `lifts.manifest.json`. Visual formula: `plateCount = floor((weight - barWeight) / (2 * plateWeight))`. Plaques driven by achievement dates.

**Projects Room:** Pedestals generated from `projects.manifest.json`. Terminal screens show project summary; click opens overlay or navigates to project page.

---

## 11. Knowledge Graph Hologram (Study Room)

### 11.1 Feature Overview

The Study room contains a hologram activator button. When pressed, the room dims and a 3D force-directed knowledge graph materializes, visualizing connections between concepts, projects, books, ideas, and people from Trey's knowledge base.

**Design target:** Premium sci-fi hologram interface—instant materialization, smooth camera transitions, responsive interactions. Never janky physics simulation warmup.

### 11.2 Scale and Performance Budget

**Target scale:** 200-500 nodes, 500-2000 edges

| Metric | Target |
|--------|--------|
| Frame rate | 60fps stable during interaction |
| Simulation tick | <5ms (achieved via pre-computation) |
| Render time | <10ms (InstancedMesh) |
| Memory footprint | 50-100MB |
| First render | Instant (pre-computed layout) |

**Performance cliff:** Degradation begins ~5,000 elements. Current architecture supports future migration to GPU-accelerated solutions if needed.

### 11.3 Technical Implementation

**Library:** `r3f-forcegraph` (official R3F bindings by vasturiano)

Rationale:
- Integrates directly into existing R3F scene as Object3D child
- No separate renderer or WebGL context conflicts
- Supports d3-force-3d and ngraph physics engines
- TypeScript support, active maintenance

**Physics engine:** `forceEngine="ngraph"` for faster processing at scale

### 11.4 Pre-computed Layout Strategy

**Principle:** Eliminate runtime simulation jitter by computing positions at build time.

**Build workflow:**
1. Author `knowledge-graph.json` (nodes + links, no positions)
2. Build script runs d3-force-3d simulation (~300 ticks)
3. Export `graph-with-positions.json` with x/y/z coordinates
4. Runtime loads pre-positioned graph, renders instantly

**Build script:** `scripts/precompute-graph-layout.mjs`
```javascript
import * as d3 from 'd3-force-3d';
import fs from 'fs';

const rawGraph = JSON.parse(fs.readFileSync('src/data/knowledge-graph.json'));

const simulation = d3.forceSimulation(rawGraph.nodes, 3)
  .force("charge", d3.forceManyBody().strength(-120))
  .force("link", d3.forceLink(rawGraph.links).id(d => d.id).distance(50))
  .force("center", d3.forceCenter())
  .stop();

for (let i = 0; i < 300; i++) simulation.tick();

const output = {
  ...rawGraph,
  nodes: rawGraph.nodes.map(n => ({ ...n, fx: n.x, fy: n.y, fz: n.z }))
};

fs.writeFileSync('src/data/graph-with-positions.json', JSON.stringify(output, null, 2));
```

### 11.5 Data Schema

**File:** `src/data/knowledge-graph.json`

```json
{
  "meta": {
    "version": "1.0",
    "generated": "2025-01-15T10:30:00Z",
    "nodeCount": 342,
    "linkCount": 891
  },
  "nodes": [
    {
      "id": "concept-special-jurisdictions",
      "label": "Special Jurisdictions",
      "type": "concept",
      "group": "governance",
      "size": 2.0,
      "color": "#4ecdc4",
      "tags": ["policy", "zones", "innovation"],
      "excerpt": "Geographically-bounded areas with distinct regulatory frameworks",
      "source": "notes/governance/special-jurisdictions.md",
      "x": 124.5, "y": -87.2, "z": 45.8
    }
  ],
  "links": [
    {
      "source": "concept-special-jurisdictions",
      "target": "project-prospera",
      "relation": "implemented_by",
      "weight": 1.0,
      "directed": true
    }
  ],
  "types": {
    "concept": { "color": "#4ecdc4", "shape": "sphere" },
    "project": { "color": "#ff6b6b", "shape": "box" },
    "book": { "color": "#ffe66d", "shape": "octahedron" },
    "idea": { "color": "#c7f464", "shape": "sphere" },
    "person": { "color": "#95e1d3", "shape": "sphere" }
  },
  "relations": {
    "references": { "style": "solid", "directed": true },
    "influences": { "style": "dashed", "directed": true },
    "related_to": { "style": "dotted", "directed": false }
  }
}
```

### 11.6 Hologram Activation UX

1. User approaches Study desk, sees "Activate Hologram" prompt
2. User presses `E` or taps activation button
3. Room lights dim (0.5s transition)
4. Graph materializes with scale-up animation (0.3s)
5. Camera pulls back to frame the graph
6. Graph is interactive: orbit, click nodes, filter by type
7. "Exit Graph Mode" always visible
8. On exit: reverse transition, restore room state

### 11.7 Interactions

- **Node click:** Opens overlay with node details and navigation to source
- **Fly-to-node:** Smooth camera orbit to center selected node (1.2s ease)
- **N-hop focus:** Filter to show only nodes within N hops of selection
- **Hover:** Highlight node + connections, show excerpt tooltip after 300ms

### 11.8 Accessibility

- **Reduced motion:** Skip animations, pre-compute full layout, instant camera cuts
- **Fallback:** Collapsible data table with node/type/connection columns
- **Screen reader:** Canvas is `aria-hidden`; data table provides accessible content

### 11.9 Dependencies

```json
{
  "r3f-forcegraph": "^1.x",
  "@tweenjs/tween.js": "^21.x",
  "d3-force-3d": "^3.x"  // build-time only
}
```

---

## 12. Asset Pipeline and CI Enforcement

### 12.1 Pipeline Tools

- **Modeling:** Blender 4.x
- **Texturing:** Substance Painter
- **Optimization:** glTF Transform CLI
- **Compression:** Basis Universal (via glTF Transform), Meshopt

### 12.2 Per-Asset Pipeline Steps

```
source.blend
    ↓ Export as glTF
raw.glb
    ↓ Validate (scale, UVs, materials)
    ↓ Optimize (merge, remove hidden)
    ↓ Compress textures → KTX2
    ↓ Compress geometry → Meshopt
    ↓ Generate hash filename
chunk-[hash].glb
    ↓ Generate budget report
chunk-report.json
```

### 12.3 CI Gates

Build fails if any chunk violates:

| Check | Threshold |
|-------|-----------|
| Compressed size | >2MB |
| Triangle count | >100K |
| Texture count | >10 |
| Missing KTX2 textures | Any |
| Missing Meshopt compression | Any |
| Manifest references missing asset | Any |

### 12.4 Technical Artist Guidelines

**Before modeling:**
- Confirm texel density tier for asset category
- Plan UV layout for ORM packing
- Allocate lightmap UV channel (UV1)

**Modeling rules:**
- Real-world scale (1 Blender unit = 1 meter)
- Y-up orientation
- Apply transforms before export
- No n-gons in final mesh

**Material rules:**
- Use Principled BSDF only
- Name materials descriptively: `M_Wood_Oak_Worn`
- No procedural textures (bake to image)

**Export settings:**
- Format: glTF 2.0 Binary (.glb)
- Apply Modifiers: Yes
- Include: UVs, Normals, Vertex Colors, Materials
- Compression: None (applied by pipeline)

---

## 13. Observability and Telemetry

### 13.1 Load Milestones

Track timing for:
- Capability check complete
- Download start (per chunk)
- Download complete (per chunk)
- Shader warmup complete
- First render
- First input received
- First Controllable Frame (FCF)

### 13.2 Engagement Events

- Entry choice: Normal vs Interactive
- Room entered (with dwell time)
- Book opened (which book)
- Project viewed (which project)
- Graph mode activated
- Graph node clicked
- Quality tier changed
- "Return to Normal" clicked

### 13.3 Performance Sampling

- Quality tier (initial and current)
- FPS buckets (0-15, 15-30, 30-45, 45-60, 60+) sampled every 5s
- Long frame detection (>50ms)
- Memory warnings (if available via Performance API)
- WebGL context lost events

### 13.4 Debug Overlay (Dev Only)

Display when enabled:
- Current FPS / frame time
- Active chunk / chunk states
- Draw calls / triangles
- Texture count / estimated VRAM
- JS heap size (Chrome)

---

## 14. Security and Privacy

- Sanitize any CMS HTML before rendering in overlays
- Tight CSP: no inline scripts, limited external sources
- External links: `rel="noopener noreferrer"`
- Analytics: Privacy-respecting, minimal by default (Plausible or similar)
- No PII collection beyond standard analytics

---

## 15. Testing and QA

### 15.1 Test Layers

**Unit tests:**
- Manifest generator schema validation
- Capability detection logic
- Quality tier selection logic
- Chunk state machine transitions

**Integration tests:**
- GLTFLoader with KTX2/Meshopt loads correctly
- Disposal actually frees memory
- State restoration from localStorage

**E2E tests:**
- Enter Interactive from Normal
- Navigate to each room
- Open content overlay
- Navigate to Normal and return
- Complete flow on mobile viewport

### 15.2 Device Matrix

| Device | Browser | Priority |
|--------|---------|----------|
| MacBook Air M1 | Chrome, Safari | P0 |
| iPhone 12+ | Safari | P0 |
| Pixel 6 / Samsung S21 | Chrome | P0 |
| Windows laptop (GTX 1060) | Chrome, Edge | P1 |
| iPad | Safari | P1 |
| Firefox (desktop) | Firefox | P2 |

### 15.3 Performance Test Protocol

For each device in matrix:
1. Cold load `/interactive` on 50Mbps throttled connection
2. Measure FCF (target: <5s)
3. Navigate to each room, measure FPS during transition
4. Spend 2 minutes exploring, monitor for memory growth
5. Activate graph mode, verify 60fps interaction
6. Leave tab for 5 minutes, return, verify recovery

---

## 16. Delivery Plan

### Phase Structure

The project is divided into two phases:

**MVP (Sprints 0-5):** Core experience, ship when complete
**V1.1 (Post-launch):** Polish and expansion

### Sprint 0: Foundations (2 weeks)

**Deliverables:**
- `/interactive` route exists, isolated from Normal bundles
- Normal site link does not prefetch `/interactive`
- GLTFLoader wired with KTX2, Meshopt
- R3F canvas renders test scene
- Asset pipeline skeleton outputs metrics
- CI gates defined and enforced
- Performance budgets documented

**Exit criteria:**
- Bundle analysis confirms zero Three.js in Normal chunks
- Test GLB with KTX2 textures loads and renders

### Sprint 1: Vertical Slice (2 weeks)

**Deliverables:**
- Exterior chunk loads with progress UI
- ecctrl character movement works (desktop)
- Mobile tap-to-move prototype on placeholder navmesh
- One interior "library corner" with:
  - Substance-textured PBR assets
  - Baked lighting
  - Color grade + selective bloom (Medium/High tier)
- Shader warmup eliminates first-frame jank

**Exit criteria:**
- 60fps on M1 MacBook Air
- 30fps on iPhone 12
- FCF <5s on 50Mbps
- No visible shader compilation stutter

### Sprint 2: Chunk Streaming + Circuit Breaker (2 weeks)

**Deliverables:**
- Chunk state machine implemented
- Door triggers preload adjacent rooms
- Fade transitions mask chunk swaps
- Disposal verified (memory returns to baseline)
- Library room complete

**Circuit Breaker checkpoint:**
At end of Sprint 2, hard stop for profiling:
- If FCF >8s on target devices: pause features, optimize
- If memory growth >100MB over 5 minutes: fix disposal before continuing
- If FPS <45 on M1: reduce chunk complexity or effects

**Exit criteria:**
- 10-minute session shows stable memory
- All disposal paths verified with `renderer.info`

### Sprint 3: Content Manifests + Gym Room (2 weeks)

**Deliverables:**
- Build-time manifest generation for all content types
- Library books from manifest with interaction
- Gym room with PR visualization
- Content overlays open correctly
- "Read more" navigates to Normal with return link

**Exit criteria:**
- Adding a blog post to Normal site appears in Interactive after rebuild
- State restoration works after Normal navigation

### Sprint 4: Projects Room + Polish (2 weeks)

**Deliverables:**
- Projects room with pedestals from manifest
- Project detail overlays
- All rooms reachable and functional
- Mobile tap-to-move refined with room label waypoints
- Settings menu complete
- Quality tier auto-selection working

**Exit criteria:**
- Full walkthrough on all P0 devices
- Settings persist across sessions

### Sprint 5: QA + Launch (2 weeks)

**Deliverables:**
- Cross-browser QA complete
- Accessibility audit passed (reduced-motion, keyboard nav, fallbacks)
- Telemetry integrated
- Error handling for all failure modes
- Launch checklist complete

**Exit criteria:**
- No P0 bugs
- All acceptance criteria met
- Monitoring dashboards ready

### Post-MVP: V1.1 Features

Explicitly deferred to post-launch:
- Audio (ambient + positional)
- Study room knowledge graph hologram
- Gaussian Splat integration for project artifacts
- Third-person camera animation polish
- Additional rooms (if warranted)
- WebGPU exploration

---

## 17. Launch Acceptance Checklist

### Normal Site
- [ ] No prefetch of `/interactive` from viewport links
- [ ] No regression in Core Web Vitals (LCP, CLS, INP)
- [ ] Zero Three.js bytes in Normal bundles (verified by CI)

### Interactive: Performance
- [ ] FCF <5s on 50Mbps connection
- [ ] 60fps on M1 MacBook Air at Medium tier
- [ ] 30fps on iPhone 12 at Low tier
- [ ] Memory stable over 10-minute session
- [ ] No memory leaks from chunk disposal

### Interactive: Functionality
- [ ] All rooms reachable
- [ ] All content interactions work (books, projects, gym)
- [ ] Mobile tap-to-move works without browser gesture conflicts
- [ ] State restoration works after Normal navigation
- [ ] Settings persist and apply correctly

### Interactive: Quality
- [ ] PBR materials look correct (metalness, roughness, normals)
- [ ] Lighting is consistent and flattering
- [ ] Post-processing is tier-appropriate
- [ ] No visible pop-in or LOD transitions
- [ ] Reduced-motion preference respected

### Interactive: Resiltic
- [ ] WebGL context loss shows recovery UI
- [ ] Chunk load failure shows retry UI
- [ ] Graceful fallback for unsupported devices

### Observability
- [ ] All load milestones tracked
- [ ] Engagement events firing
- [ ] Performance sampling active
- [ ] Error reporting integrated

---

## 18. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Asset weight exceeds budgets | Medium | High | CI gates, weekly budget reviews, aggressive KTX2 |
| Mobile Safari performance issues | High | Medium | Tap-to-move default, aggressive quality reduction, early testing |
| Shader compilation jank | Medium | High | Shader warmup phase, material count discipline |
| Memory leaks from improper disposal | Medium | High | Disposal protocol, memory monitoring, automated tests |
| Timeline slip due to art production | Medium | Medium | Placeholder art for early sprints, art pipeline parallel to eng |
| Knowledge graph too complex | Low | Medium | Deferred to V1.1, giving more time for polish |
| WebGL context instability | Low | High | Recovery UI, telemetry on context loss frequency |

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **FCF** | First Controllable Frame—when user can move and look |
| **Chunk** | A discrete loadable unit (room or area) |
| **Dormant** | Chunk kept in memory but not active |
| **ORM** | Packed texture: Occlusion, Roughness, Metalness |
| **KTX2** | GPU texture container format with Basis Universal compression |
| **Meshopt** | Geometry compression extension for glTF |
| **ecctrl** | pmndrs capsule character controller for R3F |
| **Diegetic UI** | UI that exists within the 3D world (screens, holograms) |
| **Quality tier** | Performance preset (Low/Medium/High) |

---

## 20. References

### Next.js
- Next.js 16: https://nextjs.org/blog/next-16
- Link prefetch: https://nextjs.org/docs/app/api-reference/components/link
- Manual prefetching: https://nextjs.org/docs/app/guides/prefetching
- Lazy loading: https://nextjs.org/docs/app/guides/lazy-loading

### React Three Fiber
- Introduction: https://r3f.docs.pmnd.rs/getting-started/introduction
- Installation: https://r3f.docs.pmnd.rs/getting-started/installation
- Canvas defaults: https://r3f.docs.pmnd.rs/api/canvas

### Three.js
- GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- KTX2Loader: https://threejs.org/docs/#examples/en/loaders/KTX2Loader
- DRACOLoader: https://threejs.org/docs/#examples/en/loaders/DRACOLoader
- InstancedMesh: https://threejs.org/docs/#api/en/objects/InstancedMesh

### Compression
- KHR_texture_basisu: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md
- EXT_meshopt_compression: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md
- glTF Transform: https://gltf-transform.dev/

### Ecosystem
- drei: https://drei.docs.pmnd.rs/
- react-three-rapier: https://pmndrs.github.io/react-three-rapier/
- ecctrl: https://github.com/pmndrs/ecctrl
- react-postprocessing: https://react-postprocessing.docs.pmnd.rs/
- r3f-forcegraph: https://github.com/vasturiano/r3f-forcegraph

### Accessibility
- prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Pointer Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
- WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

### Standards
- glTF 2.0 Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- PBR in glTF: https://www.khronos.org/gltf/pbr
