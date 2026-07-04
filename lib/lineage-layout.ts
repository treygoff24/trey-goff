import type { LineageEdge, Project, ProjectDiscipline, ProjectTier } from '@/lib/projects'

export const REFERENCE_WIDTH = 1200
export const REFERENCE_HEIGHT = 640
export const MIN_NODE_DISTANCE_PX = 28

const X_PAD = 0.06
// How much pure calendar-time position contributes to a node's x. The
// remainder comes from chronological rank, which spreads dense periods
// (e.g. a burst of same-year ships) apart instead of overplotting them.
const TIME_WEIGHT = 0.3
const TOP_PAD_PX = 16
const BOTTOM_PAD_PX = 44
const MIN_BAND_HEIGHT_PX = 32
const LANE_STEP_PX = 14
const SHIPPED_AT_RE = /^\d{4}-(0[1-9]|1[0-2])$/
const LINEAGE_DISCIPLINES = [
  'agent-cli',
  'agent-infra',
  'mcp',
  'app',
  'policy',
  'site',
  'creative',
  'research',
  'legal',
] as const satisfies readonly ProjectDiscipline[]

type Point = { x: number; y: number }

export type LineageLayoutNode = Point & {
  id: string
  r: number
}

export type LineageLayoutEdge = {
  from: string
  to: string
  kind: LineageEdge['kind']
  points: [Point, Point, Point]
}

export type LineageTick = {
  year: number
  x: number
}

export type LineageLayout = {
  nodes: LineageLayoutNode[]
  edges: LineageLayoutEdge[]
  thread: Point[]
  ticks: LineageTick[]
}

type Viewport = {
  width: number
  height: number
}

type PlannedNode = {
  project: Project
  x: number
  lane: number
}

const RADIUS_BY_TIER: Record<ProjectTier, number> = {
  flagship: 5,
  solid: 3.5,
  minor: 2.5,
}

function dateValue(shippedAt: string): number {
  const value = Date.parse(
    SHIPPED_AT_RE.test(shippedAt) ? `${shippedAt}-01T00:00:00.000Z` : shippedAt,
  )
  return Number.isFinite(value) ? value : 0
}

function finiteDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function byChronology(a: Project, b: Project): number {
  return dateValue(a.shippedAt) - dateValue(b.shippedAt) || a.id.localeCompare(b.id)
}

function laneCandidate(index: number): number {
  if (index === 0) return 0
  const step = Math.ceil(index / 2)
  return index % 2 === 0 ? step : -step
}

function laneIsClear(
  lane: number,
  x: number,
  assigned: readonly Pick<PlannedNode, 'x' | 'lane'>[],
  width: number,
  height: number,
): boolean {
  for (const node of assigned) {
    const distance = Math.hypot(
      (x - node.x) * width,
      (lane - node.lane) * LANE_STEP_PX * (height / REFERENCE_HEIGHT),
    )
    if (distance < MIN_NODE_DISTANCE_PX) return false
  }
  return true
}

function assignLane(
  x: number,
  assigned: readonly Pick<PlannedNode, 'x' | 'lane'>[],
  width: number,
  height: number,
): number {
  for (let index = 0; index < 200; index += 1) {
    const candidate = laneCandidate(index)
    if (laneIsClear(candidate, x, assigned, width, height)) return candidate
  }
  return assigned.length * 2
}

function edgeBend(from: Point, to: Point, index: number): Point {
  const dx = (to.x - from.x) * REFERENCE_WIDTH
  const dy = (to.y - from.y) * REFERENCE_HEIGHT
  const distance = Math.hypot(dx, dy)
  const offset = Math.min(20, Math.max(8, distance * 0.08))
  const sign = index % 2 === 0 ? 1 : -1

  if (distance === 0) {
    return { x: from.x, y: from.y - offset / REFERENCE_HEIGHT }
  }

  return {
    x: (from.x + to.x) / 2 + ((-dy / distance) * offset * sign) / REFERENCE_WIDTH,
    y: (from.y + to.y) / 2 + ((dx / distance) * offset * sign) / REFERENCE_HEIGHT,
  }
}

export function layoutLineage(
  inputProjects: readonly Project[],
  inputEdges: readonly LineageEdge[],
  viewport: Viewport,
): LineageLayout {
  const width = finiteDimension(viewport.width, REFERENCE_WIDTH)
  const height = finiteDimension(viewport.height, REFERENCE_HEIGHT)
  const radiusScale = Math.max(1, Math.min(width, height))
  const projects = [...inputProjects].filter((project) => !project.sealed).sort(byChronology)
  if (projects.length === 0) return { nodes: [], edges: [], thread: [], ticks: [] }

  const times = projects.map((project) => dateValue(project.shippedAt))
  const first = Math.min(...times)
  const last = Math.max(...times)
  const timeSpan = last - first
  const uniqueTimes = [...new Set(times)].sort((a, b) => a - b)
  const rankXByTime = new Map<number, number>()
  uniqueTimes.forEach((time, index) => {
    rankXByTime.set(
      time,
      uniqueTimes.length === 1 ? 0.5 : X_PAD + (index / (uniqueTimes.length - 1)) * (1 - X_PAD * 2),
    )
  })

  const rankX = (value: number): number => {
    const firstTime = uniqueTimes[0]!
    const lastTime = uniqueTimes[uniqueTimes.length - 1]!
    if (value <= firstTime) return rankXByTime.get(firstTime)!
    if (value >= lastTime) return rankXByTime.get(lastTime)!
    for (let index = 0; index < uniqueTimes.length - 1; index += 1) {
      const a = uniqueTimes[index]!
      const b = uniqueTimes[index + 1]!
      if (value < a || value > b) continue
      const t = b === a ? 0 : (value - a) / (b - a)
      return rankXByTime.get(a)! + t * (rankXByTime.get(b)! - rankXByTime.get(a)!)
    }
    return 0.5
  }

  const xForTime = (value: number): number => {
    if (timeSpan === 0) return 0.5
    const linear = X_PAD + ((value - first) / timeSpan) * (1 - X_PAD * 2)
    return TIME_WEIGHT * linear + (1 - TIME_WEIGHT) * rankX(value)
  }

  const xById = new Map<string, number>()
  projects.forEach((project) => {
    xById.set(project.id, xForTime(dateValue(project.shippedAt)))
  })

  const ticks: LineageTick[] = []
  if (timeSpan > 0) {
    const firstYear = new Date(first).getUTCFullYear()
    const lastYear = new Date(last).getUTCFullYear()
    for (let year = firstYear; year <= lastYear; year += 1) {
      const value = Date.parse(`${year}-01-01T00:00:00.000Z`)
      if (!Number.isFinite(value) || value < first || value > last) continue
      ticks.push({ year, x: xForTime(value) })
    }
  }

  const plannedByDiscipline = LINEAGE_DISCIPLINES.map((discipline) => {
    const bandProjects = projects.filter((project) => project.discipline === discipline)
    if (bandProjects.length === 0) return null

    const planned: PlannedNode[] = []
    for (const project of [...bandProjects].sort(
      (a, b) => (xById.get(a.id) ?? 0) - (xById.get(b.id) ?? 0) || a.id.localeCompare(b.id),
    )) {
      const x = xById.get(project.id) ?? 0.5
      planned.push({ project, x, lane: assignLane(x, planned, width, height) })
    }

    const offsets = planned.map((node) => node.lane * LANE_STEP_PX)
    const span = Math.max(...offsets) - Math.min(...offsets)
    return {
      discipline,
      heightPx: Math.max(MIN_BAND_HEIGHT_PX, span + 16),
      planned,
    }
  }).filter(
    (
      band,
    ): band is {
      discipline: ProjectDiscipline
      heightPx: number
      planned: PlannedNode[]
    } => band !== null,
  )

  const availableHeight = REFERENCE_HEIGHT - TOP_PAD_PX - BOTTOM_PAD_PX
  const desiredHeight = plannedByDiscipline.reduce((sum, band) => sum + band.heightPx, 0)
  const totalNodes = plannedByDiscipline.reduce((sum, band) => sum + band.planned.length, 0)
  const extraHeight = Math.max(0, availableHeight - desiredHeight)
  let cursor = TOP_PAD_PX
  const yById = new Map<string, number>()

  for (const band of plannedByDiscipline) {
    const heightPx = band.heightPx + extraHeight * (band.planned.length / totalNodes)
    const centerPx = cursor + heightPx / 2
    for (const node of band.planned) {
      yById.set(node.project.id, (centerPx + node.lane * LANE_STEP_PX) / REFERENCE_HEIGHT)
    }
    cursor += heightPx
  }

  const nodes = projects.map((project) => ({
    id: project.id,
    x: xById.get(project.id) ?? 0.5,
    y: yById.get(project.id) ?? 0.5,
    r: RADIUS_BY_TIER[project.tier] / radiusScale,
  }))
  const nodesById = new Map(nodes.map((node) => [node.id, node]))

  const edges = inputEdges.flatMap((edge, index): LineageLayoutEdge[] => {
    const ancestor = nodesById.get(edge.to)
    const descendant = nodesById.get(edge.from)
    if (!ancestor || !descendant) return []
    const control = edgeBend(ancestor, descendant, index)
    return [
      {
        from: ancestor.id,
        to: descendant.id,
        kind: edge.kind,
        points: [{ x: ancestor.x, y: ancestor.y }, control, { x: descendant.x, y: descendant.y }],
      },
    ]
  })

  return {
    nodes,
    edges,
    thread: nodes.map((node) => ({ x: node.x, y: node.y })),
    ticks,
  }
}
