'use client'

/**
 * Blender-rendered nebula textures for the Floating Library.
 * High-quality pre-rendered volumetric nebula images.
 *
 * NOTE: This module does NOT import the store to avoid circular deps.
 * The calling component is responsible for updating store state.
 */

import * as THREE from 'three'

// =============================================================================
// Topic → Texture Mapping
// =============================================================================

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

const VARIANTS = [
  'purple',
  'blue',
  'teal',
  'gold',
  'rose',
  'green',
  'coral',
] as const

// =============================================================================
// Cache & State
// =============================================================================

const textureCache = new Map<string, THREE.Texture>()
const loadingPromises = new Map<string, Promise<THREE.Texture | null>>()
let allLoaded = false

// =============================================================================
// Helpers
// =============================================================================

function getBlenderTextureVariant(topic: string): string {
  const normalized = topic.toLowerCase().trim()
  return BLENDER_TEXTURE_MAP[normalized] ?? 'purple'
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Preload all Blender nebula textures.
 * Safe to call multiple times - will deduplicate in-flight requests.
 *
 * @param onComplete Optional callback when all textures are loaded.
 *                   The caller should use this to update store state.
 */
export async function preloadBlenderNebulaTextures(
  onComplete?: () => void
): Promise<void> {
  if (allLoaded) {
    onComplete?.()
    return
  }

  const loader = new THREE.TextureLoader()
  const startTime = performance.now()

  await Promise.all(
    VARIANTS.map(async (variant) => {
      if (textureCache.has(variant)) return

      if (!loadingPromises.has(variant)) {
        const promise = new Promise<THREE.Texture | null>((resolve) => {
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
            (error) => {
              // Log error but don't reject - graceful degradation to procedural
              console.error(`[BlenderNebulae] Failed to load ${variant}:`, error)
              resolve(null)
            }
          )
        })
        loadingPromises.set(variant, promise)
      }

      await loadingPromises.get(variant)
    })
  )

  const loadTime = performance.now() - startTime
  const successCount = textureCache.size
  
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[BlenderNebulae] Loaded ${successCount}/${VARIANTS.length} textures in ${loadTime.toFixed(0)}ms`
    )
  }

  // Only mark as loaded if at least some textures succeeded
  allLoaded = successCount > 0
  if (successCount === 0) {
    console.warn('[BlenderNebulae] All textures failed to load, falling back to procedural')
  }
  
  onComplete?.()
}

/**
 * Get a Blender texture for a given topic.
 * Returns null if textures haven't been loaded yet.
 *
 * @param topic The book topic (e.g., 'philosophy', 'technology')
 */
export function getBlenderNebulaTexture(topic: string): THREE.Texture | null {
  const variant = getBlenderTextureVariant(topic)
  return textureCache.get(variant) ?? null
}

/**
 * Check if all Blender textures have been loaded.
 */
export function isBlenderTexturesLoaded(): boolean {
  return allLoaded
}

/**
 * Dispose all Blender nebula textures and clear cache.
 * Call this when switching to procedural mode to free GPU memory.
 */
export function disposeBlenderNebulaTextures(): void {
  textureCache.forEach((texture) => texture.dispose())
  textureCache.clear()
  loadingPromises.clear()
  allLoaded = false
}
