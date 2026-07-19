import type { Metadata } from 'next'
import Link from 'next/link'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'

export const metadata: Metadata = {
  title: 'The Lab',
  description: 'Experimental surfaces, not yet chosen.',
  robots: { index: false, follow: false },
}

const experiments = [
  {
    href: '/machine',
    meta: 'Simulation · WebGL',
    title: 'The Compound Machine',
    description:
      'Four institutional rules drive a seeded economy rendered as a compounding field of light. Pause it, re-run the same seed, or split the screen to watch two rule sets diverge from an identical start.',
  },
  {
    href: '/edition',
    meta: 'Generative · Streams live',
    title: 'The Edition',
    description:
      'Ask what brought you here and a language model composes a bespoke edition of the site around that intent, live, from what actually exists — every link real, every word its own.',
  },
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
  {
    href: '/classified',
    meta: 'Private · Gated',
    title: 'The Annex',
    description:
      'A friends-only reading room behind a shared secret, wrapped for everyone else in a deadpan notice of administrative non-access.',
  },
]

export default function LabPage() {
  return (
    <div className="tg-page max-w-4xl">
      <header className="border-b border-border-2 pb-10">
        <p className="tg-eyebrow">The Lab</p>
        <h1 className="tg-display mt-6 max-w-3xl">Five experiments, one to keep.</h1>
        <p className="tg-standfirst mt-6 max-w-2xl">
          Prototypes for the site — each one a different answer to &ldquo;how was this made?&rdquo;
          None has touched the homepage. Walk through them, then tell me which one earns its place.
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
