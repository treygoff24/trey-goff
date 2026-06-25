import Link from 'next/link'
import { allProjects } from 'content-collections'
import { EditorialHeader } from '@/components/site/EditorialHeader'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'

export const metadata = {
  title: 'Projects',
  description: "Things I've built.",
}

const otherWork = [
  {
    meta: 'Institutional',
    status: 'Ongoing',
    title: 'Próspera',
    description:
      "Public affairs and governance for Honduras's first ZEDE — the world's most ambitious charter city. First full-time employee; now chief of staff & director of public affairs.",
    tags: ['governance', 'charter cities', 'economics'],
  },
  {
    meta: 'Agent tooling',
    status: 'CLI',
    title: 'Harness & agent tooling',
    description:
      "Command-line harnesses and tools for working alongside AI agents — tinkering at the frontier of what's actually possible right now.",
    tags: ['AI', 'CLI', 'developer tools'],
  },
  {
    meta: 'Public policy',
    status: 'Initiative',
    title: 'Governance experiments',
    description:
      "Turning institutional experiments into legible, repeatable models other jurisdictions can study, adapt, and adopt — so a good idea doesn't have to be reinvented from scratch each time.",
    tags: ['institutional design', 'policy'],
  },
]

export default function ProjectsPage() {
  const projects = [...allProjects].sort((a, b) => {
    if (a.featuredRank !== b.featuredRank) return a.featuredRank - b.featuredRank
    return a.name.localeCompare(b.name)
  })
  const featuredProject = projects[0]

  return (
    <div className="tg-page max-w-6xl">
      <EditorialHeader
        eyebrow="Projects"
        title="Systems I'm building"
        standfirst="The work spans websites, command-line & agent tooling, public-policy initiatives, and Próspera itself — different surfaces, one throughline: institutions that let progress compound."
      />

      {featuredProject ? (
        <section className="mt-6 border-t-2 border-warm px-1 py-9">
          <article id={featuredProject.slug}>
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
                {featuredProject.type}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-warm">
                {featuredProject.status}
              </span>
            </div>
            <h2 className="font-newsreader text-[clamp(2rem,4vw,3.25rem)] font-normal leading-tight text-text-1">
              {featuredProject.name}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-2 sm:text-lg">
              {featuredProject.oneLiner}
            </p>
            <div className="mt-9 grid gap-8 border-t border-border-1 pt-7 md:grid-cols-2">
              <div>
                <p className="tg-eyebrow text-warm">Problem</p>
                <p className="mt-3 text-sm leading-7 text-text-2">{featuredProject.problem}</p>
              </div>
              <div>
                <p className="tg-eyebrow text-warm">Approach</p>
                <p className="mt-3 text-sm leading-7 text-text-2">{featuredProject.approach}</p>
              </div>
            </div>
            {featuredProject.links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {featuredProject.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    className="tg-action-secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="mt-14 border-t border-warm pt-8 text-text-3">
          Projects coming soon.
        </section>
      )}

      <section className="mt-12">
        <p className="border-b border-border-2 pb-4 font-mono text-xs uppercase tracking-[0.2em] text-text-3">
          More work
        </p>
        {otherWork.map((item) => (
          <article key={item.title}>
            <EditorialIndexRow
              meta={
                <span>
                  {item.meta}
                  <span className="mt-2 block text-text-2">{item.status}</span>
                </span>
              }
              title={item.title}
              description={item.description}
              tags={item.tags}
              detail={
                featuredProject ? <Link href={`/projects#${featuredProject.slug}`}>→</Link> : '→'
              }
            />
          </article>
        ))}
      </section>
    </div>
  )
}
