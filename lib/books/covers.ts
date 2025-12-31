import fs from 'fs/promises'
import {
  fetchOpenLibraryCover,
  fetchGoogleBooksCover,
  generatePlaceholderCover,
} from './cover-apis'
import type { Book } from './types'

const COVER_CACHE_FILE = './.cover-cache.json'

interface CoverCache {
  [bookId: string]: {
    url: string
    resolvedAt: string
    source: 'manual' | 'openlibrary' | 'google' | 'placeholder'
  }
}

export async function resolveBookCover(book: Book): Promise<string> {
  // 1. Manual override
  if (book.coverUrl) {
    return book.coverUrl
  }

  const isbn = book.isbn13 || book.isbn

  // 2. Try Open Library
  if (isbn) {
    const olCover = await fetchOpenLibraryCover(isbn)
    if (olCover) {
      return olCover
    }
  }

  // 3. Try Google Books
  const googleCover = await fetchGoogleBooksCover(isbn, book.title, book.author)
  if (googleCover) {
    return googleCover
  }

  // 4. Generate placeholder
  return generatePlaceholderCover(book.title, book.author)
}

export async function resolveAllCovers(
  books: Book[]
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

  // Process books with rate limiting
  for (const book of books) {
    // Check cache first (unless manual override)
    const cachedEntry = cache[book.id]
    if (cachedEntry && !book.coverUrl) {
      results.set(book.id, cachedEntry.url)
      continue
    }

    console.log(`Resolving cover for: ${book.title}`)

    const coverUrl = await resolveBookCover(book)
    results.set(book.id, coverUrl)

    // Determine source
    let source: CoverCache[string]['source'] = 'placeholder'
    if (book.coverUrl) {
      source = 'manual'
    } else if (coverUrl.includes('openlibrary')) {
      source = 'openlibrary'
    } else if (coverUrl.includes('books.google.com')) {
      source = 'google'
    }

    // Update cache
    cache[book.id] = {
      url: coverUrl,
      resolvedAt: new Date().toISOString(),
      source,
    }

    // Rate limit: wait 200ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  // Save cache
  await fs.writeFile(COVER_CACHE_FILE, JSON.stringify(cache, null, 2))

  return results
}
