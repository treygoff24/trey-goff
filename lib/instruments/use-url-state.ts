'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  instrumentStateUrl,
  parseInstrumentState,
  type InstrumentUrlState,
} from '@/lib/instruments/url-state'

/**
 * Instrument state lives in the query string and is read on the client only — the page
 * never touches the server `searchParams` prop, which would opt the route out of static
 * generation. Callers must render this under a `<Suspense>` boundary.
 */
export function useInstrumentUrlState(): [InstrumentUrlState, (next: InstrumentUrlState) => void] {
  const searchParams = useSearchParams()
  const [state, setState] = useState(() => parseInstrumentState(searchParams))

  useEffect(() => {
    setState(parseInstrumentState(searchParams))
  }, [searchParams])

  useEffect(() => {
    const onPopState = () => {
      setState(parseInstrumentState(new URLSearchParams(window.location.search)))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const commit = useCallback((next: InstrumentUrlState) => {
    setState(next)
    window.history.replaceState(window.history.state, '', instrumentStateUrl(next, window.location))
  }, [])

  return [state, commit]
}
