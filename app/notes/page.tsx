import Link from 'next/link'
import { allNotes } from 'content-collections'
import { NoteCard } from '@/components/notes/NoteCard'
import { renderNotes } from '@/lib/notes'
import { pageAlternates } from '@/lib/site-config'

export const metadata = {
  title: 'Notes',
  description: 'Short-form thoughts, occasional dispatches, and reference links.',
  alternates: pageAlternates('/notes', { markdownPath: '/notes.md' }),
}

export default async function NotesPage() {
  const sortedNotes = [...allNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Convert raw markdown to HTML. This runs at build time (static generation)
  // since the page has no dynamic segments or revalidation config.
  // Content-collections returns raw markdown, so we process it here.
  const notesWithHtml = await renderNotes(sortedNotes)

  return (
    <div className="tg-page max-w-2xl">
      <header className="tg-rise mb-12">
        <p className="tg-eyebrow text-warm">Notes</p>
        <h1 className="mt-6 mb-4 font-newsreader text-[clamp(2.4rem,4.5vw,3.2rem)] font-medium leading-[1.06] tracking-[-0.02em] text-text-1">
          Notes & dispatches
        </h1>
        <p className="text-lg text-text-2">
          Short-form thoughts, occasional dispatches, and reference links. An archive of early
          notes; longer-form thinking is published in <Link href="/writing">Writing</Link>.
        </p>
      </header>

      {sortedNotes.length === 0 ? (
        <p className="border-t border-border-1 pt-8 text-text-3">No notes published yet.</p>
      ) : (
        <div className="border-t border-border-2">
          {notesWithHtml.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
