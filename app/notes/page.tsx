import { allNotes } from 'content-collections'
import { NoteCard } from '@/components/notes/NoteCard'
import { markdownToHtml } from '@/lib/markdown'
import { getBacklinksForNote, getOutgoingLinksForNote } from '@/lib/backlinks'

export const metadata = {
  title: 'Notes',
  description: 'Quick thoughts, dispatches, and interesting links.',
}

export default async function NotesPage() {
  const sortedNotes = allNotes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Convert raw markdown to HTML. This runs at build time (static generation)
  // since the page has no dynamic segments or revalidation config.
  // Content-collections returns raw markdown, so we process it here.
  const notesWithHtml = await Promise.all(
    sortedNotes.map(async (note) => ({
      ...note,
      html: await markdownToHtml(note.content),
      backlinks: getBacklinksForNote(note.slug),
      outgoing: getOutgoingLinksForNote(note.slug),
    }))
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Notes
        </h1>
        <p className="text-lg text-text-2">
          Quick thoughts, dispatches from the field, and interesting links.
        </p>
      </header>

      {sortedNotes.length === 0 ? (
        <div className="rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
          <p className="text-text-3">Notes coming soon.</p>
        </div>
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
    </div>
  )
}
