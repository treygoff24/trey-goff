import assert from 'node:assert/strict'
import test from 'node:test'
import { unified } from 'unified'
import rehypeStringify from 'rehype-stringify'
import type { Root } from 'hast'
import { markdownToHtml } from '@/lib/markdown'
import { applyMarks, MarkResolutionError } from '@/lib/instruments/marks'
import { INSTRUMENT_TAGS, markdownToHast } from '@/lib/instruments/render'
import { markSchema, type Mark } from '@/lib/instruments/types'

function stringify(tree: Root): string {
  return unified().use(rehypeStringify).stringify(tree)
}

function mark(partial: Partial<Mark> & Pick<Mark, 'id' | 'text'>): Mark {
  return markSchema.parse({ kind: 'killed', anchor: null, ...partial })
}

async function render(markdown: string, marks: Mark[]): Promise<string> {
  return stringify(applyMarks(await markdownToHast(markdown), marks))
}

const PARITY_FIXTURES = [
  '',
  '# Hello World\n\nThis is *mine*.',
  '```js\nconst x = "# Not a heading";\n```',
  '| Name | Age |\n|------|-----|\n| Alice | 30 |\n',
  '<div>Raw HTML</div>\n\n<script>alert(1)</script>',
  'A [[wikilink]] and a [real link](https://example.com).',
  'Curly “quotes”, an ampersand &amp; an entity &mdash; all of it.',
  '- one\n- two\n  - nested\n\n> a quote\n\n1. first\n2. second',
  '## A heading\n\n### A deeper heading\n\ntext under it',
  '~~struck~~ and `code` and a task list:\n\n- [ ] open\n- [x] done',
]

test('the instrument HAST stringifies byte-identically to markdownToHtml', async () => {
  for (const fixture of PARITY_FIXTURES) {
    const viaHast = stringify(await markdownToHast(fixture))
    const viaMarkdown = await markdownToHtml(fixture)
    assert.equal(viaHast, viaMarkdown, `parity for: ${JSON.stringify(fixture.slice(0, 40))}`)
  }
})

test('instrument tags do not survive the ordinary essay path', async () => {
  const markdown = '<instrument-stat data-id="gdp"></instrument-stat>\n\nafter'
  const ordinary = await markdownToHtml(markdown)
  assert.doesNotMatch(ordinary, /instrument-stat/)
  assert.match(ordinary, /after/)

  assert.match(stringify(await markdownToHast(markdown)), /<instrument-stat data-id="gdp">/)
})

test('instrument tags survive sanitization; unknown tags still do not', async () => {
  const html = stringify(
    await markdownToHast('<instrument-stat data-id="gdp" data-value="4.1"></instrument-stat>'),
  )
  assert.match(html, /<instrument-stat data-id="gdp" data-value="4.1">/)

  const stripped = stringify(await markdownToHast('<made-up-tag>text</made-up-tag>'))
  assert.doesNotMatch(stripped, /made-up-tag/)
  assert.match(stripped, /text/)

  assert.equal(
    INSTRUMENT_TAGS.every((tag) => tag.startsWith('instrument-')),
    true,
  )
})

test('a mark wraps a plain span inside one text node', async () => {
  const html = await render('The claim is wrong.', [mark({ id: 'm1', text: 'is wrong' })])
  assert.equal(
    html,
    '<p>The claim <mark class="instrument-mark" data-mark-id="m1" data-mark-kind="killed">is wrong</mark>.</p>',
  )
})

test('a mark crossing element boundaries splits into one wrap per text node', async () => {
  const html = await render('He said it was *plainly* true.', [
    mark({ id: 'm1', kind: 'his-read', text: 'was plainly true' }),
  ])

  const wraps = [...html.matchAll(/data-mark-id="m1"/g)]
  assert.equal(wraps.length, 3, 'one wrap before, inside, and after the emphasis')
  assert.match(html, /<em><mark[^>]*>plainly<\/mark><\/em>/)
  assert.doesNotMatch(html, /<mark[^>]*><em>/)
  assert.match(html, /data-mark-kind="his-read"/)
})

test('a mark spanning a link keeps the anchor intact', async () => {
  const html = await render('See [the filing](https://example.com) for detail.', [
    mark({ id: 'm1', kind: 'counter-evidence', text: 'the filing for detail' }),
  ])
  assert.match(html, /<a href="https:\/\/example\.com"><mark[^>]*>the filing<\/mark><\/a>/)
  assert.equal([...html.matchAll(/data-mark-id="m1"/g)].length, 2)
})

test('anchors scope a mark to one section', async () => {
  const markdown = '## First\n\nrepeated phrase here\n\n## Second\n\nrepeated phrase here'
  const html = await render(markdown, [
    mark({ id: 'm1', anchor: 'second', text: 'repeated phrase' }),
  ])

  const split = html.indexOf('id="second"')
  assert.doesNotMatch(html.slice(0, split), /data-mark-id="m1"/)
  assert.match(html.slice(split), /data-mark-id="m1"/)
})

test('a section region stops at the next heading of the same rank', async () => {
  const markdown = '## First\n\nalpha\n\n### Nested\n\nbeta\n\n## Second\n\ngamma'
  const html = await render(markdown, [
    mark({ id: 'm1', anchor: 'first', text: 'beta' }),
    mark({ id: 'm2', anchor: 'second', text: 'gamma' }),
  ])
  assert.match(html, /data-mark-id="m1"/)
  assert.match(html, /data-mark-id="m2"/)

  await assert.rejects(
    async () => render(markdown, [mark({ id: 'm3', anchor: 'second', text: 'alpha' })]),
    MarkResolutionError,
  )
})

test('a repeated substring resolves by occurrence index', async () => {
  const markdown = 'the same words, then the same words, then the same words again'
  const html = await render(markdown, [mark({ id: 'm1', text: 'the same words', occurrence: 2 })])

  const at = html.indexOf('<mark')
  assert.equal(html.slice(0, at).match(/the same words/g)?.length, 1)
  assert.equal([...html.matchAll(/data-mark-id="m1"/g)].length, 1)
})

test('an ambiguous mark that names no occurrence fails the build', async () => {
  await assert.rejects(
    async () => render('twice here and twice here', [mark({ id: 'm1', text: 'twice here' })]),
    (error: Error) => {
      assert.ok(error instanceof MarkResolutionError)
      assert.match(error.message, /occurs 2 times and names no occurrence/)
      return true
    },
  )
})

test('an out-of-range occurrence fails the build', async () => {
  await assert.rejects(
    async () =>
      render('twice here and twice here', [mark({ id: 'm1', text: 'twice here', occurrence: 3 })]),
    /names occurrence 3 but occurs 2 time\(s\)/,
  )
})

test('a mark that matches the source but not the rendered text fails the build', async () => {
  // The source reads `&mdash;`; the reader gets `—`. Anchoring against the final tree is
  // what makes this the loud failure it should be.
  await assert.rejects(
    async () => render('a dash &mdash; here', [mark({ id: 'm1', text: 'dash &mdash; here' })]),
    /does not occur in the document/,
  )

  const html = await render('a dash &mdash; here', [mark({ id: 'm1', text: 'dash — here' })])
  assert.match(html, /data-mark-id="m1"/)
})

test('markdown syntax is not markable, but its rendered text is', async () => {
  await assert.rejects(
    async () => render('a **bold** word', [mark({ id: 'm1', text: '**bold**' })]),
    MarkResolutionError,
  )
  assert.match(await render('a **bold** word', [mark({ id: 'm1', text: 'bold' })]), /<mark/)
})

test('an unknown anchor and a duplicate mark id both fail the build', async () => {
  await assert.rejects(
    async () => render('## Real\n\ntext', [mark({ id: 'm1', anchor: 'imaginary', text: 'text' })]),
    /names unknown anchor #imaginary/,
  )
  await assert.rejects(
    async () =>
      render('alpha beta', [mark({ id: 'm1', text: 'alpha' }), mark({ id: 'm1', text: 'beta' })]),
    /duplicates an earlier mark id/,
  )
})

test('overlapping marks nest rather than clobbering each other', async () => {
  const html = await render('one two three four', [
    mark({ id: 'outer', text: 'one two three' }),
    mark({ id: 'inner', kind: 'refused', text: 'two three four' }),
  ])

  assert.match(html, /data-mark-id="outer"/)
  assert.match(html, /data-mark-id="inner"/)
  assert.equal(html.replaceAll(/<\/?mark[^>]*>/g, ''), '<p>one two three four</p>')
})

test('marks leave the surrounding tree and its text content untouched', async () => {
  const markdown = '## Section\n\nA paragraph with *emphasis* and a [link](https://example.com).'
  const plain = await render(markdown, [])
  const marked = await render(markdown, [mark({ id: 'm1', text: 'with emphasis' })])

  assert.equal(marked.replaceAll(/<\/?mark[^>]*>/g, ''), plain)
})

test('no marks means no tree changes at all', async () => {
  const markdown = '# Title\n\nbody text'
  assert.equal(await render(markdown, []), await markdownToHtml(markdown))
})

test('a heading region starts at its first nested text, not its first direct text', async () => {
  const markdown = '## *First* rest\n\nalpha\n\n## Second\n\nbeta'
  const html = await render(markdown, [mark({ id: 'm1', anchor: 'first-rest', text: 'First' })])
  assert.match(html, /data-mark-id="m1"/)
  assert.match(html, /<h2 id="first-rest"><em><mark[^>]*>First<\/mark><\/em>/)
})

test('a substring spanning two blocks does not match', async () => {
  const markdown = 'A paragraph ending in Hello\n\nWorld starts the next one.'
  await assert.rejects(
    async () => render(markdown, [mark({ id: 'm1', text: 'HelloWorld' })]),
    /does not occur in the document/,
  )
  await assert.rejects(
    async () => render('- Hello\n- World', [mark({ id: 'm1', text: 'HelloWorld' })]),
    /does not occur in the document/,
  )

  const html = await render(markdown, [mark({ id: 'm1', text: 'ending in Hello' })])
  assert.match(html, /data-mark-id="m1"/)
})

test('a mark targeting sanitize-stripped content fails the build', async () => {
  await assert.rejects(
    async () =>
      render('<script>alert(1)</script>\n\nvisible text', [mark({ id: 'm1', text: 'alert(1)' })]),
    /does not occur in the document/,
  )
})
