import Link from 'next/link'
import { formatDateRelative } from '@/lib/utils'
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
    <article id={slug} className="group border-b border-border-1 py-10 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]">
          <span className="text-warm">{typeLabels[type]}</span>
          <span aria-hidden="true" className="mx-2 text-text-3">
            ·
          </span>
          <time dateTime={date} className="text-text-3">
            {formatDateRelative(date)}
          </time>
        </p>
        <a
          href={`#${slug}`}
          className="font-mono text-xs text-text-3 opacity-0 transition-opacity hover:text-warm group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Link to this note"
        >
          #
        </a>
      </div>

      {title && (
        <h3 className="mb-3 font-newsreader text-2xl font-medium leading-snug text-text-1">
          {title}
        </h3>
      )}

      <div className="text-text-2 prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {type === 'link' && source && (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-warm hover:text-accent"
        >
          {sourceTitle || source} <span aria-hidden="true">↗</span>
        </a>
      )}

      {tags.length > 0 && (
        <p className="mt-5 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em]">
          {tags.map((tag, index) => (
            <span key={tag} className="flex items-center gap-3">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-3">
                  ·
                </span>
              )}
              <Link
                href={`/topics/${encodeURIComponent(tag)}`}
                className="text-text-3 transition-colors hover:text-warm"
              >
                {tag}
              </Link>
            </span>
          ))}
        </p>
      )}

      {(outgoing.length > 0 || backlinks.length > 0) && (
        <div className="mt-5 border-t border-border-1/60 pt-4">
          <RelatedLinks title="Links out" links={outgoing} size="sm" />
          <RelatedLinks title="Backlinks" links={backlinks} size="sm" className="mt-3" />
        </div>
      )}
    </article>
  )
}
