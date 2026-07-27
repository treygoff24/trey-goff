import fs from 'fs/promises'
import { fetchPodcastArtwork, verifyYouTubeThumbnail, generatePlaceholderCover } from './cover-apis'
import type { Appearance } from './types'
import type { CoverCache } from '@/lib/cover-cache'

const COVER_CACHE_FILE = './.appearance-cover-cache.json'

/** Where an appearance cover can come from, in the order the resolver tries them. */
type AppearanceCoverSource = 'manual' | 'youtube' | 'itunes' | 'placeholder'

type AppearanceCoverCache = CoverCache<AppearanceCoverSource>

async function resolveAppearanceCover(appearance: Appearance): Promise<string> {
  if (appearance.showArtwork) {
    return appearance.showArtwork
  }

  const youtubeUrl = appearance.youtubeUrl || appearance.url
  if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
    const ytThumb = await verifyYouTubeThumbnail(youtubeUrl)
    if (ytThumb) {
      return ytThumb
    }
  }

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

  return generatePlaceholderCover(appearance.title, appearance.show, appearance.type)
}

export async function resolveAllCovers(appearances: Appearance[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  let cache: AppearanceCoverCache = {}
  try {
    const cacheData = await fs.readFile(COVER_CACHE_FILE, 'utf-8')
    cache = JSON.parse(cacheData)
  } catch {
    // No cache exists
  }

  for (const appearance of appearances) {
    const cachedEntry = cache[appearance.id]
    if (cachedEntry && !appearance.showArtwork) {
      results.set(appearance.id, cachedEntry.url)
      continue
    }

    console.log(`Resolving cover for: ${appearance.title}`)

    const coverUrl = await resolveAppearanceCover(appearance)
    results.set(appearance.id, coverUrl)

    let source: AppearanceCoverSource = 'placeholder'
    if (appearance.showArtwork) {
      source = 'manual'
    } else if (coverUrl.includes('youtube.com') || coverUrl.includes('ytimg')) {
      source = 'youtube'
    } else if (coverUrl.includes('mzstatic.com')) {
      source = 'itunes'
    }

    cache[appearance.id] = {
      url: coverUrl,
      resolvedAt: new Date().toISOString(),
      source,
    }

    // Rate limit: wait 300ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  await fs.writeFile(COVER_CACHE_FILE, JSON.stringify(cache, null, 2))

  return results
}
