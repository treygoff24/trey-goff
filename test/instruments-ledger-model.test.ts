import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  BUCKET_COUNT,
  bucketIndexAt,
  buildLedgerModel,
  inRange,
  matchesFilters,
  toSeconds,
} from '../components/instruments/ledger-model'
import { DEFAULT_INSTRUMENT_STATE } from '../lib/instruments/url-state'
import { markdownToHast } from '../lib/instruments/render'
import { getClaimsLedger } from '../lib/instruments/manifest'

const SLUG = 'ufo-claims-ledger'
const ledger = getClaimsLedger(SLUG)
assert.ok(ledger, `${SLUG} ships no claims ledger`)
const model = buildLedgerModel(ledger)

test('the episode strip is an integer partition — no claim can fall in two buckets', () => {
  for (const bucket of model.buckets) {
    assert.equal(
      bucket.from,
      Math.trunc(bucket.from),
      `bucket ${bucket.index} has a fractional start`,
    )
    assert.equal(bucket.to, Math.trunc(bucket.to), `bucket ${bucket.index} has a fractional end`)
    assert.ok(bucket.to >= bucket.from, `bucket ${bucket.index} ends before it begins`)
  }

  for (let index = 0; index < BUCKET_COUNT - 1; index += 1) {
    assert.equal(
      model.buckets[index + 1]!.from,
      model.buckets[index]!.to + 1,
      `buckets ${index} and ${index + 1} overlap or leave a gap`,
    )
  }

  assert.equal(model.buckets[0]!.from, 0)
  assert.equal(model.buckets[BUCKET_COUNT - 1]!.to, model.span)
  assert.equal(
    model.buckets.reduce((total, bucket) => total + bucket.total, 0),
    model.rows.length,
    'the buckets do not account for every claim exactly once',
  )
})

test('the brush reads back the bucket it was set from, for every bucket on the real span', () => {
  for (const bucket of model.buckets) {
    // What TimeSpine does when a bucket is brushed: set the range to the bucket's own bounds,
    // then resolve both ends back to indices. Deriving those from a float `span / BUCKET_COUNT`
    // step disagreed with the rounded starts on roughly half of them.
    assert.equal(
      bucketIndexAt(model.buckets, toSeconds(secondsToClock(bucket.from))),
      bucket.index,
      `bucket ${bucket.index} starts at ${bucket.from}s but reads back as another bucket`,
    )
    assert.equal(
      bucketIndexAt(model.buckets, toSeconds(secondsToClock(bucket.to))),
      bucket.index,
      `bucket ${bucket.index} ends at ${bucket.to}s but reads back as another bucket`,
    )
  }
})

test('a brush over one bucket claims only the rows that bucket counted', () => {
  for (const bucket of model.buckets) {
    const brushed = model.rows.filter((row) =>
      inRange(row, [secondsToClock(bucket.from), secondsToClock(bucket.to)]),
    )
    // Every row the bucket tallied has to survive its own brush. (Rows with a later timestamp
    // inside the window legitimately join it, so this is a floor, not an equality.)
    assert.ok(
      brushed.length >= bucket.total,
      `bucket ${bucket.index} counted ${bucket.total} claims but brushes only ${brushed.length}`,
    )
  }
})

test('the range filter reads every timestamp a claim carries, not just the first', () => {
  const recurring = model.rows.find((row) => row.stamps.length > 1)
  assert.ok(recurring, 'the ledger has no multi-timestamp claim to test with')

  const later = recurring.stamps[recurring.stamps.length - 1]!
  assert.notEqual(later, recurring.seconds, 'expected the last timestamp to differ from the first')

  // The window a timestamp button opens: ±450s around the stamp the reader clicked.
  const filters = {
    ...DEFAULT_INSTRUMENT_STATE,
    range: [secondsToClock(Math.max(0, later - 450)), secondsToClock(later + 450)] as [
      string,
      string,
    ],
  }
  assert.ok(
    matchesFilters(recurring, filters),
    `${recurring.claim.id} is hidden by the window its own timestamp opened`,
  )
})

test('an instrument tag authored inline is lifted out of its paragraph', async () => {
  const tree = await markdownToHast('Before.\n\n<instrument-spine></instrument-spine>\n\nAfter.\n')
  const tags = tree.children
    .filter((node) => node.type === 'element')
    .map((node) => (node as { tagName: string }).tagName)

  assert.ok(
    tags.includes('instrument-spine'),
    `the spine did not reach the top level: ${tags.join(', ')}`,
  )
  for (const node of tree.children) {
    if (node.type !== 'element' || node.tagName !== 'p') continue
    const nested = JSON.stringify(node).includes('instrument-spine')
    assert.ok(!nested, 'an instrument is still nested inside a paragraph')
  }
})

function secondsToClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds))
  const minutes = String(Math.floor((whole % 3600) / 60)).padStart(2, '0')
  return `${Math.floor(whole / 3600)}:${minutes}:${String(whole % 60).padStart(2, '0')}`
}

test('the clock helper round-trips through the parser the filters use', () => {
  for (const seconds of [0, 7, 59, 60, 3599, 3600, model.span]) {
    assert.equal(toSeconds(secondsToClock(seconds)), Math.round(seconds))
  }
})
