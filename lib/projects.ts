import { z } from 'zod'
import spineData from '@/content/projects/projects.json'
import { allProjects as allDeepDiveProjects } from 'content-collections'

export const PROJECT_DISCIPLINES = [
  'agent-cli',
  'agent-infra',
  'mcp',
  'app',
  'policy',
  'site',
  'creative',
  'research',
  'legal',
] as const

export const DISCIPLINE_LABELS: Record<ProjectDiscipline, string> = {
  'agent-cli': 'Agent CLIs',
  'agent-infra': 'Agent infrastructure',
  mcp: 'MCP servers',
  app: 'Applications',
  policy: 'Policy & campaigns',
  site: 'Sites',
  creative: 'Creative',
  research: 'Research',
  legal: 'Legal',
}

const PROJECT_TIERS = ['flagship', 'solid', 'minor'] as const
const PROJECT_STATUSES = ['active', 'shipped', 'archived', 'experimental', 'ongoing'] as const
const RESERVED_LENS_IDS = new Set(['bench', 'lineage', 'ledger', 'receipts'])
const SHIPPED_AT_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const LinkSchema = z
  .object({
    github: z.string().url().optional(),
    site: z.string().url().optional(),
    install: z.string().min(1).optional(),
  })
  .strict()

const ReceiptSchema = z
  .object({
    label: z.string().min(1),
    value: z.string().min(1),
  })
  .strict()

const LineageSchema = z
  .object({
    descends: z.array(z.string().min(1)).optional(),
    builtWith: z.array(z.string().min(1)).optional(),
  })
  .strict()

export const ProjectSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).nullable(),
    oneLiner: z.string().min(1).nullable(),
    discipline: z.enum(PROJECT_DISCIPLINES),
    tier: z.enum(PROJECT_TIERS),
    status: z.enum(PROJECT_STATUSES),
    year: z.number().int(),
    shippedAt: z.string().min(1),
    dateApprox: z.boolean().optional(),
    sealed: z.boolean().optional(),
    sealedNote: z.string().min(1).optional(),
    links: LinkSchema.optional(),
    receipts: z.array(ReceiptSchema).optional(),
    lineage: LineageSchema.optional(),
    tags: z.array(z.string().min(1)).optional(),
    note: z.string().min(1).optional(),
    annotation: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((project, ctx) => {
    if (!project.dateApprox && !SHIPPED_AT_RE.test(project.shippedAt)) {
      ctx.addIssue({
        code: 'custom',
        path: ['shippedAt'],
        message: 'shippedAt must be YYYY-MM unless dateApprox is true',
      })
    }

    if (project.dateApprox && Number.isNaN(projectDateValue(project.shippedAt))) {
      ctx.addIssue({
        code: 'custom',
        path: ['shippedAt'],
        message: 'dateApprox shippedAt must still be parseable',
      })
    }

    if (!project.sealed) {
      if (project.name === null) {
        ctx.addIssue({ code: 'custom', path: ['name'], message: 'unsealed projects need a name' })
      }
      if (project.oneLiner === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['oneLiner'],
          message: 'unsealed projects need a oneLiner',
        })
      }
      return
    }

    if (project.name !== null) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'sealed projects require name null' })
    }
    if (project.oneLiner !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['oneLiner'],
        message: 'sealed projects require oneLiner null',
      })
    }
    if (!project.sealedNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['sealedNote'],
        message: 'sealed projects require sealedNote',
      })
    }
    for (const key of ['links', 'receipts', 'lineage', 'tags'] as const) {
      if (project[key] !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `sealed projects must not include ${key}`,
        })
      }
    }
  })

export type Project = z.infer<typeof ProjectSchema>
export type ProjectInput = z.input<typeof ProjectSchema>
export type ProjectDiscipline = (typeof PROJECT_DISCIPLINES)[number]
export type ProjectTier = (typeof PROJECT_TIERS)[number]
export type DeepDiveProject = (typeof allDeepDiveProjects)[number]

export type BenchGroup = {
  discipline: ProjectDiscipline
  label: string
  projects: readonly Project[]
}

export type LineageEdge = {
  from: string
  to: string
  kind: 'descends' | 'builtWith'
}

const TIER_ORDER: Record<ProjectTier, number> = {
  flagship: 0,
  solid: 1,
  minor: 2,
}

function projectDateValue(shippedAt: string): number {
  if (SHIPPED_AT_RE.test(shippedAt)) return Date.parse(`${shippedAt}-01T00:00:00.000Z`)
  return Date.parse(shippedAt)
}

function sortByShippedDescThenId(a: Project, b: Project): number {
  return projectDateValue(b.shippedAt) - projectDateValue(a.shippedAt) || a.id.localeCompare(b.id)
}

function lineageIds(project: Project): string[] {
  return [...(project.lineage?.descends ?? []), ...(project.lineage?.builtWith ?? [])]
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== 'object') return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

const deepDiveSlugs = (): readonly string[] => allDeepDiveProjects.map((project) => project.slug)

export function parseProjectsSpine(
  input: unknown,
  // Fixture tests must pass [] explicitly; the default couples to the live MDX collection.
  deepDiveIds: readonly string[] = deepDiveSlugs(),
): readonly Project[] {
  const parsed = z.array(ProjectSchema).safeParse(input)
  if (!parsed.success) {
    const summary = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid project spine: ${summary}`)
  }

  const projects = parsed.data
  const ids = new Set<string>()
  const sealedIds = new Set<string>()

  for (const project of projects) {
    if (RESERVED_LENS_IDS.has(project.id)) {
      throw new Error(`Invalid project spine: reserved lens id "${project.id}"`)
    }
    if (ids.has(project.id)) throw new Error(`Invalid project spine: duplicate id "${project.id}"`)
    ids.add(project.id)
    if (project.sealed) sealedIds.add(project.id)
  }

  for (const slug of deepDiveIds) {
    if (!ids.has(slug)) {
      throw new Error(`Invalid project spine: MDX deep dive "${slug}" has no spine entry`)
    }
  }

  for (const project of projects) {
    for (const target of lineageIds(project)) {
      if (!ids.has(target)) {
        throw new Error(
          `Invalid project spine: dangling lineage id "${target}" referenced by "${project.id}"`,
        )
      }
      if (sealedIds.has(target)) {
        throw new Error(
          `Invalid project spine: lineage edge references sealed id "${target}" from "${project.id}"`,
        )
      }
    }
  }

  return deepFreeze(projects.map((project) => ({ ...project })))
}

const PROJECTS = parseProjectsSpine(spineData)

export function getAllProjects(): readonly Project[] {
  return PROJECTS
}

export function getProject(id: string, projects: readonly Project[] = PROJECTS): Project | null {
  return projects.find((project) => project.id === id) ?? null
}

export function getFlagships(projects: readonly Project[] = PROJECTS): readonly Project[] {
  return [...projects]
    .filter((project) => project.tier === 'flagship' && !project.sealed)
    .sort(
      (a, b) =>
        projectDateValue(b.shippedAt) - projectDateValue(a.shippedAt) || a.id.localeCompare(b.id),
    )
}

export function getLedgerRows(projects: readonly Project[] = PROJECTS): readonly Project[] {
  return [...projects].sort(sortByShippedDescThenId)
}

export function getReceiptProjects(projects: readonly Project[] = PROJECTS): readonly Project[] {
  return [...projects]
    .filter((project) => !project.sealed && (project.receipts?.length ?? 0) > 0)
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || sortByShippedDescThenId(a, b))
}

export function getBenches(projects: readonly Project[] = PROJECTS): readonly BenchGroup[] {
  return PROJECT_DISCIPLINES.map((discipline) => ({
    discipline,
    label: DISCIPLINE_LABELS[discipline],
    projects: [...projects]
      .filter((project) => project.discipline === discipline)
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || sortByShippedDescThenId(a, b)),
  })).filter((bench) => bench.projects.length > 0)
}

export function getLineageEdges(projects: readonly Project[] = PROJECTS): readonly LineageEdge[] {
  return projects.flatMap((project) => [
    ...(project.lineage?.descends ?? []).map((to) => ({
      from: project.id,
      to,
      kind: 'descends' as const,
    })),
    ...(project.lineage?.builtWith ?? []).map((to) => ({
      from: project.id,
      to,
      kind: 'builtWith' as const,
    })),
  ])
}

export function getChronologicalLineageProjects(
  projects: readonly Project[] = PROJECTS,
): readonly Project[] {
  return [...projects]
    .filter((project) => !project.sealed)
    .sort(
      (a, b) =>
        projectDateValue(a.shippedAt) - projectDateValue(b.shippedAt) || a.id.localeCompare(b.id),
    )
}

export function getDeepDive(id: string): DeepDiveProject | null {
  return allDeepDiveProjects.find((project) => project.slug === id) ?? null
}

export function sealedAriaLabel(project: Project): string {
  return `sealed project — ${project.sealedNote ?? 'under seal'}, ${project.year}`
}
