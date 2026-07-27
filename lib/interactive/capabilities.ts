/**
 * Device capability detection for Interactive route.
 * Used to determine if WebGL2 is available and to suggest quality tiers.
 */

export type QualityTier = 'low' | 'medium' | 'high' | 'auto'

export interface DeviceCapabilities {
  webgl2: boolean
  deviceMemory: number | null // GB, null if not available
  hardwareConcurrency: number | null // CPU cores
  isMobile: boolean
  reducedMotion: boolean
  maxTextureSize: number | null
  renderer: string | null
  suggestedTier: QualityTier
}

/**
 * Detect device capabilities for WebGL2 and performance estimation.
 * Should be called client-side only.
 */
export function detectCapabilities(): DeviceCapabilities {
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Detect mobile via user agent (basic heuristic)
  const isMobile =
    typeof navigator !== 'undefined'
      ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      : false

  const deviceMemory =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null)
      : null

  const hardwareConcurrency =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : null

  let webgl2 = false
  let maxTextureSize: number | null = null
  let renderer: string | null = null

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2')
      if (gl) {
        webgl2 = true
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        }

        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch {
      webgl2 = false
    }
  }

  const suggestedTier = suggestQualityTier({
    webgl2,
    deviceMemory,
    hardwareConcurrency,
    isMobile,
    maxTextureSize,
    renderer,
  })

  return {
    webgl2,
    deviceMemory,
    hardwareConcurrency,
    isMobile,
    reducedMotion,
    maxTextureSize,
    renderer,
    suggestedTier,
  }
}

/**
 * Suggest a quality tier based on device capabilities.
 */
function suggestQualityTier(caps: {
  webgl2: boolean
  deviceMemory: number | null
  hardwareConcurrency: number | null
  isMobile: boolean
  maxTextureSize: number | null
  renderer: string | null
}): QualityTier {
  // If no WebGL2, can't run at all
  if (!caps.webgl2) {
    return 'low' // Will be handled by fallback UI
  }

  // Mobile always defaults to low
  if (caps.isMobile) {
    return 'low'
  }

  // Check for known high-end GPUs
  if (caps.renderer) {
    const rendererLower = caps.renderer.toLowerCase()
    const isHighEnd =
      /rtx|radeon rx 6|radeon rx 7|geforce gtx 1080|geforce gtx 1070|m1|m2|m3|apple gpu/i.test(
        rendererLower,
      )
    if (isHighEnd) {
      // High memory + high-end GPU = high tier
      if (caps.deviceMemory && caps.deviceMemory >= 8) {
        return 'high'
      }
      return 'medium'
    }

    // Check for integrated GPUs
    const isIntegrated =
      /intel|integrated|uhd|iris/i.test(rendererLower) && !/arc/i.test(rendererLower) // Intel Arc is dedicated
    if (isIntegrated) {
      return 'low'
    }
  }

  // Check device memory
  if (caps.deviceMemory !== null) {
    if (caps.deviceMemory >= 8) {
      return 'medium'
    }
    if (caps.deviceMemory <= 4) {
      return 'low'
    }
  }

  // Default to medium
  return 'medium'
}
