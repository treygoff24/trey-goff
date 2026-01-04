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
  /** Maximum delta (in ms) to consider valid - reject outliers */
  maxValidDelta: number
  /** Time to continue sampling after animations stop (ms) */
  recoverySamplingDuration: number
  /** FPS threshold for recovering to higher quality */
  recoveryThreshold: number
}

interface PerformanceState {
  samples: number[]
  currentQuality: QualityLevel
  lastDegradationTime: number
  belowThresholdSince: number | null
  lastAnimatingTime: number | null
  isInRecoveryPeriod: boolean
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
  maxValidDelta: 100, // Reject deltas > 100ms (< 10fps outliers)
  recoverySamplingDuration: 3000, // Continue sampling 3s after animations stop
  recoveryThreshold: 55, // FPS to recover to higher quality
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
      lastAnimatingTime: null,
      isInRecoveryPeriod: false,
    }
    this.onQualityChange = callbacks?.onQualityChange
    this.onSuggestFallback = callbacks?.onSuggestFallback
  }

  /**
   * Record a frame timing. Call this from useFrame.
   * Only samples when isAnimating is true or during recovery period.
   * @param delta Time since last frame in seconds
   * @param isAnimating Whether the scene is currently animating
   */
  recordFrame(delta: number, isAnimating: boolean = true): void {
    const now = Date.now()
    const deltaMs = delta * 1000

    // Update animation tracking
    if (isAnimating) {
      this.state.lastAnimatingTime = now
      this.state.isInRecoveryPeriod = false
    } else if (this.state.lastAnimatingTime !== null) {
      // Check if we're in recovery period (3s after animations stop)
      const timeSinceAnimating = now - this.state.lastAnimatingTime
      this.state.isInRecoveryPeriod = timeSinceAnimating < this.config.recoverySamplingDuration
    }

    // Only sample during animation or recovery period
    if (!isAnimating && !this.state.isInRecoveryPeriod) {
      return
    }

    // Reject outliers (deltas > maxValidDelta ms, typically caused by tab switches)
    if (deltaMs > this.config.maxValidDelta) {
      return
    }

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
      lastAnimatingTime: null,
      isInRecoveryPeriod: false,
    }
  }

  /**
   * Evaluate performance and trigger degradation/recovery if needed
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

    // Apply hysteresis for quality changes
    if (targetQuality !== this.state.currentQuality) {
      const qualityOrder: QualityLevel[] = ['full', 'reduced', 'minimal']
      const currentIndex = qualityOrder.indexOf(this.state.currentQuality)
      const targetIndex = qualityOrder.indexOf(targetQuality)

      if (targetIndex > currentIndex) {
        // Degrading - apply after hysteresis (2s below threshold)
        const timeSinceLastChange = now - this.state.lastDegradationTime
        if (timeSinceLastChange > this.config.hysteresisTime) {
          this.state.currentQuality = targetQuality
          this.state.lastDegradationTime = now
          this.onQualityChange?.(targetQuality)
        }
      } else if (avgFps >= this.config.recoveryThreshold) {
        // Recovering - allow improvement only if FPS is consistently high (55+)
        // Requires 3s of good performance (recovery hysteresis)
        const timeSinceLastChange = now - this.state.lastDegradationTime
        if (timeSinceLastChange > this.config.recoverySamplingDuration) {
          // Step up one quality level at a time
          const newIndex = Math.max(0, currentIndex - 1)
          const newQuality = qualityOrder[newIndex]!
          this.state.currentQuality = newQuality
          this.state.lastDegradationTime = now
          this.onQualityChange?.(newQuality)
        }
      }
    }
  }

  /**
   * Force a specific quality level (for user override)
   */
  setQuality(quality: QualityLevel): void {
    this.state.currentQuality = quality
    this.state.lastDegradationTime = Date.now()
    this.onQualityChange?.(quality)
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
