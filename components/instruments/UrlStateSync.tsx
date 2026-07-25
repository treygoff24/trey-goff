'use client'

import { Suspense, useEffect, useRef } from 'react'
import type { ClientLedger } from '@/lib/instruments/types'
import { useInstrumentUrlState } from '@/lib/instruments/use-url-state'
import { instrumentStatesEqual, vocabularyFromLedger } from '@/lib/instruments/url-state'
import { adoptUrlState, useLedgerStore } from '@/components/instruments/ledger-store'
import { INSTRUMENT_SENTINEL } from '@/components/instruments/sentinel'

/**
 * The one place the query string is read. It is deliberately the only thing inside the
 * Suspense boundary: `useSearchParams` makes its subtree client-only on a static route, and
 * the ledger's 434 rows must stay in the prerendered HTML. So this component renders nothing
 * and mirrors state between the URL and the store instead.
 */
function Sync({ ledger }: { ledger: ClientLedger }) {
  const vocabulary = useRef(vocabularyFromLedger(ledger)).current
  const [urlState, commit] = useInstrumentUrlState(vocabulary)
  const mirrored = useRef(urlState)

  useEffect(() => {
    mirrored.current = urlState
    adoptUrlState(urlState)
  }, [urlState])

  useEffect(
    () =>
      useLedgerStore.subscribe((state) => {
        if (instrumentStatesEqual(mirrored.current, state.filters)) return
        mirrored.current = state.filters
        commit(state.filters)
      }),
    [commit],
  )

  return null
}

export default function UrlStateSync({ ledger }: { ledger: ClientLedger }) {
  return (
    <span hidden data-instrument={INSTRUMENT_SENTINEL}>
      <Suspense fallback={null}>
        <Sync ledger={ledger} />
      </Suspense>
    </span>
  )
}
