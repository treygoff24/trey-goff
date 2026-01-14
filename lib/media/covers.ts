import fs from 'fs/promises'
import {
  fetchPodcastArtwork,
  verifyYouTubeThumbnail,
  generatePlaceholderCover,
} from './cover-apis'
import type { Appearance } from './types'

const COVER_CACHE_FILE = './.appearance-cover-cache.json'

interface CoverCache {
  [appearanceId: string]: {
    url: string
    resolvedAt: string
    source: 'manual' | 'youtube' | 'itunes' | 'placeholder'
  }
}

export async function resolveAppearanceCover(
  appearance: Appearance
): Promise<string> {
  // 1. Manual override via showArtwork
  if (appearance.showArtwork) {
    return appearance.showArtwork
  }

  // 2. Try YouTube if we have a YouTube URL
  const youtubeUrl = appearance.youtubeUrl || appearance.url
  if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
    const ytThumb = await verifyYouTubeThumbnail(youtubeUrl)
    if (ytThumb) {
      return ytThumb
    }
  }

  // 3. Try iTunes Search API for podcast artwork
  if (
    appearance.type === 'podcast' ||
    appearance.type === 'interview' ||
    appearance.appleUrl ||
    appearance.spotifyUrl
  ) {
    const podcastArtwork = await fetchPodcastArtwork(appearance.show)
    if (podcastArtwork) {
      return podcastArtwork
    }
  }

  // 4. Generate placeholder
  return generatePlaceholderCover(
    appearance.title,
    appearance.show,
    appearance.type
  )
}

export async function resolveAllCovers(
  appearances: Appearance[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Load existing cache
  let cache: CoverCache = {}
  try {
    const cacheData = await fs.readFile(COVER_CACHE_FILE, 'utf-8')
    cache = JSON.parse(cacheData)
  } catch {
    // No cache exists
  }

  // Process appearances with rate limiting
  for (const appearance of appearances) {
    // Check cache first (unless manual override)
    const cachedEntry = cache[appearance.id]
    if (cachedEntry && !appearance.showArtwork) {
      results.set(appearance.id, cachedEntry.url)
      continue
    }

    console.log(`Resolving cover for: ${appearance.title}`)

    const coverUrl = await resolveAppearanceCover(appearance)
    results.set(appearance.id, coverUrl)

    // Determine source
    let source: CoverCache[string]['source'] = 'placeholder'
    if (appearance.showArtwork) {
      source = 'manual'
    } else if (coverUrl.includes('youtube.com') || coverUrl.includes('ytimg')) {
      source = 'youtube'
    } else if (coverUrl.includes('mzstatic.com')) {
      source = 'itunes'
    }

    // Update cache
    cache[appearance.id] = {
      url: coverUrl,
      resolvedAt: new Date().toISOString(),
      source,
    }

    // Rate limit: wait 300ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  // Save cache
  await fs.writeFile(COVER_CACHE_FILE, JSON.stringify(cache, null, 2))

  return results
}
