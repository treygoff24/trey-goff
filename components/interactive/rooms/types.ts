import type { ComponentType } from 'react'
import type { RoomId } from '@/lib/interactive/types'
import type { QualityTier } from '@/lib/interactive/capabilities'
import type { OverlayContent } from '../ContentOverlay'

/**
 * Shared room contracts.
 *
 * This module is deliberately a leaf: individual room components and the room
 * registry (`./index`) both depend on it, and it depends on neither. Declaring
 * these types in the barrel instead would make every room import its own
 * registry, which is the import cycle this file exists to prevent.
 */

export interface RoomProps {
  debug?: boolean
  onDoorActivate?: (
    targetRoom: RoomId,
    spawnPosition: [number, number, number],
    spawnRotation: number,
  ) => void
  onContentSelect?: (content: OverlayContent) => void
  /** Quality tier for atmospheric effects */
  qualityTier?: QualityTier
  /** Whether reduced motion is preferred */
  reducedMotion?: boolean
}

export interface RoomConfig {
  /** The room component */
  Component: ComponentType<RoomProps>
  /** Default spawn position when entering this room */
  defaultSpawn: [number, number, number]
  /** Default spawn rotation (Y-axis) when entering this room */
  defaultRotation: number
  /** Display name for UI */
  displayName: string
  /** Whether room is ready (has real assets vs placeholder) */
  isPlaceholder: boolean
}
