# Floating Library - Technical Documentation

A 3D explorable cosmos where books float as constellations organized by topic. Built with React Three Fiber.

## Overview

The `/library` page transforms a book collection into an interactive 3D space visualization. Books are grouped into **nebulae** (topic clusters), with each nebula containing all books sharing that primary topic. Users can zoom from a universe view → constellation view → individual book view.

**Live at:** `http://localhost:3000/library`

---

## Visual Hierarchy

```
Universe View (zoomed out)
├── Nebula clouds (one per topic, colored by topic)
│   └── Books floating within each nebula
├── "Random" nebula (orphan books with no/single-book topics)
├── Stats constellation (reading metrics)
└── Star field background

Constellation View (zoomed into one topic)
├── Active nebula (full opacity)
├── Other nebulae (dimmed)
└── Books spread within the nebula sphere

Book View (selected book)
├── Selected book (highlighted)
├── Detail panel (HTML overlay with book info + Amazon link)
└── Scene dimmed
```

---

## Architecture

### File Structure

```
lib/library/
├── store.ts          # Zustand state management
├── types.ts          # TypeScript types + topic colors
├── constellation.ts  # Positioning algorithms
└── textures.ts       # Book cover texture loading

components/library/floating/
├── FloatingLibrary.tsx    # Main canvas wrapper + error boundary
├── Universe.tsx           # Scene container (nebulae + stars + filters)
├── Constellation.tsx      # Single topic nebula + its books
├── NebulaCloud.tsx        # The glowing cloud effect (THIS IS WHAT TO IMPROVE)
├── FloatingBook.tsx       # Individual book mesh with hover/select
├── StarField.tsx          # Background star particles
├── StatsConstellation.tsx # Reading stats as floating cards
├── CameraController.tsx   # Animated camera transitions
├── BookDetailPanel.tsx    # HTML panel for selected book
├── LibraryBreadcrumb.tsx  # Navigation breadcrumb
├── LibraryHUD.tsx         # Filter controls overlay
└── AccessibleBookList.tsx # Screen reader fallback
```

### Tech Stack

- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Helpers (Html, etc.)
- **Three.js** - WebGL rendering
- **Zustand** - State management
- **Tailwind CSS** - UI styling (HUD, panels)

---

## The Nebula System (Current Implementation)

### NebulaCloud.tsx

The current nebula effect is **minimal** - just two concentric spheres with additive blending:

```tsx
// Outer soft glow - large sphere, very transparent
<mesh>
  <sphereGeometry args={[radius * 0.8, 32, 32]} />
  <meshBasicMaterial
    color={outerColor}        // Desaturated topic color
    transparent
    opacity={0.04}            // Very subtle
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    toneMapped={false}
  />
</mesh>

// Inner brighter core - smaller sphere
<mesh>
  <sphereGeometry args={[radius * 0.3, 24, 24]} />
  <meshBasicMaterial
    color={baseColor}         // Full topic color
    transparent
    opacity={0.08}            // Slightly more visible
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    toneMapped={false}
  />
</mesh>
```

**Animation:** Gentle breathing/pulsing via `useFrame`:
- Outer sphere scales 1.0 ↔ 1.05
- Inner sphere scales 1.0 ↔ 1.08

**Props:**
- `color: string` - Hex color (from topic colors, see below)
- `position: [x, y, z]` - Always `[0, 0, 0]` (relative to constellation group)
- `radius: number` - 15-30 based on book count
- `reducedMotion: boolean` - Disable animations for a11y
- `opacity: number` - For fade effects during view changes

### Topic Colors

Defined in `lib/library/types.ts`:

```typescript
export const TOPIC_COLORS: Record<string, string> = {
  philosophy: '#8B5CF6',   // Purple
  economics: '#F59E0B',    // Amber
  governance: '#14B8A6',   // Teal
  technology: '#3B82F6',   // Blue
  science: '#22C55E',      // Green
  history: '#A16207',      // Brown
  fiction: '#F43F5E',      // Rose
  biography: '#FB7185',    // Pink
  'self-help': '#EAB308',  // Yellow
  libertarianism: '#EA580C', // Orange
  futurism: '#06B6D4',     // Cyan
  random: '#9CA3AF',       // Gray (orphan books)
}
```

Unknown topics get a procedurally generated color via `generateTopicColor()` (hash-based HSL).

---

## Positioning System

### Constellation Placement

Constellations are distributed on a sphere using the **golden angle** for even spacing:

```typescript
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
const theta = goldenAngle * index

// Vertical position (-1 to 1, then scaled)
const y = 1 - (index / (total - 1)) * 2

// Convert to 3D position
const radiusAtY = Math.sqrt(1 - y * y)
const x = Math.cos(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS
const z = Math.sin(theta) * radiusAtY * CONSTELLATION_SPREAD_RADIUS
```

**Current constants:**
- `CONSTELLATION_SPREAD_RADIUS = 160` - Horizontal spread
- `VERTICAL_SPREAD = 70` - Vertical range
- Small jitter (±3 units) breaks the perfect pattern

### Book Placement Within Nebulae

Books are distributed in 3D space within each nebula using **fibonacci sphere** distribution:

```typescript
// Even spherical distribution
const goldenRatio = (1 + Math.sqrt(5)) / 2
const theta = 2 * Math.PI * index / goldenRatio
const phi = Math.acos(1 - 2 * (index + 0.5) / total)

// Vary radius to fill volume (not just surface)
const radiusFactor = 0.3 + random() * 0.6  // 30-90% of nebula radius
const radius = nebulaRadius * radiusFactor * 0.7

// Convert to cartesian (LOCAL to nebula center)
const x = radius * Math.sin(phi) * Math.cos(theta)
const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6  // Flattened
const z = radius * Math.cos(phi) * 0.8
```

**Key:** Book positions are LOCAL to the constellation group, so they move with their nebula.

### Nebula Radius Formula

```typescript
const nebulaRadius = Math.max(15, Math.min(30, 10 + bookCount * 0.5))
```

- Minimum: 15 units
- Maximum: 30 units
- Scales with book count

---

## State Management

The Zustand store (`lib/library/store.ts`) manages:

### View State
- `viewLevel: 'universe' | 'constellation' | 'book'`
- `activeConstellation: string | null` - Current topic
- `selectedBook: Book | null`

### Camera
- `cameraPosition: [x, y, z]`
- `cameraTarget: [x, y, z]`
- `isTransitioning: boolean`

### Filters
- `statusFilter: 'read' | 'reading' | 'want' | null`
- `topicFilter: string | null`
- `searchQuery: string`
- `sortBy: 'rating' | 'title' | 'author' | 'year'`

When filters are active, nebulae hide and filtered books form a central cluster.

---

## Rendering Details

### Blending

All glowing elements use:
```typescript
blending={THREE.AdditiveBlending}
toneMapped={false}
depthWrite={false}
```

This prevents dark blobs and creates proper light accumulation.

### Performance

- `reducedMotion` prop disables animations for accessibility
- `qualityLevel` in store (unused currently) for future LOD
- Star field uses instanced rendering

---

## Ideas for Improving Nebulae

The current implementation is **very basic** - just transparent spheres. Here are directions to explore:

### 1. Volumetric/Particle Clouds
- Use `THREE.Points` with custom shaders
- Thousands of tiny particles in a cloud distribution
- Varying opacity based on distance from center
- Perlin noise for organic shapes

### 2. Shader-Based Volumetric Fog
- Custom fragment shader with raymarching
- Noise-based density function
- Color gradients from core to edge
- Animated noise for movement

### 3. Multiple Layered Sprites
- Billboard sprites at varying depths
- Pre-rendered cloud/nebula textures
- Parallax effect as camera moves

### 4. Post-Processing Effects
- Bloom on bright cores
- God rays / volumetric light
- Chromatic aberration at edges

### 5. Physical Simulation
- Particles that drift/swirl slowly
- React to camera movement
- Subtle turbulence animation

### Key Constraints
- Must work with `AdditiveBlending` (no dark areas)
- Should scale with `radius` prop (15-30 units)
- Needs to accept `color` prop (topic color)
- Performance: ~40 nebulae on screen at universe view
- Must support `opacity` for fade transitions
- `reducedMotion` should disable heavy animations

---

## Running Locally

```bash
cd /Users/treygoff/Code/trey-goff
pnpm dev
# Open http://localhost:3000/library
```

### Key Files to Modify

**To improve nebula visuals:**
1. `components/library/floating/NebulaCloud.tsx` - Main target
2. Optionally add new shader files in `components/library/floating/shaders/`

**To adjust spacing:**
- `lib/library/constellation.ts` - Constants at top of file

**To change topic colors:**
- `lib/library/types.ts` - `TOPIC_COLORS` object

---

## Current Screenshot

The nebulae currently appear as soft colored glows behind book clusters. Each topic has a distinct color. Books float within the nebula sphere in 3D space.

The goal: Make nebulae look **10x cooler** - more like actual space nebulae with depth, movement, and visual interest.
