// Open Library API (no auth required)
export async function fetchOpenLibraryCover(
  isbn: string
): Promise<string | null> {
  const sizes = ['L', 'M', 'S'] // Try large first

  for (const size of sizes) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`

    try {
      const response = await fetch(url, { method: 'HEAD' })

      // Open Library returns 200 with a 1x1 pixel for missing covers
      // Check content-length to detect this
      const contentLength = response.headers.get('content-length')
      if (response.ok && contentLength && parseInt(contentLength) > 1000) {
        return url
      }
    } catch {
      continue
    }
  }

  return null
}

// Google Books API (optional API key for higher limits)
export async function fetchGoogleBooksCover(
  isbn?: string,
  title?: string,
  author?: string
): Promise<string | null> {
  let query = ''

  if (isbn) {
    query = `isbn:${isbn}`
  } else if (title && author) {
    query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
  } else {
    return null
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes'
  const url = apiKey
    ? `${baseUrl}?q=${query}&key=${apiKey}`
    : `${baseUrl}?q=${query}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      // Google returns http URLs, convert to https and get larger size
      let coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail
      coverUrl = coverUrl.replace('http://', 'https://')
      coverUrl = coverUrl.replace('zoom=1', 'zoom=2') // Larger image

      return coverUrl
    }
  } catch {
    return null
  }

  return null
}

// Generate placeholder SVG
export function generatePlaceholderCover(title: string, author: string): string {
  // Create a gradient based on title hash for variety
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360

  const svg = `
    <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 30%, 15%)" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360}, 30%, 25%)" />
        </linearGradient>
      </defs>
      <rect width="300" height="450" fill="url(#grad)" />
      <text x="150" y="180" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui" font-size="20" font-weight="600">
        ${escapeXml(truncate(title, 25))}
      </text>
      <text x="150" y="220" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui" font-size="14">
        ${escapeXml(truncate(author, 30))}
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
