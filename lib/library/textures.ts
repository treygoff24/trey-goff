/**
 * Texture loading system for the Floating Library.
 * Handles book cover textures with caching, fallbacks, and memory management.
 */

import * as THREE from 'three'
import { getTopicColor, DEFAULT_TOPIC_COLOR } from './types'

// =============================================================================
// Types
// =============================================================================

export interface TextureEntry {
  texture: THREE.Texture
  loadedAt: number
  lastUsedAt: number
  bookId: string
}

// =============================================================================
// Constants
// =============================================================================

/** Texture cache time-to-live in ms (5 minutes) */
const TEXTURE_TTL = 5 * 60 * 1000

/** Maximum number of textures to keep in cache */
const MAX_CACHED_TEXTURES = 100

/** Cleanup interval in ms (1 minute) */
const CLEANUP_INTERVAL = 60 * 1000

// =============================================================================
// Singleton Texture Manager
// =============================================================================

class TextureManager {
  private cache: Map<string, TextureEntry> = new Map()
  private loader: THREE.TextureLoader
  private cleanupTimer: ReturnType<typeof setInterval> | null = null
  private coverMap: Record<string, string> | null = null
  private coverMapPromise: Promise<Record<string, string>> | null = null

  constructor() {
    this.loader = new THREE.TextureLoader()
    this.loader.setCrossOrigin('anonymous')
  }

  /**
   * Start the cleanup timer.
   */
  start(): void {
    if (this.cleanupTimer) return
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL)
  }

  /**
   * Stop the cleanup timer and dispose all textures.
   */
  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.disposeAll()
  }

  /**
   * Load the cover map from the JSON file.
   */
  private async loadCoverMap(): Promise<Record<string, string>> {
    if (this.coverMap) return this.coverMap

    if (!this.coverMapPromise) {
      this.coverMapPromise = fetch('/cover-map.json')
        .then((res) => res.json())
        .then((data) => {
          this.coverMap = data as Record<string, string>
          return this.coverMap
        })
        .catch((err) => {
          console.warn('[TextureManager] Failed to load cover map:', err)
          this.coverMap = {}
          return this.coverMap
        })
    }

    return this.coverMapPromise
  }

  /**
   * Get the cover URL for a book ID.
   */
  async getCoverUrl(bookId: string): Promise<string | null> {
    const map = await this.loadCoverMap()
    return map[bookId] ?? null
  }

  /**
   * Get or load a texture for a book.
   */
  async getTexture(bookId: string, topics: string[] = []): Promise<THREE.Texture> {
    // Check cache first
    const cached = this.cache.get(bookId)
    if (cached) {
      cached.lastUsedAt = Date.now()
      return cached.texture
    }

    // Try to load from cover map
    const url = await this.getCoverUrl(bookId)

    if (url) {
      try {
        const texture = await this.loadTexture(url)
        this.cacheTexture(bookId, texture)
        return texture
      } catch (err) {
        console.warn(`[TextureManager] Failed to load cover for ${bookId}:`, err)
      }
    }

    // Fallback to topic-colored placeholder
    return this.createPlaceholderTexture(topics)
  }

  /**
   * Load a texture from URL.
   */
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // Configure texture for better quality
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.generateMipmaps = true
          texture.anisotropy = 4
          resolve(texture)
        },
        undefined,
        (err) => reject(err)
      )
    })
  }

  /**
   * Create a colored placeholder texture based on topic.
   */
  createPlaceholderTexture(topics: string[]): THREE.Texture {
    const primaryTopic = topics[0]?.toLowerCase()
    const color = primaryTopic ? getTopicColor(primaryTopic) : DEFAULT_TOPIC_COLOR

    // Create a simple colored canvas
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 192
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Fill with topic color
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add a subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0.2)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add a border
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    return texture
  }

  /**
   * Cache a loaded texture.
   */
  private cacheTexture(bookId: string, texture: THREE.Texture): void {
    const now = Date.now()

    // Evict oldest if at capacity
    if (this.cache.size >= MAX_CACHED_TEXTURES) {
      this.evictOldest()
    }

    this.cache.set(bookId, {
      texture,
      bookId,
      loadedAt: now,
      lastUsedAt: now,
    })
  }

  /**
   * Evict the oldest unused texture.
   */
  private evictOldest(): void {
    let oldest: TextureEntry | null = null
    let oldestKey: string | null = null

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastUsedAt < oldest.lastUsedAt) {
        oldest = entry
        oldestKey = key
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)
      if (entry) {
        entry.texture.dispose()
        this.cache.delete(oldestKey)
      }
    }
  }

  /**
   * Clean up unused textures.
   */
  private cleanup(): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [key, entry] of this.cache) {
      if (now - entry.lastUsedAt > TEXTURE_TTL) {
        toRemove.push(key)
      }
    }

    for (const key of toRemove) {
      const entry = this.cache.get(key)
      if (entry) {
        entry.texture.dispose()
        this.cache.delete(key)
      }
    }

    if (toRemove.length > 0) {
      console.debug(`[TextureManager] Cleaned up ${toRemove.length} textures`)
    }
  }

  /**
   * Dispose all cached textures.
   */
  disposeAll(): void {
    for (const entry of this.cache.values()) {
      entry.texture.dispose()
    }
    this.cache.clear()
  }

  /**
   * Get cache stats for debugging.
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHED_TEXTURES,
    }
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const textureManager = new TextureManager()

// Start cleanup timer when module loads (client-side only)
if (typeof window !== 'undefined') {
  textureManager.start()
}
