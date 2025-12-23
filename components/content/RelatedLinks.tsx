import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RelatedLink {
  id?: string
  title: string
  url: string
  type: string
}

interface RelatedLinksProps {
  title: string
  links: RelatedLink[]
  size?: 'sm' | 'md'
  className?: string
}

const typeLabels: Record<string, string> = {
  essay: 'Essay',
  note: 'Note',
  project: 'Project',
  topic: 'Topic',
}

export function RelatedLinks({
  title,
  links,
  size = 'md',
  className,
}: RelatedLinksProps) {
  if (links.length === 0) return null

  const titleClass =
    size === 'sm'
      ? 'text-[10px] uppercase tracking-[0.2em] text-text-3'
      : 'text-xs uppercase tracking-[0.2em] text-text-3'
  const listClass = size === 'sm' ? 'space-y-1 text-xs' : 'space-y-2 text-sm'

  return (
    <div className={cn('space-y-2', className)}>
      <p className={titleClass}>{title}</p>
      <ul className={listClass}>
        {links.map((link) => (
          <li
            key={link.id ?? link.url}
            className="flex items-center justify-between gap-3"
          >
            <Link
              href={link.url}
              className="text-text-2 transition-colors hover:text-text-1"
            >
              {link.title}
            </Link>
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-3">
              {typeLabels[link.type] ?? link.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
