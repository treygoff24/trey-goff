'use client'

import { useMemo } from 'react'
import type { InstrumentUrlState } from '@/lib/instruments/url-state'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { useLedgerStore } from '@/components/instruments/ledger-store'
import { toSeconds, type LedgerRow } from '@/components/instruments/ledger-model'

/** One definition of "does this row survive the current filters", shared by every instrument. */
export function matchesFilters(row: LedgerRow, filters: InstrumentUrlState): boolean {
  if (filters.verdicts.length > 0 && !filters.verdicts.includes(row.state)) return false
  if (filters.sections.length > 0 && !filters.sections.includes(row.claim.section)) return false
  if (filters.range) {
    const from = toSeconds(filters.range[0])
    const to = toSeconds(filters.range[1])
    if (row.seconds < from || row.seconds > to) return false
  }
  const query = filters.query.trim().toLowerCase()
  if (query && !row.haystack.includes(query)) return false
  return true
}

export function useVisibleIds(): ReadonlySet<string> {
  const { model } = useLedger()
  const filters = useLedgerStore((state) => state.filters)
  return useMemo(
    () =>
      new Set(model.rows.filter((row) => matchesFilters(row, filters)).map((row) => row.claim.id)),
    [model.rows, filters],
  )
}

/** True when anything is narrowing the view, which is what the Clear affordance keys on. */
export function isFiltered(filters: InstrumentUrlState): boolean {
  return (
    filters.verdicts.length > 0 ||
    filters.sections.length > 0 ||
    filters.range !== null ||
    filters.query.trim() !== ''
  )
}
