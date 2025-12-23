import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import { getTopicHref, getTopicsIndex } from '@/lib/topics'
import type { TopicEntry } from '@/lib/topics'

export const metadata = {
  title: 'Topics',
  description: 'Signals across essays, notes, and books.',
}

const spotlightStyles = [
  {
    ring: 'border-warm/30',
    glow: 'shadow-[0_0_45px_-25px_rgba(255,184,107,0.6)]',
    gradient: 'from-warm/25 via-warm/10 to-transparent',
    label: 'text-warm',
  },
  {
    ring: 'border-accent/30',
    glow: 'shadow-[0_0_45px_-25px_rgba(124,92,255,0.6)]',
    gradient: 'from-accent/25 via-accent/10 to-transparent',
    label: 'text-accent',
  },
  {
    ring: 'border-success/30',
    glow: 'shadow-[0_0_45px_-25px_rgba(52,211,153,0.5)]',
    gradient: 'from-success/20 via-success/10 to-transparent',
    label: 'text-success',
  },
]

export default function TopicsPage() {
  const topics = getTopicsIndex()
  const spotlight = topics.slice(0, 7)
  const totalSignals = topics.reduce((sum, topic) => sum + topic.counts.total, 0)
  const maxSignal = Math.max(1, ...spotlight.map((topic) => topic.counts.total))

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <p className="text-sm uppercase tracking-[0.3em] text-text-3">
          Signal Index
        </p>
        <h1 className="mt-4 font-satoshi text-4xl font-medium text-text-1">
          Topics
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-text-2">
          A live map of themes across essays, notes, and the library. Each topic
          is a signal you can follow deeper.
        </p>
      </header>

      {topics.length === 0 ? (
        <div className="rounded-2xl border border-border-1 bg-surface-1 p-10 text-center">
          <p className="text-text-3">No topics yet. Add tags to get started.</p>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-border-1 bg-bg-1/60 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-bg-0/80 via-bg-1/80 to-bg-1/60" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-warm/10 via-transparent to-accent/10" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-satoshi text-2xl font-medium text-text-1">
                    Signal Field
                  </h2>
                  <p className="mt-2 text-sm text-text-3">
                    The most active topics right now.
                  </p>
                </div>
                <div className="text-sm text-text-3">
                  {topics.length} topics / {totalSignals} signals
                </div>
              </div>

              <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {spotlight.map((topic, index) => {
                  const style =
                    spotlightStyles[index % spotlightStyles.length] ??
                    spotlightStyles[0]!
                  return (
                    <TopicSpotlightCard
                      key={topic.tag}
                      topic={topic}
                      maxSignal={maxSignal}
                      style={style}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-satoshi text-2xl font-medium text-text-1">
                  All Topics
                </h2>
                <p className="mt-2 text-sm text-text-3">
                  Explore the full signal archive.
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-text-3">
                Sorted by activity
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <TopicCard key={topic.tag} topic={topic} maxSignal={maxSignal} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function TopicSpotlightCard({
  topic,
  maxSignal,
  style,
}: {
  topic: TopicEntry
  maxSignal: number
  style: {
    ring: string
    glow: string
    gradient: string
    label: string
  }
}) {
  return (
    <Link
      href={getTopicHref(topic.tag)}
      className={`group relative min-w-[240px] flex-1 snap-start overflow-hidden rounded-2xl border bg-surface-1/40 p-5 transition-all hover:-translate-y-1 hover:border-border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1 ${style.ring} ${style.glow}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-60 ${style.gradient}`}
      />
      <div className="absolute inset-0 opacity-60 mix-blend-screen" />

      <div className="relative z-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-3">
          <span>Topic</span>
          <span>{topic.counts.total} signals</span>
        </div>

        <h3 className="mt-3 font-satoshi text-2xl font-semibold text-text-1 group-hover:text-text-1">
          {topic.tag}
        </h3>

        <div className="mt-4 flex items-center gap-2 text-xs text-text-3">
          <span className={style.label}>Essays {topic.counts.essays}</span>
          <span>/</span>
          <span>Notes {topic.counts.notes}</span>
          <span>/</span>
          <span>Books {topic.counts.books}</span>
        </div>

        <div className="mt-4">
          <SignalBars counts={topic.counts} maxSignal={maxSignal} />
        </div>

        <div className="mt-4 text-xs text-text-3">
          {topic.latest ? (
            <span>
              Latest: {formatSignalLabel(topic.latest)}
              {topic.latest.date && (
                  <span className="ml-2 text-text-3">
                    / {formatDateShort(topic.latest.date)}
                  </span>
                )}
            </span>
          ) : (
            <span>Awaiting first signal.</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function TopicCard({
  topic,
  maxSignal,
}: {
  topic: TopicEntry
  maxSignal: number
}) {
  return (
    <Link
      href={getTopicHref(topic.tag)}
      className="group rounded-2xl border border-border-1 bg-surface-1 p-5 transition-all hover:border-border-2 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm focus-visible:ring-offset-2 focus-visible:ring-offset-bg-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-satoshi text-lg font-medium text-text-1">
            {topic.tag}
          </h3>
          <p className="mt-1 text-xs text-text-3">
            {topic.counts.total} signals
          </p>
        </div>
        <span className="rounded-full border border-border-1 bg-bg-1/60 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-text-3">
          Topic
        </span>
      </div>

      <div className="mt-4 text-xs text-text-3">
        Essays {topic.counts.essays} / Notes {topic.counts.notes} / Books{' '}
        {topic.counts.books}
      </div>

      <div className="mt-4">
        <SignalBars counts={topic.counts} maxSignal={maxSignal} compact />
      </div>

      <div className="mt-4 text-xs text-text-3">
        {topic.latest ? (
          <span>
            Latest: {formatSignalLabel(topic.latest)}
            {topic.latest.date && (
              <span className="ml-2">/ {formatDateShort(topic.latest.date)}</span>
            )}
          </span>
        ) : (
          <span>Awaiting first signal.</span>
        )}
      </div>
    </Link>
  )
}

function SignalBars({
  counts,
  maxSignal,
  compact = false,
}: {
  counts: TopicEntry['counts']
  maxSignal: number
  compact?: boolean
}) {
  const scale = Math.max(1, maxSignal)
  const entries = [
    { key: 'essays', value: counts.essays, className: 'bg-warm/70' },
    { key: 'notes', value: counts.notes, className: 'bg-accent/70' },
    { key: 'books', value: counts.books, className: 'bg-success/70' },
  ]

  return (
    <div
      className={`flex items-end gap-2 rounded-full border border-border-1 bg-bg-1/60 px-3 ${
        compact ? 'h-8' : 'h-10'
      }`}
      aria-hidden="true"
    >
      {entries.map((entry) => {
        if (entry.value === 0) return null
        const ratio = entry.value / scale
        const height = Math.max(0.2, ratio)
        return (
          <div key={entry.key} className="flex flex-1 items-end">
            <div
              className={`w-full rounded-full ${entry.className}`}
              style={{ height: `${height * 100}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

function formatSignalLabel(signal: TopicEntry['latest']) {
  if (!signal) return 'Awaiting first signal'
  const typeLabel = signal.type.charAt(0).toUpperCase() + signal.type.slice(1)
  return `${typeLabel}: ${signal.title}`
}
