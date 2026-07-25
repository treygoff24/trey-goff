import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import type { InstrumentUrlState, InstrumentVocabulary } from '@/lib/instruments/url-state'

const VOCABULARY: InstrumentVocabulary = {
  sections: new Set(['A', 'B']),
  claims: new Set(['C001', 'C002']),
  duration: 3 * 60 * 60,
}

/**
 * The URL codec is pure and covered by `instruments-url-state.test.ts`. What needs a DOM
 * is the hook's contract with the browser: it reads the query string on the client only,
 * and it re-reads it on `popstate` so back/forward restores state. Next's `useSearchParams`
 * requires a Suspense boundary, so the harness renders under one.
 */

const dom = new JSDOM('<!doctype html><div id="root"></div>', {
  url: 'https://example.com/writing/ufo-claims-ledger?v=likely&audit=1',
  pretendToBeVisual: true,
})

const globals = globalThis as unknown as Record<string, unknown>
globals.window = dom.window
globals.document = dom.window.document
globals.HTMLElement = dom.window.HTMLElement
globals.Event = dom.window.Event
globals.PopStateEvent = dom.window.PopStateEvent
globals.IS_REACT_ACT_ENVIRONMENT = true

test('the hook reads the initial query string and restores state on popstate', async () => {
  // Imported here rather than at the top of the file: React and Next's client context must
  // load after the jsdom globals above are in place.
  const { createElement, Suspense, act } = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { SearchParamsContext } =
    await import('next/dist/shared/lib/hooks-client-context.shared-runtime')
  const { useInstrumentUrlState } = await import('@/lib/instruments/use-url-state')
  const { DEFAULT_INSTRUMENT_STATE } = await import('@/lib/instruments/url-state')

  let latest: InstrumentUrlState = DEFAULT_INSTRUMENT_STATE

  function Probe() {
    const [state] = useInstrumentUrlState(VOCABULARY)
    latest = state
    return null
  }

  const container = dom.window.document.getElementById('root')
  assert.ok(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(
      createElement(
        SearchParamsContext.Provider,
        { value: new dom.window.URLSearchParams(dom.window.location.search) },
        createElement(Suspense, { fallback: null }, createElement(Probe)),
      ),
    )
  })

  assert.deepEqual(latest.verdicts, ['likely'])
  assert.equal(latest.audit, true)

  // Back/forward changes `location` without re-rendering the tree; only `popstate` tells
  // the hook to look again.
  dom.window.history.pushState(null, '', '/writing/ufo-claims-ledger?v=debunked&s=A')
  await act(async () => {
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'))
  })

  assert.deepEqual(latest.verdicts, ['debunked'])
  assert.deepEqual(latest.sections, ['A'])
  assert.equal(latest.audit, false)

  await act(async () => {
    root.unmount()
  })
})
