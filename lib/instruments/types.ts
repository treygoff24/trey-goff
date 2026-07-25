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
const timestampSchema = z.string().regex(/^\d+:\d{2}:\d{2}$/)

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

export const claimsLedgerSchema = z
  .object({
    source: z.object({
      title: z.string().min(1),
      episode: z.string().min(1),
      url: z.string().url(),
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
  })

/**
 * A marked passage in an audited essay. Anchoring is (section anchor, exact substring,
 * occurrence) resolved against the rendered tree — see `lib/instruments/marks.ts`.
 */
export const markKindSchema = z.enum(['killed', 'his-read', 'counter-evidence', 'refused'])

export const markSchema = z.object({
  id: z.string().min(1),
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
  url: z.string().url(),
  quote: z.string().min(1).optional(),
  retrieved: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const statSchema = z.object({
  id: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1).optional(),
  sources: z.array(sourceSchema).min(1),
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
  })

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

export const VERDICTS = verdictSchema.options
export const MARK_KINDS = markKindSchema.options

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
