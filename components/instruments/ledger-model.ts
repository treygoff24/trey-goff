import type { ClientClaim, ClientLedger } from '@/lib/instruments/types'
import {
  LEDGER_STATE_VALUES,
  type InstrumentUrlState,
  type LedgerFilterState,
} from '@/lib/instruments/url-state'

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
  claim: ClientClaim
  state: LedgerState
  /** Where the claim sits on the episode clock: its first timestamp. */
  seconds: number
  /**
   * Every clock position the claim carries. A claim recurring later in the interview is in
   * the brush's range whenever *any* of its timestamps is, not only its first.
   */
  stamps: number[]
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

/** A zeroed tally over the seven states — the shape every spectrum reads. */
export function emptyCounts(): Record<LedgerState, number> {
  return Object.fromEntries(LEDGER_STATES.map((state) => [state, 0])) as Record<LedgerState, number>
}

function stateOf(claim: ClientClaim): LedgerState {
  return claim.verdict ?? 'unverified'
}

function toRow(claim: ClientClaim): LedgerRow {
  return {
    claim,
    state: stateOf(claim),
    seconds: toSeconds(claim.timestamps[0] ?? '0:00:00'),
    stamps: claim.timestamps.map(toSeconds),
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

/**
 * The episode strip, as integer half-open bounds. Fractional boundaries plus an inclusive
 * range filter used to leak the claims sitting exactly on a boundary into both neighbours,
 * so each bucket ends one second before the next begins and the last one closes on the span.
 */
function bucketStart(index: number, span: number): number {
  return Math.round((index * span) / BUCKET_COUNT)
}

/**
 * The bucket a clock position falls in, read off the strip's own integer bounds. Recomputing it
 * from `span / BUCKET_COUNT` instead drifts against the rounded starts and lands on the wrong
 * bucket for roughly half of them.
 */
export function bucketIndexAt(buckets: readonly LedgerBucket[], seconds: number): number {
  let index = 0
  while (index + 1 < buckets.length && buckets[index + 1]!.from <= seconds) index += 1
  return index
}

function buildBuckets(rows: readonly LedgerRow[], span: number): LedgerBucket[] {
  const starts = Array.from({ length: BUCKET_COUNT }, (_, index) => bucketStart(index, span))
  const buckets: LedgerBucket[] = starts.map((from, index) => ({
    index,
    from,
    to: index === BUCKET_COUNT - 1 ? span : Math.max(from, starts[index + 1]! - 1),
    counts: emptyCounts(),
    total: 0,
  }))

  // Placed against the same integer boundaries the brush reads back, so a claim is never
  // counted in a bucket whose own window would then filter it out.
  for (const row of rows) {
    let index = 0
    while (index + 1 < BUCKET_COUNT && starts[index + 1]! <= row.seconds) index += 1
    const bucket = buckets[index]!
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
export function buildLedgerModel(ledger: ClientLedger): LedgerModel {
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

/**
 * The label a verdict wears in the UI. `unverified` reads as itself: the chip, the URL token
 * and the method note all name the same thing, so a shared link and its filter agree.
 */
export function stateLabel(state: LedgerState): string {
  return state
}

export function sectionAnchor(sectionId: string): string {
  return `ledger-section-${sectionId}`
}

/** One definition of "does this row survive the current filters", shared by every instrument. */
export function matchesFilters(row: LedgerRow, filters: InstrumentUrlState): boolean {
  if (filters.verdicts.length > 0 && !filters.verdicts.includes(row.state)) return false
  if (filters.sections.length > 0 && !filters.sections.includes(row.claim.section)) return false
  if (filters.range && !inRange(row, filters.range)) return false
  if (!matchesQuery(row, filters.query)) return false
  return true
}

/**
 * A claim is inside the brush when *any* of its timestamps is. Testing only the first one
 * meant the later-timestamp buttons on a recurring claim scoped the ledger to a window that
 * hid the very row they were printed on.
 */
export function inRange(row: LedgerRow, range: readonly [string, string]): boolean {
  const from = toSeconds(range[0])
  const to = toSeconds(range[1])
  return row.stamps.some((stamp) => stamp >= from && stamp <= to)
}

export function matchesQuery(row: LedgerRow, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return needle === '' || row.haystack.includes(needle)
}
