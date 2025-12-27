import appearancesData from '@/content/media/appearances.json'
import type { Appearance, AppearancesData, AppearanceType } from './types'

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

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeId(url)
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null
}

// Get thumbnail for appearance (YouTube auto-fetch or showArtwork)
export function getAppearanceThumbnail(appearance: Appearance): string | null {
  const youtubeUrl = appearance.youtubeUrl || appearance.url
  if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
    const thumbnail = getYouTubeThumbnail(youtubeUrl)
    if (thumbnail) return thumbnail
  }
  return appearance.showArtwork || null
}

export type { Appearance, AppearancesData, AppearanceType } from './types'
