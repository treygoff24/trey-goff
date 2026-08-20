import Link from 'next/link'
import { accentColor, type PublishedPiece } from '@/lib/instruments/publication'

const ORDINALS = ['I', 'II', 'III', 'IV', 'V', 'VI']

/**
 * A piece's ledger at its true proportions. Static markup, no instrument code: the cover
 * shows the character of the instruments without loading any of them.
 */
function CoverSpectrum({ piece }: { piece: PublishedPiece }) {
  if (!piece.spectrum) return null
  const total = piece.spectrum.reduce((sum, band) => sum + band.count, 0)

  return (
    <span
      role="img"
      aria-label={`Verdict spectrum across ${total} claims`}
      className="mt-5 flex h-1.5 w-full gap-px overflow-hidden"
    >
      {piece.spectrum.map((band) => (
        <span
          key={band.state}
          style={{ flex: band.count, backgroundColor: `var(--color-verdict-${band.state})` }}
        />
      ))}
    </span>
  )
}

/**
 * The publication cover: instrumented pieces get a shelf of their own above the essay index,
 * each carrying its own accent and the fine print of what it is instrumented with. Rendered
 * on the server — nothing here hydrates.
 */
export function PublicationCover({ pieces }: { pieces: PublishedPiece[] }) {
  if (pieces.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="publication-cover">
      <p
        id="publication-cover"
        className="border-b border-border-1 pb-5 font-mono text-xs uppercase tracking-[0.2em] text-text-3"
      >
        Interactive essays
      </p>
      <ol className="mt-2">
        {pieces.map((piece, index) => (
          <li
            key={piece.slug}
            className="border-b border-border-1 last:border-b-0"
            style={{ '--piece-accent': accentColor(piece.accent) } as React.CSSProperties}
          >
            <Link
              href={piece.href}
              className="group block px-1 py-8 transition-colors hover:bg-warm/5"
            >
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
                <span
                  aria-hidden="true"
                  className="font-mono text-xs font-semibold tracking-[0.14em]"
                  style={{ color: 'var(--piece-accent)' }}
                >
                  {ORDINALS[index] ?? index + 1}
                </span>
                <span aria-hidden="true">·</span>
                <span>{piece.genre}</span>
              </span>
              <h3 className="mt-2 font-newsreader text-[clamp(1.5rem,2.6vw,2.1rem)] font-normal leading-[1.15] text-text-1 transition-colors group-hover:text-warm">
                {piece.title}
              </h3>
              <span className="mt-3 block max-w-2xl text-base leading-7 text-text-2">
                {piece.summary}
              </span>
              <CoverSpectrum piece={piece} />
              <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
                {piece.facts.map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
                <span>{piece.readingTime} min →</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
