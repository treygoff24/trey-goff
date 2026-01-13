# Implementation Plan: Blender Nebula Texture Integration

**Spec:** `docs/plans/BLENDER_NEBULA_INTEGRATION_SPEC.md`
**Branch:** `feature/floating-library-v2` (continue existing branch)
**Estimated phases:** 5

---

## Phase 1: Store Additions

**Goal:** Add state for texture mode and loading status.

### Tasks

1. Add to `lib/library/store.ts`:
   ```typescript
   // State
   nebulaTextureMode: 'procedural' | 'blender'
   blenderTexturesLoaded: boolean

   // Setters
   setNebulaTextureMode: (mode: 'procedural' | 'blender') => void
   setBlenderTexturesLoaded: (loaded: boolean) => void
   ```

2. Add selectors:
   ```typescript
   export const selectNebulaTextureMode = (s: LibraryStore) => s.nebulaTextureMode
   export const selectBlenderTexturesLoaded = (s: LibraryStore) => s.blenderTexturesLoaded
   ```

3. Initialize defaults:
   - `nebulaTextureMode`: derive from `qualityLevel` ('full' → 'blender', else 'procedural')
   - `blenderTexturesLoaded`: `false`

4. **Override precedence:** User toggle takes priority over quality-based defaults.
   ```typescript
   // Track if user has manually set texture mode
   nebulaTextureModeManual: boolean // default false

   // setNebulaTextureMode sets manual flag
   setNebulaTextureMode: (mode) => set({
     nebulaTextureMode: mode,
     nebulaTextureModeManual: true
   })

   // setQualityLevel only updates texture mode if NOT manually set
   setQualityLevel: (level) => {
     const state = get()
     const updates: Partial<LibraryStore> = { qualityLevel: level }
     if (!state.nebulaTextureModeManual) {
       updates.nebulaTextureMode = level === 'full' ? 'blender' : 'procedural'
     }
     set(updates)
   }
   ```

### Verification

```bash
pnpm typecheck && pnpm lint
```

---

## Phase 2: Blender Texture Loader

**Goal:** Create the texture loading module.

**Note:** To avoid circular dependency, the loader does NOT import the store.
Instead, it exports a callback mechanism and the component triggers store updates.

### Tasks

1. Create `lib/library/blenderNebulaTextures.ts`:
   - Topic → texture variant mapping (hardcoded whitelist)
   - `THREE.TextureLoader` based loading
   - Promise deduplication for in-flight loads
   - `preloadBlenderNebulaTextures(onComplete?)` - loads all 7 variants
   - `getBlenderNebulaTexture(topic)` - returns cached texture or null
   - `isBlenderTexturesLoaded()` - returns boolean

2. Configure textures:
   - `texture.colorSpace = THREE.SRGBColorSpace`
   - `texture.wrapS = THREE.RepeatWrapping`
   - `texture.wrapT = THREE.RepeatWrapping`
   - Generate mipmaps for LOD

### File Contents

```typescript
/**
 * Blender-rendered nebula textures for the Floating Library.
 * High-quality pre-rendered volumetric nebula images.
 *
 * NOTE: This module does NOT import the store to avoid circular deps.
 * The calling component is responsible for updating store state.
 */

import * as THREE from 'three'

const BLENDER_TEXTURE_MAP: Record<string, string> = {
  philosophy: 'purple',
  technology: 'blue',
  governance: 'teal',
  futurism: 'teal',
  science: 'green',
  economics: 'gold',
  history: 'gold',
  'self-help': 'gold',
  fiction: 'rose',
  biography: 'rose',
  libertarianism: 'coral',
  random: 'purple',
} as const

const VARIANTS = ['purple', 'blue', 'teal', 'gold', 'rose', 'green', 'coral'] as const

const textureCache = new Map<string, THREE.Texture>()
const loadingPromises = new Map<string, Promise<THREE.Texture>>()
let allLoaded = false

function getBlenderTextureVariant(topic: string): string {
  const normalized = topic.toLowerCase().trim()
  return BLENDER_TEXTURE_MAP[normalized] ?? 'purple'
}

export async function preloadBlenderNebulaTextures(
  onComplete?: () => void
): Promise<void> {
  if (allLoaded) {
    onComplete?.()
    return
  }

  const loader = new THREE.TextureLoader()
  const startTime = performance.now()

  await Promise.all(VARIANTS.map(async (variant) => {
    if (textureCache.has(variant)) return

    if (!loadingPromises.has(variant)) {
      const promise = new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          `/assets/library/nebulae/nebula_${variant}.png`,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.generateMipmaps = true
            texture.minFilter = THREE.LinearMipmapLinearFilter
            texture.magFilter = THREE.LinearFilter
            textureCache.set(variant, texture)
            resolve(texture)
          },
          undefined,
          reject
        )
      })
      loadingPromises.set(variant, promise)
    }

    await loadingPromises.get(variant)
  }))

  const loadTime = performance.now() - startTime
  if (process.env.NODE_ENV === 'development') {
    console.log(`[BlenderNebulae] Loaded ${VARIANTS.length} textures in ${loadTime.toFixed(0)}ms`)
  }

  allLoaded = true
  onComplete?.()
}

export function getBlenderNebulaTexture(topic: string): THREE.Texture | null {
  const variant = getBlenderTextureVariant(topic)
  return textureCache.get(variant) ?? null
}

export function isBlenderTexturesLoaded(): boolean {
  return allLoaded
}
```

### Verification

```bash
pnpm typecheck && pnpm lint
```

---

## Phase 3: VolumetricNebula Integration

**Goal:** Update the component to use Blender textures when available.

### Tasks

1. Import new store selectors and texture getter
2. Subscribe to `nebulaTextureMode` and `blenderTexturesLoaded`
3. Update texture `useMemo` to check mode and loaded state
4. Conditionally use `MeshBasicMaterial` for Blender textures

### Changes to `VolumetricNebula.tsx`

```tsx
// New imports
import { getBlenderNebulaTexture } from '@/lib/library/blenderNebulaTextures'
import {
  selectNebulaTextureMode,
  selectBlenderTexturesLoaded,
} from '@/lib/library/store'

// In component:
const nebulaTextureMode = useLibraryStore(selectNebulaTextureMode)
const blenderTexturesLoaded = useLibraryStore(selectBlenderTexturesLoaded)

// Update texture memo
const texture = useMemo(() => {
  if (nebulaTextureMode === 'blender' && blenderTexturesLoaded) {
    const blenderTex = getBlenderNebulaTexture(topic)
    if (blenderTex) return blenderTex
  }
  return getNebulaTexture(topic)
}, [topic, nebulaTextureMode, blenderTexturesLoaded])

// Determine if using Blender texture
const isBlenderTexture = nebulaTextureMode === 'blender' &&
                         blenderTexturesLoaded &&
                         getBlenderNebulaTexture(topic) !== null
```

5. Update `NebulaSlice` to conditionally render material:

```tsx
// For Blender textures: MeshBasicMaterial (texture has color baked in)
// For procedural: MeshStandardMaterial with emissive (current approach)

{isBlenderTexture ? (
  <meshBasicMaterial
    map={texture}
    transparent
    opacity={opacity * data.uvScale}
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    toneMapped={false}
    side={THREE.DoubleSide}
  />
) : (
  <meshStandardMaterial
    ref={materialRef}
    map={texture}
    color="#000000"
    emissive={color}
    emissiveIntensity={emissiveIntensity}
    transparent
    opacity={opacity * data.uvScale}
    depthWrite={false}
    blending={THREE.AdditiveBlending}
    toneMapped={false}
    side={THREE.DoubleSide}
  />
)}
```

### Bloom Verification

After implementation, verify bloom works with MeshBasicMaterial:
1. Visual check: nebulae should have soft glow from postprocessing bloom
2. If bloom is weak: increase texture brightness or use alternative approach (see spec)

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Visual test: Open library, verify nebulae render with both modes.

---

## Phase 4: Preload Trigger & Quality Integration

**Goal:** Wire up texture preloading from components (not store).

### Tasks

1. Add preload trigger in `FloatingLibrary.tsx` (components/library/floating/):
   ```tsx
   import { preloadBlenderNebulaTextures } from '@/lib/library/blenderNebulaTextures'

   // In component:
   const nebulaTextureMode = useLibraryStore(selectNebulaTextureMode)
   const setBlenderTexturesLoaded = useLibraryStore((s) => s.setBlenderTexturesLoaded)

   useEffect(() => {
     if (nebulaTextureMode === 'blender') {
       preloadBlenderNebulaTextures(() => {
         setBlenderTexturesLoaded(true)
       })
     }
   }, [nebulaTextureMode, setBlenderTexturesLoaded])
   ```

2. Quality changes already handled in Phase 1 (respects manual override).

### Performance Verification

Add dev-mode instrumentation:
```typescript
// In preloadBlenderNebulaTextures (already added in Phase 2)
// Log load time - should be < 3000ms

// Check GPU memory via browser devtools:
// Chrome: chrome://tracing or Performance Monitor
// Target: < 40MB for 7 textures with mipmaps
```

Manual verification steps:
1. Open devtools Network tab
2. Reload page with cache disabled
3. Verify total nebula texture download < 6MB
4. Verify console shows load time < 3s on fast connection

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Visual test:
- Load page with full quality → Blender textures load and appear
- Switch to reduced quality → Falls back to procedural
- Switch back to full → Blender textures show (already cached)

---

## Phase 5: HUD Toggle (Required)

**Goal:** Add user-facing toggle for texture mode (required by spec acceptance criteria).

### Tasks

1. Add to settings dropdown in `LibraryHUD.tsx`:
   ```tsx
   // In settings dropdown items
   const nebulaTextureMode = useLibraryStore(selectNebulaTextureMode)
   const setNebulaTextureMode = useLibraryStore((s) => s.setNebulaTextureMode)

   <DropdownMenuItem
     onClick={() => setNebulaTextureMode(
       nebulaTextureMode === 'blender' ? 'procedural' : 'blender'
     )}
   >
     {nebulaTextureMode === 'blender' ? '✓ ' : ''}HD Nebulae
   </DropdownMenuItem>
   ```

2. Show loading indicator if blender mode but not yet loaded:
   ```tsx
   const blenderTexturesLoaded = useLibraryStore(selectBlenderTexturesLoaded)

   // In dropdown item
   {nebulaTextureMode === 'blender' && !blenderTexturesLoaded && ' (loading...)'}
   ```

### Verification

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Visual test:
- Toggle should switch texture mode without page reload
- Visual change should be immediate when textures are cached

---

## Completion Checklist

- [ ] Phase 1: Store additions pass typecheck
- [ ] Phase 2: Texture loader created and passes typecheck
- [ ] Phase 3: VolumetricNebula updated, bloom verified
- [ ] Phase 4: Preload trigger wired, performance verified (< 3s load, < 40MB GPU)
- [ ] Phase 5: HUD toggle works without reload
- [ ] All acceptance criteria from spec verified
- [ ] Commit: `feat(library): integrate Blender nebula textures`

---

## Fallback Notes

If MeshBasicMaterial produces weak bloom:
1. **Option A:** Scale texture RGB values at load time (multiply by 1.5-2x)
2. **Option B:** Use MeshStandardMaterial with emissiveMap set to Blender texture
3. **Option C:** Re-render Blender textures as grayscale alpha masks (keeps emissive workflow)

See spec section "Alternative (keep emissive workflow)" for details.

---

## Notes

- The Blender textures are already in `public/assets/library/nebulae/`
- No new dependencies required (uses existing THREE.TextureLoader)
- Procedural textures remain as always-available fallback
- Memory impact: ~37MB GPU with mipmaps (acceptable for 'full' quality tier)
- User manual toggle takes precedence over quality-based auto-selection
