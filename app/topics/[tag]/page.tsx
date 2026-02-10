import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EssayCard } from '@/components/writing/EssayCard'
import { NoteCard } from '@/components/notes/NoteCard'
import { TagPill } from '@/components/ui/TagPill'
import { markdownToHtml } from '@/lib/markdown'
import { cn } from '@/lib/utils'
import { getTopicContent, getTopicsIndex } from '@/lib/topics'
import { getBacklinksForNote, getOutgoingLinksForNote } from '@/lib/backlinks'
import { generateBreadcrumbSchema } from '@/lib/structured-data'
import type { Book } from '@/lib/books/types'

interface PageProps {
  params: Promise<{ tag: string }>
}

export function generateStaticParams() {
  return getTopicsIndex().map((topic) => ({ tag: topic.tag }))
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params
  const topicTag = tag
  const { essays, notes, books } = getTopicContent(topicTag)

  const getLatestDate = (): string | undefined => {
    const dates: number[] = []

    for (const essay of essays) {
      if (essay.date) dates.push(new Date(essay.date).getTime())
    }

    for (const note of notes) {
      if (note.date) dates.push(new Date(note.date).getTime())
    }

    for (const book of books) {
      const bookDate = book.dateRead || book.dateStarted || (book.year ? `${book.year}-01-01` : undefined)
      if (bookDate) dates.push(new Date(bookDate).getTime())
    }

    if (dates.length === 0) {
      return undefined
    }

    return new Date(Math.max(...dates)).toISOString()
  }

  const latestDate = getLatestDate()

  return {
    title: `${topicTag} - Topics`,
    description: `Signals about ${topicTag} across essays, notes, and books.`,
    openGraph: {
      ...(latestDate ? { modifiedTime: latestDate } : {}),
    },
  }
}

const statusBadges: Record<Book['status'], { label: string; className: string }> = {
  read: { label: 'Read', className: 'bg-success/20 text-success' },
  reading: { label: 'Reading', className: 'bg-warm/20 text-warm' },
  want: { label: 'Want to Read', className: 'bg-accent/20 text-accent' },
  abandoned: { label: 'Abandoned', className: 'bg-error/20 text-error' },
}

export default async function TopicPage({ params }: PageProps) {
  const { tag } = await params
  const topicTag = tag
  const { essays, notes, books } = getTopicContent(topicTag)

  if (essays.length === 0 && notes.length === 0 && books.length === 0) {
    notFound()
  }

  const sortedEssays = [...essays].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const sortedBooks = [...books].sort((a, b) => {
    const aDate = a.dateRead || a.dateStarted || `${a.year}-01-01`
    const bDate = b.dateRead || b.dateStarted || `${b.year}-01-01`
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  const notesWithHtml = await Promise.all(
    sortedNotes.map(async (note) => ({
      ...note,
      html: await markdownToHtml(note.content),
      backlinks: getBacklinksForNote(note.slug),
      outgoing: getOutgoingLinksForNote(note.slug),
    }))
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://trey.world' },
    { name: 'Topics', url: 'https://trey.world/topics' },
    { name: topicTag, url: `https://trey.world/topics/${topicTag}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-12">
        <Link href="/topics" className="text-sm text-text-3 hover:text-text-2">
          Back to topics
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TagPill tag={topicTag} active size="md" />
          <span className="text-sm text-text-3">
            {essays.length} essays / {notes.length} notes / {books.length} books
          </span>
        </div>

        <h1 className="mt-4 font-satoshi text-4xl font-medium text-text-1">
          {topicTag}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-text-2">
          Trace this topic across long-form essays, field notes, and the
          reading list.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <TopicStat label="Essays" value={essays.length} />
          <TopicStat label="Notes" value={notes.length} />
          <TopicStat label="Books" value={books.length} />
        </div>
      </header>

      <section>
        <SectionHeader title="Essays" count={sortedEssays.length} />
        {sortedEssays.length === 0 ? (
          <EmptyState message="No essays tagged yet." />
        ) : (
          <div className="space-y-6">
            {sortedEssays.map((essay) => (
              <EssayCard
                key={essay.slug}
                title={essay.title}
                slug={essay.slug}
                date={essay.date}
                summary={essay.summary}
                tags={essay.tags}
                readingTime={essay.readingTime}
                status={essay.status}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader title="Notes" count={notesWithHtml.length} />
        {notesWithHtml.length === 0 ? (
          <EmptyState message="No notes tagged yet." />
        ) : (
          <div className="space-y-6">
            {notesWithHtml.map((note) => (
              <NoteCard
                key={note.slug}
                slug={note.slug}
                date={note.date}
                type={note.type}
                title={note.title}
                content={note.html}
                tags={note.tags}
                source={note.source}
                sourceTitle={note.sourceTitle}
                backlinks={note.backlinks}
                outgoing={note.outgoing}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader title="Books" count={sortedBooks.length} />
        {sortedBooks.length === 0 ? (
          <EmptyState message="No books tagged yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedBooks.map((book) => (
              <TopicBookRow key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
      </div>
    </>
  )
}

function TopicStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-1 bg-surface-1 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-text-3">
        {label}
      </div>
      <div className="mt-2 font-satoshi text-2xl font-semibold text-text-1">
        {value}
      </div>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="font-satoshi text-2xl font-medium text-text-1">{title}</h2>
      <span className="text-sm text-text-3">{count} total</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border-1 bg-surface-1 p-8 text-center text-text-3">
      {message}
    </div>
  )
}

function TopicBookRow({ book }: { book: Book }) {
  const badge = statusBadges[book.status]
  return (
    <Link
      href={`/library#${book.id}`}
      className="group rounded-2xl border border-border-1 bg-surface-1 p-5 transition-all hover:border-border-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-satoshi text-lg font-medium text-text-1">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-text-3">
            {book.author} / {book.year}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-xs font-medium',
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {book.whyILoveIt && (
        <p className="mt-3 text-sm text-text-2 line-clamp-3">
          {book.whyILoveIt}
        </p>
      )}
    </Link>
  )
}
