import { z } from 'zod'

export const editionKindSchema = z.enum(['essays', 'projects', 'library', 'transmissions', 'about'])

// Caps carry ~40% headroom over the lengths the prompt asks for. They are a
// bound on what can render, not a style control: a model that overruns by a
// clause should still produce a page, and the prompt does the actual shaping.
// Measured 2026-07-20 — at the old caps, strong models hard-failed schema
// validation on demanding intents instead of degrading.
export const editionSectionSchema = z.object({
  kind: editionKindSchema,
  lede: z.string().max(280),
  slugs: z.array(z.string().min(1)).min(1).max(4),
})

export const editionSchema = z.object({
  intent: z.string().max(200),
  opening: z.string().max(700),
  sections: z.array(editionSectionSchema).min(2).max(4),
  closing: z.string().max(420),
})

export const editionRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500),
})

export type Edition = z.infer<typeof editionSchema>
export type EditionKind = z.infer<typeof editionKindSchema>
