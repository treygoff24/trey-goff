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
}

export function EssayCard({
  title,
  slug,
  date,
  summary,
  tags,
  readingTime,
  status,
}: EssayCardProps) {
  return (
    <article className="group">
      <Link href={`/writing/${slug}`} className="block">
        <div className="rounded-lg border border-border-1 bg-surface-1 p-6 transition-all hover:border-border-2 hover:bg-surface-2">
          {/* Status badge for evergreen */}
          {status === 'evergreen' && (
            <span className="mb-2 inline-block rounded-full bg-warm/10 px-2 py-0.5 text-xs font-medium text-warm">
              Evergreen
            </span>
          )}

          <h2 className="font-satoshi text-xl font-medium text-text-1 group-hover:text-warm">
            {title}
          </h2>

          <p className="mt-2 text-text-2 line-clamp-2">{summary}</p>

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
