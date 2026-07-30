import assert from 'node:assert/strict'
import test from 'node:test'
import { allEssays } from 'content-collections'
import { siteUrl } from '@/lib/site-config'
import { buildSitemapMarkdown, cleanMdx, publishedEssays } from '@/lib/markdown-mirrors'

test('essay markdown route returns markdown with Vary: Accept', async () => {
  const essay = publishedEssays()[0]
  assert.ok(essay)

  const { GET } = await import('@/app/md/writing/[slug]/route')
  const response = await GET(new Request('https://example.com'), {
    params: Promise.resolve({ slug: essay.slug }),
  })

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8')
  assert.equal(response.headers.get('Vary'), 'Accept')
  assert.match(
    await response.text(),
    new RegExp(`^# ${essay.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
  )
})

test('draft essays are excluded from markdown routes and sitemap', async () => {
  const draft = allEssays.find((essay) => essay.status === 'draft')
  assert.ok(draft)

  const { GET } = await import('@/app/md/writing/[slug]/route')
  const response = await GET(new Request('https://example.com'), {
    params: Promise.resolve({ slug: draft.slug }),
  })

  assert.equal(response.status, 404)
  assert.doesNotMatch(buildSitemapMarkdown(), new RegExp(`/writing/${draft.slug}\\.md`))
})

test('cleanMdx strips statements and JSX tags while preserving inner text', () => {
  const source = `import Callout from './Callout'\n\n<Callout tone="warm">\nKeep this text.\n</Callout>\n\n\`\`\`js\nimport stays = true\n\`\`\``
  const cleaned = cleanMdx(source)

  assert.doesNotMatch(cleaned, /import Callout/)
  assert.doesNotMatch(cleaned, /<Callout/)
  assert.match(cleaned, /Keep this text\./)
  assert.match(cleaned, /import stays = true/)
})

test('sitemap markdown lists published essay mirrors with summaries', () => {
  const sitemap = buildSitemapMarkdown()

  for (const essay of publishedEssays()) {
    assert.match(sitemap, new RegExp(`${siteUrl}/writing/${essay.slug}\\.md`))
    assert.match(sitemap, new RegExp(essay.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
