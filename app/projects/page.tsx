import Link from 'next/link'
import { allProjects } from 'content-collections'
import { ProjectCard } from '@/components/projects/ProjectCard'

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-14 space-y-6">
        <div className="space-y-4">
          <p className="eyebrow text-text-3">Selected work</p>
          <h1 className="font-satoshi text-4xl font-medium text-text-1 sm:text-5xl">
            Projects that move from idea to deployment.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-text-2 sm:text-xl">
            Case studies and experiments across software, policy, and institutional
            innovation—built to ship, measured in practice, and iterated in public.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center rounded-full bg-warm px-6 py-3 text-sm font-semibold text-bg-0 shadow-lg shadow-warm/25 transition hover:-translate-y-0.5 hover:shadow-warm/40"
          >
            Get project updates
          </Link>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-border-1 bg-surface-1 p-10 text-center text-text-3">
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
