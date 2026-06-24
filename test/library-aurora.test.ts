import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'
import { getAllBooks } from '@/lib/books'
import {
  AURORA_CATEGORY_ORDER,
  AURORA_CATEGORIES,
  buildAuroraGraph,
  buildAuroraLibrary,
  fnv1a,
  sortAuroraBooks,
} from '@/lib/library/aurora'

type HandoffCategory = {
  label: string
  hue: number
}

type HandoffBook = {
  id: string
  t: string
  a: string
  y: number
  c: string
  tp: string[]
  r?: number
  k?: string
}

function loadHandoffData(): {
  CATEGORIES: Record<string, HandoffCategory>
  LIBRARY: HandoffBook[]
} {
  const sourcePath = join(
    process.cwd(),
    'docs/designs/2026-06-24-personal-website-redesign-concept/library-data.js',
  )
  const source = readFileSync(sourcePath, 'utf-8')
    .replace('export const CATEGORIES =', 'globalThis.CATEGORIES =')
    .replace('export const LIBRARY =', 'globalThis.LIBRARY =')
  const context = { globalThis: {} as Record<string, unknown> }
  vm.runInNewContext(source, context, { filename: sourcePath })
  return JSON.parse(JSON.stringify(context.globalThis)) as {
    CATEGORIES: Record<string, HandoffCategory>
    LIBRARY: HandoffBook[]
  }
}

test('Aurora library categories match the design handoff taxonomy', () => {
  const handoff = loadHandoffData()

  assert.deepEqual(Object.keys(AURORA_CATEGORIES), Object.keys(handoff.CATEGORIES))
  for (const [code, category] of Object.entries(handoff.CATEGORIES)) {
    assert.deepEqual(AURORA_CATEGORIES[code], {
      code,
      label: category.label,
      hue: category.hue,
    })
  }
  assert.deepEqual(AURORA_CATEGORY_ORDER, [
    'scifi',
    'science',
    'growth',
    'business',
    'econ',
    'politics',
    'phil',
    'religion',
    'history',
    'lives',
    'fiction',
    'fantasy',
  ])
})

test('Aurora library data transform matches every generated handoff book', () => {
  const handoff = loadHandoffData()
  const auroraBooks = buildAuroraLibrary(getAllBooks())

  assert.equal(auroraBooks.length, 334)
  assert.equal(auroraBooks.length, handoff.LIBRARY.length)

  const actualById = new Map(auroraBooks.map((book) => [book.id, book]))
  for (const expected of handoff.LIBRARY) {
    const actual = actualById.get(expected.id)
    assert.ok(actual, `missing ${expected.id}`)
    assert.equal(actual.title, expected.t, `${expected.id} title`)
    assert.equal(actual.author, expected.a, `${expected.id} author`)
    assert.equal(actual.year, expected.y, `${expected.id} year`)
    assert.equal(actual.categoryCode, expected.c, `${expected.id} category`)
    assert.deepEqual(actual.topics, expected.tp, `${expected.id} topics`)
    assert.equal(actual.rating, expected.r, `${expected.id} rating`)
    assert.equal(actual.whyILoveIt, expected.k, `${expected.id} blurb`)
  }
})

test('Aurora graph is deterministic, sparse, and skips generic topic hairballs', () => {
  const books = buildAuroraLibrary(getAllBooks())
  const graphA = buildAuroraGraph(books)
  const graphB = buildAuroraGraph(books)

  assert.deepEqual(graphA.nodes, graphB.nodes)
  assert.deepEqual(graphA.edges, graphB.edges)
  assert.equal(graphA.nodes.length, books.length)
  assert.ok(
    graphA.edges.length > books.length,
    'graph should include both shelf texture and topic threads',
  )
  assert.ok(
    graphA.edges.filter((edge) => edge.kind === 'topic').length < books.length * 4,
    'generic topic filtering should prevent a dense clique-like graph',
  )

  const progress = graphA.nodes.find((node) => node.id === 'progress-and-poverty')
  assert.ok(progress)
  assert.equal(progress.categoryCode, 'econ')
  assert.equal(progress.hue, AURORA_CATEGORIES.econ.hue)
  assert.equal(progress.spine.height, 152 + (fnv1a('Progress and Poverty') % 9) * 15)
  assert.equal(progress.spine.width, 33 + (fnv1a('Henry GeorgeProgress and Poverty') % 5) * 7)
})

test('Aurora shelf/index sort modes follow the handoff lens semantics', () => {
  const books = buildAuroraLibrary(getAllBooks())
  const graph = buildAuroraGraph(books)

  const byThreads = sortAuroraBooks(graph.books, 'links')
  assert.ok(byThreads[0].degree >= byThreads[1].degree)

  const byRecent = sortAuroraBooks(graph.books, 'recent')
  assert.equal(byRecent[0].year, Math.max(...books.map((book) => book.year)))

  const byShelf = sortAuroraBooks(graph.books, 'shelf')
  const firstHue = byShelf[0].hue
  assert.ok(byShelf.slice(0, 12).every((book) => book.hue >= firstHue))

  const byAuthor = sortAuroraBooks(graph.books, 'author')
  assert.deepEqual(
    byAuthor.map((book) => book.author).slice(0, 12),
    [...byAuthor.map((book) => book.author)].sort((a, b) => a.localeCompare(b)).slice(0, 12),
  )
})
