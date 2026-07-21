import { allProjects } from 'content-collections'
import { HashDossierOpener } from '@/components/projects/HashDossierOpener'
import { WorkshopStation } from '@/components/projects/WorkshopStation'
import { EditorialHeader } from '@/components/site/EditorialHeader'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { featuredByStation, ledgerTools, stations, toolById } from '@/lib/software/tools'

export const metadata = {
  title: 'The Workshop',
  description:
    'One machine, a swarm of AI agents, and the tools that keep them honest — the software behind the work.',
}

const beyondWork = [
  {
    meta: 'Institutional',
    status: 'Ongoing',
    title: 'Próspera',
    description:
      "Public affairs and governance for Honduras's first ZEDE — the world's most ambitious charter city. First full-time employee; now chief of staff & director of public affairs.",
    tags: ['governance', 'charter cities', 'economics'],
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

interface ProjectsPageProps {
  searchParams: Promise<{ tool?: string | string[] }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams
  const requested = Array.isArray(params?.tool) ? params.tool[0] : params?.tool
  const openToolId = requested && toolById.get(requested)?.featured ? requested : undefined

  const siteProject = [...allProjects].sort((a, b) => a.featuredRank - b.featuredRank)[0]

  return (
    <div className="tg-page max-w-6xl">
      <HashDossierOpener />
      <EditorialHeader
        eyebrow="The Workshop"
        title="One machine, many hands"
        standfirst="Most of this software exists so that a laptop full of AI agents can do real work without lying to their operator. Websites, command-line tools, agent infrastructure — built with the agents that now use it."
      />

      <p className="mt-6 max-w-3xl border-t-2 border-warm px-1 pt-7 text-base leading-8 text-text-2">
        The floor has five stations. <span className="text-text-1">Coordination</span> decides who
        works where and how tasks move between agents;{' '}
        <span className="text-text-1">verification</span> makes their output provable;{' '}
        <span className="text-text-1">senses</span> give them images, speech, and documents;{' '}
        <span className="text-text-1">discipline</span> keeps the whole machine honest about money,
        memory, and mess; and <span className="text-text-1">play</span> is where the same habits
        build things for a life instead of a pipeline. Every terminal capture below is real output
        from the tool, run on this machine, dated.
      </p>

      {siteProject && (
        <section className="mt-14 border-t-2 border-warm px-1 py-8" id={siteProject.slug}>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
              {siteProject.type}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-warm">
              {siteProject.status}
            </span>
          </div>
          <h2 className="font-newsreader text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-tight text-text-1">
            {siteProject.name}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-text-2">
            {/* Single template literal: the JSX transform drops the lone space
                between an expression and adjacent text, yielding "reading.You". */}
            {`${siteProject.oneLiner} You are standing in it — this site is the workshop's own dossier, co-authored with the agents the rest of this page describes.`}
          </p>
        </section>
      )}

      {stations.map((station) => (
        <WorkshopStation
          key={station.id}
          station={station}
          tools={featuredByStation(station.id)}
          openToolId={openToolId}
        />
      ))}

      <section aria-labelledby="bench-ledger" className="mt-16">
        <div className="border-b border-border-2 px-1 pb-4">
          <h2 id="bench-ledger" className="font-newsreader text-2xl font-medium text-text-1">
            Also on the bench
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-3">
            The rest of the shop, one line each. Tools marked experiment are live questions, not
            finished answers.
          </p>
        </div>
        <ul>
          {ledgerTools.map((tool) => (
            <li
              key={tool.id}
              className="grid grid-cols-[auto_1fr] items-baseline gap-4 border-t border-border-1 px-1 py-3 sm:grid-cols-[10rem_1fr_auto]"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
                {tool.name}
              </span>
              <span className="text-sm leading-6 text-text-2">{tool.oneLiner}</span>
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-text-3 sm:block">
                {tool.status === 'experiment' ? 'experiment' : tool.stack}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <p className="border-b border-border-2 px-1 pb-4 font-mono text-xs uppercase tracking-[0.2em] text-text-3">
          Beyond the workshop
        </p>
        {beyondWork.map((item) => (
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
            />
          </article>
        ))}
      </section>
    </div>
  )
}
