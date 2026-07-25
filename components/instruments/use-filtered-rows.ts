'use client'

import { useMemo } from 'react'
import type { InstrumentUrlState } from '@/lib/instruments/url-state'
import { useLedger } from '@/components/instruments/LedgerProvider'
import { useLedgerStore } from '@/components/instruments/ledger-store'
import { matchesFilters } from '@/components/instruments/ledger-model'

export { inRange, matchesFilters, matchesQuery } from '@/components/instruments/ledger-model'

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
