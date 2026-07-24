import type { AnnexEntry } from '@/lib/annex/frontmatter'
import { formatDateShort } from '@/lib/utils'

type ReadingRoomEntry = Omit<AnnexEntry, 'body'>

export function ReadingRoom({ entries }: { entries: ReadingRoomEntry[] }) {
  return (
    <div className="tg-page max-w-5xl">
      <header className="border-b border-border-1 pb-10">
        <p className="tg-eyebrow">Clearance granted · welcome back</p>
        <h1 className="tg-display mt-6">The annex</h1>
        <p className="tg-standfirst mt-5">
          Writing best kept among friends, for now. The rest is simply here to be read.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="annex-entries-heading">
        <h2
          id="annex-entries-heading"
          className="border-b border-border-1 pb-5 font-mono text-xs uppercase tracking-[0.2em] text-text-3"
        >
          Filed entries
        </h2>
        {entries.length === 0 ? (
          <p className="border-b border-border-1 py-10 text-base text-text-2">
            Nothing is currently declassified.
          </p>
        ) : (
          entries.map((entry) => (
            <article key={entry.slug}>
              <a
                href={`/classified/${entry.slug}`}
                className="group block border-b border-border-1 py-6 transition-colors hover:bg-surface-1/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="font-newsreader text-2xl font-medium text-text-1 transition-colors group-hover:text-accent">
                    {entry.title}
                  </h3>
                  <time
                    className="font-mono text-xs uppercase tracking-[0.14em] text-text-3"
                    dateTime={entry.date}
                  >
                    {formatDateShort(entry.date)}
                  </time>
                </div>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-2">
                  {entry.summary}
                </p>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-warm">
                  {entry.readingTime} min →
                </p>
              </a>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
