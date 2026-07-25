import { allEssays } from 'content-collections'
import {
  getInstrumentManifest,
  instrumentedSlugs,
  loadInstrumentPiece,
} from '@/lib/instruments/manifest'
import {
  LEDGER_STATE_VALUES as LEDGER_STATES,
  type LedgerFilterState as LedgerState,
} from '@/lib/instruments/url-state'
import type { InstrumentId } from '@/lib/instruments/manifest'

/**
 * What the publication surfaces — the cover on `/writing` and the cross-nav inside an
 * instrumented piece — know about a piece. Everything here is derived at build time from the
 * manifest and its data files, so a piece cannot advertise instruments it does not carry.
 */
export interface PublishedPiece {
  slug: string
  title: string
  summary: string
  date: string
  readingTime: number
  href: string
  /** What kind of reading surface this is, in the reader's terms. */
  genre: string
  /** Two or three derived facts about the instruments, for the cover's fine print. */
  facts: string[]
  /** The ledger's true proportions, when the piece has one. */
  spectrum: SpectrumBand[] | null
  accent: { hue: number; chroma: number }
}

export interface SpectrumBand {
  state: LedgerState
  count: number
}

const GENRES: Partial<Record<InstrumentId, string>> = {
  'claim-ledger': 'Evidence explorer',
  'audit-layer': 'Audited essay',
  'margin-notes': 'Annotated argument',
}

function genreOf(instruments: readonly InstrumentId[]): string {
  for (const instrument of instruments) {
    const genre = GENRES[instrument]
    if (genre) return genre
  }
  return 'Instrumented piece'
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function spectrumOf(claims: readonly { verdict: string | null }[]): SpectrumBand[] {
  const counts = new Map<LedgerState, number>(LEDGER_STATES.map((state) => [state, 0]))
  for (const claim of claims) {
    const state = (claim.verdict ?? 'unverified') as LedgerState
    counts.set(state, (counts.get(state) ?? 0) + 1)
  }
  return LEDGER_STATES.map((state) => ({ state, count: counts.get(state) ?? 0 })).filter(
    (band) => band.count > 0,
  )
}

/**
 * Published instrumented pieces, newest first. Drafts are excluded unconditionally: the
 * bench pieces exist only behind the preview route, and the cover is a public shelf.
 */
export function publishedInstrumentedPieces(): PublishedPiece[] {
  const instrumented = instrumentedSlugs()

  return allEssays
    .filter((essay) => essay.status !== 'draft' && instrumented.has(essay.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .flatMap((essay) => {
      const manifest = getInstrumentManifest(essay.slug)
      if (!manifest) return []
      const piece = loadInstrumentPiece(essay.slug)

      const facts: string[] = []
      if (piece?.ledger) {
        facts.push(
          `${plural(piece.ledger.claims.length, 'claim')} · ${plural(piece.ledger.sections.length, 'section')}`,
        )
      }
      if (manifest.dossiers.length > 0) facts.push(plural(manifest.dossiers.length, 'dossier'))
      const marks = piece?.annotations?.marks.length ?? 0
      if (marks > 0) facts.push(plural(marks, 'marked passage'))
      const notes = piece?.annotations?.notes.length ?? 0
      if (notes > 0) facts.push(plural(notes, 'margin note'))
      const charts = piece?.charts?.length ?? 0
      if (charts > 0) facts.push(plural(charts, 'figure'))

      return [
        {
          slug: essay.slug,
          title: essay.title,
          summary: essay.summary,
          date: essay.date,
          readingTime: essay.readingTime,
          href: `/writing/${essay.slug}`,
          genre: genreOf(manifest.instruments),
          facts,
          spectrum: piece?.ledger ? spectrumOf(piece.ledger.claims) : null,
          accent: manifest.accent,
        },
      ]
    })
}

/** The accent an instrumented piece wears outside `.instrument-scope`, in the same terms. */
export function accentColor(accent: { hue: number; chroma: number }): string {
  return `oklch(0.85 ${accent.chroma} ${accent.hue})`
}
