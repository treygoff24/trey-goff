import type { Book } from '@/lib/books/types'
import coverMap from '@/public/cover-map.json'

export const AURORA_CATEGORY_ORDER = [
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
] as const

export type AuroraCategoryCode = (typeof AURORA_CATEGORY_ORDER)[number]

export type AuroraCategory = {
  code: AuroraCategoryCode
  label: string
  hue: number
}

export const AURORA_CATEGORIES: Record<AuroraCategoryCode, AuroraCategory> = {
  scifi: { code: 'scifi', label: 'Sci-Fi', hue: 230 },
  fantasy: { code: 'fantasy', label: 'Fantasy', hue: 218 },
  fiction: { code: 'fiction', label: 'Fiction', hue: 205 },
  science: { code: 'science', label: 'Science', hue: 196 },
  growth: { code: 'growth', label: 'Self & Growth', hue: 186 },
  business: { code: 'business', label: 'Business', hue: 178 },
  econ: { code: 'econ', label: 'Economics', hue: 168 },
  politics: { code: 'politics', label: 'Politics', hue: 158 },
  phil: { code: 'phil', label: 'Philosophy', hue: 148 },
  religion: { code: 'religion', label: 'Religion', hue: 138 },
  history: { code: 'history', label: 'History', hue: 128 },
  lives: { code: 'lives', label: 'Lives', hue: 118 },
}

export type AuroraBook = {
  id: string
  title: string
  author: string
  year: number
  categoryCode: AuroraCategoryCode
  categoryLabel: string
  hue: number
  topics: string[]
  rating?: number
  whyILoveIt?: string
  coverUrl?: string
}

export type AuroraGraphBook = AuroraBook & {
  degree: number
  density: number
  color: string
  spine: {
    height: number
    width: number
  }
}

export type AuroraGraphNode = {
  id: string
  index: number
  categoryCode: AuroraCategoryCode
  hue: number
  x: number
  y: number
  radius: number
  degree: number
  density: number
  phase: number
  title: string
  author: string
  spine: AuroraGraphBook['spine']
}

export type AuroraGraphEdge = {
  id: string
  a: string
  b: string
  kind: 'shelf' | 'topic'
  topic?: string
}

export type AuroraGraph = {
  books: AuroraGraphBook[]
  nodes: AuroraGraphNode[]
  edges: AuroraGraphEdge[]
  topicCounts: Map<string, number>
  maxDegree: number
}

export type AuroraShelfSort = 'shelf' | 'color' | 'links' | 'recent' | 'height' | 'author'
export type AuroraIndexSort = 'title' | 'author' | 'cat' | 'topic' | 'year'

const GENERIC_TOPIC_LIMIT = 24
// ponytail: elliptical ring so the constellation fills the wide lens panel like a sky band
const RING_RADIUS_X = 800
const RING_RADIUS_Y = 500
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const GENRE_TO_CATEGORY: Record<string, AuroraCategoryCode> = {
  adventure: 'fiction',
  biography: 'lives',
  business: 'business',
  economics: 'econ',
  essays: 'phil',
  fantasy: 'fantasy',
  fiction: 'fiction',
  finance: 'business',
  fitness: 'growth',
  futurism: 'scifi',
  history: 'history',
  horror: 'fiction',
  law: 'politics',
  'literary-fiction': 'fiction',
  manga: 'fantasy',
  memoir: 'lives',
  mystery: 'fiction',
  parenting: 'growth',
  philosophy: 'phil',
  'political-science': 'politics',
  'political-theory': 'politics',
  politics: 'politics',
  psychology: 'growth',
  religion: 'religion',
  science: 'science',
  'science-fiction': 'scifi',
  'self-help': 'growth',
  'social-commentary': 'politics',
  sociology: 'politics',
  technology: 'science',
  thriller: 'fiction',
  'young-adult': 'fantasy',
}

function includesAny(topics: readonly string[], candidates: readonly string[]): boolean {
  return candidates.some((topic) => topics.includes(topic))
}

function categorizeNonFiction(book: Book): AuroraCategoryCode {
  const topics = book.topics ?? []

  if (includesAny(topics, ['economics'])) return 'econ'
  if (includesAny(topics, ['governance', 'politics', 'society'])) return 'politics'
  if (includesAny(topics, ['marketing'])) return 'business'
  if (includesAny(topics, ['military', 'technology', 'china', 'geopolitics'])) return 'science'
  if (includesAny(topics, ['history'])) return 'history'
  if (includesAny(topics, ['psychology', 'games', 'dogs', 'performance', 'learning']))
    return 'growth'

  return 'phil'
}

export function categorizeAuroraBook(book: Book): AuroraCategoryCode {
  if (book.genre === 'non-fiction') return categorizeNonFiction(book)
  return book.genre ? (GENRE_TO_CATEGORY[book.genre] ?? 'phil') : 'phil'
}

export function buildAuroraLibrary(books: readonly Book[]): AuroraBook[] {
  return books.map((book) => {
    const categoryCode = categorizeAuroraBook(book)
    const category = AURORA_CATEGORIES[categoryCode]
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year,
      categoryCode,
      categoryLabel: category.label,
      hue: category.hue,
      topics: [...(book.topics ?? [])],
      rating: book.rating,
      whyILoveIt: book.whyILoveIt || undefined,
      coverUrl: book.coverUrl ?? (coverMap as Record<string, string>)[book.id],
    }
  })
}

export function fnv1a(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function oklchColor(hue: number, l = 0.74, c = 0.14, a = 1): string {
  return `oklch(${l} ${c} ${hue} / ${a})`
}

export function buildTopicCounts(books: readonly AuroraBook[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const book of books) {
    for (const topic of book.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1)
    }
  }
  return counts
}

function buildNeighborSets(
  books: readonly AuroraBook[],
  topicCounts: Map<string, number>,
): Set<number>[] {
  const topicMap = new Map<string, number[]>()
  books.forEach((book, index) => {
    for (const topic of book.topics) {
      const ids = topicMap.get(topic) ?? []
      ids.push(index)
      topicMap.set(topic, ids)
    }
  })

  const neighbors = books.map(() => new Set<number>())
  for (const [topic, ids] of topicMap.entries()) {
    const topicCount = topicCounts.get(topic) ?? ids.length
    if (topicCount < 2 || topicCount > GENERIC_TOPIC_LIMIT) continue
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = ids[i]
        const b = ids[j]
        if (a === undefined || b === undefined) continue
        neighbors[a]?.add(b)
        neighbors[b]?.add(a)
      }
    }
  }
  return neighbors
}

function buildGraphBook(book: AuroraBook, degree: number, maxDegree: number): AuroraGraphBook {
  const density = degree / Math.max(1, maxDegree)
  return {
    ...book,
    degree,
    density,
    color: oklchColor(book.hue, 0.74, 0.14, 1),
    spine: {
      height: 152 + (fnv1a(book.title) % 9) * 15,
      width: 33 + (fnv1a(`${book.author}${book.title}`) % 5) * 7,
    },
  }
}

export function buildAuroraGraph(books: readonly AuroraBook[]): AuroraGraph {
  const topicCounts = buildTopicCounts(books)
  const neighbors = buildNeighborSets(books, topicCounts)
  const degrees = neighbors.map((set) => set.size)
  const maxDegree = Math.max(1, ...degrees)
  const graphBooks = books.map((book, index) =>
    buildGraphBook(book, degrees[index] ?? 0, maxDegree),
  )

  const groups = new Map<AuroraCategoryCode, { angle: number; books: AuroraGraphBook[] }>()
  const categories = AURORA_CATEGORY_ORDER.filter((code) =>
    graphBooks.some((book) => book.categoryCode === code),
  )
  categories.forEach((code, index) => {
    groups.set(code, { angle: (index / categories.length) * Math.PI * 2, books: [] })
  })
  for (const book of graphBooks) {
    groups.get(book.categoryCode)?.books.push(book)
  }

  const nodes: AuroraGraphNode[] = []
  const nodeByIndex = new Map<number, AuroraGraphNode>()
  for (const code of categories) {
    const group = groups.get(code)
    if (!group) continue
    const cx = Math.cos(group.angle) * RING_RADIUS_X
    const cy = Math.sin(group.angle) * RING_RADIUS_Y
    const sorted = [...group.books].sort(
      (a, b) =>
        b.degree - a.degree || (b.rating ?? 0) - (a.rating ?? 0) || a.title.localeCompare(b.title),
    )

    sorted.forEach((book, localIndex) => {
      const sourceIndex = graphBooks.findIndex((entry) => entry.id === book.id)
      const angle = localIndex * GOLDEN_ANGLE
      const radius = 22 * Math.sqrt(localIndex + 0.7)
      const node: AuroraGraphNode = {
        id: book.id,
        index: sourceIndex,
        categoryCode: code,
        hue: book.hue,
        x: Math.round((cx + Math.cos(angle) * radius) * 1000) / 1000,
        y: Math.round((cy + Math.sin(angle) * radius) * 1000) / 1000,
        radius: Math.round((2 + Math.sqrt(book.density) * 4.2) * 1000) / 1000,
        degree: book.degree,
        density: book.density,
        phase: (fnv1a(book.id) % 6283) / 1000,
        title: book.title,
        author: book.author,
        spine: book.spine,
      }
      nodes.push(node)
      nodeByIndex.set(sourceIndex, node)
    })
  }

  const edges: AuroraGraphEdge[] = []
  for (const code of categories) {
    const categoryNodes = nodes.filter((node) => node.categoryCode === code)
    for (let index = 1; index < categoryNodes.length; index += 1) {
      const previous = categoryNodes[index - 1]
      const current = categoryNodes[index]
      if (!previous || !current) continue
      edges.push({
        id: `shelf:${previous.id}:${current.id}`,
        a: previous.id,
        b: current.id,
        kind: 'shelf',
      })
    }
  }

  const seenTopicEdges = new Set<string>()
  for (const [topic, count] of topicCounts.entries()) {
    if (count < 2 || count > GENERIC_TOPIC_LIMIT) continue
    const ids = graphBooks
      .map((book, index) => (book.topics.includes(topic) ? index : -1))
      .filter((index) => index >= 0 && nodeByIndex.has(index))
      .sort((a, b) => {
        const nodeA = nodeByIndex.get(a)
        const nodeB = nodeByIndex.get(b)
        if (!nodeA || !nodeB) return 0
        return Math.atan2(nodeA.y, nodeA.x) - Math.atan2(nodeB.y, nodeB.x)
      })

    for (let index = 1; index < ids.length; index += 1) {
      const aIndex = ids[index - 1]
      const bIndex = ids[index]
      if (aIndex === undefined || bIndex === undefined) continue
      const a = nodeByIndex.get(aIndex)
      const b = nodeByIndex.get(bIndex)
      if (!a || !b) continue
      const edgeKey = a.index < b.index ? `${a.index}-${b.index}` : `${b.index}-${a.index}`
      if (seenTopicEdges.has(edgeKey)) continue
      seenTopicEdges.add(edgeKey)
      edges.push({ id: `topic:${topic}:${edgeKey}`, a: a.id, b: b.id, kind: 'topic', topic })
    }
  }

  return {
    books: graphBooks,
    nodes,
    edges,
    topicCounts,
    maxDegree,
  }
}

export function sortAuroraBooks<T extends AuroraGraphBook>(
  books: readonly T[],
  sort: AuroraShelfSort,
): T[] {
  const sorted = [...books]
  switch (sort) {
    case 'shelf':
      sorted.sort((a, b) => a.hue - b.hue || b.degree - a.degree || a.title.localeCompare(b.title))
      break
    case 'color':
      sorted.sort((a, b) => a.hue - b.hue || a.title.localeCompare(b.title))
      break
    case 'links':
      sorted.sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title))
      break
    case 'recent':
      sorted.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
      break
    case 'height':
      sorted.sort(
        (a, b) => (fnv1a(b.title) % 9) - (fnv1a(a.title) % 9) || a.title.localeCompare(b.title),
      )
      break
    case 'author':
      sorted.sort((a, b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title))
      break
  }
  return sorted
}

export function sortAuroraIndex<T extends AuroraGraphBook>(
  books: readonly T[],
  key: AuroraIndexSort,
  ascending: boolean,
): T[] {
  const direction = ascending ? 1 : -1
  return [...books].sort((a, b) => {
    let result: number
    switch (key) {
      case 'title':
        result = a.title.localeCompare(b.title)
        break
      case 'author':
        result = a.author.localeCompare(b.author)
        break
      case 'cat':
        result = a.categoryLabel.localeCompare(b.categoryLabel)
        break
      case 'topic':
        result = (a.topics[0] ?? '').localeCompare(b.topics[0] ?? '')
        break
      case 'year':
        result = a.year - b.year
        break
    }
    return result * direction
  })
}

export function formatAuroraTopic(topic: string): string {
  return topic.replace(/-/g, ' ')
}
