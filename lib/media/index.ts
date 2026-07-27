import appearancesData from '@/content/media/appearances.json'
import appearanceCovers from '@/public/appearance-covers.json'
import type { Appearance, AppearancesData, AppearanceType } from './types'

// Pre-resolved cover map
const coverMap = appearanceCovers as Record<string, string>

export function getAllAppearances(): Appearance[] {
  return (appearancesData as AppearancesData).appearances
}

export function getFeaturedAppearances(): Appearance[] {
  return getAllAppearances().filter((appearance) => appearance.featured)
}

export function getAppearancesByType(type: AppearanceType): Appearance[] {
  return getAllAppearances().filter((appearance) => appearance.type === type)
}

export function getAllTypes(): AppearanceType[] {
  const types = new Set<AppearanceType>()
  getAllAppearances().forEach((appearance) => types.add(appearance.type))
  return Array.from(types)
}

export function sortAppearancesByDate(appearances: Appearance[]): Appearance[] {
  return [...appearances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAppearanceThumbnail(appearance: Appearance): string | null {
  const cover = coverMap[appearance.id]
  if (cover) return cover

  // Fallback to manual showArtwork if not in cover map
  return appearance.showArtwork || null
}

export type { Appearance, AppearancesData, AppearanceType } from './types'
