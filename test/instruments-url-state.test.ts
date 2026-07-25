import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_INSTRUMENT_STATE,
  instrumentStateUrl,
  instrumentStatesEqual,
  parseInstrumentState,
  serializeInstrumentState,
  type InstrumentUrlState,
} from '@/lib/instruments/url-state'

function parse(search: string): InstrumentUrlState {
  return parseInstrumentState(new URLSearchParams(search))
}

test('an empty query string parses to the default state', () => {
  assert.deepEqual(parse(''), DEFAULT_INSTRUMENT_STATE)
  assert.equal(serializeInstrumentState(DEFAULT_INSTRUMENT_STATE), '')
})

test('every parameter round-trips', () => {
  const state: InstrumentUrlState = {
    verdicts: ['confirmed', 'debunked'],
    sections: ['A', 'N'],
    claim: 'C145',
    range: ['0:10:00', '1:20:30'],
    query: 'apollo',
    audit: true,
  }

  const search = serializeInstrumentState(state)
  assert.equal(
    search,
    '?v=confirmed%2Cdebunked&s=A%2CN&claim=C145&range=0%3A10%3A00-1%3A20%3A30&q=apollo&audit=1',
  )
  assert.deepEqual(parse(search), state)
  assert.equal(instrumentStatesEqual(parse(search), state), true)
})

test('invalid values are dropped, valid neighbours survive', () => {
  const state = parse('?v=confirmed,nonsense,debunked&s=A,zz,3,N&claim=lowercase&audit=yes')

  assert.deepEqual(state.verdicts, ['confirmed', 'debunked'])
  assert.deepEqual(state.sections, ['A', 'N'])
  assert.equal(state.claim, null)
  assert.equal(state.audit, false)
})

test('a malformed or inverted range is dropped whole', () => {
  assert.equal(parse('?range=nope').range, null)
  assert.equal(parse('?range=0:10:00').range, null)
  assert.equal(parse('?range=0:10:00-0:20:00-0:30:00').range, null)
  assert.equal(parse('?range=1:20:00-0:10:00').range, null)
  assert.deepEqual(parse('?range=0:10:00-0:10:00').range, ['0:10:00', '0:10:00'])
})

test('duplicate list values collapse and an over-long query is dropped', () => {
  assert.deepEqual(parse('?v=confirmed,confirmed,likely').verdicts, ['confirmed', 'likely'])
  assert.equal(parse(`?q=${'x'.repeat(121)}`).query, '')
  assert.equal(parse(`?q=${'x'.repeat(120)}`).query.length, 120)
})

test('unknown parameters survive a serialize round-trip', () => {
  const search = serializeInstrumentState(
    { ...DEFAULT_INSTRUMENT_STATE, verdicts: ['likely'] },
    '?utm_source=newsletter&ref=abc',
  )

  const params = new URLSearchParams(search)
  assert.equal(params.get('utm_source'), 'newsletter')
  assert.equal(params.get('ref'), 'abc')
  assert.equal(params.get('v'), 'likely')
})

test('clearing state deletes its parameters without touching the others', () => {
  const search = serializeInstrumentState(DEFAULT_INSTRUMENT_STATE, '?v=likely&audit=1&ref=abc')
  assert.equal(search, '?ref=abc')
  assert.equal(serializeInstrumentState(DEFAULT_INSTRUMENT_STATE, '?v=likely'), '')
})

test('the state URL preserves path and hash', () => {
  const location = new URL('https://example.com/writing/ufo-claims-ledger?ref=abc#section-c')
  const url = instrumentStateUrl({ ...DEFAULT_INSTRUMENT_STATE, audit: true }, location)

  assert.equal(url, '/writing/ufo-claims-ledger?ref=abc&audit=1#section-c')
})

test('a state URL with nothing to encode keeps the hash and drops the question mark', () => {
  const location = new URL('https://example.com/writing/ufo-claims-ledger?v=likely#claims')
  assert.equal(
    instrumentStateUrl(DEFAULT_INSTRUMENT_STATE, location),
    '/writing/ufo-claims-ledger#claims',
  )
})

test('parsing is total — no input throws', () => {
  const hostile = [
    '?v=',
    '?v=,,,',
    '?s=%%%',
    '?claim=C1450',
    '?range=-',
    '?audit=1&audit=0',
    `?q=${encodeURIComponent('<script>')}`,
  ]
  for (const search of hostile) {
    const state = parse(search)
    assert.deepEqual(parse(serializeInstrumentState(state)), state, `stable for ${search}`)
  }
})
