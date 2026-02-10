import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Home page metadata', () => {
  const pageSource = readFileSync(join(process.cwd(), 'app', 'page.tsx'), 'utf-8')

  test('should export metadata object', () => {
    assert.match(pageSource, /export\s+const\s+metadata/, 'page should export metadata')
  })

  test('should have a title set', () => {
    const titleMatch = pageSource.match(/title:\s*['"]([^'"]+)['"]/)
    const title = titleMatch?.[1]
    assert.ok(title, 'metadata should have a title')
    assert.ok(title.length > 0, 'title should not be empty')
  })

  test('should have a description of at least 50 characters', () => {
    const descMatch = pageSource.match(/description:\s*['"]([^'"]+)['"]/)
    const desc = descMatch?.[1]
    assert.ok(desc, 'metadata should have a description')
    assert.ok(desc.length >= 50, `description should be at least 50 characters, got ${desc.length}`)
  })

  test('should have openGraph config with title and description', () => {
    assert.match(pageSource, /openGraph:\s*\{/, 'metadata should have openGraph')
    assert.match(pageSource, /openGraph:\s*\{[^}]*title:/, 'openGraph should have title')
    assert.match(pageSource, /openGraph:\s*\{[^}]*description:/, 'openGraph should have description')
  })
})
