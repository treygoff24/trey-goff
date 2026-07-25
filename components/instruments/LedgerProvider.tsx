'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ClientLedger } from '@/lib/instruments/types'
import { buildLedgerModel, type LedgerModel } from '@/components/instruments/ledger-model'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

interface LedgerContextValue {
  /** Null on an instrumented piece that carries no claims ledger — an audited essay, say. */
  model: LedgerModel | null
  /** Dossier slugs this piece ships, so a claim can tell a live link from a dead end. */
  dossiers: readonly string[]
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

/** For instruments that read the ledger if there is one: the rail, the audit control. */
export function useOptionalLedger(): LedgerContextValue {
  const value = useContext(LedgerContext)
  if (!value) throw new Error('instrument components must render inside <LedgerProvider>')
  return value
}

/** For instruments that are the ledger: the spine, the rows, the dossier slide-over. */
export function useLedger(): LedgerContextValue & { model: LedgerModel } {
  const value = useOptionalLedger()
  if (!value.model) throw new Error('this instrument needs a claims ledger and the piece has none')
  return { ...value, model: value.model }
}

interface LedgerProviderProps {
  ledger: ClientLedger | null
  dossiers: readonly string[]
  children: ReactNode
}

/**
 * Derives the ledger model once for the whole piece. The spine, the ledger and the rail all
 * read it from here rather than each rebuilding it — the terrain in particular is the
 * expensive part and must not recompute when a filter changes.
 */
export default function LedgerProvider({ ledger, dossiers, children }: LedgerProviderProps) {
  const value = useMemo(
    () => ({ model: ledger ? buildLedgerModel(ledger) : null, dossiers }),
    [ledger, dossiers],
  )

  return (
    <LedgerContext.Provider value={value}>
      <div data-instrument={INSTRUMENT_SENTINEL}>{children}</div>
    </LedgerContext.Provider>
  )
}
