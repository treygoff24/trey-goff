import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')

test('Organization schema exists in app/layout.tsx', () => {
  const layoutPath = join(projectRoot, 'app/layout.tsx')
  const layoutSource = readFileSync(layoutPath, 'utf-8')

  assert.ok(
    layoutSource.includes('application/ld+json'),
    'Layout should contain structured data script tag'
  )
  assert.ok(
    layoutSource.includes('generateOrganizationSchema'),
    'Layout should import and use generateOrganizationSchema'
  )
  assert.ok(
    layoutSource.includes('organizationSchema'),
    'Layout should reference organizationSchema'
  )
})

test('BreadcrumbList schema exists in writing/[slug]/page.tsx', () => {
  const writingPagePath = join(projectRoot, 'app/writing/[slug]/page.tsx')
  const writingSource = readFileSync(writingPagePath, 'utf-8')

  assert.ok(
    writingSource.includes('BreadcrumbList') || writingSource.includes('generateBreadcrumbSchema'),
    'Writing pages should include BreadcrumbList schema or breadcrumb generator'
  )
})

test('BreadcrumbList schema exists in topics/[tag]/page.tsx', () => {
  const topicPagePath = join(projectRoot, 'app/topics/[tag]/page.tsx')
  const topicSource = readFileSync(topicPagePath, 'utf-8')

  assert.ok(
    topicSource.includes('BreadcrumbList') || topicSource.includes('generateBreadcrumbSchema'),
    'Topic pages should include BreadcrumbList schema or breadcrumb generator'
  )
})

test('Book schema includes enhanced fields', () => {
  const structuredDataPath = join(projectRoot, 'lib/structured-data.ts')
  const structuredDataSource = readFileSync(structuredDataPath, 'utf-8')

  assert.ok(
    structuredDataSource.includes('image') && structuredDataSource.includes('coverUrl'),
    'Book schema should include image field mapped from coverUrl'
  )
  assert.ok(
    structuredDataSource.includes('datePublished') && structuredDataSource.includes('year'),
    'Book schema should include datePublished field mapped from year'
  )
  assert.ok(
    structuredDataSource.includes('inLanguage'),
    'Book schema should include inLanguage field'
  )
})
