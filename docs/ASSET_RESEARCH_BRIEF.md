# 3D Asset Research Brief — Interactive World

## Project Context

I'm building an interactive 3D "secret level" for my personal portfolio website at trey.world. It's a virtual mansion that visitors can explore in first-person, where each room maps to different content on my site:

- **Exterior**: Dramatic entrance with a sci-fi mech, mountains, and O'Neill cylinders in the sky
- **Main Hall**: Grand foyer with doors leading to other rooms
- **Library**: My book reviews displayed as physical books on shelves
- **Gym**: My powerlifting PRs visualized as loaded barbells
- **Projects Room**: Museum-style exhibits for my software projects

**Tech stack**: React Three Fiber (Three.js), running in the browser. Assets must be web-optimized.

**Visual style target**: High-end sci-fi meets cozy study. Think Blade Runner meets a wealthy collector's private mansion. Dark, moody, with warm accent lighting and electric purple/blue highlights. NOT cartoony or low-poly stylized — aiming for believable PBR materials with character.

**Current state**: All geometry is placeholder boxes/cylinders. I need actual 3D models to make it look polished.

---

## Technical Requirements (All Assets)

### File Format
- **GLTF 2.0 / GLB** (binary GLTF preferred)
- Must be compatible with Three.js / React Three Fiber
- No proprietary formats (FBX/MAX acceptable only if easily convertible)

### Optimization Targets
- **Total scene budget**: <500MB memory with 2 rooms loaded
- **Individual chunk targets**:
  - Room GLB files: 5-15MB each (compressed)
  - Hero props (mech): up to 20MB
  - Small props: <2MB each
- **Polygon budget per room**: 50k-150k triangles
- **Must support**: Meshopt compression, KTX2/Basis texture compression

### Texture Specifications
- **PBR Metallic-Roughness workflow** (not Specular-Glossiness)
- Required maps: Base Color, Normal, Roughness, Metallic
- Optional maps: Ambient Occlusion, Emissive
- **Resolution**:
  - Hero assets: 2048x2048
  - Room surfaces: 1024x1024
  - Background/distant: 512x512
- **Format**: PNG or JPEG (will be converted to KTX2)

### Licensing
- Must allow commercial use on a personal website
- Prefer: CC0, CC-BY, or royalty-free commercial license
- Must NOT require attribution in a way that's impractical for a 3D scene

---

## Asset Requirements by Category

### 1. EXTERIOR ENVIRONMENT

#### 1.1 Mansion Building
**What**: A grand gothic-industrial mansion facade. 2-3 stories, imposing but inviting. Should have:
- Large central entrance door (will be interactive)
- Multiple windows with potential for interior glow
- Architectural details (columns, cornices, or industrial piping)
- Materials: dark brick/stone, metal trim, glass

**Why**: This is the first thing visitors see. Sets the tone for the entire experience.

**Specs**:
- Dimensions: roughly 20m wide × 12m tall × 15m deep
- Should be optimized for exterior viewing (interior not needed)
- Baked ambient occlusion preferred

**Style references**: Victorian industrial, Dishonored architecture, Batman Arkham mansion vibes

---

#### 1.2 Mech (Hero Asset)
**What**: A large bipedal industrial mech, 8-10 meters tall. Idle/powered-down pose. Should look like it belongs to "Goff Industries" — a personal project/brand.

**Why**: This is THE hero asset of the exterior. A statement piece that makes visitors go "whoa."

**Specs**:
- Height: ~10m in-world scale
- Should support idle animation (subtle hydraulic hum, head scanning)
- Cockpit or head with visor that can have emissive glow
- Materials: weathered metal, industrial paint, rubber joints
- Higher poly budget acceptable: up to 50k tris

**Style references**: Titanfall mechs, MechWarrior, Iron Harvest walkers, Avatar AMP suits. NOT anime-style — more utilitarian/military.

---

#### 1.3 Garage Structure
**What**: Smaller outbuilding that matches the mansion aesthetic. Could be a carriage house, workshop, or literal garage.

**Why**: Adds depth to the scene, potential future expansion point.

**Specs**:
- Dimensions: ~10m × 6m × 8m
- Should have a large door (potential future interactive element)
- Matching materials to mansion

---

#### 1.4 Mountains / Terrain
**What**: Distant mountain range for backdrop. Snow-capped peaks or dramatic rocky formations.

**Why**: Establishes scale and environment. Currently just flat cones.

**Specs**:
- Can be low-poly (distant background)
- Should tile or extend across backdrop
- Neutral colors that don't compete with foreground

**Alternative**: Could be a terrain heightmap + texture rather than modeled geometry.

---

#### 1.5 O'Neill Cylinders (Sci-Fi Background)
**What**: 2-3 large rotating space station cylinders visible in the sky. Classic sci-fi megastructure.

**Why**: Establishes the sci-fi setting. Tells visitors "this isn't just any mansion."

**Specs**:
- Very low poly (distant objects)
- Should have some surface detail (panels, windows, docking bays)
- Subtle emissive elements for lit sections

**Style references**: Interstellar, Elysium, Gundam colony cylinders, The Expanse

---

#### 1.6 Ground / Terrain
**What**: Textured ground plane with a path leading to the mansion entrance.

**Why**: Currently a solid gray plane. Needs visual interest.

**Specs**:
- Materials: gravel/packed earth, grass patches, stone path
- Should support shadow receiving
- Can be simple plane geometry with good textures

---

#### 1.7 Skybox / HDRI
**What**: Environment map for sky and ambient lighting. Either dramatic twilight sky or space station interior view.

**Why**: Defines the entire lighting mood of the exterior.

**Specs**:
- HDRI format (HDR or EXR)
- Resolution: 4K minimum (4096×2048)
- Should include light source for realistic shadows

**Options to research**:
- Twilight/dusk sky with dramatic clouds
- Space environment with nebula/stars
- Interior of a larger space station (looking out from inside an O'Neill cylinder)

---

### 2. MAIN HALL (Interior)

#### 2.1 Grand Foyer Room Shell
**What**: Complete interior of a grand entrance hall. High ceiling, ornate but not cluttered.

**Why**: Sets the interior tone. This is the hub connecting all other rooms.

**Specs**:
- Dimensions: 20m × 25m floor, 8m ceiling height
- Should include: floor, walls, ceiling as separate or easily-editable elements
- 4 door openings (one on each wall)
- Materials: marble or dark wood floor, wood/fabric wall panels, ornate ceiling

---

#### 2.2 Decorative Pillars
**What**: 4 matching pillars/columns for the hall corners.

**Why**: Adds architectural interest and defines the space.

**Specs**:
- Classical or industrial style
- ~3m tall
- Can be modular (base, shaft, capital)

---

#### 2.3 Chandelier
**What**: Central lighting fixture. Industrial-modern preferred over traditional crystal.

**Why**: Visual anchor for the room, light source.

**Specs**:
- Should work with emissive materials for glow effect
- ~2m diameter

---

#### 2.4 Central Pedestal / Hologram Display
**What**: Sci-fi display stand in the center of the room. Should look like it could project a hologram.

**Why**: Future interactive element, visual centerpiece.

**Specs**:
- ~1.5m tall pedestal
- Emissive ring/surface for hologram effect
- Could be futuristic or blend with room aesthetic

---

### 3. LIBRARY

#### 3.1 Library Room Shell
**What**: Warm, wood-paneled study/library interior.

**Why**: Houses my book collection visualization.

**Specs**:
- Dimensions: 18m × 16m floor
- Dark wood paneling, warm lighting feel
- Door opening to main hall

**Style references**: Traditional English library, Hogwarts library (less grand), cozy study

---

#### 3.2 Bookshelves
**What**: 6 tall wooden bookshelves that can hold many books.

**Why**: Core furniture for the room. Books are placed on these programmatically.

**Specs**:
- ~3m tall, ~2m wide
- 5-6 shelf levels
- Classic wood design
- Should be modular or at least consistent style
- Books will be separate geometry (see 3.3)

---

#### 3.3 Book Models (Optional)
**What**: A set of book meshes in varying sizes/thicknesses that can be instanced.

**Why**: Currently generating books as colored boxes. Real book meshes would look better.

**Specs**:
- 5-10 book variations (different heights, thicknesses)
- Very low poly (will be instanced hundreds of times)
- Simple texture or vertex color (I'll colorize programmatically)

**Alternative**: Could keep procedural books if shelves look good enough.

---

#### 3.4 Reading Nook Furniture
**What**: Cozy reading corner — armchair, side table, reading lamp.

**Why**: Adds life and habitability to the room.

**Specs**:
- Classic leather armchair
- Small side table (wood)
- Adjustable reading lamp (should have emissive element)

---

### 4. GYM

#### 4.1 Gym Room Shell
**What**: Industrial gym/garage interior. Rubber flooring, exposed structure.

**Why**: Houses the powerlifting equipment visualization.

**Specs**:
- Dimensions: 20m × 18m floor
- Materials: rubber floor mats, concrete/metal walls
- Industrial lighting feel

**Style references**: CrossFit box, powerlifting gym, garage gym

---

#### 4.2 Power/Squat Rack
**What**: Standard power rack with J-hooks for squatting.

**Why**: Core equipment for squat PR visualization.

**Specs**:
- Standard dimensions (~1.2m × 1.2m × 2.2m)
- Metal construction with realistic details
- J-hooks, safety bars

---

#### 4.3 Flat Bench
**What**: Standard flat bench for bench press.

**Why**: Core equipment for bench PR visualization.

**Specs**:
- Standard dimensions
- Padded top, metal frame

---

#### 4.4 Deadlift Platform
**What**: Wooden/rubber deadlift platform.

**Why**: Station for deadlift PR visualization.

**Specs**:
- ~2.4m × 1.2m
- Wood center with rubber sides (typical platform design)

---

#### 4.5 Olympic Barbell
**What**: Standard Olympic barbell (20kg/45lb).

**Why**: The bar that holds the weight plates.

**Specs**:
- 2.2m length, proper knurling texture
- Rotating sleeves on ends

---

#### 4.6 Weight Plates Set
**What**: Competition-style bumper plates in standard weights.

**Why**: Visualized based on actual PR weights.

**Specs**:
- Weights needed: 45lb (red), 35lb (yellow), 25lb (green), 10lb (blue), 5lb (white), 2.5lb (white)
- Bumper plate style (thick rubber with metal insert)
- Should be modular/instanceable

**Note**: These could stay procedural if modeling is expensive, but real plates would look much better.

---

### 5. PROJECTS ROOM

#### 5.1 Projects Room Shell
**What**: Dark museum/gallery space with track lighting aesthetic.

**Why**: Houses interactive project exhibits.

**Specs**:
- Dimensions: 22m × 18m floor
- Dark walls, polished dark floor
- Track lighting on ceiling
- Museum/gallery vibe

**Style references**: Modern art museum, Apple store aesthetic, tech showroom

---

#### 5.2 Display Pedestals
**What**: Modern pedestals for project displays. Each has an integrated screen/terminal.

**Why**: Each pedestal represents one project.

**Specs**:
- ~1m tall cylindrical or geometric base
- Integrated screen/display surface on top
- Should have emissive capability for screen glow
- Need 5-10 matching pedestals

---

### 6. GENERAL PROPS (Optional but Nice)

#### 6.1 Decorative Objects
- Potted plants (modern planters)
- Rugs for interior rooms
- Wall art frames (I'll texture with actual images)
- Small desk accessories (for library)

#### 6.2 Lighting Fixtures
- Wall sconces (matching main hall style)
- Floor lamps
- Track lighting fixtures

---

## Research Priorities

### Must-Have (Blocking)
1. **Mech** — Hero asset, most visible
2. **Mansion exterior** — First impression
3. **Room shells** (all 4 interiors) — Basic structure
4. **HDRI skybox** — Lighting foundation

### High Priority
5. **Bookshelves** — Core library feature
6. **Gym equipment** (rack, bench, platform) — Core gym feature
7. **Ground texture/terrain** — Exterior polish

### Nice-to-Have
8. **Mountains** — Background polish
9. **O'Neill cylinders** — Sci-fi flavor
10. **Furniture and props** — Details

---

## Source Suggestions to Research

### Asset Marketplaces
- **Sketchfab** — Large library, check licensing carefully
- **TurboSquid** — Professional quality, higher prices
- **CGTrader** — Good architectural models
- **Kitbash3D** — Premium sci-fi kits
- **Unity Asset Store / Unreal Marketplace** — May need format conversion

### Free Resources
- **Poly Haven** (polyhaven.com) — Free HDRIs, textures, some models
- **Sketchfab CC0** — Filter by Creative Commons Zero
- **Quaternius** — Free low-poly packs
- **Kenney** — Stylized assets (may be too cartoony)
- **NASA 3D Models** — Space-related assets
- **Blend Swap** — Blender community models

### Custom Creation Services
- **Fiverr / Upwork** — Commission custom models
- **ArtStation** — Find 3D artists for hire

---

## Output Format Requested

For each asset you find, please provide:
1. **Asset name** and source URL
2. **Price** (or "Free" with license type)
3. **File format** available
4. **Polygon count** if listed
5. **Why it's a good fit** for this project
6. **Any concerns** (wrong style, needs modification, etc.)

Prioritize web-ready GLB/GLTF formats. If only FBX/OBJ available, that's acceptable but note it will need conversion.

---

## Questions to Answer

1. What's the best single source for a cohesive mansion interior + exterior kit?
2. Are there any sci-fi mech models that match the industrial (not anime) aesthetic?
3. What's the best HDRI for a moody twilight/sci-fi exterior?
4. Can we find a complete gym equipment pack, or piece together individual assets?
5. Are there any asset bundles that would cover multiple needs at once?
