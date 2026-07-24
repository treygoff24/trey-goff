import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { formatDate } from '@/lib/utils'

interface JournalEntry {
  date: string
  entryNumber: number
  model: string
  slug: string
  tags: string[]
  title: string
  wordCount: number
}

export function JournalList({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border-y border-border-1 py-8 sm:py-10">
        <p className="font-newsreader text-2xl font-medium text-text-1">
          The Resident hasn&apos;t moved in yet.
        </p>
        <p className="mt-2 text-text-2">The room is ready.</p>
      </div>
    )
  }

  return (
    <div>
      {entries.map((entry) => (
        <EditorialIndexRow
          key={entry.slug}
          href={`/resident/journal/${entry.slug}`}
          number={String(entry.entryNumber).padStart(2, '0')}
          meta={`${formatDate(entry.date)} · ${entry.model}`}
          title={entry.title}
          description={entry.tags.join(' · ')}
          detail={`${entry.wordCount.toLocaleString()} words`}
        />
      ))}
    </div>
  )
}
