import assert from 'node:assert/strict'
import test, { afterEach, beforeEach, describe } from 'node:test'
import {
  fetchGoogleBooksCover,
  fetchOpenLibraryCover,
  generatePlaceholderCover,
} from '@/lib/books/cover-apis'

const originalFetch = globalThis.fetch
const originalGoogleApiKey = process.env.GOOGLE_BOOKS_API_KEY

beforeEach(() => {
  globalThis.fetch = originalFetch
  process.env.GOOGLE_BOOKS_API_KEY = originalGoogleApiKey
})

afterEach(() => {
  globalThis.fetch = originalFetch
  process.env.GOOGLE_BOOKS_API_KEY = originalGoogleApiKey
})

describe('fetchOpenLibraryCover', () => {
  test('returns the first valid cover URL by size', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    globalThis.fetch = async (url, init) => {
      calls.push({ url: url.toString(), init })
      return new Response(null, {
        status: 200,
        headers: { 'content-length': '1501' },
      })
    }

    const result = await fetchOpenLibraryCover('1234567890')
    assert.equal(
      result,
      'https://covers.openlibrary.org/b/isbn/1234567890-L.jpg'
    )
    assert.equal(calls.length, 1)
    assert.equal(calls[0].init?.method, 'HEAD')
  })

  test('skips missing covers and continues to next size', async () => {
    let callIndex = 0
    globalThis.fetch = async (url) => {
      callIndex += 1
      if (callIndex === 1) {
        return new Response(null, {
          status: 200,
          headers: { 'content-length': '42' },
        })
      }
      return new Response(null, {
        status: 200,
        headers: { 'content-length': '2000' },
      })
    }

    const result = await fetchOpenLibraryCover('999')
    assert.equal(result, 'https://covers.openlibrary.org/b/isbn/999-M.jpg')
  })

  test('continues after network errors and returns null when none found', async () => {
    let callIndex = 0
    globalThis.fetch = async () => {
      callIndex += 1
      if (callIndex <= 2) {
        throw new Error('network')
      }
      return new Response(null, {
        status: 200,
        headers: { 'content-length': '10' },
      })
    }

    const result = await fetchOpenLibraryCover('nope')
    assert.equal(result, null)
  })
})

describe('fetchGoogleBooksCover', () => {
  test('returns null when insufficient query data', async () => {
    const result = await fetchGoogleBooksCover()
    assert.equal(result, null)
  })

  test('builds an ISBN query and uses the API key when provided', async () => {
    process.env.GOOGLE_BOOKS_API_KEY = 'test-key'
    let requestedUrl = ''

    globalThis.fetch = async (url) => {
      requestedUrl = url.toString()
      return new Response(
        JSON.stringify({
          items: [
            {
              volumeInfo: {
                imageLinks: {
                  thumbnail: 'http://example.com/cover.jpg?zoom=1',
                },
              },
            },
          ],
        }),
        { status: 200 }
      )
    }

    const result = await fetchGoogleBooksCover('9780000000')
    assert.ok(requestedUrl.includes('q=isbn:9780000000'))
    assert.ok(requestedUrl.includes('key=test-key'))
    assert.equal(result, 'https://example.com/cover.jpg?zoom=2')
  })

  test('returns null when the API has no thumbnail', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ items: [] }), { status: 200 })

    const result = await fetchGoogleBooksCover(undefined, 'Title', 'Author')
    assert.equal(result, null)
  })

  test('returns null on fetch errors', async () => {
    globalThis.fetch = async () => {
      throw new Error('boom')
    }

    const result = await fetchGoogleBooksCover('9780000000')
    assert.equal(result, null)
  })
})

describe('generatePlaceholderCover', () => {
  test('returns a data URI SVG', () => {
    const result = generatePlaceholderCover('Test Book', 'Test Author')
    assert.ok(result.startsWith('data:image/svg+xml,'))
  })

  test('includes the title in the SVG', () => {
    const result = generatePlaceholderCover('My Title', 'Author')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('My Title'))
  })

  test('includes the author in the SVG', () => {
    const result = generatePlaceholderCover('Title', 'Jane Doe')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('Jane Doe'))
  })

  test('escapes XML special characters in title', () => {
    const result = generatePlaceholderCover('Tom & Jerry <Friends>', 'Author')
    const decoded = decodeURIComponent(result)
    // Should escape & and < and >
    assert.ok(decoded.includes('&amp;'))
    assert.ok(decoded.includes('&lt;'))
    assert.ok(decoded.includes('&gt;'))
    // Should NOT contain raw special characters in text content
    assert.ok(!decoded.includes('>Tom & Jerry'))
  })

  test('escapes XML special characters in author', () => {
    const result = generatePlaceholderCover('Title', "O'Brien & Co")
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('&apos;'))
    assert.ok(decoded.includes('&amp;'))
  })

  test('truncates long titles', () => {
    const longTitle = 'A'.repeat(50)
    const result = generatePlaceholderCover(longTitle, 'Author')
    const decoded = decodeURIComponent(result)
    // Title is truncated to 25 chars (24 + ...)
    assert.ok(!decoded.includes('A'.repeat(50)))
    assert.ok(decoded.includes('...'))
  })

  test('truncates long author names', () => {
    const longAuthor = 'B'.repeat(50)
    const result = generatePlaceholderCover('Title', longAuthor)
    const decoded = decodeURIComponent(result)
    // Author is truncated to 30 chars (29 + ...)
    assert.ok(!decoded.includes('B'.repeat(50)))
    assert.ok(decoded.includes('...'))
  })

  test('generates different colors for different titles', () => {
    const result1 = generatePlaceholderCover('Book A', 'Author')
    const result2 = generatePlaceholderCover('Book B', 'Author')
    // The hue values should be different based on title hash
    // Both are valid SVGs but should have different gradient colors
    assert.notEqual(result1, result2)
  })

  test('generates consistent color for same title', () => {
    const result1 = generatePlaceholderCover('Consistent Title', 'Author')
    const result2 = generatePlaceholderCover('Consistent Title', 'Author')
    assert.equal(result1, result2)
  })

  test('SVG has correct dimensions', () => {
    const result = generatePlaceholderCover('Test', 'Author')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('width="300"'))
    assert.ok(decoded.includes('height="450"'))
  })

  test('handles empty title', () => {
    const result = generatePlaceholderCover('', 'Author')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('<svg'))
    assert.ok(decoded.includes('Author'))
  })

  test('handles empty author', () => {
    const result = generatePlaceholderCover('Title', '')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('<svg'))
    assert.ok(decoded.includes('Title'))
  })

  test('handles quotes in text', () => {
    const result = generatePlaceholderCover('"Quoted"', 'Author')
    const decoded = decodeURIComponent(result)
    assert.ok(decoded.includes('&quot;'))
  })
})
