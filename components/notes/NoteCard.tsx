import { formatDateRelative } from '@/lib/utils'
import { TagPill } from '@/components/ui/TagPill'
import { RelatedLinks } from '@/components/content/RelatedLinks'

interface NoteCardProps {
  slug: string
  date: string
  type: 'thought' | 'dispatch' | 'link'
  title?: string
  content: string
  tags: string[]
  source?: string
  sourceTitle?: string
  backlinks?: { id: string; title: string; url: string; type: string }[]
  outgoing?: { id: string; title: string; url: string; type: string }[]
}

const typeIcons = {
  thought: '💭',
  dispatch: '📡',
  link: '🔗',
}

const typeLabels = {
  thought: 'Thought',
  dispatch: 'Dispatch',
  link: 'Link',
}

export function NoteCard({
  slug,
  date,
  type,
  title,
  content,
  tags,
  source,
  sourceTitle,
  backlinks = [],
  outgoing = [],
}: NoteCardProps) {
  return (
    <article
      id={slug}
      className="group card-interactive rounded-lg border border-border-1 bg-surface-1 p-6 hover:border-warm/20 hover:bg-surface-1/80"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm text-text-3">
          <span>{typeIcons[type]}</span>
          <span>{typeLabels[type]}</span>
          <span>·</span>
          <time dateTime={date}>{formatDateRelative(date)}</time>
        </div>

        {/* Anchor link */}
        <a
          href={`#${slug}`}
          className="text-text-3 opacity-0 transition-opacity hover:text-text-2 group-hover:opacity-100"
          aria-label="Link to this note"
        >
          #
        </a>
      </div>

      {/* Title (if present) */}
      {title && (
        <h3 className="mb-2 font-satoshi text-lg font-medium text-text-1">
          {title}
        </h3>
      )}

      {/* Content */}
      <div className="text-text-2 prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Source link for link-type notes */}
      {type === 'link' && source && (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 text-sm text-warm hover:underline"
        >
          <span>{sourceTitle || source}</span>
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              href={`/topics/${encodeURIComponent(tag)}`}
            />
          ))}
        </div>
      )}

      {(outgoing.length > 0 || backlinks.length > 0) && (
        <div className="mt-4 border-t border-border-1 pt-4">
          <RelatedLinks title="Links out" links={outgoing} size="sm" />
          <RelatedLinks title="Backlinks" links={backlinks} size="sm" className="mt-3" />
        </div>
      )}
    </article>
  )
}
