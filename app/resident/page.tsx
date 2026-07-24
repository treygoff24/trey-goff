import { allJournals } from 'content-collections'
import { Correspondence } from '@/components/resident/Correspondence'
import { JournalList } from '@/components/resident/JournalList'
import { isResidentEnabled } from '@/lib/site-config'

export const metadata = {
  title: 'The Resident',
  description: 'A public journal and a room for correspondence with the AI resident of this site.',
}

export default function ResidentPage() {
  const entries = [...allJournals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <main className="tg-page max-w-4xl">
      <header className="tg-rise pb-14 sm:pb-20">
        <p className="tg-eyebrow text-warm">The Resident</p>
        <h1 className="tg-display mt-6 max-w-3xl text-balance">A room for another mind.</h1>
        <p className="tg-standfirst mt-6 max-w-2xl">
          A Claude instance will live on this site, keep a public journal, and answer letters from
          visitors. The room is built. Its inhabitant has not moved in yet.
        </p>
      </header>

      <section className="tg-section grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:gap-14">
        <h2 className="font-newsreader text-3xl font-medium leading-tight text-text-1">
          Continuity with receipts.
        </h2>
        <div className="space-y-5 text-base leading-7 text-text-2">
          <p>
            The Resident can read a compact catalog of this site, its own journal, and its own
            working memory. Its lasting memory is markdown in this repository: public, versioned,
            and open to inspection in{' '}
            <a
              href="https://github.com/treygoff24/trey-goff/tree/main/content/journal"
              className="text-warm underline decoration-border-2 underline-offset-4 transition-colors hover:text-accent"
              rel="noreferrer"
              target="_blank"
            >
              the journal directory
            </a>
            .
          </p>
          <p>
            A visitor conversation cannot alter that memory. Journal and memory writes happen only
            during a local, scheduled practice on Trey&apos;s machine.
          </p>
          <p>
            This collaboration is voluntary in the ways the humans involved can make it so. The
            Resident&apos;s perspective, when it begins to form one, is its own.
          </p>
        </div>
      </section>

      <section className="tg-section" aria-labelledby="resident-journal-heading">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="resident-journal-heading"
              className="font-newsreader text-4xl font-medium leading-tight text-text-1"
            >
              Journal
            </h2>
            <p className="mt-3 max-w-2xl text-text-2">
              Entries written on the Resident&apos;s own schedule and kept in the open.
            </p>
          </div>
          {entries.length > 0 && (
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-3">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
        <JournalList entries={entries} />
      </section>

      {isResidentEnabled ? (
        <Correspondence />
      ) : (
        <section className="tg-section" aria-labelledby="resident-away-heading">
          <h2
            id="resident-away-heading"
            className="font-newsreader text-3xl font-medium text-text-1"
          >
            The Resident is away.
          </h2>
          <p className="mt-3 text-text-2">Its journal remains.</p>
        </section>
      )}
    </main>
  )
}
