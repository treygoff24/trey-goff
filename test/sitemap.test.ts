import { test } from 'node:test'
import assert from 'node:assert/strict'
import sitemap from '@/app/sitemap'

test('sitemap includes core routes', () => {
  const entries = sitemap()
  assert.ok(entries.length > 0)

  const urls = entries.map((entry) => entry.url)
  assert.ok(urls.some((url) => url.endsWith('/writing')))
  assert.ok(urls.some((url) => url.endsWith('/notes')))
  assert.ok(urls.some((url) => url.endsWith('/library')))
  assert.ok(urls.some((url) => url.endsWith('/topics')))
})

test('sitemap entries include required metadata', () => {
  const entries = sitemap()

  for (const entry of entries) {
    assert.ok(entry.url.startsWith('http'))
    assert.ok(entry.lastModified instanceof Date)
    assert.ok(entry.changeFrequency)
    assert.ok(typeof entry.priority === 'number')
  }
})
