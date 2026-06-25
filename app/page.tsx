import Link from 'next/link'
import type { Metadata } from 'next'
import { allEssays, allProjects } from 'content-collections'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { formatDateShort } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Trey Goff — Writer, Builder, Explorer',
  description:
    'Personal site of Trey Goff. Essays on governance, technology, building, books, projects, and institutional design.',
  openGraph: {
    title: 'Trey Goff — Writer, Builder, Explorer',
    description: 'Personal site of Trey Goff. Essays on governance, technology, and building.',
    type: 'website',
  },
}

const paths = [
  {
    href: '/writing',
    title: 'Writing',
    description: 'Essays and field notes on governance, technology, faith, and building.',
  },
  {
    href: '/projects',
    title: 'Projects',
    description: 'Websites, CLI & agent tooling, policy initiatives, and Próspera.',
  },
  {
    href: '/library',
    title: 'Library',
    description: "A few hundred books, mapped four ways — a constellation of everything I've read.",
  },
  {
    href: '/about',
    title: 'About',
    description: "Mississippi roots, a cosmopolitan orbit, and what I'm chasing.",
  },
]

const fallbackWork = [
  {
    meta: 'Institutional',
    status: 'Ongoing',
    title: 'Próspera',
    description:
      "Public affairs and governance for the world's most ambitious charter city — from first employee to chief of staff.",
  },
  {
    meta: 'Agent tooling',
    status: 'CLI',
    title: 'Harness & command-line tools',
    description:
      "Tinkering at the frontier of what's possible with AI — harnesses and tools for working alongside agents.",
  },
  {
    meta: 'Public policy',
    status: 'Initiative',
    title: 'Governance experiments',
    description:
      'Turning institutional experiments into legible, repeatable models others can adopt.',
  },
]

export default function HomePage() {
  const isProduction = process.env.NODE_ENV === 'production'
  const visibleEssays = isProduction
    ? allEssays.filter((essay) => essay.status !== 'draft')
    : allEssays

  const featuredEssays = [...visibleEssays]
    .sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 3)

  const featuredProject = [...allProjects].sort((a, b) => {
    if (a.featuredRank !== b.featuredRank) return a.featuredRank - b.featuredRank
    return a.name.localeCompare(b.name)
  })[0]

  const selectedWork = [
    ...(featuredProject
      ? [
          {
            meta: featuredProject.type,
            status: featuredProject.status,
            title: featuredProject.name,
            description:
              featuredProject.approach ||
              featuredProject.oneLiner ||
              'An explorable index of ideas, writing, and reading.',
          },
        ]
      : []),
    ...fallbackWork,
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-12 pb-24 pt-44 sm:px-6 sm:pt-32">
      <header className="tg-rise mx-auto flex min-h-[64vh] max-w-4xl flex-col items-center justify-center py-8 text-center sm:py-12">
        <p className="tg-eyebrow whitespace-nowrap text-[0.62rem] tracking-[0.22em] text-warm sm:text-[0.68rem] sm:tracking-[0.28em]">
          Próspera · Public Policy · Software
        </p>
        <h1 className="mt-7 font-newsreader text-[clamp(3rem,5.45vw,4.15rem)] font-medium leading-[1.08] tracking-[-0.025em] text-text-1 text-balance">
          <span className="sr-only">Designing the systems that let human progress compound.</span>
          <span aria-hidden="true">
            Designing the systems that let human progress{' '}
            <span className="italic text-warm">compound</span>.
          </span>
        </h1>
        <p className="mt-7 max-w-2xl text-[clamp(1rem,1.45vw,1.15rem)] leading-8 text-text-2">
          I&apos;m Trey Goff — institutional designer, public-policy economist, and builder of
          software and AI tooling. Chief of staff at Próspera, curious to a fault, hunting for the
          largest lever I can pull.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/writing" className="tg-action">
            Read the writing →
          </Link>
          <Link href="/projects" className="tg-action-secondary">
            See the work →
          </Link>
        </div>
      </header>

      <section className="mt-10">
        <p className="border-b border-border-2 pb-4 font-mono text-xs uppercase tracking-[0.2em] text-text-3">
          Four paths into the work
        </p>
        {paths.map((item, index) => (
          <EditorialIndexRow
            key={item.href}
            href={item.href}
            number={String(index + 1).padStart(2, '0')}
            title={item.title}
            description={item.description}
          />
        ))}
      </section>

      <section className="tg-section text-center">
        <h2 className="font-newsreader text-[clamp(2rem,4vw,3.1rem)] font-light text-text-1">
          Selected work
        </h2>
        <p className="mt-2 text-sm text-text-3">Across websites, tooling, policy, and Próspera.</p>
        <div className="mt-8 border-t border-border-2 text-left">
          {selectedWork.map((item) => (
            <EditorialIndexRow
              key={item.title}
              href="/projects"
              meta={
                <span>
                  {item.meta}
                  <span className="mt-2 block text-text-2">{item.status}</span>
                </span>
              }
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </section>

      <section className="tg-section">
        <div className="flex items-end justify-between gap-6 border-b border-border-2 pb-5">
          <h2 className="font-newsreader text-[clamp(2rem,4vw,3.1rem)] font-light text-text-1">
            Featured essays
          </h2>
          <Link href="/writing" className="font-mono text-xs uppercase tracking-[0.16em] text-warm">
            All writing →
          </Link>
        </div>
        {featuredEssays.map((essay) => (
          <EditorialIndexRow
            key={essay.slug}
            href={`/writing/${essay.slug}`}
            meta={<time dateTime={essay.date}>{formatDateShort(essay.date)}</time>}
            title={essay.title}
            description={essay.summary}
            detail={`${essay.readingTime} min`}
          />
        ))}
      </section>
    </div>
  )
}
