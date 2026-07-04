import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import { getTopicHref, getTopicsIndex } from '@/lib/topics'
import type { TopicEntry } from '@/lib/topics'

export const metadata = {
  title: 'Topics',
  description: 'The threads that run through essays, notes, projects, and the library.',
}

function breakdown(counts: TopicEntry['counts']) {
  const parts = [
    ['essays', counts.essays],
    ['notes', counts.notes],
    ['projects', counts.projects],
    ['books', counts.books],
  ] as const
  return parts.filter(([, value]) => value > 0)
}

export default function TopicsPage() {
  const topics = getTopicsIndex()
  const totalSignals = topics.reduce((sum, topic) => sum + topic.counts.total, 0)

  return (
    <div className="tg-page max-w-4xl">
      <header className="tg-rise mb-10">
        <p className="tg-eyebrow text-warm">Topics</p>
        <h1 className="mt-6 font-newsreader text-[clamp(2.4rem,4.5vw,3.4rem)] font-medium leading-[1.06] tracking-[-0.02em] text-text-1 text-balance">
          The threads that run through everything here.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-2">
          Every essay, note, project, and book is stitched to the ideas it touches. Pull a thread to
          see where it goes.
        </p>
        <p className="mt-6 font-mono text-sm text-text-3">
          <span className="text-warm">{topics.length}</span> threads
          <span aria-hidden="true" className="mx-3">
            ·
          </span>
          <span className="text-warm">{totalSignals}</span> appearances
        </p>
      </header>

      {topics.length === 0 ? (
        <p className="border-t border-border-1 pt-8 text-text-3">
          No topics yet. Add tags to get started.
        </p>
      ) : (
        <div className="border-t border-border-2">
          {topics.map((topic) => {
            const parts = breakdown(topic.counts)
            return (
              <Link
                key={topic.tag}
                href={getTopicHref(topic.tag)}
                className="group grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-4 border-b border-border-1 px-2 py-4 transition-colors hover:bg-surface-1/50 sm:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,18rem)]"
              >
                <span className="font-mono text-xs text-warm">{topic.counts.total}</span>
                <span className="min-w-0">
                  <span className="block truncate font-newsreader text-xl font-medium leading-snug text-text-1 transition-colors group-hover:text-warm">
                    {topic.tag}
                  </span>
                  <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-3">
                    {parts.map(([label, value], index) => (
                      <span key={label}>
                        {index > 0 && (
                          <span aria-hidden="true" className="mx-2">
                            ·
                          </span>
                        )}
                        {value} {label}
                      </span>
                    ))}
                  </span>
                </span>
                {topic.latest && (
                  <span className="hidden min-w-0 truncate text-right text-sm text-text-3 sm:block">
                    {topic.latest.title}
                    {topic.latest.date && (
                      <span className="ml-2 font-mono text-[10.5px] uppercase tracking-[0.08em]">
                        {formatDateShort(topic.latest.date)}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
