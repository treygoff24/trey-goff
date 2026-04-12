import Link from 'next/link'
import { allProjects } from 'content-collections'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { isNewsletterEnabled } from '@/lib/site-config'

export const metadata = {
  title: 'Projects',
  description: "Things I've built.",
}

export default function ProjectsPage() {
  const projects = [...allProjects].sort((a, b) => {
    if (a.featuredRank !== b.featuredRank) {
      return a.featuredRank - b.featuredRank
    }
    return a.name.localeCompare(b.name)
  })
  const isSingleProjectView = projects.length === 1

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="space-y-4">
          <p className="eyebrow text-text-3">Selected work</p>
          <h1 className="font-satoshi text-4xl font-medium text-text-1 sm:text-5xl">
            Projects that move from idea to deployment.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-text-2 sm:text-xl">
            Case studies and experiments across software, policy, and institutional innovation—built
            to ship, measured in practice, and iterated in public.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={isNewsletterEnabled ? '/subscribe' : '/writing'}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-warm px-6 py-3 text-sm font-semibold text-bg-0 shadow-lg shadow-warm/25 transition hover:-translate-y-0.5 hover:shadow-warm/40"
            >
              {isNewsletterEnabled ? 'Get project updates' : 'Read the writing'}
            </Link>
          </div>
        </div>

        <aside className="glass-panel rounded-2xl p-5 sm:p-6">
          <p className="eyebrow text-text-3">Public archive</p>
          <h2 className="mt-3 font-satoshi text-xl font-medium text-text-1">
            {isSingleProjectView
              ? 'One flagship case study, intentionally.'
              : 'A compact working archive.'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-2">
            {isSingleProjectView
              ? 'The projects section is curated rather than exhaustive. Writing carries the theory; this page spotlights the systems that are far enough along to show in public.'
              : 'This archive favors depth over volume. Each project is meant to read like a field report, not a thumbnail gallery.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs uppercase tracking-[0.16em] text-text-3">
            <div className="rounded-2xl border border-white/8 bg-surface-1 backdrop-blur-md px-3 py-3">
              <div className="text-lg font-semibold tracking-normal text-text-1">
                {projects.length}
              </div>
              <div className="mt-1">Live case studies</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-surface-1 backdrop-blur-md px-3 py-3">
              <div className="text-lg font-semibold tracking-normal text-text-1">Essays</div>
              <div className="mt-1">Carry the thinking</div>
            </div>
          </div>
        </aside>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-border-1 bg-surface-1 backdrop-blur-md p-10 text-center text-text-3">
          Projects coming soon.
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
