import { allEssays, allNotes } from 'content-collections'
import { getAllBooks } from '@/lib/books'
import type { Book } from '@/lib/books/types'

type Essay = (typeof allEssays)[number]
type Note = (typeof allNotes)[number]

export type TopicSource = 'essay' | 'note' | 'book'

export interface TopicSignal {
  type: TopicSource
  title: string
  url: string
  date?: string
}

export interface TopicEntry {
  tag: string
  counts: {
    essays: number
    notes: number
    books: number
    total: number
  }
  latest?: TopicSignal
}

export interface TopicContent {
  essays: Essay[]
  notes: Note[]
  books: Book[]
}

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

interface TopicAggregate extends TopicEntry {
  latestTimestamp: number
}

export function getTopicHref(tag: string): string {
  return `/topics/${encodeURIComponent(tag)}`
}

function getTimestamp(date?: string): number {
  if (!date) return 0
  const timestamp = new Date(date).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getBookDate(book: Book): string | undefined {
  if (book.dateRead) return book.dateRead
  if (book.dateStarted) return book.dateStarted
  return book.year ? `${book.year}-01-01` : undefined
}

function addSignal(
  map: Map<string, TopicAggregate>,
  tag: string,
  signal: TopicSignal,
  timestamp: number
) {
  const existing = map.get(tag) ?? {
    tag,
    counts: { essays: 0, notes: 0, books: 0, total: 0 },
    latestTimestamp: 0,
  }

  if (signal.type === 'essay') existing.counts.essays += 1
  if (signal.type === 'note') existing.counts.notes += 1
  if (signal.type === 'book') existing.counts.books += 1
  existing.counts.total += 1

  if (timestamp > existing.latestTimestamp) {
    existing.latestTimestamp = timestamp
    existing.latest = signal
  }

  map.set(tag, existing)
}

export function getTopicsIndex(): TopicEntry[] {
  const topicMap = new Map<string, TopicAggregate>()

  for (const essay of visibleEssays) {
    const signal: TopicSignal = {
      type: 'essay',
      title: essay.title,
      url: `/writing/${essay.slug}`,
      date: essay.date,
    }
    const timestamp = getTimestamp(essay.date)
    for (const tag of essay.tags) {
      addSignal(topicMap, tag, signal, timestamp)
    }
  }

  for (const note of allNotes) {
    const signal: TopicSignal = {
      type: 'note',
      title: note.title || `Note from ${note.date}`,
      url: `/notes#${note.slug}`,
      date: note.date,
    }
    const timestamp = getTimestamp(note.date)
    for (const tag of note.tags) {
      addSignal(topicMap, tag, signal, timestamp)
    }
  }

  const books = getAllBooks()
  for (const book of books) {
    const date = getBookDate(book)
    const signal: TopicSignal = {
      type: 'book',
      title: book.title,
      url: `/library#${book.id}`,
      date,
    }
    const timestamp = getTimestamp(date)
    for (const topic of book.topics) {
      addSignal(topicMap, topic, signal, timestamp)
    }
  }

  return Array.from(topicMap.values())
    .map((entry) => {
      const { latestTimestamp, ...topic } = entry
      void latestTimestamp
      return topic
    })
    .sort((a, b) => {
      if (b.counts.total !== a.counts.total) {
        return b.counts.total - a.counts.total
      }
      return a.tag.localeCompare(b.tag)
    })
}

export function getTopicContent(tag: string): TopicContent {
  const essays = visibleEssays.filter((essay) => essay.tags.includes(tag))
  const notes = allNotes.filter((note) => note.tags.includes(tag))
  const books = getAllBooks().filter((book) => book.topics.includes(tag))
  return { essays, notes, books }
}
