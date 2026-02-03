import Link from 'next/link'
import { TagPill } from '@/components/ui/TagPill'
import { cn } from '@/lib/utils'

interface ProjectLink {
  label: string
  url: string
}

interface ProjectCardProps {
  project: {
    slug: string
    name: string
    oneLiner: string
    problem: string
    approach: string
    status: 'active' | 'shipped' | 'on-hold' | 'archived' | 'idea'
    type: 'software' | 'policy' | 'professional' | 'experiment'
    roles: string[]
    links: ProjectLink[]
    tags: string[]
  }
}

const statusStyles: Record<ProjectCardProps['project']['status'], string> = {
  active: 'bg-warm/20 text-warm',
  shipped: 'bg-success/20 text-success',
  'on-hold': 'bg-warning/20 text-warning',
  archived: 'bg-surface-2 text-text-3',
  idea: 'bg-accent/20 text-accent',
}

const typeStyles: Record<ProjectCardProps['project']['type'], string> = {
  software: 'bg-surface-2 text-text-2',
  policy: 'bg-surface-2 text-text-2',
  professional: 'bg-surface-2 text-text-2',
  experiment: 'bg-surface-2 text-text-2',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [primaryLink, ...secondaryLinks] = project.links

  return (
    <article
      id={project.slug}
      className="card-interactive group rounded-2xl border border-border-1 bg-surface-1 p-6 transition hover:border-warm/20 sm:p-7"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
            <span
              className={cn(
                'rounded-full px-3 py-1 font-semibold',
                statusStyles[project.status]
              )}
            >
              {project.status}
            </span>
            <span
              className={cn(
                'rounded-full px-3 py-1 font-semibold',
                typeStyles[project.type]
              )}
            >
              {project.type}
            </span>
          </div>
          <div>
            <h2 className="font-satoshi text-2xl font-medium text-text-1 sm:text-3xl">
              {project.name}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-text-2">
              {project.oneLiner}
            </p>
          </div>
        </div>
        {primaryLink && (
          <Link
            href={primaryLink.url}
            className="inline-flex items-center justify-center rounded-full bg-warm px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-bg-0 shadow-lg shadow-warm/25 transition hover:-translate-y-0.5 hover:shadow-warm/40"
          >
            {primaryLink.label}
          </Link>
        )}
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-3">Problem</p>
          <p className="mt-2 text-sm leading-relaxed text-text-2">
            {project.problem}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-3">
            Approach
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-2">
            {project.approach}
          </p>
        </div>
      </div>

      {project.roles.length > 0 && (
        <div className="mt-7">
          <p className="text-xs uppercase tracking-[0.2em] text-text-3">Roles</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.roles.map((role) => (
              <TagPill key={role} tag={role} />
            ))}
          </div>
        </div>
      )}

      {secondaryLinks.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {secondaryLinks.map((link) => (
            <Link
              key={`${project.slug}-${link.url}`}
              href={link.url}
              className="rounded-full border border-border-1 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-text-2 transition hover:border-warm/40 hover:text-warm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {project.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <TagPill key={`${project.slug}-${tag}`} tag={tag} />
          ))}
        </div>
      )}
    </article>
  )
}
