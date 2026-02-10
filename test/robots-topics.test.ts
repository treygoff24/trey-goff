import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

describe('robots.txt', () => {
  test('robots.txt exists in public directory', () => {
    const robotsPath = join(process.cwd(), 'public', 'robots.txt')
    assert.ok(existsSync(robotsPath), 'robots.txt should exist in public/')
  })

  test('robots.txt contains correct directives', () => {
    const robotsPath = join(process.cwd(), 'public', 'robots.txt')
    const content = readFileSync(robotsPath, 'utf-8')

    assert.ok(content.includes('User-agent: *'), 'Should have User-agent: *')
    assert.ok(content.includes('Allow: /'), 'Should have Allow: /')
    assert.ok(content.includes('Disallow: /api/'), 'Should disallow /api/')
    assert.ok(content.includes('Disallow: /preview/'), 'Should disallow /preview/')
  })

  test('robots.txt references sitemap', () => {
    const robotsPath = join(process.cwd(), 'public', 'robots.txt')
    const content = readFileSync(robotsPath, 'utf-8')

    assert.ok(
      content.includes('Sitemap: https://trey.world/sitemap.xml'),
      'Should reference sitemap at https://trey.world/sitemap.xml'
    )
  })
})

describe('topic page metadata', () => {
  test('topic pages should include lastModified based on latest content date', async () => {
    const topicPageModule = await import('@/app/topics/[tag]/page')

    assert.ok(
      topicPageModule.generateMetadata,
      'generateMetadata should be exported'
    )

    const mockParams = Promise.resolve({ tag: 'systems' })
    const metadata = await topicPageModule.generateMetadata({
      params: mockParams
    })

    assert.ok(metadata, 'Should return metadata object')
    assert.ok(metadata.title, 'Should have title')
    assert.ok(metadata.description, 'Should have description')

    assert.ok(
      metadata.openGraph?.modifiedTime,
      'Should have openGraph.modifiedTime for SEO'
    )

    const modifiedTime = new Date(metadata.openGraph.modifiedTime).getTime()
    const now = Date.now()

    assert.ok(
      modifiedTime <= now,
      'modifiedTime should not be in the future'
    )

    assert.ok(
      modifiedTime > new Date('2000-01-01').getTime(),
      'modifiedTime should be after year 2000 (reasonable date validation)'
    )
  })
})
