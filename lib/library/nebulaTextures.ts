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
const NOISE_SCALE = 3.5
const NOISE_OCTAVES = 3
const NOISE_PERSISTENCE = 0.55

/** Radial falloff parameters */
const FALLOFF_POWER = 2.2
const FALLOFF_EDGE = 0.85 // Where falloff starts (0-1 from center)

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

      // Radial falloff (soft edge)
      let falloff = 1
      if (dist > FALLOFF_EDGE) {
        const edgeDist = (dist - FALLOFF_EDGE) / (1 - FALLOFF_EDGE)
        falloff = Math.max(0, 1 - Math.pow(edgeDist, FALLOFF_POWER))
      }

      // Multi-octave noise for organic variation
      const noise = fbm2D(
        x / TEXTURE_SIZE * NOISE_SCALE,
        y / TEXTURE_SIZE * NOISE_SCALE,
        NOISE_OCTAVES,
        NOISE_PERSISTENCE,
        2,
        seed
      )

      // Map noise from [-1, 1] to [0, 1] with contrast boost
      const noiseValue = Math.pow((noise + 1) / 2, 1.5)

      // Combine noise with radial falloff
      const intensity = noiseValue * falloff

      // Apply color tint
      const pixelIndex = (y * TEXTURE_SIZE + x) * 4
      data[pixelIndex] = Math.floor(r * intensity * 255)
      data[pixelIndex + 1] = Math.floor(g * intensity * 255)
      data[pixelIndex + 2] = Math.floor(b * intensity * 255)
      data[pixelIndex + 3] = Math.floor(intensity * 255) // Alpha for transparency
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
