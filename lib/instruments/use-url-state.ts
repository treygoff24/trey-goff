'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  instrumentStateUrl,
  parseInstrumentState,
  type InstrumentUrlState,
  type InstrumentVocabulary,
} from '@/lib/instruments/url-state'

/**
 * Instrument state lives in the query string and is read on the client only — the page
 * never touches the server `searchParams` prop, which would opt the route out of static
 * generation. Callers must render this under a `<Suspense>` boundary.
 */
export function useInstrumentUrlState(
  vocabulary?: InstrumentVocabulary,
): [InstrumentUrlState, (next: InstrumentUrlState) => void] {
  const searchParams = useSearchParams()
  const [state, setState] = useState(() => parseInstrumentState(searchParams, vocabulary))

  useEffect(() => {
    setState(parseInstrumentState(searchParams, vocabulary))
  }, [searchParams, vocabulary])

  useEffect(() => {
    const onPopState = () => {
      setState(parseInstrumentState(new URLSearchParams(window.location.search), vocabulary))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [vocabulary])

  const commit = useCallback((next: InstrumentUrlState) => {
    setState(next)
    window.history.replaceState(window.history.state, '', instrumentStateUrl(next, window.location))
  }, [])

  return [state, commit]
}
