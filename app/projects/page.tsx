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
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Projects
        </h1>
        <p className="max-w-2xl text-lg text-text-2">
          Case studies and experiments across software, policy, and institutional
          innovation.
        </p>
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
