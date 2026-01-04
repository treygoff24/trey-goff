'use client'

/**
 * AnimationDriver - Central animation invalidation controller.
 *
 * R3F with `frameloop="demand"` only renders when `invalidate()` is called.
 * This component monitors the derived `isAnimating` flag from the store and
 * calls `invalidate()` every frame while any animation is active.
 *
 * This ensures:
 * - Scene is static when idle (GPU idles at ~0%)
 * - Animations render smoothly at 60fps
 * - All animation sources are centrally coordinated
 *
 * Animation sources tracked:
 * - Camera transitions (isTransitioning)
 * - Nebula UV panning (isUvPanning)
 * - Particle drift (isParticleDrifting)
 * - Book position lerps (hasBookLerps)
 */

import { useFrame, useThree } from '@react-three/fiber'
import { useLibraryStore, selectIsAnimating } from '@/lib/library/store'

// =============================================================================
// Component
// =============================================================================

export function AnimationDriver() {
  const { invalidate } = useThree()
  const isAnimating = useLibraryStore(selectIsAnimating)

  useFrame(() => {
    // Only invalidate when something is animating
    // This keeps the render loop active during animations
    if (isAnimating) {
      invalidate()
    }
  })

  // This component renders nothing - it just drives animation
  return null
}
