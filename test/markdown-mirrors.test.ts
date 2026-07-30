import assert from 'node:assert/strict'
import test from 'node:test'
import { allEssays } from 'content-collections'
import { siteUrl } from '@/lib/site-config'
import {
  buildEssayMarkdown,
  buildSitemapMarkdown,
  cleanMdx,
  publishedEssays,
} from '@/lib/markdown-mirrors'

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

test('cleanMdx preserves capitalized JSX inside fenced code blocks', () => {
  const source = [
    'Prose before.',
    '',
    '<Callout>outside</Callout>',
    '',
    '```tsx',
    'const el = <Button onClick={() => {}}>Save</Button>',
    '```',
    '',
    'Prose after.',
  ].join('\n')
  const cleaned = cleanMdx(source)

  assert.doesNotMatch(cleaned, /<Callout/)
  assert.match(cleaned, /outside/)
  assert.match(cleaned, /const el = <Button onClick=\{\(\) => \{\}\}>Save<\/Button>/)
})

test('cleanMdx strips instrument tags outside fences', () => {
  const source = [
    'Framing.',
    '<instrument-spine>',
    '</instrument-spine>',
    '<instrument-ledger />',
    '```html',
    '<instrument-ledger>keep</instrument-ledger>',
    '```',
  ].join('\n')
  const cleaned = cleanMdx(source)

  assert.doesNotMatch(cleaned, /<instrument-spine/)
  assert.doesNotMatch(cleaned, /<\/instrument-spine/)
  assert.match(cleaned, /Framing\./)
  assert.match(cleaned, /<instrument-ledger>keep<\/instrument-ledger>/)
})

test('ufo-claims-ledger markdown mirror includes the claims ledger', () => {
  const markdown = buildEssayMarkdown('ufo-claims-ledger')
  assert.ok(markdown)

  assert.doesNotMatch(markdown, /<instrument/)
  assert.match(markdown, /## Claims ledger/)
  assert.match(markdown, /434 claims from/)
  assert.match(markdown, /### C001 — Johnston told to destroy first-generation Apollo negatives/)
  assert.match(markdown, /Verdict: contested/)

  const claimHeadings = markdown.match(/^### C\d+/gm) ?? []
  assert.equal(claimHeadings.length, 434)
})

test('sitemap markdown lists published essay mirrors with summaries', () => {
  const sitemap = buildSitemapMarkdown()

  for (const essay of publishedEssays()) {
    assert.match(sitemap, new RegExp(`${siteUrl}/writing/${essay.slug}\\.md`))
    assert.match(sitemap, new RegExp(essay.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})
