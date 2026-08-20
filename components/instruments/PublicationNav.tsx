import Link from 'next/link'
import type { PublishedPiece } from '@/lib/instruments/publication'

interface PublicationNavProps {
  /** The piece being read. It is never linked to itself, and may itself be unpublished. */
  slug: string
  pieces: PublishedPiece[]
}

/**
 * The footer of an instrumented piece: what publication the reader is inside, and the other
 * published pieces in it. With only one piece published this states the identity and stops —
 * an empty list is the honest rendering, not a placeholder link.
 *
 * Server-rendered on purpose. Cross-nav is furniture; it must not cost a client chunk.
 */
export function PublicationNav({ slug, pieces }: PublicationNavProps) {
  const others = pieces.filter((piece) => piece.slug !== slug)

  return (
    <nav
      aria-label="Interactive essays"
      className="mt-20 border-t border-border-1 pt-8 lg:max-w-[calc(100%-17rem)]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-3">
        An interactive essay
      </p>
      <p className="mt-3 max-w-xl text-sm leading-6 text-text-2">
        Every claim this piece makes is on the record with the instrument that adjudicates it.
        {others.length === 0 ? ' It is the first of its kind here.' : ''}
      </p>
      {others.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {others.map((piece) => (
            <li key={piece.slug}>
              <Link
                href={piece.href}
                className="group block border-t border-border-1 pt-4 transition-colors hover:border-warm"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
                  {piece.genre}
                </span>
                <span className="mt-2 block font-newsreader text-lg leading-snug text-text-1 transition-colors group-hover:text-warm">
                  {piece.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
