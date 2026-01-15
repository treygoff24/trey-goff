import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

const THUMBNAILS_DIR = './public/thumbnails'

interface Appearance {
  id: string
  title: string
  show: string
  type: string
  url: string
  youtubeUrl?: string
  [key: string]: unknown
}

interface AppearancesData {
  lastUpdated: string
  appearances: Appearance[]
}

function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function downloadThumbnail(videoId: string | null, filepath: string): Promise<boolean> {
  if (!videoId) return false
  // Try maxresdefault first, then hqdefault
  const urls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ]

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const buffer = await response.arrayBuffer()
      // YouTube returns a placeholder for missing thumbnails that's ~1KB
      if (buffer.byteLength < 2000) continue

      writeFileSync(filepath, Buffer.from(buffer))
      return true
    } catch {
      continue
    }
  }
  return false
}

async function main() {
  console.log('Fetching media thumbnails...')

  // Ensure directory exists
  mkdirSync(THUMBNAILS_DIR, { recursive: true })

  // Load appearances
  const data: AppearancesData = JSON.parse(
    readFileSync('./content/media/appearances.json', 'utf-8')
  )

  const thumbnailMap: Record<string, string> = {}
  let downloaded = 0
  let skipped = 0
  let noYoutube = 0

  for (const appearance of data.appearances) {
    const youtubeUrl = appearance.youtubeUrl || appearance.url
    const videoId = extractYouTubeVideoId(youtubeUrl)

    if (!videoId) {
      console.log(`No YouTube ID for: ${appearance.title}`)
      noYoutube++
      continue
    }

    const localPath = `${THUMBNAILS_DIR}/${appearance.id}.jpg`
    const publicPath = `/thumbnails/${appearance.id}.jpg`

    // Skip if already downloaded
    if (existsSync(localPath)) {
      thumbnailMap[appearance.id] = publicPath
      skipped++
      continue
    }

    console.log(`Downloading thumbnail for: ${appearance.title}`)
    const success = await downloadThumbnail(videoId, localPath)

    if (success) {
      thumbnailMap[appearance.id] = publicPath
      downloaded++
    } else {
      console.warn(`  Failed to download thumbnail for: ${appearance.id}`)
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  // Write thumbnail mapping
  writeFileSync('./public/thumbnail-map.json', JSON.stringify(thumbnailMap, null, 2))

  console.log(`\nThumbnail fetch complete:`)
  console.log(`  Downloaded: ${downloaded}`)
  console.log(`  Skipped (cached): ${skipped}`)
  console.log(`  No YouTube URL: ${noYoutube}`)
  console.log(`  Total appearances: ${data.appearances.length}`)
}

main().catch(console.error)
