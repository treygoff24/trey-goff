import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  generateArticleSchema,
  generatePersonSchema,
  generateProfilePageSchema,
  generateWebSiteSchema,
} from '@/lib/structured-data'
import { siteUrl } from '@/lib/site-config'

const projectRoot = join(__dirname, '..')
const personId = `${siteUrl}/#person`
const websiteId = `${siteUrl}/#website`

test('Organization schema exists in app/layout.tsx', () => {
  const layoutPath = join(projectRoot, 'app/layout.tsx')
  const layoutSource = readFileSync(layoutPath, 'utf-8')

  assert.ok(
    layoutSource.includes('application/ld+json'),
    'Layout should contain structured data script tag',
  )
  assert.ok(
    layoutSource.includes('generateOrganizationSchema'),
    'Layout should import and use generateOrganizationSchema',
  )
  assert.ok(
    layoutSource.includes('organizationSchema'),
    'Layout should reference organizationSchema',
  )
  assert.ok(
    layoutSource.includes('generateWebSiteSchema') && layoutSource.includes('webSiteSchema'),
    'Layout should emit WebSite JSON-LD',
  )
})

test('Person, WebSite, ProfilePage, and Article JSON-LD parse with @id wiring', () => {
  const person = generatePersonSchema()
  const website = generateWebSiteSchema()
  const profile = generateProfilePageSchema()
  const article = generateArticleSchema({
    title: 'Test Essay',
    summary: 'A summary',
    date: '2026-01-15',
    slug: 'test-essay',
  })

  for (const doc of [person, website, profile, article]) {
    assert.deepEqual(JSON.parse(JSON.stringify(doc)), doc)
  }

  assert.equal(person['@type'], 'Person')
  assert.equal(person['@id'], personId)
  assert.ok(person.sameAs.includes('https://x.com/thetreygoff'))
  assert.ok(person.sameAs.includes('https://github.com/treygoff24'))

  assert.equal(website['@type'], 'WebSite')
  assert.equal(website['@id'], websiteId)
  assert.equal(website.url, siteUrl)
  assert.equal(website.publisher['@id'], personId)

  assert.equal(profile['@type'], 'ProfilePage')
  assert.equal(profile.mainEntity['@id'], personId)

  assert.equal(article.author['@id'], personId)
  assert.equal(article.publisher['@id'], personId)
})

test('About page emits Person and ProfilePage schemas', () => {
  const aboutPath = join(projectRoot, 'app/about/page.tsx')
  const aboutSource = readFileSync(aboutPath, 'utf-8')

  assert.ok(aboutSource.includes('generatePersonSchema'))
  assert.ok(aboutSource.includes('generateProfilePageSchema'))
})

test('BreadcrumbList schema exists in writing/[slug]/page.tsx', () => {
  const writingPagePath = join(projectRoot, 'app/writing/[slug]/page.tsx')
  const writingSource = readFileSync(writingPagePath, 'utf-8')

  assert.ok(
    writingSource.includes('BreadcrumbList') || writingSource.includes('generateBreadcrumbSchema'),
    'Writing pages should include BreadcrumbList schema or breadcrumb generator',
  )
})

test('BreadcrumbList schema exists in topics/[tag]/page.tsx', () => {
  const topicPagePath = join(projectRoot, 'app/topics/[tag]/page.tsx')
  const topicSource = readFileSync(topicPagePath, 'utf-8')

  assert.ok(
    topicSource.includes('BreadcrumbList') || topicSource.includes('generateBreadcrumbSchema'),
    'Topic pages should include BreadcrumbList schema or breadcrumb generator',
  )
})

test('Topic breadcrumb structured-data URL uses the encoded topic href helper', () => {
  const topicPagePath = join(projectRoot, 'app/topics/[tag]/page.tsx')
  const topicSource = readFileSync(topicPagePath, 'utf-8')

  assert.ok(
    topicSource.includes('getTopicHref') &&
      topicSource.includes('${siteUrl}${getTopicHref(topicTag)}'),
    'Topic breadcrumb item URL should use getTopicHref(topicTag) so special characters are encoded',
  )
  assert.ok(
    !topicSource.includes('${siteUrl}/topics/${topicTag}'),
    'Topic breadcrumb item URL should not concatenate a raw decoded tag into the URL',
  )
})

test('Book schema includes enhanced fields', () => {
  const structuredDataPath = join(projectRoot, 'lib/structured-data.ts')
  const structuredDataSource = readFileSync(structuredDataPath, 'utf-8')

  assert.ok(
    structuredDataSource.includes('image') && structuredDataSource.includes('coverUrl'),
    'Book schema should include image field mapped from coverUrl',
  )
  assert.ok(
    structuredDataSource.includes('datePublished') && structuredDataSource.includes('year'),
    'Book schema should include datePublished field mapped from year',
  )
  assert.ok(
    structuredDataSource.includes('inLanguage'),
    'Book schema should include inLanguage field',
  )
})
