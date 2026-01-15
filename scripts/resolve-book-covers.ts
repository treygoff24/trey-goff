import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolveAllCovers } from '../lib/books/covers'
import type { BooksData } from '../lib/books/types'

const COVERS_DIR = './public/covers'

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) return false

    const buffer = await response.arrayBuffer()
    // Skip tiny images (likely 1x1 placeholders)
    if (buffer.byteLength < 1000) return false

    writeFileSync(filepath, Buffer.from(buffer))
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('Resolving book covers...')

  // Ensure directories exist
  mkdirSync('./public', { recursive: true })
  mkdirSync(COVERS_DIR, { recursive: true })

  // Load books
  const booksData: BooksData = JSON.parse(
    readFileSync('./content/library/books.json', 'utf-8')
  )

  // First, resolve URLs using the existing system
  const coverUrls = await resolveAllCovers(booksData.books)

  // Now download each cover locally
  const coverMap: Record<string, string> = {}
  let downloaded = 0
  let skipped = 0

  for (const [bookId, url] of coverUrls.entries()) {
    const localPath = `${COVERS_DIR}/${bookId}.jpg`
    const publicPath = `/covers/${bookId}.jpg`

    // Skip if already downloaded
    if (existsSync(localPath)) {
      coverMap[bookId] = publicPath
      skipped++
      continue
    }

    // Skip data URLs (SVG placeholders) - keep them as-is
    if (url.startsWith('data:')) {
      coverMap[bookId] = url
      continue
    }

    console.log(`Downloading cover for: ${bookId}`)
    const success = await downloadImage(url, localPath)

    if (success) {
      coverMap[bookId] = publicPath
      downloaded++
    } else {
      // Fall back to the original URL (will fail due to CORS, but better than nothing)
      // Or generate placeholder
      console.warn(`  Failed to download, using placeholder for: ${bookId}`)
      coverMap[bookId] = generateLocalPlaceholder(bookId, booksData.books.find(b => b.id === bookId))
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Write cover mapping
  writeFileSync('./public/cover-map.json', JSON.stringify(coverMap, null, 2))

  console.log(`\nCover resolution complete:`)
  console.log(`  Downloaded: ${downloaded}`)
  console.log(`  Skipped (cached): ${skipped}`)
  console.log(`  Total: ${coverUrls.size}`)
}

function generateLocalPlaceholder(bookId: string, book?: { title?: string; author?: string }): string {
  const title = book?.title || bookId
  const author = book?.author || 'Unknown'
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360

  const svg = `<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
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
  </svg>`.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '...' : str
}

main().catch(console.error)
