'use client'

import dynamic from 'next/dynamic'

/**
 * The one lazy boundary for the whole instrument layer.
 *
 * `next/dynamic` only defers when the call sits in a client module: called from a Server
 * Component, Turbopack is free to fold the target into the route's shared client chunk, and
 * then every ordinary essay on `/writing/[slug]` downloads the ledger. Declaring the boundary
 * here keeps each instrument in an async chunk that is fetched only by a page that renders it.
 * `scripts/check-bundle-isolation.ts` fails the build if that stops being true.
 *
 * Server rendering is deliberately left on: all 434 ledger rows must reach the HTML.
 */
export const LazyLedgerProvider = dynamic(() => import('@/components/instruments/LedgerProvider'))
export const LazyUrlStateSync = dynamic(() => import('@/components/instruments/UrlStateSync'))
export const LazyInstrumentRail = dynamic(() => import('@/components/instruments/InstrumentRail'))
export const LazyTimeSpine = dynamic(() => import('@/components/instruments/TimeSpine'))
export const LazyClaimLedger = dynamic(() => import('@/components/instruments/ClaimLedger'))
export const LazyDossierDialog = dynamic(() => import('@/components/instruments/DossierDialog'))

export const LazyAuditProvider = dynamic(() => import('@/components/instruments/AuditProvider'))
export const LazyAuditLayer = dynamic(() => import('@/components/instruments/AuditLayer'))
export const LazyNotesList = dynamic(() => import('@/components/instruments/MarginNotes'))
export const LazyStat = dynamic(() => import('@/components/instruments/Stat'))
export const LazyForecastCard = dynamic(() => import('@/components/instruments/ForecastCard'))
export const LazyChart = dynamic(() => import('@/components/instruments/Chart'))

/**
 * The two annotation components are named exports of modules whose default export is a
 * different instrument, so they take the long way round to the same async chunk.
 */
export const LazyMarkSpan = dynamic(() =>
  import('@/components/instruments/AuditLayer').then((module) => module.MarkSpan),
)
export const LazyNoteMarker = dynamic(() =>
  import('@/components/instruments/MarginNotes').then((module) => module.NoteMarker),
)
