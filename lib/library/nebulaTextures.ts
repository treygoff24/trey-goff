/**
 * Procedural Nebula Texture Generator
 *
 * Generates 512x512 grayscale textures with noise and radial falloff.
 * One texture per topic, cached for reuse.
 *
 * Platform compatibility:
 * - Uses OffscreenCanvas when available (web workers, modern browsers)
 * - Falls back to HTMLCanvasElement (iOS Safari < 16.4, older browsers)
 */

import * as THREE from 'three'
import { fbm2D } from './noise'
import { getTopicColor, TOPIC_COLORS } from './types'

// =============================================================================
// Constants
// =============================================================================

/** Texture resolution (256x256 for fast generation, still looks good with blur) */
const TEXTURE_SIZE = 256

/** Noise parameters for organic nebula appearance */
const NOISE_SCALE = 2.5        // Lower = larger features
const NOISE_OCTAVES = 3
const NOISE_PERSISTENCE = 0.6

/** 
 * Radial falloff parameters - creates soft, cloud-like edges
 * Key insight: real nebulae have very soft, diffuse edges that fade gradually
 */
const FALLOFF_START = 0.0     // Start fading immediately from center
const FALLOFF_POWER = 1.8     // Gentler falloff curve

// =============================================================================
// Texture Cache
// =============================================================================

const textureCache = new Map<string, THREE.Texture>()

// =============================================================================
// Canvas Factory (Platform Compatibility)
// =============================================================================

interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2D | null
}

/**
 * Create a canvas for texture generation.
 * Uses OffscreenCanvas if available, falls back to HTMLCanvasElement.
 */
function createCanvas(width: number, height: number): CanvasLike {
  // Check if OffscreenCanvas is available and working
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const canvas = new OffscreenCanvas(width, height)
      // Test that we can get a 2D context
      if (canvas.getContext('2d')) {
        return canvas as unknown as CanvasLike
      }
    } catch {
      // OffscreenCanvas not fully supported, fall through to HTMLCanvasElement
    }
  }

  // Fallback to HTMLCanvasElement
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  throw new Error('No canvas implementation available')
}

// =============================================================================
// Texture Generation
// =============================================================================

/**
 * Hash a string to a numeric seed for deterministic noise.
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

/**
 * Parse hex color to RGB components (0-1 range).
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.slice(0, 2), 16) / 255
  const g = parseInt(cleaned.slice(2, 4), 16) / 255
  const b = parseInt(cleaned.slice(4, 6), 16) / 255
  return { r, g, b }
}

/**
 * Generate a procedural nebula texture for a given topic.
 *
 * @param topic - Topic name (used for color and seed)
 * @returns THREE.Texture with nebula pattern
 */
export function generateNebulaTexture(topic: string): THREE.Texture {
  const canvas = createCanvas(TEXTURE_SIZE, TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get 2D context for texture generation')
  }

  // Get topic color and seed
  const color = getTopicColor(topic)
  const { r, g, b } = parseHexColor(color)
  const seed = hashString(topic)

  // Create ImageData to write pixels directly
  const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE)
  const data = imageData.data

  const center = TEXTURE_SIZE / 2

  for (let y = 0; y < TEXTURE_SIZE; y++) {
    for (let x = 0; x < TEXTURE_SIZE; x++) {
      // Normalized coordinates (-1 to 1)
      const nx = (x - center) / center
      const ny = (y - center) / center

      // Distance from center (0 at center, 1 at edge)
      const dist = Math.sqrt(nx * nx + ny * ny)

      // Multi-octave noise for organic variation
      const noise = fbm2D(
        x / TEXTURE_SIZE * NOISE_SCALE,
        y / TEXTURE_SIZE * NOISE_SCALE,
        NOISE_OCTAVES,
        NOISE_PERSISTENCE,
        2,
        seed
      )

      // Secondary noise at different scale for edge variation
      const edgeNoise = fbm2D(
        x / TEXTURE_SIZE * NOISE_SCALE * 2,
        y / TEXTURE_SIZE * NOISE_SCALE * 2,
        2,
        0.5,
        2,
        seed + 1000
      )

      // Noise-modulated radial falloff - creates organic, wispy edges
      // The edge boundary varies with noise, creating natural-looking shapes
      const noiseModulation = 0.3 + (edgeNoise + 1) * 0.35 // 0.3 to 1.0
      const effectiveRadius = noiseModulation

      // Soft gaussian-like falloff from the noise-modulated boundary
      let falloff: number
      if (dist < effectiveRadius * 0.5) {
        // Inner core - mostly opaque but with some variation
        falloff = 1.0
      } else if (dist < effectiveRadius) {
        // Transition zone - smooth falloff
        const t = (dist - effectiveRadius * 0.5) / (effectiveRadius * 0.5)
        falloff = 1.0 - t * t // Quadratic falloff
      } else {
        // Outer wisps - exponential decay for soft edges
        const overshoot = (dist - effectiveRadius) / (1 - effectiveRadius + 0.01)
        falloff = Math.exp(-overshoot * 3) * 0.5
      }

      // Map primary noise from [-1, 1] to [0, 1] with subtle variation
      const noiseValue = 0.6 + (noise + 1) * 0.2 // 0.6 to 1.0 - keeps it bright but varied

      // Combine: base intensity from falloff, modulated by noise
      const intensity = falloff * noiseValue

      // Apply color tint with softer overall opacity
      const pixelIndex = (y * TEXTURE_SIZE + x) * 4
      data[pixelIndex] = Math.floor(r * 255)
      data[pixelIndex + 1] = Math.floor(g * 255)
      data[pixelIndex + 2] = Math.floor(b * 255)
      data[pixelIndex + 3] = Math.floor(intensity * 200) // Cap at 200 for softer look
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // Create THREE.Texture from canvas
  // Need to handle both OffscreenCanvas and HTMLCanvasElement
  let texture: THREE.Texture
  if (canvas instanceof HTMLCanvasElement) {
    texture = new THREE.CanvasTexture(canvas)
  } else {
    // For OffscreenCanvas, we need to transfer to ImageBitmap or use a different approach
    // Since we're in a client component, we can create an ImageBitmap
    texture = new THREE.CanvasTexture(canvas as unknown as HTMLCanvasElement)
  }

  texture.needsUpdate = true
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true

  return texture
}

/**
 * Get a cached nebula texture for a topic, generating if needed.
 *
 * @param topic - Topic name
 * @returns Cached or newly generated THREE.Texture
 */
export function getNebulaTexture(topic: string): THREE.Texture {
  const normalized = topic.toLowerCase().trim()

  // Check cache
  if (textureCache.has(normalized)) {
    return textureCache.get(normalized)!
  }

  // Generate and cache
  const texture = generateNebulaTexture(normalized)
  textureCache.set(normalized, texture)

  if (process.env.NODE_ENV === 'development') {
    console.log(`[NebulaTextures] Generated texture for topic: ${normalized}`)
  }

  return texture
}

/**
 * Pre-generate textures for all known topics.
 * Call this during initialization to avoid generation during render.
 */
export function preloadNebulaTextures(): void {
  const topics = Object.keys(TOPIC_COLORS)

  for (const topic of topics) {
    getNebulaTexture(topic)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[NebulaTextures] Preloaded ${topics.length} textures`)
  }
}

/**
 * Get the number of cached textures.
 */
export function getCacheSize(): number {
  return textureCache.size
}

/**
 * Clear the texture cache (useful for hot reloading in dev).
 */
export function clearTextureCache(): void {
  // Dispose of textures to free GPU memory
  for (const texture of textureCache.values()) {
    texture.dispose()
  }
  textureCache.clear()
}
