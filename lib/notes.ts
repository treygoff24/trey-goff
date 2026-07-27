import { markdownToHtml } from '@/lib/markdown'
import { getBacklinksForNote, getOutgoingLinksForNote } from '@/lib/backlinks'
import type { LinkEntry } from '@/lib/backlinks'

interface RawNote {
  slug: string
  content: string
}

export type RenderedNote<T extends RawNote> = T & {
  html: string
  backlinks: LinkEntry[]
  outgoing: LinkEntry[]
}

/**
 * Renders each note's markdown and attaches its link graph — everything `NoteCard` needs
 * beyond the collection record itself. Runs at build time on the note listing pages.
 */
export async function renderNotes<T extends RawNote>(
  notes: readonly T[],
): Promise<RenderedNote<T>[]> {
  return Promise.all(
    notes.map(async (note) => ({
      ...note,
      html: await markdownToHtml(note.content),
      backlinks: getBacklinksForNote(note.slug),
      outgoing: getOutgoingLinksForNote(note.slug),
    })),
  )
}
