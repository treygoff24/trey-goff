# Living Nebula v3 — Specification

## Overview

Rewrite the Floating Library's nebula visual effects using pure procedural Three.js/R3F. No Blender textures, no pre-rendered assets. All effects generated in GPU shaders.

**Goal:** Premium, artistic, "video-worthy" visuals that are also performant enough for 44 simultaneous nebulae on mid-tier devices.

**Aesthetic:** "Living Nebula" — Soft ethereal base with structured wisps that slowly drift and breathe. Ancient and alive, not aggressive. Dreamlike softness, visible detail on closer inspection, organic motion.

## Functional Requirements

### F1: Nebula Visual Components

Each nebula consists of four layered components:

| Layer | Purpose | Always Visible |
|-------|---------|----------------|
| **NebulaCore** | Soft glowing ellipsoid, radial falloff | Yes |
| **NebulaRim** | Fresnel edge highlight for definition | Yes |
| **NebulaWisps** | Billboard planes with animated fbm noise | LOD-gated |
| **NebulaDust** | Instanced particles for depth/sparkle | LOD-gated |

### F2: LOD (Level of Detail) System

Must support 44 nebulae visible simultaneously in universe view.

| LOD Tier | Trigger | Components | Draw Calls |
|----------|---------|------------|------------|
| **Tier 0** | Universe view, inactive | Core + Rim | 2 |
| **Tier 1** | Universe view, nearby | + 2 wisp planes | 4 |
| **Tier 2** | Constellation view, active | + 5 wisp planes + particles | ~7 |
| **Tier 3** | Book view | Same as Tier 2, reduced intensity | ~7 |

LOD transitions must crossfade smoothly (no pop-in).

### F3: Color System

Each nebula has a topic-based color from `TOPIC_COLORS` in `lib/library/types.ts`. Colors apply to:
- Core glow emissive
- Wisp shader uniforms
- Particle tint
- Rim highlight

### F4: Animation

All animation runs in GPU shaders via uniforms. No JS-side per-frame computation.

| Animation | Frequency | Effect |
|-----------|-----------|--------|
| Core breathing | ~0.3 Hz | Subtle intensity pulse (±5%) |
| Wisp drift | ~0.1 units/sec | Slow noise domain shift |
| Particle drift | Per-particle seeded | Gentle orbital motion |

Animation respects `reducedMotion` preference (disable all motion).

### F5: Integration Points

Must integrate with existing systems:
- **Store:** `viewLevel`, `transitionPhase`, `qualityLevel`, `postprocessingEnabled`
- **Constellation component:** Replace current `<VolumetricNebula>` usage
- **Performance monitor:** Respect quality level for particle counts

## Non-Functional Requirements

### NF1: Performance Targets

| Metric | Target |
|--------|--------|
| Universe view (44 nebulae) | 60 FPS on M1 MacBook Air |
| Constellation view (1 active) | 60 FPS on mid-tier laptop |
| Initial load | < 100ms (no texture loading) |
| Memory | < 50MB GPU for all nebulae |

### NF2: Code Quality

- All shaders in separate `.glsl` files or template literals (not inline strings)
- TypeScript strict mode compliance
- No `any` types
- Memoize all geometries, materials, and vectors
- No per-frame allocations

### NF3: Accessibility

- Nebulae are decorative; no accessibility requirements
- Existing labels and book interactions unchanged

## Technical Design

### Shader Architecture

**NebulaCoreMaterial** (ShaderMaterial):
```
Inputs: uColor (vec3), uIntensity (float), uTime (float)
Vertex: Pass vNormal, vViewDir for fresnel
Fragment: Soft radial falloff + fresnel rim + breathing pulse
Output: HDR emissive for bloom pickup
```

**NebulaWispMaterial** (ShaderMaterial):
```
Inputs: uColor (vec3), uOpacity (float), uTime (float)
Fragment: 4-octave fbm noise + domain warping + radial falloff
Output: Additive blended, HDR for bloom
```

**NebulaDust** (InstancedMesh + PointsMaterial or custom):
```
Count: 50-200 particles per nebula (LOD-dependent)
Animation: Orbital drift via shader or useFrame
```

### Component Hierarchy

```
<LivingNebula>
  ├── <NebulaCore />       // IcosahedronGeometry + NebulaCoreMaterial
  ├── <NebulaWisps />      // 2-5 Billboard planes + NebulaWispMaterial
  ├── <NebulaDust />       // InstancedMesh Points
  └── (position, color, LOD from props)
```

### File Structure

```
components/library/floating/
├── LivingNebula.tsx       // Main component
├── NebulaCore.tsx         // Core glow subcomponent
├── NebulaWisps.tsx        // Wisp planes subcomponent
├── NebulaDust.tsx         // Particle dust (reuse/refactor existing)
└── shaders/
    ├── nebulaCore.vert
    ├── nebulaCore.frag
    ├── nebulaWisp.vert
    └── nebulaWisp.frag
```

## Acceptance Criteria

1. **Visual Quality**
   - [ ] Nebulae look premium — soft, detailed, alive
   - [ ] No visible banding or artifacts
   - [ ] Colors match topic colors
   - [ ] HDR bloom pickup works correctly

2. **Performance**
   - [ ] 60 FPS in universe view with 44 nebulae
   - [ ] No frame drops during LOD transitions
   - [ ] Zero texture loading (pure procedural)

3. **LOD System**
   - [ ] Smooth crossfade between LOD tiers
   - [ ] Correct tier selection based on view level and active state
   - [ ] Particle system respects quality settings

4. **Animation**
   - [ ] Core breathing is subtle and organic
   - [ ] Wisps drift slowly without jumpiness
   - [ ] `reducedMotion` disables all animation

5. **Integration**
   - [ ] Drop-in replacement for existing VolumetricNebula
   - [ ] Works with existing Constellation component
   - [ ] Respects store state (viewLevel, transitionPhase, etc.)

6. **Code Quality**
   - [ ] TypeScript strict, zero errors
   - [ ] ESLint clean
   - [ ] Build passes
   - [ ] No per-frame allocations

## Out of Scope

- Book rendering (unchanged)
- Label rendering (unchanged)
- Camera controls (unchanged)
- Postprocessing effects (unchanged, just ensure bloom pickup)
- StarField component (unchanged)

## Dependencies

- `three` (existing)
- `@react-three/fiber` (existing)
- `@react-three/drei` (existing, for Billboard)
- No new dependencies required
