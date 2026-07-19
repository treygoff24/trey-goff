import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EMPTY_READING_COPY, ReadingShelf } from '@/components/mission-control/ReadingShelf'
import { aggregateFocus } from '@/lib/mission-control/focus'
import { isStale } from '@/lib/mission-control/instrument'
import { aggregateLifts, type LiftsSource } from '@/lib/mission-control/lifts'
import { aggregateOrbit } from '@/lib/mission-control/orbit'
import { getShippingInstrument } from '@/lib/mission-control/shipping'

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200 })
}

function githubFetcher(eventPages: unknown[][], repos: unknown[]): typeof fetch {
  return async (input, init) => {
    assert.ok(init?.signal, 'every GitHub request has a timeout signal')
    const url = String(input)
    if (url.includes('/events/public')) {
      const page = Number(new URL(url).searchParams.get('page'))
      return jsonResponse(eventPages[page - 1] ?? [])
    }
    return jsonResponse(repos)
  }
}

const validRepo = {
  name: 'project',
  full_name: 'collaborator/project',
  html_url: 'https://github.com/collaborator/project',
  description: 'Collaborative work',
  language: 'TypeScript',
  pushed_at: '2026-07-01T00:00:00.000Z',
  fork: false,
  private: false,
}

test('staleness begins only after the declared cadence', () => {
  const asOf = '2026-06-01T00:00:00.000Z'

  assert.equal(isStale(asOf, 30, new Date('2026-07-01T00:00:00.000Z')), false)
  assert.equal(isStale(asOf, 30, new Date('2026-07-02T00:00:00.000Z')), true)
  assert.equal(isStale('not-a-date', 30), true)
})

test('lifts aggregator computes the big-three total from its fixture', () => {
  const fixture: LiftsSource = {
    lastUpdated: '2026-07-01',
    lifts: {
      squat: { weight: 405, unit: 'lb', date: '2026-06-01' },
      bench: { weight: 275, unit: 'lb', date: '2026-06-02' },
      deadlift: { weight: 495, unit: 'lb', date: '2026-06-03' },
    },
    history: {
      squat: [{ weight: 365, unit: 'lb', date: '2025-06-01' }],
    },
  }

  const instrument = aggregateLifts(fixture, new Date('2026-07-19T00:00:00.000Z'))

  assert.equal(instrument.data?.total, 1175)
  assert.deepEqual(
    instrument.data?.lifts[0]?.progression.map((record) => record.weight),
    [365, 405],
  )
})

test('GitHub fetch failure returns an absent instrument instead of throwing', async () => {
  const failingFetch: typeof fetch = async () => {
    throw new Error('network unavailable')
  }

  const instrument = await getShippingInstrument(failingFetch, new Date('2026-07-19T12:00:00.000Z'))

  assert.equal(instrument.data, null)
  assert.equal(instrument.asOf, '2026-07-19T12:00:00.000Z')
  assert.match(instrument.source, /api\.github\.com/)
})

test("Shipping orders repos by Trey's public actions, not global repository pushes", async () => {
  const instrument = await getShippingInstrument(
    githubFetcher(
      [
        [
          { created_at: '2026-07-19T11:00:00.000Z', repo: { name: 'collaborator/project' } },
          { created_at: '2026-07-18T11:00:00.000Z', repo: { name: 'treygoff/active' } },
        ],
        [],
        [],
      ],
      [
        validRepo,
        {
          ...validRepo,
          name: 'active',
          full_name: 'treygoff/active',
          html_url: 'https://github.com/treygoff/active',
        },
        {
          ...validRepo,
          name: 'stale',
          full_name: 'treygoff/stale',
          html_url: 'https://github.com/treygoff/stale',
          pushed_at: '2026-07-19T12:00:00.000Z',
        },
      ],
    ),
    new Date('2026-07-19T12:00:00.000Z'),
  )

  assert.deepEqual(
    instrument.data?.repos.map((repo) => [repo.fullName, repo.touchedAt]),
    [
      ['collaborator/project', '2026-07-19T11:00:00.000Z'],
      ['treygoff/active', '2026-07-18T11:00:00.000Z'],
    ],
  )
  assert.equal(
    instrument.data?.repos.some((repo) => repo.fullName === 'treygoff/stale'),
    false,
  )
})

test('Shipping fails closed when any GitHub record is malformed', async () => {
  const instrument = await getShippingInstrument(
    githubFetcher(
      [[{ created_at: 'not-a-date', repo: { name: 'treygoff/project' } }], [], []],
      [validRepo],
    ),
    new Date('2026-07-19T12:00:00.000Z'),
  )

  assert.equal(instrument.data, null)
})

test('source aggregators return absent instruments for invalid consumed fields', () => {
  const now = new Date('2026-07-19T12:00:00.000Z')

  assert.equal(
    aggregateFocus(
      { mission: 'Mission', location: null, tz: 'not/a-zone', note: 'Note', updated: '2026-07-01' },
      now,
    ).data,
    null,
  )
  assert.equal(
    aggregateLifts(
      {
        lastUpdated: '2026-07-01',
        lifts: {
          squat: { weight: 405, unit: 'lb', date: '2026-06-01' },
          bench: { weight: 275, unit: '', date: '2026-06-02' },
          deadlift: { weight: 495, unit: 'lb', date: '2026-06-03' },
        },
      },
      now,
    ).data,
    null,
  )
  assert.equal(
    aggregateOrbit(
      {
        lastUpdated: '2026-07-01',
        appearances: [
          { title: 'Appearance', show: 'Show', date: '2026-07-10', url: 'javascript:alert(1)' },
        ],
      },
      { lastUpdated: '2026-07-01', transmissions: [] },
      now,
    ).data,
    null,
  )
})

test('Orbit uses the newest listed item as its as-of date', () => {
  const instrument = aggregateOrbit(
    {
      lastUpdated: '2024-12-30',
      appearances: [
        {
          title: 'Appearance',
          show: 'Show',
          date: '2025-11-28',
          url: 'https://example.com/appearance',
        },
      ],
    },
    { lastUpdated: '2024-12-30', transmissions: [] },
    new Date('2025-12-01T00:00:00.000Z'),
  )

  assert.equal(instrument.asOf, '2025-11-28')
  assert.match(instrument.source, /content\/transmissions\/publications\.json/)
})

test('empty reading shelf renders its designed, non-fabricated copy', () => {
  const html = renderToStaticMarkup(
    createElement(ReadingShelf, { currentlyReading: [], topRated: [] }),
  )

  assert.match(html, /data-reading-empty/)
  assert.match(html, new RegExp(EMPTY_READING_COPY.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})
