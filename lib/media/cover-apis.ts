// iTunes Search API for podcast artwork (no auth required)
export async function fetchPodcastArtwork(
  podcastName: string
): Promise<string | null> {
  const encodedName = encodeURIComponent(podcastName)
  const url = `https://itunes.apple.com/search?term=${encodedName}&entity=podcast&limit=5`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      // Find best match by comparing names
      const normalizedSearch = podcastName.toLowerCase().trim()
      const match = data.results.find((result: { collectionName?: string }) => {
        const resultName = result.collectionName?.toLowerCase().trim() || ''
        return (
          resultName === normalizedSearch ||
          resultName.includes(normalizedSearch) ||
          normalizedSearch.includes(resultName)
        )
      })

      const result = match || data.results[0]

      // iTunes returns artworkUrl60, artworkUrl100, artworkUrl600
      // Get highest resolution available
      if (result.artworkUrl600) {
        return result.artworkUrl600
      }
      if (result.artworkUrl100) {
        // Request larger size by modifying URL
        return result.artworkUrl100.replace('100x100', '600x600')
      }
    }
  } catch {
    return null
  }

  return null
}

// Extract YouTube video ID from various URL formats
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
  if (!videoId) return null

  // maxresdefault is highest quality but may not exist
  // We return it and let the build script verify it exists
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

// Verify a YouTube thumbnail exists (maxresdefault may 404)
export async function verifyYouTubeThumbnail(
  url: string
): Promise<string | null> {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  // Try thumbnail sizes in order of preference
  const sizes = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault']

  for (const size of sizes) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/${size}.jpg`
    try {
      const response = await fetch(thumbUrl, { method: 'HEAD' })
      // YouTube returns 200 for missing thumbnails with a placeholder
      // Check content-length - real thumbnails are larger
      const contentLength = response.headers.get('content-length')
      if (response.ok && contentLength && parseInt(contentLength) > 5000) {
        return thumbUrl
      }
    } catch {
      continue
    }
  }

  return null
}

// Generate placeholder SVG for appearances
export function generatePlaceholderCover(
  title: string,
  showName: string,
  type: 'podcast' | 'youtube' | 'talk' | 'interview'
): string {
  // Create a gradient based on title hash for variety
  const hash = (title + showName)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360

  // Icon based on type
  const iconPaths: Record<string, string> = {
    podcast:
      'M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3h-1.75c0 2.03-1.64 3.68-3.66 3.91V17h-1v-2.09C9.15 14.68 7.51 13.03 7.51 11H5.75c0 3.04 2.35 5.54 5.25 5.91V20h2v-3.09c2.9-.37 5.25-2.87 5.25-5.91h-0.09z',
    youtube:
      'M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z',
    talk: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
    interview:
      'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z',
  }

  const iconPath = iconPaths[type] || iconPaths.podcast

  const svg = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 40%, 20%)" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 40%, 30%)" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#grad)" />
      <g transform="translate(250, 200) scale(4)" fill="rgba(255,255,255,0.3)">
        <path d="${iconPath}" />
      </g>
      <text x="300" y="380" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui" font-size="28" font-weight="600">
        ${escapeXml(truncate(showName, 30))}
      </text>
      <text x="300" y="420" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui" font-size="18">
        ${escapeXml(truncate(title, 40))}
      </text>
    </svg>
  `.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '...' : str
}
