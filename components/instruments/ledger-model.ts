import type { Claim, ClaimsLedger } from '@/lib/instruments/types'
import { LEDGER_STATE_VALUES, type LedgerFilterState } from '@/lib/instruments/url-state'

/**
 * The seven states a row can sit in: the six verdicts, plus the claims that have not been
 * worked to one. `unverified` is a status rather than a verdict in the data, but the reader
 * meets it as a seventh band in the spectrum, so the view flattens the two.
 */
export const LEDGER_STATES = LEDGER_STATE_VALUES
export type LedgerState = LedgerFilterState

/**
 * The weights behind the terrain. This is an invented metric, and the piece prints these
 * numbers in its method note rather than smuggling them in — `unfalsifiable` and
 * `unverified` carry no weight because neither is a judgement about the world.
 */
export const TERRAIN_WEIGHTS: Readonly<Partial<Record<LedgerState, number>>> = {
  confirmed: 1,
  likely: 0.5,
  contested: 0,
  unsupported: -0.5,
  debunked: -1,
}

/** Half-width of the rolling window, in seconds. */
export const TERRAIN_WINDOW = 420
/** A window holding fewer scored claims than this produces a gap, not a guess. */
export const TERRAIN_MIN_CLAIMS = 6
/** Sampling interval of the terrain, in seconds — fixed, so the curve never depends on width. */
const TERRAIN_STEP = 10
/** Buckets the episode strip divides the runtime into. */
export const BUCKET_COUNT = 60

export function toSeconds(timestamp: string): number {
  return timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  const minutes = Math.floor((whole % 3600) / 60)
  return `${Math.floor(whole / 3600)}:${String(minutes).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/** `1:04` — the coarse form the axis and the window readout use. */
export function formatMinutes(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 3600)}:${String(Math.floor((whole % 3600) / 60)).padStart(2, '0')}`
}

export interface LedgerRow {
  claim: Claim
  state: LedgerState
  /** Where the claim sits on the episode clock: its first timestamp. */
  seconds: number
  /** Everything the search box matches against, pre-lowercased. */
  haystack: string
}

export interface LedgerSection {
  id: string
  title: string
  rows: LedgerRow[]
  counts: Record<LedgerState, number>
}

export interface TerrainSample {
  t: number
  value: number
}

export interface LedgerBucket {
  index: number
  from: number
  to: number
  counts: Record<LedgerState, number>
  total: number
}

export interface LedgerModel {
  source: ClaimsLedger['source']
  rows: LedgerRow[]
  byId: Map<string, LedgerRow>
  sections: LedgerSection[]
  counts: Record<LedgerState, number>
  worked: number
  /** Runtime covered by the ledger: the last timestamp any claim carries. */
  span: number
  /** Contiguous runs of the terrain; a break between runs is a disclosed gap. */
  terrain: TerrainSample[][]
  extremes: { low: TerrainSample; high: TerrainSample } | null
  buckets: LedgerBucket[]
}

function emptyCounts(): Record<LedgerState, number> {
  return Object.fromEntries(LEDGER_STATES.map((state) => [state, 0])) as Record<LedgerState, number>
}

function stateOf(claim: Claim): LedgerState {
  return claim.verdict ?? 'unverified'
}

function toRow(claim: Claim): LedgerRow {
  return {
    claim,
    state: stateOf(claim),
    seconds: toSeconds(claim.timestamps[0] ?? '0:00:00'),
    haystack: [
      claim.id,
      claim.title,
      claim.claim,
      claim.speakers.join(' '),
      claim.rationale ?? '',
      claim.verdictLabel ?? '',
    ]
      .join(' ')
      .toLowerCase(),
  }
}

function buildTerrain(rows: readonly LedgerRow[], span: number) {
  const scored = rows
    .filter((row) => row.state in TERRAIN_WEIGHTS)
    .sort((a, b) => a.seconds - b.seconds)

  const runs: TerrainSample[][] = []
  let run: TerrainSample[] | null = null
  let low: TerrainSample | null = null
  let high: TerrainSample | null = null

  for (let t = 0; t <= span; t += TERRAIN_STEP) {
    const near = scored.filter((row) => Math.abs(row.seconds - t) <= TERRAIN_WINDOW)
    if (near.length < TERRAIN_MIN_CLAIMS) {
      run = null
      continue
    }
    const value =
      near.reduce((total, row) => total + (TERRAIN_WEIGHTS[row.state] ?? 0), 0) / near.length
    const sample = { t, value }
    if (!run) {
      run = []
      runs.push(run)
    }
    run.push(sample)
    if (!low || value < low.value) low = sample
    if (!high || value > high.value) high = sample
  }

  return { runs, extremes: low && high ? { low, high } : null }
}

function buildBuckets(rows: readonly LedgerRow[], span: number): LedgerBucket[] {
  const width = span / BUCKET_COUNT
  const buckets: LedgerBucket[] = Array.from({ length: BUCKET_COUNT }, (_, index) => ({
    index,
    from: index * width,
    to: (index + 1) * width,
    counts: emptyCounts(),
    total: 0,
  }))
  for (const row of rows) {
    const bucket = buckets[Math.min(BUCKET_COUNT - 1, Math.floor(row.seconds / width))]
    if (!bucket) continue
    bucket.counts[row.state] += 1
    bucket.total += 1
  }
  return buckets
}

/**
 * Everything the instruments read, derived once from the shipped ledger. Pure and
 * synchronous: the client builds it in a `useMemo` so the terrain survives filter changes
 * untouched.
 */
export function buildLedgerModel(ledger: ClaimsLedger): LedgerModel {
  const rows = ledger.claims.map(toRow)
  const span = Math.max(0, ...ledger.claims.flatMap((claim) => claim.timestamps.map(toSeconds)))

  const counts = emptyCounts()
  for (const row of rows) counts[row.state] += 1

  const sections = ledger.sections
    .map((section) => {
      const sectionRows = rows.filter((row) => row.claim.section === section.id)
      const sectionCounts = emptyCounts()
      for (const row of sectionRows) sectionCounts[row.state] += 1
      return { id: section.id, title: section.title, rows: sectionRows, counts: sectionCounts }
    })
    .filter((section) => section.rows.length > 0)

  const { runs, extremes } = buildTerrain(rows, span)

  return {
    source: ledger.source,
    rows,
    byId: new Map(rows.map((row) => [row.claim.id, row])),
    sections,
    counts,
    worked: rows.filter((row) => row.state !== 'unverified').length,
    span,
    terrain: runs,
    extremes,
    buckets: buildBuckets(rows, span),
  }
}

export function verdictColor(state: LedgerState): string {
  return `var(--color-verdict-${state})`
}

/** The label a verdict wears in the UI. `unverified` is a state of the work, not a finding. */
export function stateLabel(state: LedgerState): string {
  return state === 'unverified' ? 'not yet worked' : state
}

export function sectionAnchor(sectionId: string): string {
  return `ledger-section-${sectionId}`
}
