'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { Spectrum } from '@/components/instruments/Spectrum'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'
import { clearFilters, toggleSection, useLedgerStore } from '@/components/instruments/ledger-store'
import { isFiltered, matchesFilters } from '@/components/instruments/use-filtered-rows'
import { formatClock, sectionAnchor } from '@/components/instruments/ledger-model'

/** Headings the rail tracks: the article's own, then every ledger section. */
function useReadingPosition(ids: readonly string[]) {
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-140px 0px -70% 0px' },
    )
    for (const element of elements) observer.observe(element)
    return () => observer.disconnect()
  }, [ids])

  return active
}

function StateSummary() {
  const { model } = useLedger()
  const filters = useLedgerStore((state) => state.filters)
  const visible = useMemo(
    () => model.rows.filter((row) => matchesFilters(row, filters)).length,
    [model.rows, filters],
  )
  const filtered = isFiltered(filters)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="font-mono text-xs text-text-2">
        <span className="text-text-1">{visible}</span> of {model.rows.length} claims
      </p>
      {filters.range && (
        <p className="font-mono text-[11px] text-text-3">
          {formatClock(secondsOf(filters.range[0]))}–{formatClock(secondsOf(filters.range[1]))}
        </p>
      )}
      {filtered && (
        <button
          type="button"
          className="font-mono text-[11px] underline underline-offset-4"
          style={{ color: 'var(--instrument-accent)' }}
          onClick={clearFilters}
        >
          clear
        </button>
      )}
    </div>
  )
}

function secondsOf(timestamp: string): number {
  return timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

/**
 * On an instrumented piece the rail replaces the table of contents: it subsumes scrollspy and
 * adds what a contents list cannot say — how much of the ledger the current filters leave
 * standing, and how each section's verdicts fall. Below 1024px it collapses to a sticky strip.
 */
export default function InstrumentRail({ headings }: { headings: { id: string; text: string }[] }) {
  const { model } = useLedger()
  const filters = useLedgerStore((state) => state.filters)
  const sectionIds = useMemo(
    () => model.sections.map((section) => sectionAnchor(section.id)),
    [model.sections],
  )
  const ids = useMemo(
    () => [...headings.map((heading) => heading.id), ...sectionIds],
    [headings, sectionIds],
  )
  const active = useReadingPosition(ids)
  const activeSection = model.sections.find((section) => sectionAnchor(section.id) === active)

  return (
    <>
      <div
        className="sticky top-20 z-20 -mx-4 mb-6 border-b border-border-1 bg-bg-0/95 px-4 py-2 backdrop-blur lg:hidden"
        data-instrument={INSTRUMENT_SENTINEL}
      >
        <p className="truncate font-mono text-[11px] tracking-[0.12em] text-text-3 uppercase">
          {activeSection
            ? `${activeSection.id} · ${activeSection.title}`
            : (headings.find((heading) => heading.id === active)?.text ?? 'The claims ledger')}
        </p>
        <div className="mt-1">
          <StateSummary />
        </div>
      </div>

      <nav
        aria-label="Instrument rail"
        className="hidden lg:block"
        data-instrument={INSTRUMENT_SENTINEL}
      >
        <div className="tg-scroll sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
          <p className="tg-instrument-label">Where you are</p>
          <div className="mt-2 border-b border-border-1 pb-3">
            <StateSummary />
          </div>

          {headings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className="block text-sm"
                    style={{
                      color:
                        active === heading.id ? 'var(--instrument-accent)' : 'var(--color-text-3)',
                    }}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="tg-instrument-label mt-6">Sections</p>
          <ul className="mt-2 space-y-2">
            {model.sections.map((section) => {
              const anchor = sectionAnchor(section.id)
              const on = filters.sections.includes(section.id)
              return (
                <li key={section.id} className="grid grid-cols-[1.75rem_1fr] items-start gap-2">
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Show only section ${section.id}`}
                    title={`Filter the ledger to section ${section.id}`}
                    onClick={() => toggleSection(section.id)}
                    className="flex size-6 items-center justify-center rounded-xs border font-mono text-xs"
                    style={{
                      color: on ? 'var(--instrument-accent)' : 'var(--color-text-3)',
                      borderColor: on ? 'var(--instrument-accent)' : 'var(--color-border-1)',
                    }}
                  >
                    {section.id}
                  </button>
                  <a
                    href={`#${anchor}`}
                    className="block text-xs leading-snug"
                    style={{
                      color: active === anchor ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    }}
                  >
                    {section.title}
                    <span className="mt-1 block">
                      <Spectrum
                        counts={section.counts}
                        mini
                        label={`Full verdict mix for section ${section.id}, before any filter`}
                      />
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </>
  )
}
