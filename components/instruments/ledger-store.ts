'use client'

import { create } from 'zustand'
import {
  DEFAULT_INSTRUMENT_STATE,
  instrumentStatesEqual,
  type InstrumentUrlState,
  type LedgerFilterState,
} from '@/lib/instruments/url-state'
import { formatClock, toSeconds, type LedgerRow } from '@/components/instruments/ledger-model'

interface LedgerStore {
  /** The shareable state — the same object the URL codec reads and writes. */
  filters: InstrumentUrlState
  /** Which dossier the slide-over is showing, if any. */
  dossier: string | null
  /** The claim the reader was just sent to, marked for one beat. */
  flash: string | null
  /** Set once the URL has been read on the client; before that the view is the default. */
  hydrated: boolean
}

export const useLedgerStore = create<LedgerStore>(() => ({
  filters: DEFAULT_INSTRUMENT_STATE,
  dossier: null,
  flash: null,
  hydrated: false,
}))

const set = useLedgerStore.setState
const get = useLedgerStore.getState

function patch(next: Partial<InstrumentUrlState>) {
  const filters = { ...get().filters, ...next }
  if (!instrumentStatesEqual(filters, get().filters)) set({ filters })
}

/** Adopt state parsed out of the URL. Idempotent, so the sync effect can fire freely. */
export function adoptUrlState(filters: InstrumentUrlState) {
  const current = get()
  if (current.hydrated && instrumentStatesEqual(current.filters, filters)) return
  set({ filters, hydrated: true })
}

export function toggleVerdict(verdict: LedgerFilterState) {
  const { verdicts } = get().filters
  patch({
    verdicts: verdicts.includes(verdict)
      ? verdicts.filter((value) => value !== verdict)
      : [...verdicts, verdict],
  })
}

export function toggleSection(section: string) {
  const { sections } = get().filters
  patch({
    sections: sections.includes(section)
      ? sections.filter((value) => value !== section)
      : [...sections, section],
  })
}

export function setQuery(query: string) {
  patch({ query })
}

/** The brush, in seconds. Passing `null` clears the window. */
export function setRange(range: [number, number] | null) {
  patch({
    range: range === null ? null : [formatClock(range[0]), formatClock(range[1])],
  })
}

export function clearFilters() {
  patch({ verdicts: [], sections: [], query: '', range: null, claim: null })
}

export function openDossier(dossier: string) {
  set({ dossier })
}

export function closeDossier() {
  set({ dossier: null })
}

/**
 * Send the reader to a claim, clearing whatever would have hidden it. A cross-reference that
 * silently lands on a filtered-out row is worse than no cross-reference.
 */
export function focusClaim(id: string, row: LedgerRow | undefined) {
  const { filters } = get()
  const rangeHides =
    filters.range !== null &&
    row !== undefined &&
    (row.seconds < toSeconds(filters.range[0]) || row.seconds > toSeconds(filters.range[1]))

  set({
    dossier: null,
    flash: id,
    filters: {
      ...filters,
      claim: id,
      query: '',
      range: rangeHides ? null : filters.range,
      verdicts:
        row && filters.verdicts.length > 0 && !filters.verdicts.includes(row.state)
          ? []
          : filters.verdicts,
      sections:
        row && filters.sections.length > 0 && !filters.sections.includes(row.claim.section)
          ? []
          : filters.sections,
    },
  })
}

export function clearFlash() {
  if (get().flash !== null) set({ flash: null })
}
