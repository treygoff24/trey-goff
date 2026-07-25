'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ClaimsLedger } from '@/lib/instruments/types'
import { buildLedgerModel, type LedgerModel } from '@/components/instruments/ledger-model'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

interface LedgerContextValue {
  model: LedgerModel
  /** Dossier slugs this piece ships, so a claim can tell a live link from a dead end. */
  dossiers: readonly string[]
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

export function useLedger(): LedgerContextValue {
  const value = useContext(LedgerContext)
  if (!value) throw new Error('instrument components must render inside <LedgerProvider>')
  return value
}

interface LedgerProviderProps {
  ledger: ClaimsLedger
  dossiers: readonly string[]
  children: ReactNode
}

/**
 * Derives the ledger model once for the whole piece. The spine, the ledger and the rail all
 * read it from here rather than each rebuilding it — the terrain in particular is the
 * expensive part and must not recompute when a filter changes.
 */
export default function LedgerProvider({ ledger, dossiers, children }: LedgerProviderProps) {
  const value = useMemo(() => ({ model: buildLedgerModel(ledger), dossiers }), [ledger, dossiers])

  return (
    <LedgerContext.Provider value={value}>
      <div data-instrument={INSTRUMENT_SENTINEL}>{children}</div>
    </LedgerContext.Provider>
  )
}
