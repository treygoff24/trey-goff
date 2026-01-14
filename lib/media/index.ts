import appearancesData from '@/content/media/appearances.json'
import appearanceCovers from '@/public/appearance-covers.json'
import type { Appearance, AppearancesData, AppearanceType } from './types'

// Pre-resolved cover map
const coverMap = appearanceCovers as Record<string, string>

// Get all appearances
export function getAllAppearances(): Appearance[] {
  return (appearancesData as AppearancesData).appearances
}

// Get featured appearances
export function getFeaturedAppearances(): Appearance[] {
  return getAllAppearances().filter((appearance) => appearance.featured)
}

// Get appearances by type
export function getAppearancesByType(type: AppearanceType): Appearance[] {
  return getAllAppearances().filter((appearance) => appearance.type === type)
}

// Get all unique types
export function getAllTypes(): AppearanceType[] {
  const types = new Set<AppearanceType>()
  getAllAppearances().forEach((appearance) => types.add(appearance.type))
  return Array.from(types)
}

// Sort appearances by date (newest first)
export function sortAppearancesByDate(appearances: Appearance[]): Appearance[] {
  return [...appearances].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// Get thumbnail for appearance from pre-resolved cover map
export function getAppearanceThumbnail(appearance: Appearance): string | null {
  // Use pre-resolved cover from build-time resolution
  const cover = coverMap[appearance.id]
  if (cover) return cover

  // Fallback to manual showArtwork if not in cover map
  return appearance.showArtwork || null
}

export type { Appearance, AppearancesData, AppearanceType } from './types'
