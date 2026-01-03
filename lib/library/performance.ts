/**
 * Performance monitoring for the Floating Library.
 * Tracks FPS and triggers quality degradation when needed.
 */

import type { QualityLevel } from './types'

// =============================================================================
// Types
// =============================================================================

interface PerformanceConfig {
  /** Samples to collect before evaluating */
  sampleSize: number
  /** Threshold for reducing to 'reduced' quality (fps) */
  reducedThreshold: number
  /** Threshold for reducing to 'minimal' quality (fps) */
  minimalThreshold: number
  /** Threshold for prompting fallback (fps) */
  fallbackThreshold: number
  /** Time in ms that FPS must be below threshold before action */
  hysteresisTime: number
}

interface PerformanceState {
  samples: number[]
  currentQuality: QualityLevel
  lastDegradationTime: number
  belowThresholdSince: number | null
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONFIG: PerformanceConfig = {
  sampleSize: 60,
  reducedThreshold: 45,
  minimalThreshold: 35,
  fallbackThreshold: 20,
  hysteresisTime: 2000,
}

// =============================================================================
// Performance Monitor Class
// =============================================================================

export class PerformanceMonitor {
  private config: PerformanceConfig
  private state: PerformanceState
  private onQualityChange?: (quality: QualityLevel) => void
  private onSuggestFallback?: () => void
  private lastFrameTime: number = 0

  constructor(
    config: Partial<PerformanceConfig> = {},
    callbacks?: {
      onQualityChange?: (quality: QualityLevel) => void
      onSuggestFallback?: () => void
    }
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = {
      samples: [],
      currentQuality: 'full',
      lastDegradationTime: 0,
      belowThresholdSince: null,
    }
    this.onQualityChange = callbacks?.onQualityChange
    this.onSuggestFallback = callbacks?.onSuggestFallback
  }

  /**
   * Record a frame timing. Call this from useFrame.
   * @param delta Time since last frame in seconds
   */
  recordFrame(delta: number): void {
    const fps = 1 / delta
    this.state.samples.push(fps)

    // Keep only recent samples
    if (this.state.samples.length > this.config.sampleSize) {
      this.state.samples.shift()
    }

    // Evaluate performance every 30 frames
    if (this.state.samples.length % 30 === 0) {
      this.evaluate()
    }
  }

  /**
   * Get the current average FPS
   */
  getAverageFps(): number {
    if (this.state.samples.length === 0) return 60
    return (
      this.state.samples.reduce((sum, fps) => sum + fps, 0) /
      this.state.samples.length
    )
  }

  /**
   * Get the current quality level
   */
  getQuality(): QualityLevel {
    return this.state.currentQuality
  }

  /**
   * Reset the monitor
   */
  reset(): void {
    this.state = {
      samples: [],
      currentQuality: 'full',
      lastDegradationTime: 0,
      belowThresholdSince: null,
    }
  }

  /**
   * Evaluate performance and trigger degradation if needed
   */
  private evaluate(): void {
    const avgFps = this.getAverageFps()
    const now = Date.now()

    // Determine target quality based on FPS
    let targetQuality: QualityLevel = 'full'
    if (avgFps < this.config.fallbackThreshold) {
      // Suggest fallback if consistently below threshold
      if (this.state.belowThresholdSince === null) {
        this.state.belowThresholdSince = now
      } else if (now - this.state.belowThresholdSince > 3000) {
        this.onSuggestFallback?.()
        this.state.belowThresholdSince = null
      }
      targetQuality = 'minimal'
    } else if (avgFps < this.config.minimalThreshold) {
      targetQuality = 'minimal'
      this.state.belowThresholdSince = null
    } else if (avgFps < this.config.reducedThreshold) {
      targetQuality = 'reduced'
      this.state.belowThresholdSince = null
    } else {
      this.state.belowThresholdSince = null
    }

    // Apply hysteresis - only degrade after being below threshold for hysteresisTime
    if (targetQuality !== this.state.currentQuality) {
      // Only allow degradation, not improvement (to prevent oscillation)
      const qualityOrder: QualityLevel[] = ['full', 'reduced', 'minimal']
      const currentIndex = qualityOrder.indexOf(this.state.currentQuality)
      const targetIndex = qualityOrder.indexOf(targetQuality)

      if (targetIndex > currentIndex) {
        // Degrading - apply after hysteresis
        const timeSinceLastDegradation = now - this.state.lastDegradationTime
        if (timeSinceLastDegradation > this.config.hysteresisTime) {
          this.state.currentQuality = targetQuality
          this.state.lastDegradationTime = now
          this.onQualityChange?.(targetQuality)
        }
      }
      // Don't auto-improve quality - user must refresh or manually reset
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let performanceMonitorInstance: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor()
  }
  return performanceMonitorInstance
}

export function initPerformanceMonitor(
  callbacks?: {
    onQualityChange?: (quality: QualityLevel) => void
    onSuggestFallback?: () => void
  }
): PerformanceMonitor {
  performanceMonitorInstance = new PerformanceMonitor({}, callbacks)
  return performanceMonitorInstance
}
