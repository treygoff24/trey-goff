import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { unified } from 'unified'
import rehypeStringify from 'rehype-stringify'
import type { Root } from 'hast'
import { applyAnnotations, MarkResolutionError } from '@/lib/instruments/marks'
import { markdownToHast } from '@/lib/instruments/render'
import {
  chartsDocumentSchema,
  forecastsDocumentSchema,
  marginNoteSchema,
  marksDocumentSchema,
  statsDocumentSchema,
  type MarginNote,
} from '@/lib/instruments/types'
import {
  getCharts,
  getForecasts,
  getMarksDocument,
  getStats,
  loadInstrumentPiece,
} from '@/lib/instruments/manifest'
import { allEssays } from 'content-collections'
import { visibleEditionEssays } from '@/lib/edition/manifest'
import { generateSearchIndex } from '@/lib/search/generate-index'

const DEMO = 'instruments-demo'

function stringify(tree: Root): string {
  return unified().use(rehypeStringify).stringify(tree)
}

function note(partial: Partial<MarginNote> & Pick<MarginNote, 'id' | 'text'>): MarginNote {
  return marginNoteSchema.parse({ anchor: null, body: 'a note', ...partial })
}

async function annotate(markdown: string, notes: MarginNote[]) {
  const result = applyAnnotations(await markdownToHast(markdown), { notes })
  return { html: stringify(result.tree), noteOrder: result.noteOrder }
}

test('a margin note wraps its span and numbers the marker in document order', async () => {
  const { html, noteOrder } = await annotate('First sentence. Second sentence.', [
    note({ id: 'second', text: 'Second' }),
    note({ id: 'first', text: 'First' }),
  ])

  assert.deepEqual(noteOrder, ['first', 'second'], 'document order, not authoring order')
  assert.match(html, /<instrument-note data-note-id="first" data-note-index="1"/)
  assert.match(html, /<instrument-note data-note-id="second" data-note-index="2"/)
})

test('a note spanning an element boundary flags exactly one wrap as the last', async () => {
  const { html } = await annotate('He said it was *plainly* true here.', [
    note({ id: 'split', text: 'was plainly true' }),
  ])

  assert.equal([...html.matchAll(/data-note-id="split"/g)].length, 3)
  assert.equal(
    [...html.matchAll(/data-annotation-last="true"/g)].length,
    1,
    'one marker per note, however many wraps the span needed',
  )
})

test('a mark carrying no note is emitted exactly as Wave 1 emitted it', async () => {
  const { html } = await annotate('nothing marked here', [])
  assert.doesNotMatch(html, /data-annotation-last/)

  const marked = applyAnnotations(await markdownToHast('The claim is wrong.'), {
    marks: [{ id: 'm1', kind: 'killed', anchor: null, text: 'is wrong' }],
  })
  assert.equal(
    stringify(marked.tree),
    '<p>The claim <mark class="instrument-mark" data-mark-id="m1" data-mark-kind="killed">is wrong</mark>.</p>',
  )
})

test('a mark carrying a note is flagged so its card renders once', async () => {
  const { tree } = applyAnnotations(await markdownToHast('He said it was *plainly* true.'), {
    marks: [
      { id: 'm1', kind: 'his-read', anchor: null, text: 'was plainly true', note: 'an inference' },
    ],
  })
  const html = stringify(tree)
  assert.equal([...html.matchAll(/data-mark-id="m1"/g)].length, 3)
  assert.equal([...html.matchAll(/data-annotation-last="true"/g)].length, 1)
})

test('marks and notes share one id namespace and one resolver', async () => {
  await assert.rejects(
    async () =>
      applyAnnotations(await markdownToHast('alpha beta'), {
        marks: [{ id: 'shared', kind: 'killed', anchor: null, text: 'alpha' }],
        notes: [note({ id: 'shared', text: 'beta' })],
      }),
    /duplicates an earlier annotation id/,
  )
})

test('a note that no longer matches the prose fails the build, loudly and by name', async () => {
  await assert.rejects(
    async () =>
      annotate('the sentence as it now reads', [note({ id: 'stale', text: 'as it read' })]),
    (error: Error) => {
      assert.ok(error instanceof MarkResolutionError)
      assert.match(error.message, /^margin note stale does not occur in the document/)
      return true
    },
  )
})

test('an ambiguous note is a build failure, not a guess', async () => {
  await assert.rejects(
    async () => annotate('twice here and twice here', [note({ id: 'n', text: 'twice here' })]),
    /margin note n occurs 2 times and names no occurrence/,
  )
})

test('a stat requires a stated confidence and http sources', () => {
  assert.throws(() =>
    statsDocumentSchema.parse([
      { id: 's', value: '1', label: 'l', sources: [{ title: 't', url: 'https://example.com' }] },
    ]),
  )
  assert.throws(() =>
    statsDocumentSchema.parse([
      {
        id: 's',
        value: '1',
        label: 'l',
        confidence: 'firm',
        sources: [{ title: 't', url: 'javascript:alert(1)' }],
      },
    ]),
  )
})

test('a resolved forecast must carry the date it resolved on', () => {
  const base = {
    id: 'f',
    question: 'q',
    forCase: 'a',
    againstCase: 'b',
    confidence: 0.5,
    stated: '2026-01-01',
    resolvesOn: '2027-01-01',
  }
  assert.throws(() => forecastsDocumentSchema.parse([{ ...base, status: 'resolved-yes' }]))
  assert.throws(() =>
    forecastsDocumentSchema.parse([{ ...base, status: 'open', resolvedOn: '2027-01-02' }]),
  )
  assert.doesNotThrow(() =>
    forecastsDocumentSchema.parse([
      { ...base, status: 'resolved-no', resolvedOn: '2027-01-02', resolution: 'it did not' },
    ]),
  )
})

test('a forecast may only state how it resolved once it has resolved', () => {
  const base = {
    id: 'f',
    question: 'q',
    forCase: 'a',
    againstCase: 'b',
    confidence: 0.5,
    stated: '2026-01-01',
    resolvesOn: '2027-01-01',
  }

  // An open card claiming a score it has not earned.
  assert.throws(() =>
    forecastsDocumentSchema.parse([{ ...base, status: 'open', resolution: 'it happened' }]),
  )

  // A resolved card whose status chip has nothing behind it.
  for (const status of ['resolved-yes', 'resolved-no', 'ambiguous', 'withdrawn']) {
    assert.throws(
      () => forecastsDocumentSchema.parse([{ ...base, status, resolvedOn: '2027-01-02' }]),
      `${status} without a resolution should be rejected`,
    )
  }

  assert.doesNotThrow(() => forecastsDocumentSchema.parse([{ ...base, status: 'open' }]))
})

test('a figure may not give two of its entries the same label', () => {
  const frame = { id: 'c', title: 't', summary: 's' }

  assert.throws(() =>
    chartsDocumentSchema.parse([
      {
        ...frame,
        kind: 'bars',
        bars: [
          { label: 'same', value: 1 },
          { label: 'same', value: 2 },
        ],
      },
    ]),
  )
  assert.throws(() =>
    chartsDocumentSchema.parse([
      {
        ...frame,
        kind: 'slope',
        fromLabel: 'a',
        toLabel: 'b',
        series: [
          { label: 'same', from: 1, to: 2 },
          { label: 'same', from: 3, to: 4 },
        ],
      },
    ]),
  )
  assert.doesNotThrow(() =>
    chartsDocumentSchema.parse([
      {
        ...frame,
        kind: 'bars',
        bars: [
          { label: 'one', value: 1 },
          { label: 'two', value: 2 },
        ],
      },
    ]),
  )
})

test('duplicate instrument ids are rejected in every authoring document', () => {
  assert.throws(() =>
    marksDocumentSchema.parse({
      marks: [{ id: 'x', kind: 'killed', anchor: null, text: 'a' }],
      notes: [{ id: 'x', anchor: null, text: 'b', body: 'c' }],
    }),
  )
  assert.throws(() =>
    chartsDocumentSchema.parse([
      { id: 'c', kind: 'bars', title: 't', summary: 's', bars: [{ label: 'l', value: 1 }] },
      { id: 'c', kind: 'bars', title: 't', summary: 's', bars: [{ label: 'l', value: 1 }] },
    ]),
  )
})

test('the demo piece resolves every annotation against its own rendered prose', async () => {
  const piece = loadInstrumentPiece(DEMO)
  assert.ok(piece, 'the demo piece has an instrument manifest')

  const markdown = readFileSync(join(process.cwd(), `content/essays/${DEMO}.mdx`), 'utf8')
  const body = markdown.split(/^---$/m).slice(2).join('---')
  const { noteOrder } = applyAnnotations(await markdownToHast(body), {
    marks: piece.annotations?.marks,
    notes: piece.annotations?.notes,
  })

  assert.equal(noteOrder.length, piece.annotations?.notes.length)
})

test('the demo piece exercises every instrument in the audit grammar', () => {
  const marks = getMarksDocument(DEMO)
  const stats = getStats(DEMO)
  const forecasts = getForecasts(DEMO)
  const charts = getCharts(DEMO)

  assert.deepEqual(
    [...new Set(marks?.marks.map((mark) => mark.kind))].sort(),
    ['counter-evidence', 'his-read', 'killed', 'refused'],
    'all four kinds of self-audit are shown',
  )
  assert.ok((marks?.notes.length ?? 0) >= 3, 'enough notes for the packer to have work to do')
  assert.ok((stats?.length ?? 0) >= 1)
  assert.ok((forecasts?.length ?? 0) >= 1)
  assert.deepEqual(
    [...new Set(charts?.map((chart) => chart.kind))].sort(),
    ['bars', 'series', 'slope', 'timeline'],
    'one of each figure in the kit',
  )
})

test('the demo piece stays a draft, so it is reachable only behind the preview auth', () => {
  const markdown = readFileSync(join(process.cwd(), `content/essays/${DEMO}.mdx`), 'utf8')
  assert.match(markdown.split(/^---$/m)[1] ?? '', /^status:\s*draft\s*$/m)
})

test('the draft bench reaches none of the surfaces that publish an essay', () => {
  // The frontmatter check above says the bench is marked a draft. This one says the mark is
  // load-bearing: every surface that would otherwise announce the piece to a reader — the
  // writing index, both feeds, the sitemap, the search index and the Edition catalog — filters
  // it out. A draft that leaks into the feed is behind the preview auth in name only.
  assert.equal(
    allEssays.find((essay) => essay.slug === DEMO)?.status,
    'draft',
    'the bench is the draft this test is about',
  )

  const published = visibleEditionEssays(allEssays)
  assert.ok(
    published.length > 0 && !published.some((essay) => essay.slug === DEMO),
    'the Edition and writing filters drop the bench',
  )

  const index = generateSearchIndex()
  assert.ok(!JSON.stringify(index).includes(DEMO), 'the search index carries no trace of the bench')

  // Feed and sitemap both gate on `status !== 'draft'` (app/feed.xml/route.ts,
  // app/sitemap.ts — the sitemap only in production builds). Assert the predicate they
  // share rather than rendering each route here.
  const draftFiltered = allEssays.filter((essay) => essay.status !== 'draft')
  assert.ok(
    !draftFiltered.some((essay) => essay.slug === DEMO),
    'the feed/sitemap draft predicate drops the bench',
  )
})

test('every instrument component rides the isolation sentinel', () => {
  const dir = join(process.cwd(), 'components/instruments')
  const sources = new Map(
    readdirSync(dir)
      .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map((file) => [file.replace(/\.tsx?$/, ''), readFileSync(join(dir, file), 'utf8')]),
  )

  /**
   * A component satisfies the sentinel either by stamping it or by only ever rendering inside
   * something that does — the chart leaves draw into `ChartFrame`, and stamping each of them
   * as well would put four copies of the marker in one figure.
   */
  const carries = (name: string, seen = new Set<string>()): boolean => {
    if (seen.has(name)) return false
    seen.add(name)
    const source = sources.get(name)
    if (!source) return false
    if (source.includes('INSTRUMENT_SENTINEL')) return true
    return [...source.matchAll(/@\/components\/instruments\/([\w-]+)/g)].some((match) =>
      carries(match[1]!, seen),
    )
  }

  // The entry points are exactly what `lazy.tsx` names: every instrument the article mounts
  // arrives through that one boundary, so every one of them must reach the sentinel.
  const entryPoints = [
    ...new Set(
      [...(sources.get('lazy') ?? '').matchAll(/@\/components\/instruments\/([\w-]+)/g)].map(
        (match) => match[1]!,
      ),
    ),
  ]

  assert.ok(entryPoints.length > 10, 'the lazy boundary should name every mounted instrument')
  for (const name of entryPoints) {
    assert.ok(
      carries(name),
      `${name} is mounted by the article but never reaches the sentinel the isolation check reads`,
    )
  }
})

test('safeHref admits only parseable http(s) URLs', async () => {
  const { safeHref } = await import('@/lib/instruments/href')
  assert.equal(safeHref('https://example.com/x'), 'https://example.com/x')
  assert.equal(safeHref('http://example.com'), 'http://example.com/')
  for (const bad of [
    'javascript:alert(1)',
    'data:text/html,x',
    'ftp://x',
    '//evil',
    'not a url',
    '',
  ]) {
    assert.equal(safeHref(bad), null, bad)
  }
})

test('the publication cover shows only published instrumented pieces', async () => {
  const { publishedInstrumentedPieces } = await import('@/lib/instruments/publication')
  const pieces = publishedInstrumentedPieces()
  assert.ok(
    pieces.some((piece) => piece.slug === 'ufo-claims-ledger'),
    'the shipped ledger is on the cover',
  )
  assert.ok(!pieces.some((piece) => piece.slug === DEMO), 'the draft bench never reaches the cover')
})

test('a one-piece publication nav renders identity, not links', async () => {
  const { createElement } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { PublicationNav } = await import('@/components/instruments/PublicationNav')
  const { publishedInstrumentedPieces } = await import('@/lib/instruments/publication')

  const pieces = publishedInstrumentedPieces()
  const first = pieces[0]
  assert.ok(
    first && pieces.length === 1,
    'this test pins the n=1 rendering; update it when n grows',
  )

  const html = renderToStaticMarkup(createElement(PublicationNav, { slug: first.slug, pieces }))
  assert.ok(html.length > 0, 'nav renders at n=1')
  assert.doesNotMatch(html, /<a\s/, 'no links to other pieces exist yet, so none render')
})
