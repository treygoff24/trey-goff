import { test } from 'node:test'
import assert from 'node:assert/strict'
import sitemap from '@/app/sitemap'
import { allEssays, allNotes } from 'content-collections'
import { isNewsletterEnabled, siteUrl } from '@/lib/site-config'

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

test('sitemap includes core routes', () => {
  const entries = sitemap()
  assert.ok(entries.length > 0)

  const urls = entries.map((entry) => entry.url)
  assert.ok(urls.some((url) => url.endsWith('/writing')))
  assert.ok(urls.some((url) => url.endsWith('/notes')))
  assert.ok(urls.some((url) => url.endsWith('/library')))
  assert.ok(urls.some((url) => url.endsWith('/topics')))

  const hasSubscribe = urls.some((url) => url.endsWith('/subscribe'))
  assert.equal(hasSubscribe, isNewsletterEnabled)
})

test('sitemap has no fragment URLs', () => {
  const entries = sitemap()
  for (const entry of entries) {
    assert.ok(!entry.url.includes('#'), `fragment URL is invalid in sitemaps: ${entry.url}`)
  }
})

test('sitemap lastModified is honest', () => {
  const entries = sitemap()
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]))

  const staticWithoutDates = [
    '',
    '/library',
    '/graph',
    '/machine',
    '/projects',
    '/about',
    '/now',
    '/colophon',
    '/topics',
    '/resident',
    '/stack',
    '/transmissions',
    '/media',
  ]
  if (isNewsletterEnabled) staticWithoutDates.push('/subscribe')

  for (const route of staticWithoutDates) {
    const entry = byUrl.get(`${siteUrl}${route}`)
    assert.ok(entry, `missing static route ${route}`)
    assert.equal(
      entry.lastModified,
      undefined,
      `${route} must omit lastModified (build-time Date is dishonest)`,
    )
    assert.ok(entry.changeFrequency)
    assert.ok(typeof entry.priority === 'number')
  }

  const writing = byUrl.get(`${siteUrl}/writing`)
  assert.ok(writing)
  if (visibleEssays.length > 0) {
    assert.ok(writing.lastModified instanceof Date)
    const newestEssay = visibleEssays.map((essay) => essay.date).reduce((a, b) => (a > b ? a : b))
    assert.equal(writing.lastModified.toISOString().slice(0, 10), newestEssay.slice(0, 10))
  }

  const notes = byUrl.get(`${siteUrl}/notes`)
  assert.ok(notes)
  if (allNotes.length > 0) {
    assert.ok(notes.lastModified instanceof Date)
    const newestNote = allNotes.map((note) => note.date).reduce((a, b) => (a > b ? a : b))
    assert.equal(notes.lastModified.toISOString().slice(0, 10), newestNote.slice(0, 10))
  }

  for (const essay of visibleEssays) {
    const entry = byUrl.get(`${siteUrl}/writing/${essay.slug}`)
    assert.ok(entry, `missing essay ${essay.slug}`)
    assert.ok(entry.lastModified instanceof Date)
    assert.equal(entry.lastModified.toISOString().slice(0, 10), essay.date.slice(0, 10))
  }
})

test('sitemap entries include required non-date metadata', () => {
  const entries = sitemap()

  for (const entry of entries) {
    assert.ok(entry.url.startsWith('http'))
    assert.ok(entry.changeFrequency)
    assert.ok(typeof entry.priority === 'number')
  }
})
