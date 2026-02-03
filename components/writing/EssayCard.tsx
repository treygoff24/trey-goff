import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { TagPill } from '@/components/ui/TagPill'

interface EssayCardProps {
  title: string
  slug: string
  date: string
  summary: string
  tags: string[]
  readingTime: number
  status: 'draft' | 'published' | 'evergreen'
  featured?: boolean
}

export function EssayCard({
  title,
  slug,
  date,
  summary,
  tags,
  readingTime,
  status,
  featured = false,
}: EssayCardProps) {
  const cardClasses = [
    'card-interactive relative rounded-lg border border-border-1 bg-surface-1 p-6 transition duration-300 ease-out',
    'hover:-translate-y-1 hover:border-warm/30 hover:bg-surface-2 hover:shadow-lg hover:shadow-warm/10',
    featured ? 'border-warm/30 bg-warm/5 shadow-sm shadow-warm/10' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className="group">
      <Link
        href={`/writing/${slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
      >
        <div className={cardClasses}>
          {(featured || status === 'evergreen') && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {featured && (
                <span className="inline-flex items-center rounded-full bg-warm/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warm ring-1 ring-warm/30">
                  Featured
                </span>
              )}
              {status === 'evergreen' && (
                <span className="inline-flex items-center rounded-full bg-warm/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warm">
                  Evergreen
                </span>
              )}
            </div>
          )}

          <h2 className="font-satoshi text-xl font-medium text-text-1 transition group-hover:text-warm">
            {title}
          </h2>

          <p className="mt-2 text-text-2 line-clamp-2 transition group-hover:text-text-1">
            {summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-3">
            <time dateTime={date}>{formatDate(date)}</time>
            <span>·</span>
            <span>{readingTime} min read</span>
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
