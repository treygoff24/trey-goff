import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  layoutLineage,
  MIN_NODE_DISTANCE_PX,
  REFERENCE_HEIGHT,
  REFERENCE_WIDTH,
} from '@/lib/lineage-layout'
import {
  getAllProjects,
  getChronologicalLineageProjects,
  getLineageEdges,
  type Project,
} from '@/lib/projects'

const VIEWPORT = { width: REFERENCE_WIDTH, height: REFERENCE_HEIGHT }

function projectFixture(overrides: Partial<Project> & Pick<Project, 'id'>): Project {
  return {
    name: overrides.name ?? overrides.id,
    oneLiner: overrides.oneLiner ?? 'fixture project',
    discipline: overrides.discipline ?? 'app',
    tier: overrides.tier ?? 'solid',
    status: overrides.status ?? 'shipped',
    year: overrides.year ?? 2024,
    shippedAt: overrides.shippedAt ?? '2024-06',
    ...overrides,
  } as Project
}

function liveLineage() {
  const projects = getChronologicalLineageProjects()
  return {
    projects,
    edges: getLineageEdges(projects),
    layout: layoutLineage(projects, getLineageEdges(projects), VIEWPORT),
  }
}

function assertFiniteNumbers(value: unknown, path = 'layout') {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${path} must be finite`)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertFiniteNumbers(child, `${path}[${index}]`))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assert.notEqual(child, undefined, `${path}.${key} must not be undefined`)
      assertFiniteNumbers(child, `${path}.${key}`)
    }
  }
}

describe('lineage layout', () => {
  test('is deterministic for the live spine', () => {
    const projects = getChronologicalLineageProjects()
    const edges = getLineageEdges(projects)

    assert.deepEqual(
      layoutLineage(projects, edges, VIEWPORT),
      layoutLineage(projects, edges, VIEWPORT),
    )
  })

  test('emits no NaN or undefined coordinates for the live spine', () => {
    assertFiniteNumbers(liveLineage().layout)
  })

  test('keeps same-band nodes at least the minimum normalized distance apart', () => {
    const { projects, layout } = liveLineage()
    const byId = new Map(projects.map((project) => [project.id, project]))

    for (let left = 0; left < layout.nodes.length; left += 1) {
      for (let right = left + 1; right < layout.nodes.length; right += 1) {
        const a = layout.nodes[left]!
        const b = layout.nodes[right]!
        const projectA = byId.get(a.id)
        const projectB = byId.get(b.id)
        assert.ok(projectA && projectB, 'layout nodes must map back to projects')
        if (projectA.discipline !== projectB.discipline) continue

        const distance = Math.hypot((a.x - b.x) * VIEWPORT.width, (a.y - b.y) * VIEWPORT.height)
        assert.ok(
          distance + 0.001 >= MIN_NODE_DISTANCE_PX,
          `${a.id} and ${b.id} are too close in ${projectA.discipline}`,
        )
      }
    }
  })

  test('thread visits every unsealed node exactly once in chronological order', () => {
    const { projects, layout } = liveLineage()
    const nodesById = new Map(layout.nodes.map((node) => [node.id, node]))

    assert.deepEqual(
      layout.thread,
      projects.map((project) => {
        const node = nodesById.get(project.id)
        assert.ok(node, `${project.id} is missing from nodes`)
        return { x: node.x, y: node.y }
      }),
    )
  })

  test('sealed projects are absent from nodes', () => {
    const sealedIds = new Set(
      getAllProjects()
        .filter((project): project is Project & { sealed: true } => project.sealed === true)
        .map((project) => project.id),
    )

    for (const node of liveLineage().layout.nodes) {
      assert.ok(!sealedIds.has(node.id), `${node.id} should not be in the lineage graph`)
    }
  })

  test('node and edge counts match the live unsealed lineage spine', () => {
    const { projects, edges, layout } = liveLineage()

    assert.equal(layout.nodes.length, projects.length)
    assert.equal(layout.edges.length, edges.length)
  })

  test('single node has finite coords centered at x=0.5', () => {
    const project = projectFixture({ id: 'solo' })
    const layout = layoutLineage([project], [], { width: 800, height: 600 })

    assert.equal(layout.nodes.length, 1)
    assert.equal(layout.edges.length, 0)
    assert.equal(layout.thread.length, 1)
    assertFiniteNumbers(layout)
    assert.equal(layout.nodes[0]!.x, 0.5)
  })

  test('all-same shippedAt places every node at x=0.5 with no NaN', () => {
    const projects = [
      projectFixture({ id: 'a', discipline: 'app' }),
      projectFixture({ id: 'b', discipline: 'site' }),
      projectFixture({ id: 'c', discipline: 'policy' }),
    ]
    const layout = layoutLineage(projects, [], VIEWPORT)

    assertFiniteNumbers(layout)
    for (const node of layout.nodes) {
      assert.equal(node.x, 0.5)
    }
  })

  test('zero edges still produces a complete thread', () => {
    const projects = [
      projectFixture({ id: 'a', shippedAt: '2023-01' }),
      projectFixture({ id: 'b', shippedAt: '2024-01' }),
      projectFixture({ id: 'c', shippedAt: '2025-01' }),
    ]
    const layout = layoutLineage(projects, [], VIEWPORT)

    assert.equal(layout.edges.length, 0)
    assert.equal(layout.thread.length, projects.length)
    assertFiniteNumbers(layout)
  })

  test('single discipline band fills height with finite coords', () => {
    const projects = [
      projectFixture({ id: 'a', discipline: 'app', shippedAt: '2022-01' }),
      projectFixture({ id: 'b', discipline: 'app', shippedAt: '2023-01' }),
      projectFixture({ id: 'c', discipline: 'app', shippedAt: '2024-01' }),
    ]
    const layout = layoutLineage(projects, [], VIEWPORT)

    assertFiniteNumbers(layout)
    assert.equal(layout.nodes.length, projects.length)
  })

  test('narrow viewport 390x520 keeps same-band nodes at least the minimum on-screen distance apart', () => {
    const projects = [
      projectFixture({ id: 'a', discipline: 'app', shippedAt: '2024-01' }),
      projectFixture({ id: 'b', discipline: 'app', shippedAt: '2024-02' }),
      projectFixture({ id: 'c', discipline: 'app', shippedAt: '2024-03' }),
      projectFixture({ id: 'd', discipline: 'app', shippedAt: '2024-04' }),
    ]
    const layout = layoutLineage(projects, [], { width: 390, height: 520 })

    assertFiniteNumbers(layout)
    for (let left = 0; left < layout.nodes.length; left += 1) {
      for (let right = left + 1; right < layout.nodes.length; right += 1) {
        const a = layout.nodes[left]!
        const b = layout.nodes[right]!
        const distance = Math.hypot((a.x - b.x) * 390, (a.y - b.y) * 520)
        assert.ok(
          distance + 0.001 >= MIN_NODE_DISTANCE_PX,
          `${a.id} and ${b.id} are too close at narrow viewport`,
        )
      }
    }
  })
})
