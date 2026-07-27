import fs from 'fs/promises'
import {
  fetchOpenLibraryCover,
  fetchGoogleBooksCover,
  generatePlaceholderCover,
} from './cover-apis'
import type { Book } from './types'
import type { CoverCache } from '@/lib/cover-cache'

const COVER_CACHE_FILE = './.cover-cache.json'

/** Where a book cover can come from, in the order the resolver tries them. */
type BookCoverSource = 'manual' | 'openlibrary' | 'google' | 'placeholder'

type BookCoverCache = CoverCache<BookCoverSource>

async function resolveBookCover(book: Book): Promise<string> {
  if (book.coverUrl) {
    return book.coverUrl
  }

  const isbn = book.isbn13 || book.isbn

  if (isbn) {
    const olCover = await fetchOpenLibraryCover(isbn)
    if (olCover) {
      return olCover
    }
  }

  const googleCover = await fetchGoogleBooksCover(isbn, book.title, book.author)
  if (googleCover) {
    return googleCover
  }

  return generatePlaceholderCover(book.title, book.author)
}

export async function resolveAllCovers(books: Book[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  let cache: BookCoverCache = {}
  try {
    const cacheData = await fs.readFile(COVER_CACHE_FILE, 'utf-8')
    cache = JSON.parse(cacheData)
  } catch {
    // No cache exists
  }

  for (const book of books) {
    const cachedEntry = cache[book.id]
    if (cachedEntry && !book.coverUrl) {
      results.set(book.id, cachedEntry.url)
      continue
    }

    console.log(`Resolving cover for: ${book.title}`)

    const coverUrl = await resolveBookCover(book)
    results.set(book.id, coverUrl)

    let source: BookCoverSource = 'placeholder'
    if (book.coverUrl) {
      source = 'manual'
    } else if (coverUrl.includes('openlibrary')) {
      source = 'openlibrary'
    } else if (coverUrl.includes('books.google.com')) {
      source = 'google'
    }

    cache[book.id] = {
      url: coverUrl,
      resolvedAt: new Date().toISOString(),
      source,
    }

    // Rate limit: wait 200ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  await fs.writeFile(COVER_CACHE_FILE, JSON.stringify(cache, null, 2))

  return results
}
