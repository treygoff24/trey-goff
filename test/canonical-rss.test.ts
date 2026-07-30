import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pageAlternates, rssAlternates, siteUrl } from '@/lib/site-config'

describe('Layout metadata', () => {
  const layoutSource = readFileSync(join(process.cwd(), 'app', 'layout.tsx'), 'utf-8')

  test('should have alternates with canonical URL', () => {
    assert.match(layoutSource, /alternates:\s*\{/, 'metadata should have alternates configuration')
    assert.match(layoutSource, /canonical:\s*siteUrl/, 'alternates should reference siteUrl')
    assert.equal(siteUrl, 'https://www.treygoff.com')
  })

  test('should have RSS feed discovery links', () => {
    assert.match(
      layoutSource,
      /['"]application\/rss\+xml['"]:\s*rssAlternates/,
      'root metadata types should assign the shared rssAlternates list',
    )
    const urls = rssAlternates.map((feed) => feed.url)
    assert.deepEqual(urls, ['/feed.xml', '/writing/feed.xml', '/notes/feed.xml'])
  })
})

describe('pageAlternates', () => {
  test('restates canonical and RSS links alongside the markdown alternate', () => {
    const alternates = pageAlternates('/about', { markdownPath: '/about.md' })
    assert.equal(alternates.canonical, `${siteUrl}/about`)
    assert.equal(alternates.types['application/rss+xml'], rssAlternates)
    assert.equal(alternates.types['text/markdown'], `${siteUrl}/about.md`)
  })

  test('omits the markdown type when no mirror exists', () => {
    const alternates = pageAlternates('/projects')
    assert.equal(alternates.canonical, `${siteUrl}/projects`)
    assert.equal('text/markdown' in alternates.types, false)
  })
})
