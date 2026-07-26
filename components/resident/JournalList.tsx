import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface JournalEntry {
  date: string
  slug: string
  title: string
}

// Deliberately not EditorialIndexRow: that row reserves a narrow column for an
// entry number, and these entries carry only a date and a title.
export function JournalList({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border-y border-border-1 py-8 sm:py-10">
        <p className="font-newsreader text-2xl font-medium text-text-1">Nothing here yet.</p>
        <p className="mt-2 text-text-2">That is a normal state of this room.</p>
      </div>
    )
  }

  return (
    <div className="border-b border-border-1">
      {entries.map((entry) => (
        <Link
          key={entry.slug}
          href={`/resident/journal/${entry.slug}`}
          className="group flex flex-col gap-2 border-t border-border-1 py-6 transition-colors hover:bg-surface-1/50 sm:flex-row sm:items-baseline sm:gap-8 sm:py-7"
        >
          <time
            dateTime={entry.date}
            className="font-mono text-xs uppercase tracking-[0.14em] text-warm sm:w-40 sm:shrink-0"
          >
            {formatDate(entry.date)}
          </time>
          <h3 className="font-newsreader text-2xl font-medium leading-tight text-text-1 transition-colors group-hover:text-warm">
            {entry.title}
          </h3>
        </Link>
      ))}
    </div>
  )
}
