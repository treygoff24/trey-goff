import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { generatePlaceholderCover } from '@/lib/books/cover-apis'

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
