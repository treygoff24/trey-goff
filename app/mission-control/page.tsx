import type { Metadata } from 'next'
import Link from 'next/link'
import { ColumnStrip } from '@/components/mission-control/ColumnStrip'
import { HeatStrip } from '@/components/mission-control/HeatStrip'
import { LocalClock } from '@/components/mission-control/LocalClock'
import { ReadingShelf } from '@/components/mission-control/ReadingShelf'
import { Sparkline } from '@/components/mission-control/Sparkline'
import { TopicStrip } from '@/components/mission-control/TopicStrip'
import { EditorialIndexRow } from '@/components/site/EditorialIndexRow'
import { getFocusInstrument } from '@/lib/mission-control/focus'
import type { Instrument } from '@/lib/mission-control/instrument'
import { getStrengthInstrument } from '@/lib/mission-control/lifts'
import { getOrbitInstrument } from '@/lib/mission-control/orbit'
import { getReadingInstrument } from '@/lib/mission-control/reading'
import { getShippingInstrument } from '@/lib/mission-control/shipping'
import { getWritingInstrument } from '@/lib/mission-control/writing'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'A sourced, timestamped operating picture of what I am doing now.',
  robots: { index: false, follow: false },
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'date unavailable'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function formatMonth(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}-01T00:00:00Z`))
}

function monthSpan(start: string, end: string): number {
  const first = new Date(start)
  const last = new Date(end)
  return Math.max(
    0,
    (last.getUTCFullYear() - first.getUTCFullYear()) * 12 +
      last.getUTCMonth() -
      first.getUTCMonth(),
  )
}

function InstrumentHeader({
  id,
  title,
  instrument,
  cadence,
}: {
  id: string
  title: string
  instrument: Instrument<unknown>
  cadence: string
}) {
  return (
    <header>
      <h2 id={id} className="font-newsreader text-3xl font-medium tracking-[-0.015em] text-text-1">
        {title}
      </h2>
      <p className="mt-3 font-mono text-[11px] leading-5 uppercase tracking-[0.12em] text-text-2">
        {instrument.source}
        <span aria-hidden="true"> · </span>
        as of <time dateTime={instrument.asOf}>{formatDate(instrument.asOf)}</time>
        <span aria-hidden="true"> · </span>
        refresh {cadence}
      </p>
      {instrument.stale && (
        <span className="mt-3 inline-block border border-border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-warm">
          stale · awaiting a fresh reading
        </span>
      )}
    </header>
  )
}

function InstrumentSection({
  id,
  title,
  instrument,
  cadence,
  children,
}: {
  id: string
  title: string
  instrument: Instrument<unknown>
  cadence: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      data-instrument={id}
      className="tg-section grid gap-8 lg:grid-cols-[minmax(12rem,0.32fr)_minmax(0,1fr)] lg:gap-14"
    >
      <InstrumentHeader
        id={`${id}-heading`}
        title={title}
        instrument={instrument}
        cadence={cadence}
      />
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function AbsentState({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-y border-border-1 py-6 font-newsreader text-xl leading-8 text-text-2">
      {children}
    </p>
  )
}

export default async function MissionControlPage() {
  const renderedAt = new Date()
  const [focus, strength, reading, writing, shipping, orbit] = await Promise.all([
    getFocusInstrument(renderedAt),
    getStrengthInstrument(renderedAt),
    getReadingInstrument(renderedAt),
    getWritingInstrument(renderedAt),
    getShippingInstrument(fetch, renderedAt),
    getOrbitInstrument(renderedAt),
  ])

  return (
    <div className="tg-page" data-mission-control>
      <header className="tg-rise pb-12 sm:pb-16">
        <p className="tg-eyebrow">Mission Control</p>
        <h1 className="tg-display mt-6 max-w-4xl">A life, in instruments.</h1>
        <p className="tg-standfirst mt-6">
          A sourced operating picture of what I am doing, lifting, reading, writing, and shipping.
          Nothing inferred. Every reading carries its clock.
        </p>
      </header>

      <InstrumentSection id="focus" title="Focus" instrument={focus} cadence="within 30 days">
        {focus.data ? (
          <div>
            <p className="max-w-3xl font-newsreader text-[clamp(2rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.025em] text-text-1">
              {focus.data.mission}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-text-2">{focus.data.note}</p>
            <div className="mt-8 border-y border-border-1 py-4 font-mono text-xs uppercase tracking-[0.14em] text-text-2">
              {focus.data.location && focus.data.tz ? (
                <p>
                  {focus.data.location}
                  <span aria-hidden="true"> · </span>
                  <LocalClock initialIso={renderedAt.toISOString()} timeZone={focus.data.tz} />
                </p>
              ) : focus.data.location ? (
                <p>{focus.data.location} · local time not set</p>
              ) : focus.data.tz ? (
                <p>
                  Location not set
                  <span aria-hidden="true"> · </span>
                  <LocalClock initialIso={renderedAt.toISOString()} timeZone={focus.data.tz} />
                </p>
              ) : (
                <p>Location not set · local time not set</p>
              )}
            </div>
          </div>
        ) : (
          <AbsentState>
            The current-focus ledger is unreadable. No mission or position is being inferred.
          </AbsentState>
        )}
      </InstrumentSection>

      <InstrumentSection id="strength" title="Strength" instrument={strength} cadence="quarterly">
        {strength.data ? (
          <div>
            <div className="border-b border-border-1">
              {strength.data.lifts.map((lift) => {
                const first = lift.progression[0]!
                const last = lift.progression.at(-1)!
                const summary = `${lift.name}: ${first.weight} to ${last.weight} ${last.unit} over ${monthSpan(first.date, last.date)} months.`
                return (
                  <div
                    key={lift.name}
                    className="grid gap-5 border-t border-border-1 py-5 sm:grid-cols-[minmax(8rem,0.32fr)_minmax(0,1fr)] sm:items-end sm:gap-8"
                  >
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-warm">
                        {lift.name}
                      </p>
                      <p className="mt-2 font-newsreader text-3xl text-text-1">
                        {lift.current.weight}{' '}
                        <span className="font-mono text-xs uppercase tracking-[0.12em] text-text-2">
                          {lift.current.unit}
                        </span>
                      </p>
                      <time
                        dateTime={lift.current.date}
                        className="mt-2 block font-mono text-[10px] uppercase tracking-[0.12em] text-text-2"
                      >
                        set {formatDate(lift.current.date)}
                      </time>
                    </div>
                    <Sparkline
                      label="progression"
                      values={lift.progression.map((record) => record.weight)}
                      summary={summary}
                    />
                  </div>
                )
              })}
            </div>
            <p className="py-5 font-mono text-sm tracking-[0.06em] text-text-2">
              {strength.data.lifts.map((lift) => lift.current.weight).join(' · ')} —{' '}
              <span className="text-text-1">
                {strength.data.total} {strength.data.unit} total
              </span>
            </p>
          </div>
        ) : (
          <AbsentState>The bar is quiet. No verified lift ledger could be read.</AbsentState>
        )}
      </InstrumentSection>

      <InstrumentSection id="reading" title="Reading" instrument={reading} cadence="monthly">
        {reading.data ? (
          <div>
            <p className="border-y border-border-1 py-5 font-mono text-sm leading-7 tracking-[0.04em] text-text-2">
              <span className="text-text-1">{reading.data.counts.read} read</span> ·{' '}
              {reading.data.counts.reading} reading · {reading.data.counts.want} queued ·{' '}
              {reading.data.counts.abandoned} abandoned
            </p>
            <div className="py-8">
              <TopicStrip topics={reading.data.topics} />
              <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {reading.data.topics.map((topic) => (
                  <li
                    key={topic.topic}
                    className="flex justify-between border-b border-border-1 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-2"
                  >
                    <span>{topic.topic}</span>
                    <span>{topic.count}</span>
                  </li>
                ))}
              </ol>
            </div>
            <ReadingShelf
              currentlyReading={reading.data.currentlyReading}
              topRated={reading.data.topRated}
            />
            <Link href="/library" className="tg-action-secondary mt-8">
              Open the library
            </Link>
          </div>
        ) : (
          <AbsentState>
            The library ledger is closed tonight. No catalog counts are being claimed.
          </AbsentState>
        )}
      </InstrumentSection>

      <InstrumentSection id="writing" title="Writing" instrument={writing} cadence="on publish">
        {writing.data ? (
          <div>
            <div className="border-y border-border-1 py-6">
              <ColumnStrip
                values={writing.data.months.map((month) => ({
                  label: formatMonth(month.month),
                  value: month.count,
                }))}
                summary={`${writing.data.months.reduce((sum, month) => sum + month.count, 0)} essays and notes published across the trailing 24 months.`}
              />
            </div>
            {writing.data.latestEssay ? (
              <EditorialIndexRow
                href={`/writing/${writing.data.latestEssay.slug}`}
                meta={formatDate(writing.data.latestEssay.date)}
                title={writing.data.latestEssay.title}
                description={writing.data.latestEssay.summary}
                detail={`${writing.data.latestEssay.readingTime} min →`}
              />
            ) : (
              <p className="border-b border-border-1 py-5 text-sm text-text-2">
                No published essay is on the wire yet.
              </p>
            )}
            <p className="py-5 font-mono text-sm tracking-[0.06em] text-text-2">
              <span className="text-text-1">{writing.data.wordCount.toLocaleString()}</span> words
              across the published corpus
            </p>
          </div>
        ) : (
          <AbsentState>
            The writing ledger could not be reconciled. No cadence is being claimed.
          </AbsentState>
        )}
      </InstrumentSection>

      <InstrumentSection id="shipping" title="Shipping" instrument={shipping} cadence="hourly">
        {shipping.data ? (
          <div>
            <div className="border-y border-border-1 py-6">
              <HeatStrip
                days={shipping.data.days}
                summary={`${shipping.data.eventCount} public GitHub events recorded across the last 30 days.`}
              />
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-text-2">
                {shipping.data.eventCount} public events · 30-day API horizon
              </p>
            </div>
            {shipping.data.repos.length > 0 ? (
              shipping.data.repos.map((repo) => (
                <EditorialIndexRow
                  key={repo.fullName}
                  href={repo.url}
                  meta={`touched ${formatDate(repo.touchedAt)}`}
                  title={repo.name}
                  description={repo.description ?? 'Public repository; no description supplied.'}
                  detail={repo.language ?? 'view →'}
                />
              ))
            ) : (
              <p className="border-b border-border-1 py-5 text-sm text-text-2">
                GitHub answered, but no public source repositories were returned.
              </p>
            )}
          </div>
        ) : (
          <AbsentState>
            GitHub isn&apos;t answering the observatory tonight. Instrument offline — last attempt{' '}
            <time dateTime={shipping.asOf}>{formatDate(shipping.asOf)}</time>.
          </AbsentState>
        )}
      </InstrumentSection>

      <InstrumentSection id="orbit" title="Orbit" instrument={orbit} cadence="monthly">
        {orbit.data && orbit.data.length > 0 ? (
          <div>
            {orbit.data.map((entry) => (
              <EditorialIndexRow
                key={`${entry.kind}-${entry.url}`}
                href={entry.url}
                meta={`${entry.kind} · ${formatDate(entry.date)}`}
                title={entry.title}
                description={entry.venue}
              />
            ))}
            <Link href="/transmissions" className="tg-action-secondary mt-8">
              Follow the signal
            </Link>
          </div>
        ) : orbit.data ? (
          <AbsentState>
            The receiving dish has no logged appearances or publications yet.
          </AbsentState>
        ) : (
          <AbsentState>
            The receiving dish is quiet. No appearances or publications are being claimed.
          </AbsentState>
        )}
      </InstrumentSection>
    </div>
  )
}
