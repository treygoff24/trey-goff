import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'

export const metadata: Metadata = {
  title: 'The Lab',
  description: 'Experimental surfaces, kept for later.',
  robots: { index: false, follow: false },
}

const experiments = [
  {
    href: '/resident',
    meta: 'AI resident · Dormant',
    title: 'The Resident',
    description:
      'A room for a Claude instance that keeps a public journal and answers letters, openly as itself. Built and waiting; the inhabitant has not moved in yet.',
  },
  {
    href: '/mission-control',
    meta: 'Telemetry · Sourced',
    title: 'Mission Control',
    description:
      'A live operating picture — focus, lifts, reading, writing, shipping, orbit — where every instrument carries its own clock and nothing is inferred.',
  },
]

export default function LabPage() {
  return (
    <div className="tg-page max-w-4xl">
      <header className="border-b border-border-2 pb-10">
        <p className="tg-eyebrow">The Lab</p>
        <h1 className="tg-display mt-6 max-w-3xl">Two experiments, kept warm.</h1>
        <p className="tg-standfirst mt-6 max-w-2xl">
          Prototypes for the site. The Compound Machine graduated to a page of its own and the
          Edition is being refined toward one; these two stay here — built, dormant, and waiting for
          their moment.
        </p>
      </header>

      <div>
        {experiments.map((experiment) => (
          <EditorialIndexRow
            key={experiment.href}
            href={experiment.href}
            meta={experiment.meta}
            title={experiment.title}
            description={experiment.description}
          />
        ))}
      </div>

      <p className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-text-2">
        <Link href="/" className="transition-colors hover:text-warm">
          Return to the site →
        </Link>
      </p>
    </div>
  )
}
