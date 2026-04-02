import type { Book } from '@/lib/books/types'

/**
 * Topic family definitions. Each family groups related raw topics
 * into a single display stack on the library page.
 */
export interface TopicFamily {
  id: string
  label: string
  topics: string[]
  color: string
}

export const TOPIC_FAMILIES: TopicFamily[] = [
  {
    id: 'science-fiction',
    label: 'Science Fiction',
    topics: ['science-fiction', 'cyberpunk', 'dystopia'],
    color: '#E11D48',
  },
  {
    id: 'fantasy',
    label: 'Fantasy & Fiction',
    topics: [
      'fantasy',
      'fiction',
      'literary-fiction',
      'thriller',
      'horror',
      'mystery',
      'humor',
      'adventure',
      'young-adult',
      'classic',
    ],
    color: '#F43F5E',
  },
  {
    id: 'philosophy',
    label: 'Philosophy & Mind',
    topics: [
      'philosophy',
      'consciousness',
      'psychology',
      'neuroscience',
      'buddhism',
      'stoicism',
      'meditation',
      'existentialism',
      'ethics',
      'spirituality',
    ],
    color: '#8B5CF6',
  },
  {
    id: 'economics',
    label: 'Economics & Markets',
    topics: [
      'economics',
      'finance',
      'investing',
      'money',
      'venture-capital',
      'austrian-economics',
      'inequality',
      'poverty',
      'land',
    ],
    color: '#F59E0B',
  },
  {
    id: 'politics',
    label: 'Politics & Governance',
    topics: [
      'politics',
      'governance',
      'government',
      'libertarianism',
      'classical-liberalism',
      'anarchism',
      'anarcho-capitalism',
      'liberty',
      'policy',
      'law',
      'constitution',
    ],
    color: '#14B8A6',
  },
  {
    id: 'science',
    label: 'Science & Nature',
    topics: [
      'science',
      'physics',
      'biology',
      'evolution',
      'genetics',
      'cosmology',
      'quantum',
      'mathematics',
      'math',
      'statistics',
      'probability',
      'geology',
      'nature',
      'environment',
      'climate',
    ],
    color: '#22C55E',
  },
  {
    id: 'technology',
    label: 'Technology & Future',
    topics: [
      'technology',
      'ai',
      'innovation',
      'future',
      'nuclear',
      'energy',
      'space',
      'networks',
      'data',
      'systems',
    ],
    color: '#3B82F6',
  },
  {
    id: 'business',
    label: 'Business & Startups',
    topics: [
      'business',
      'startups',
      'entrepreneurship',
      'management',
      'leadership',
      'marketing',
      'growth',
      'performance',
      'success',
      'productivity',
    ],
    color: '#EAB308',
  },
  {
    id: 'history',
    label: 'History & Culture',
    topics: [
      'history',
      'culture',
      'war',
      'military',
      'geopolitics',
      'foreign-policy',
      'society',
      'sociology',
      'anthropology',
      'linguistics',
      'language',
    ],
    color: '#A16207',
  },
  {
    id: 'world',
    label: 'World & Places',
    topics: [
      'charter-cities',
      'singapore',
      'china',
      'israel',
      'ukraine',
      'europe',
      'anglosphere',
      'immigration',
      'urban-planning',
      'communities',
      'local-knowledge',
    ],
    color: '#06B6D4',
  },
  {
    id: 'health',
    label: 'Health & Life',
    topics: [
      'health',
      'fitness',
      'longevity',
      'relationships',
      'marriage',
      'parenting',
      'dogs',
      'lifestyle',
      'habits',
      'dopamine',
      'drugs',
      'psychedelics',
      'sports',
    ],
    color: '#FB7185',
  },
  {
    id: 'religion',
    label: 'Religion & Meaning',
    topics: ['religion', 'christianity', 'apologetics', 'atheism', 'mythology'],
    color: '#C084FC',
  },
  {
    id: 'knowledge',
    label: 'Knowledge & Craft',
    topics: [
      'knowledge',
      'learning',
      'education',
      'creativity',
      'art',
      'journalism',
      'negotiation',
      'communication',
      'social-dynamics',
      'memoir',
      'biography',
      'networking',
    ],
    color: '#F97316',
  },
]

const MISC_FAMILY: TopicFamily = {
  id: 'miscellaneous',
  label: 'Miscellaneous',
  topics: [],
  color: '#9CA3AF',
}

/**
 * Build a topic → family lookup map for O(1) resolution.
 */
const topicToFamily = new Map<string, TopicFamily>()
for (const family of TOPIC_FAMILIES) {
  for (const topic of family.topics) {
    topicToFamily.set(topic.toLowerCase().trim(), family)
  }
}

/**
 * Resolve a book's primary topic to its topic family.
 * Falls back to Miscellaneous if no family matches.
 */
export function getTopicFamily(book: Book): TopicFamily {
  const primary = book.topics?.[0]?.toLowerCase().trim()
  if (!primary) return MISC_FAMILY
  return topicToFamily.get(primary) ?? MISC_FAMILY
}

/**
 * Resolve any topic string to its family label.
 */
export function getTopicFamilyLabel(topic: string): string {
  const family = topicToFamily.get(topic.toLowerCase().trim())
  return family?.label ?? topic
}

/**
 * Group books by their primary topic family.
 * Returns a sorted array of [family, books[]] tuples,
 * sorted by count descending (largest stacks first).
 */
export function groupBooksByFamily(books: Book[]): [TopicFamily, Book[]][] {
  const groups = new Map<string, { family: TopicFamily; books: Book[] }>()

  for (const book of books) {
    const family = getTopicFamily(book)
    const entry = groups.get(family.id)
    if (entry) {
      entry.books.push(book)
    } else {
      groups.set(family.id, { family, books: [book] })
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.books.length - a.books.length)
    .map((g) => [g.family, g.books])
}

/**
 * Group books by year into decade buckets.
 */
export function groupBooksByDecade(books: Book[]): { label: string; books: Book[] }[] {
  const groups = new Map<number, Book[]>()
  for (const book of books) {
    const decade = Math.floor(book.year / 10) * 10
    const arr = groups.get(decade)
    if (arr) arr.push(book)
    else groups.set(decade, [book])
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, books]) => ({ label: `${decade}s`, books }))
}

/**
 * Group books by author last name initial ranges.
 */
export function groupBooksByAuthor(books: Book[]): { label: string; books: Book[] }[] {
  const ad: Book[] = []
  const eh: Book[] = []
  const il: Book[] = []
  const mp: Book[] = []
  const qt: Book[] = []
  const uz: Book[] = []

  const sorted = [...books].sort((a, b) => a.author.localeCompare(b.author))

  for (const book of sorted) {
    const initial = book.author.trim().charCodeAt(0)
    // A=65, E=69, I=73, M=77, Q=81, U=85
    if (initial < 69) ad.push(book)
    else if (initial < 73) eh.push(book)
    else if (initial < 77) il.push(book)
    else if (initial < 81) mp.push(book)
    else if (initial < 85) qt.push(book)
    else uz.push(book)
  }

  const result: { label: string; books: Book[] }[] = []
  if (ad.length > 0) result.push({ label: 'A\u2013D', books: ad })
  if (eh.length > 0) result.push({ label: 'E\u2013H', books: eh })
  if (il.length > 0) result.push({ label: 'I\u2013L', books: il })
  if (mp.length > 0) result.push({ label: 'M\u2013P', books: mp })
  if (qt.length > 0) result.push({ label: 'Q\u2013T', books: qt })
  if (uz.length > 0) result.push({ label: 'U\u2013Z', books: uz })
  return result
}

/**
 * Group books by genre.
 */
export function groupBooksByGenre(books: Book[]): { label: string; books: Book[] }[] {
  const groups = new Map<string, Book[]>()
  for (const book of books) {
    const genre = book.genre ?? 'Uncategorized'
    const arr = groups.get(genre)
    if (arr) arr.push(book)
    else groups.set(genre, [book])
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, books]) => ({ label, books }))
}

/**
 * Get the topic family color for a group label.
 * Used for decade/author/genre groups that don't have a family color.
 */
export function getGroupColor(label: string): string {
  // Try to find a family with this label
  const family = TOPIC_FAMILIES.find((f) => f.label === label)
  if (family) return family.color
  return '#9CA3AF'
}
