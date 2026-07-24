import { allEssays, allNotes } from 'content-collections'
import { attemptDate, type Instrument } from './instrument'

export interface WritingMonth {
  month: string
  count: number
}

export interface WritingData {
  months: WritingMonth[]
  latestEssay: {
    title: string
    slug: string
    date: string
    summary: string
    readingTime: number
  } | null
  wordCount: number
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function countWords(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0
}

export function getWritingInstrument(now = new Date()): Instrument<WritingData> {
  try {
    const essays = allEssays.filter((essay) => essay.status !== 'draft')
    const months = Array.from({ length: 24 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (23 - index), 1))
      return { month: monthKey(date), count: 0 }
    })
    const counts = new Map(months.map((month) => [month.month, month]))

    for (const item of [...essays, ...allNotes]) {
      const month = counts.get(item.date.slice(0, 7))
      if (month) month.count += 1
    }

    const latestEssay = [...essays].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
    const sourceDates = [...essays, ...allNotes]
      .map((item) => item.date)
      .sort()
      .reverse()

    return {
      data: {
        months,
        latestEssay: latestEssay
          ? {
              title: latestEssay.title,
              slug: latestEssay.slug,
              date: latestEssay.date,
              summary: latestEssay.summary,
              readingTime: latestEssay.readingTime,
            }
          : null,
        wordCount:
          essays.reduce((total, essay) => total + essay.wordCount, 0) +
          allNotes.reduce((total, note) => total + countWords(note.content), 0),
      },
      asOf: sourceDates[0] ?? attemptDate(now),
      source: 'content-collections · essays + notes',
      stale: false,
    }
  } catch {
    return {
      data: null,
      asOf: attemptDate(now),
      source: 'content-collections · essays + notes',
      stale: false,
    }
  }
}
