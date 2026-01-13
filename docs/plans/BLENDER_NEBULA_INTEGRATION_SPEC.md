# Blender Nebula Texture Integration Spec

## Overview

Integrate pre-rendered Blender volumetric nebula textures into the Floating Library as an alternative to the current procedural texture generation. The Blender textures offer higher visual fidelity with art-directed detail that's expensive to compute procedurally.

## Current State

The library currently uses **procedural textures** (`nebulaTextures.ts`):
- 256×256 canvas-generated textures
- Noise + radial falloff per topic, tinted to topic color
- Generated on-demand, cached in memory
- CPU-bound generation (~50ms per texture on M1)

**Current material approach** (`VolumetricNebula.tsx:243`):
```tsx
<meshStandardMaterial
  map={texture}
  color="#000000"              // <-- texture RGB ignored
  emissive={color}             // <-- topic color applied via emissive
  emissiveIntensity={...}
  transparent
  opacity={...}
  blending={THREE.AdditiveBlending}
  toneMapped={false}
/>
```
The texture's alpha controls visibility; RGB is ignored. Topic color comes from `emissive`.

## Proposed Change

Add support for **pre-rendered Blender textures** (`public/assets/library/nebulae/`):
- 1024×1024 high-quality PNG renders (RGBA)
- 7 color variants: purple, blue, teal, gold, rose, green, coral
- **Pre-colored**: RGB contains nebula color, alpha controls density
- Map topics to nearest color variant via hardcoded whitelist

**Material change for Blender textures:**
```tsx
<meshBasicMaterial
  map={texture}
  transparent
  opacity={...}
  depthWrite={false}
  blending={THREE.AdditiveBlending}
  toneMapped={false}
/>
```
- Use `MeshBasicMaterial` instead of `MeshStandardMaterial`
- Remove emissive (texture RGB provides color)
- Texture alpha controls visibility
- For HDR bloom: scale texture colors at load time OR use emissiveMap approach

**Alternative (keep emissive workflow):**
Render Blender textures as **grayscale alpha masks** instead of colored. Then the existing emissive approach works unchanged. This requires re-rendering the Blender textures.

**Chosen approach:** Use colored textures with `MeshBasicMaterial` for visual quality. The Blender textures already contain the "emissive glow" baked in.

## Topic → Texture Mapping

Hardcoded whitelist (no dynamic URL construction from user input):

```typescript
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
  random: 'purple',  // Gray topics use purple as fallback
} as const

function getBlenderTextureVariant(topic: string): string {
  const normalized = topic.toLowerCase().trim()
  return BLENDER_TEXTURE_MAP[normalized] ?? 'purple'
}
```

## Architecture

### New Files

1. **`lib/library/blenderNebulaTextures.ts`**
   - `getBlenderNebulaTexture(topic: string): THREE.Texture | null`
   - `preloadBlenderNebulaTextures(): Promise<void>`
   - `isBlenderTexturesLoaded(): boolean`
   - Internal texture cache with THREE.TextureLoader
   - Promise deduplication for in-flight loads

### Store Changes

1. **`lib/library/store.ts`**
   - Add `nebulaTextureMode: 'procedural' | 'blender'` state
   - Add `blenderTexturesLoaded: boolean` state (triggers re-render)
   - Add `setNebulaTextureMode(mode)` setter
   - Add `setBlenderTexturesLoaded(loaded)` setter
   - **Default**: Tie to `qualityLevel` - 'full' uses Blender, others use procedural

### Modified Files

1. **`components/library/floating/VolumetricNebula.tsx`**
   - Read `nebulaTextureMode` and `blenderTexturesLoaded` from store
   - Conditionally render `MeshBasicMaterial` vs `MeshStandardMaterial`
   - Subscribe to `blenderTexturesLoaded` to trigger re-render when textures arrive

2. **`components/library/floating/LibraryHUD.tsx`**
   - Add texture mode toggle to settings dropdown (optional)
   - "HD Nebulae" vs "Fast Nebulae" labels

## Async Loading & Re-render Strategy

The key challenge: `useMemo` won't re-run when Blender textures finish loading async.

**Solution:** Use store state to trigger re-render.

```typescript
// In blenderNebulaTextures.ts
const textureCache = new Map<string, THREE.Texture>()
const loadingPromises = new Map<string, Promise<THREE.Texture>>()
let allLoaded = false

export async function preloadBlenderNebulaTextures(): Promise<void> {
  const variants = ['purple', 'blue', 'teal', 'gold', 'rose', 'green', 'coral']
  const loader = new THREE.TextureLoader()
  
  await Promise.all(variants.map(async (variant) => {
    if (textureCache.has(variant)) return
    
    // Deduplicate in-flight requests
    if (!loadingPromises.has(variant)) {
      const promise = new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          `/assets/library/nebulae/nebula_${variant}.png`,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
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
  
  allLoaded = true
  // Signal store that textures are ready
  useLibraryStore.getState().setBlenderTexturesLoaded(true)
}

export function getBlenderNebulaTexture(topic: string): THREE.Texture | null {
  const variant = getBlenderTextureVariant(topic)
  return textureCache.get(variant) ?? null
}

export function isBlenderTexturesLoaded(): boolean {
  return allLoaded
}
```

```tsx
// In VolumetricNebula.tsx
const nebulaTextureMode = useLibraryStore((s) => s.nebulaTextureMode)
const blenderTexturesLoaded = useLibraryStore((s) => s.blenderTexturesLoaded)

const texture = useMemo(() => {
  // Re-runs when blenderTexturesLoaded changes
  if (nebulaTextureMode === 'blender' && blenderTexturesLoaded) {
    const blenderTex = getBlenderNebulaTexture(topic)
    if (blenderTex) return blenderTex
  }
  return getNebulaTexture(topic) // Procedural fallback
}, [topic, nebulaTextureMode, blenderTexturesLoaded])
```

## Crossfade Strategy

**Simplified approach:** No crossfade on texture swap.

The texture swap happens once per session (procedural → Blender after load). Rather than complex dual-material blending:

1. Start with procedural textures (instant)
2. Preload Blender textures in background
3. When loaded, swap textures directly
4. The visual "pop" is minimal because:
   - Both textures have similar structure (cloud-like nebula)
   - Additive blending softens any discontinuity
   - User attention is typically elsewhere during initial load

**If crossfade is required later:** Add a `textureTransition` state (0-1) and blend in the shader.

## Quality Integration

Tie texture mode to existing quality system:

```typescript
// In store.ts or PerformanceMonitor
function getDefaultTextureMode(qualityLevel: QualityLevel): 'procedural' | 'blender' {
  return qualityLevel === 'full' ? 'blender' : 'procedural'
}
```

Users can override via settings toggle if desired.

## Performance Targets

- **Texture download:** 7 textures × ~800KB = ~5.6MB total
- **Preload time:** < 3s on 4G connection (acceptable for "full" quality tier)
- **GPU memory:** ~37MB with mipmaps (7 × 1024 × 1024 × 4 bytes × 1.33 mipmap factor)
- **No frame drops:** Async loading + store-triggered re-render (non-blocking)

## Acceptance Criteria

1. [ ] Blender textures load and display correctly for all mapped topics
2. [ ] Topic → texture mapping produces visually appropriate results
3. [ ] Fallback to procedural works when:
   - Blender textures haven't loaded yet
   - Quality level is not 'full'
   - User explicitly selects procedural mode
4. [ ] Settings toggle switches between modes without page reload
5. [ ] Texture swap has minimal visual discontinuity (no jarring pop)
6. [ ] Performance targets met (< 3s preload, < 40MB GPU memory)
7. [ ] All existing nebula functionality preserved (LOD, animation, bloom)

## Out of Scope

- Mobile-optimized smaller textures (future enhancement)
- Complex crossfade animation between texture modes
- Additional Blender texture variants
- Texture streaming/progressive loading
- Grayscale Blender textures (would require re-rendering)

## Risk Assessment

**Low Risk:**
- The change is additive; procedural system remains as fallback
- Textures are static assets served from `/public`
- Hardcoded whitelist prevents URL injection

**Medium Risk:**
- ~37MB GPU memory increase could affect low-end devices
- 5.6MB download adds to initial load (mitigated by lazy loading)

**Mitigation:**
- Tie Blender mode to 'full' quality level only
- Lazy load textures after initial page render
- Keep procedural as always-available fallback
