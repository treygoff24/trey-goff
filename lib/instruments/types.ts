import { z } from 'zod'

export const verdictSchema = z.enum([
  'confirmed',
  'likely',
  'contested',
  'unsupported',
  'debunked',
  'unfalsifiable',
])

export const claimStatusSchema = z.enum(['worked', 'unverified'])

/** A = "person X said Y", B = "document/event Z exists", C = direct assertion about the world. */
export const claimTypeSchema = z.enum(['A', 'B', 'C', 'A/B'])

const claimIdSchema = z.string().regex(/^C\d{3}$/)
/** `h:mm:ss` with real minute and second components — `9:99:99` is not a timestamp. */
export const TIMESTAMP_PATTERN = /^\d+:[0-5]\d:[0-5]\d$/
const timestampSchema = z.string().regex(TIMESTAMP_PATTERN)

/** Links reach the reader as `href`; `javascript:` and `data:` never do. */
const httpUrlSchema = z.url({ protocol: /^https?$/ })

export const claimSectionSchema = z.object({
  id: z.string().regex(/^[A-Z]$/),
  title: z.string().min(1),
})

export const claimSchema = z.object({
  id: claimIdSchema,
  section: z.string().regex(/^[A-Z]$/),
  title: z.string().min(1),
  claim: z.string().min(1),
  speakers: z.array(z.string().min(1)).min(1),
  timestamps: z.array(timestampSchema).min(1),
  type: claimTypeSchema,
  status: claimStatusSchema,
  /**
   * The primary verdict. Compound verdicts ("confirmed (Type A) / debunked (Type C)") and
   * qualified ones ("contested - audit flagged") keep their full text in `verdictLabel`;
   * `verdict` is the leading token, which is what the ledger filters and chips key on.
   */
  verdict: verdictSchema.nullable(),
  verdictLabel: z.string().min(1).nullable(),
  rationale: z.string().min(1).nullable(),
  /** Path of the research finding in the source corpus, e.g. `findings/tehran.md`. */
  finding: z.string().min(1).nullable(),
  /** Slug of a dossier shipped alongside this ledger, when one covers the claim's finding. */
  dossier: z.string().min(1).nullable(),
})

/**
 * The subset of a ledger the browser is given. `status` is redundant with `verdict` once the
 * model is built, and the source record, canonical-id bookkeeping and provenance block are
 * build-time concerns — none of them has a client reader, so none of them crosses the wire.
 */
export type ClientClaim = Omit<z.infer<typeof claimSchema>, 'status'>

export interface ClientLedger {
  sections: z.infer<typeof claimSectionSchema>[]
  claims: ClientClaim[]
}

export const claimsLedgerSchema = z
  .object({
    source: z.object({
      title: z.string().min(1),
      episode: z.string().min(1),
      url: httpUrlSchema,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    canonicalIds: z.object({
      first: claimIdSchema,
      last: claimIdSchema,
      total: z.number().int().positive(),
      unassigned: z.array(claimIdSchema),
    }),
    sections: z.array(claimSectionSchema).min(1),
    claims: z.array(claimSchema).min(1),
  })
  .superRefine((ledger, ctx) => {
    const fail = (message: string, path: (string | number)[]) => {
      ctx.addIssue({ code: 'custom', message, path })
    }

    const { first, last, total, unassigned } = ledger.canonicalIds
    const firstNumber = Number(first.slice(1))
    const lastNumber = Number(last.slice(1))
    if (lastNumber - firstNumber + 1 !== total) {
      fail(`canonical range ${first}–${last} does not span ${total} ids`, ['canonicalIds', 'total'])
    }

    const unassignedIds = new Set(unassigned)
    if (unassignedIds.size !== unassigned.length) {
      fail('unassigned ids contain duplicates', ['canonicalIds', 'unassigned'])
    }
    for (const id of unassignedIds) {
      const number = Number(id.slice(1))
      if (number < firstNumber || number > lastNumber) {
        fail(`unassigned id ${id} falls outside ${first}–${last}`, ['canonicalIds', 'unassigned'])
      }
    }
    if (ledger.claims.length !== total - unassignedIds.size) {
      fail(
        `${ledger.claims.length} claims for ${total} canonical ids with ${unassignedIds.size} unassigned`,
        ['claims'],
      )
    }

    const sectionIds = new Set(ledger.sections.map((section) => section.id))
    const seen = new Set<string>()
    for (const [index, claim] of ledger.claims.entries()) {
      if (seen.has(claim.id)) fail(`duplicate claim id ${claim.id}`, ['claims', index, 'id'])
      seen.add(claim.id)

      const number = Number(claim.id.slice(1))
      if (number < firstNumber || number > lastNumber) {
        fail(`${claim.id} falls outside ${first}–${last}`, ['claims', index, 'id'])
      }
      if (unassignedIds.has(claim.id)) {
        fail(`${claim.id} is recorded as unassigned but carries a claim`, ['claims', index, 'id'])
      }
      if (!sectionIds.has(claim.section)) {
        fail(`${claim.id} references unknown section ${claim.section}`, [
          'claims',
          index,
          'section',
        ])
      }

      const worked = claim.status === 'worked'
      if (worked !== (claim.verdict !== null)) {
        fail(
          `${claim.id} is ${claim.status} but ${claim.verdict === null ? 'has no' : 'has a'} verdict`,
          ['claims', index, 'verdict'],
        )
      }
      if ((claim.verdictLabel !== null) !== worked || (claim.rationale !== null) !== worked) {
        fail(`${claim.id} verdict fields disagree with status ${claim.status}`, [
          'claims',
          index,
          'verdictLabel',
        ])
      }
      if (claim.verdictLabel !== null && !claim.verdictLabel.startsWith(claim.verdict ?? '')) {
        fail(`${claim.id} verdict label does not lead with its verdict`, [
          'claims',
          index,
          'verdictLabel',
        ])
      }
    }

    for (let number = firstNumber; number <= lastNumber; number += 1) {
      const id = `C${String(number).padStart(3, '0')}`
      if (!seen.has(id) && !unassignedIds.has(id)) {
        fail(`${id} is in the canonical range but neither claimed nor recorded unassigned`, [
          'claims',
        ])
      }
    }
  })

/**
 * A marked passage in an audited essay. Anchoring is (section anchor, exact substring,
 * occurrence) resolved against the rendered tree — see `lib/instruments/marks.ts`.
 */
export const markKindSchema = z.enum(['killed', 'his-read', 'counter-evidence', 'refused'])

export const markSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: markKindSchema,
  /** Heading id the substring lives under; null searches the whole document. */
  anchor: z.string().min(1).nullable(),
  text: z.string().min(1),
  /** 1-based; omit only when the substring occurs exactly once in the anchor's range. */
  occurrence: z.number().int().positive().optional(),
  note: z.string().min(1).optional(),
})

export const scopeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  standing: z.enum(['in', 'out', 'partial']),
  note: z.string().min(1).optional(),
})

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: httpUrlSchema,
  quote: z.string().min(1).optional(),
  retrieved: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

/**
 * How firmly the figure is held. A sourced stat that is nonetheless an estimate says so in
 * the dialog rather than letting the headline number imply a precision it does not have.
 */
export const confidenceSchema = z.enum(['firm', 'estimated', 'contested'])

export const statSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  /** How the figure was arrived at — the arithmetic, the sample, the year it is stated for. */
  detail: z.string().min(1).optional(),
  confidence: confidenceSchema,
  sources: z.array(sourceSchema).min(1),
})

/**
 * A pinned footnote. Anchored exactly as a mark is — (section anchor, exact substring,
 * occurrence) against the rendered tree — so a note whose text drifts fails the build rather
 * than silently detaching from the sentence it annotates.
 */
export const marginNoteSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  anchor: z.string().min(1).nullable(),
  text: z.string().min(1),
  occurrence: z.number().int().positive().optional(),
  /** A short kicker above the note — the authority's name, the caveat's subject. */
  label: z.string().min(1).optional(),
  body: z.string().min(1),
  sources: z.array(sourceSchema).optional(),
})

export const forecastStatusSchema = z.enum([
  'open',
  'resolved-yes',
  'resolved-no',
  'ambiguous',
  'withdrawn',
])

export const forecastCardSchema = z
  .object({
    id: z.string().min(1),
    question: z.string().min(1),
    /** The two sides, stated by whoever holds them — not a summary of both. */
    forCase: z.string().min(1),
    againstCase: z.string().min(1),
    confidence: z.number().min(0).max(1),
    stated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    resolvesOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: forecastStatusSchema,
    resolvedOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    resolution: z.string().min(1).optional(),
  })
  .superRefine((card, ctx) => {
    if (card.status !== 'open' && card.resolvedOn === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `${card.id} is ${card.status} but carries no resolution date`,
        path: ['resolvedOn'],
      })
    }
    if (card.status === 'open' && card.resolvedOn !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `${card.id} is open but carries a resolution date`,
        path: ['resolvedOn'],
      })
    }
    // The resolution prose is the card's own account of how it did. An open card that already
    // carries one is claiming a score it has not earned; a resolved one without it is a status
    // chip with nothing behind it.
    if (card.status === 'open' && card.resolution !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `${card.id} is open but already states how it resolved`,
        path: ['resolution'],
      })
    }
    if (card.status !== 'open' && card.resolution === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `${card.id} is ${card.status} but does not say what happened`,
        path: ['resolution'],
      })
    }
  })

/**
 * Chart tones are roles, not colours: `primary` is the piece's own line of argument,
 * `counter` the voice arguing against it, `context` the background it is read against, and
 * `contrast` a fourth category that belongs to neither side. Four is the count a categorical
 * palette needs before two series in one figure can share a tone and read as one grey line.
 *
 * The tokens they resolve to are the audit grammar's own hues — a figure in an audited piece
 * is coloured out of the same box as the marks — declared once in `app/globals.css` and held
 * to AA by `test/instruments-contrast.test.ts`.
 */
export const chartToneSchema = z.enum(['primary', 'counter', 'context', 'contrast'])

/**
 * A figure's labels are its identity: React keys them, the legend addresses them, and the
 * highlight matches on them. Two entries sharing a label therefore light together and key
 * against each other, so a duplicate is an authoring error rather than a rendering quirk.
 */
function uniqueLabels(entries: readonly { label: string }[], ctx: z.RefinementCtx) {
  const seen = new Set<string>()
  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry.label)) {
      ctx.addIssue({ code: 'custom', message: `duplicate label ${entry.label}`, path: [index] })
    }
    seen.add(entry.label)
  }
}

const chartFrameFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  caption: z.string().min(1).optional(),
  source: sourceSchema.optional(),
  /** What a screen reader is told the figure shows. Never derived from the title alone. */
  summary: z.string().min(1),
}

export const slopeChartSchema = z.object({
  ...chartFrameFields,
  kind: z.literal('slope'),
  fromLabel: z.string().min(1),
  toLabel: z.string().min(1),
  unit: z.string().optional(),
  series: z
    .array(
      z.object({
        label: z.string().min(1),
        tone: chartToneSchema.default('context'),
        from: z.number(),
        to: z.number(),
        fromNote: z.string().min(1).optional(),
        toNote: z.string().min(1).optional(),
      }),
    )
    .min(2)
    .superRefine(uniqueLabels),
  /** A horizontal reference line, e.g. the population share the slopes are read against. */
  reference: z.object({ value: z.number(), label: z.string().min(1) }).optional(),
})

export const seriesChartSchema = z.object({
  ...chartFrameFields,
  kind: z.literal('series'),
  xLabel: z.string().min(1).optional(),
  yLabel: z.string().min(1).optional(),
  unit: z.string().optional(),
  series: z
    .array(
      z.object({
        label: z.string().min(1),
        tone: chartToneSchema.default('primary'),
        points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
      }),
    )
    .min(1)
    .superRefine(uniqueLabels),
})

export const barsChartSchema = z.object({
  ...chartFrameFields,
  kind: z.literal('bars'),
  unit: z.string().optional(),
  bars: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.number(),
        tone: chartToneSchema.default('primary'),
        note: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .superRefine(uniqueLabels),
})

export const timelineChartSchema = z.object({
  ...chartFrameFields,
  kind: z.literal('timeline'),
  events: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/),
        label: z.string().min(1),
        note: z.string().min(1).optional(),
        tone: chartToneSchema.default('context'),
      }),
    )
    .min(2)
    .superRefine(uniqueLabels),
})

export const chartSchema = z.discriminatedUnion('kind', [
  slopeChartSchema,
  seriesChartSchema,
  barsChartSchema,
  timelineChartSchema,
])

/** Ids are how the markdown addresses an instrument, so a duplicate is an authoring error. */
function uniqueIds<T extends { id: string }>(items: T[], ctx: z.RefinementCtx, what: string) {
  const seen = new Set<string>()
  for (const [index, item] of items.entries()) {
    if (seen.has(item.id)) {
      ctx.addIssue({ code: 'custom', message: `duplicate ${what} id ${item.id}`, path: [index] })
    }
    seen.add(item.id)
  }
}

/**
 * Everything anchored into the prose of one piece. Marks and notes share an id namespace
 * because they share the anchoring pass, and a collision between them would be silent.
 */
export const marksDocumentSchema = z
  .object({
    marks: z.array(markSchema).default([]),
    notes: z.array(marginNoteSchema).default([]),
    scopes: z.array(scopeSchema).default([]),
  })
  .superRefine((document, ctx) => {
    uniqueIds([...document.marks, ...document.notes], ctx, 'annotation')
    uniqueIds(document.scopes, ctx, 'scope')
  })

export const statsDocumentSchema = z
  .array(statSchema)
  .superRefine((stats, ctx) => uniqueIds(stats, ctx, 'stat'))

export const forecastsDocumentSchema = z
  .array(forecastCardSchema)
  .superRefine((cards, ctx) => uniqueIds(cards, ctx, 'forecast'))

export const chartsDocumentSchema = z
  .array(chartSchema)
  .superRefine((charts, ctx) => uniqueIds(charts, ctx, 'chart'))

export type Verdict = z.infer<typeof verdictSchema>
export type ClaimStatus = z.infer<typeof claimStatusSchema>
export type ClaimType = z.infer<typeof claimTypeSchema>
export type ClaimSection = z.infer<typeof claimSectionSchema>
export type Claim = z.infer<typeof claimSchema>
export type ClaimsLedger = z.infer<typeof claimsLedgerSchema>
export type MarkKind = z.infer<typeof markKindSchema>
export type Mark = z.infer<typeof markSchema>
export type Scope = z.infer<typeof scopeSchema>
export type Source = z.infer<typeof sourceSchema>
export type Stat = z.infer<typeof statSchema>
export type ForecastStatus = z.infer<typeof forecastStatusSchema>
export type ForecastCard = z.infer<typeof forecastCardSchema>
export type Confidence = z.infer<typeof confidenceSchema>
export type MarginNote = z.infer<typeof marginNoteSchema>
export type ChartTone = z.infer<typeof chartToneSchema>
export type SlopeChart = z.infer<typeof slopeChartSchema>
export type SeriesChart = z.infer<typeof seriesChartSchema>
export type BarsChart = z.infer<typeof barsChartSchema>
export type TimelineChart = z.infer<typeof timelineChartSchema>
export type Chart = z.infer<typeof chartSchema>
export type MarksDocument = z.infer<typeof marksDocumentSchema>

export const VERDICTS = verdictSchema.options
export const MARK_KINDS = markKindSchema.options
export const CHART_TONES = chartToneSchema.options

export function countVerdicts(claims: readonly Claim[]): Record<Verdict, number> {
  const counts = Object.fromEntries(VERDICTS.map((verdict) => [verdict, 0])) as Record<
    Verdict,
    number
  >
  for (const claim of claims) {
    if (claim.verdict !== null) counts[claim.verdict] += 1
  }
  return counts
}
