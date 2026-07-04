import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  getAllProjects,
  getLedgerRows,
  getProject,
  parseProjectsSpine,
  sealedAriaLabel,
  type ProjectInput,
} from '@/lib/projects'

const baseProjects: ProjectInput[] = [
  {
    id: 'alpha',
    name: 'Alpha',
    oneLiner: 'First project.',
    discipline: 'agent-cli',
    tier: 'flagship',
    status: 'shipped',
    year: 2026,
    shippedAt: '2026-02',
    note: 'Has a note.',
  },
  {
    id: 'beta',
    name: 'Beta',
    oneLiner: 'Second project.',
    discipline: 'site',
    tier: 'solid',
    status: 'active',
    year: 2025,
    shippedAt: '2025-12',
    lineage: { descends: ['alpha'] },
  },
]

function withFixture(extra: ProjectInput[] = []) {
  return [...baseProjects, ...extra]
}

describe('projects spine validation', () => {
  test('valid live spine loads and is non-empty', () => {
    const projects = getAllProjects()

    assert.ok(projects.length >= 40)

    const ids = projects.map((project) => project.id)
    assert.equal(ids.length, new Set(ids).size, 'all project ids must be unique')

    assert.ok(getProject('the-control-room'), 'the-control-room spine entry must exist')
  })

  test('duplicate id throws', () => {
    assert.throws(
      () => parseProjectsSpine([...baseProjects, { ...baseProjects[0]! }], []),
      /duplicate/i,
    )
  })

  test('dangling lineage throws', () => {
    assert.throws(
      () => parseProjectsSpine([{ ...baseProjects[0]!, lineage: { builtWith: ['missing'] } }], []),
      /dangling/i,
    )
  })

  test('edge-to-sealed throws', () => {
    assert.throws(
      () =>
        parseProjectsSpine(
          withFixture([
            {
              id: 'sealed-alpha',
              name: null,
              oneLiner: null,
              discipline: 'legal',
              tier: 'minor',
              status: 'archived',
              year: 2024,
              shippedAt: '2024-01',
              sealed: true,
              sealedNote: 'Client-confidential work.',
            },
            {
              id: 'gamma',
              name: 'Gamma',
              oneLiner: 'References sealed.',
              discipline: 'app',
              tier: 'solid',
              status: 'shipped',
              year: 2024,
              shippedAt: '2024-02',
              lineage: { descends: ['sealed-alpha'] },
            },
          ]),
          [],
        ),
      /sealed/i,
    )
  })

  test('sealed with links throws', () => {
    assert.throws(
      () =>
        parseProjectsSpine(
          [
            {
              id: 'sealed-alpha',
              name: null,
              oneLiner: null,
              discipline: 'legal',
              tier: 'minor',
              status: 'archived',
              year: 2024,
              shippedAt: '2024-01',
              sealed: true,
              sealedNote: 'Client-confidential work.',
              links: { site: 'https://example.com' },
            },
          ],
          [],
        ),
      /sealed/i,
    )
  })

  test('sealed without sealedNote throws', () => {
    assert.throws(
      () =>
        parseProjectsSpine(
          [
            {
              id: 'sealed-alpha',
              name: null,
              oneLiner: null,
              discipline: 'legal',
              tier: 'minor',
              status: 'archived',
              year: 2024,
              shippedAt: '2024-01',
              sealed: true,
            },
          ],
          [],
        ),
      /sealedNote/i,
    )
  })

  test('id equal to lens name throws', () => {
    assert.throws(
      () => parseProjectsSpine([{ ...baseProjects[0]!, id: 'ledger' }], []),
      /reserved lens/i,
    )
  })

  test('getLedgerRows sorted desc with id tie-break', () => {
    const rows = parseProjectsSpine(
      withFixture([
        {
          id: 'aardvark',
          name: 'Aardvark',
          oneLiner: 'Tie breaker first.',
          discipline: 'mcp',
          tier: 'minor',
          status: 'experimental',
          year: 2026,
          shippedAt: '2026-02',
        },
      ]),
      [],
    )

    assert.deepEqual(
      getLedgerRows(rows).map((project) => project.id),
      ['aardvark', 'alpha', 'beta'],
    )
  })

  test('shippedAt with invalid month and no dateApprox throws', () => {
    assert.throws(
      () => parseProjectsSpine([{ ...baseProjects[0]!, shippedAt: '2026-13' }], []),
      /shippedAt/i,
    )
  })

  test('shippedAt with slash separator throws', () => {
    assert.throws(
      () => parseProjectsSpine([{ ...baseProjects[0]!, shippedAt: '2026/02' }], []),
      /shippedAt/i,
    )
  })

  test('shippedAt with dateApprox parses a YYYY-MM value', () => {
    const rows = parseProjectsSpine(
      [{ ...baseProjects[0]!, shippedAt: '2026-03', dateApprox: true }],
      [],
    )
    assert.equal(rows[0]?.id, 'alpha')
    assert.equal(rows[0]?.dateApprox, true)
  })

  test('shippedAt unparseable even with dateApprox throws', () => {
    assert.throws(
      () =>
        parseProjectsSpine(
          [{ ...baseProjects[0]!, shippedAt: 'not-a-date', dateApprox: true }],
          [],
        ),
      /shippedAt/i,
    )
  })

  test('MDX deep-dive slug with no matching spine id throws', () => {
    assert.throws(
      () => parseProjectsSpine(withFixture(), ['missing-slug']),
      /MDX deep dive "missing-slug" has no spine entry/i,
    )
  })

  test('sealedAriaLabel produces the exact string format', () => {
    const sealed = parseProjectsSpine(
      [
        {
          id: 'sealed-alpha',
          name: null,
          oneLiner: null,
          discipline: 'legal',
          tier: 'minor',
          status: 'archived',
          year: 2024,
          shippedAt: '2024-01',
          sealed: true,
          sealedNote: 'legal · under seal',
        },
      ],
      [],
    )[0]!
    assert.equal(sealedAriaLabel(sealed), 'sealed project — legal · under seal, 2024')
  })
})
