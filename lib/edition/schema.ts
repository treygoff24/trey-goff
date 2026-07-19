import { z } from 'zod'

export const editionKindSchema = z.enum(['essays', 'projects', 'library', 'transmissions', 'about'])

export const editionSectionSchema = z.object({
  kind: editionKindSchema,
  lede: z.string().max(200),
  slugs: z.array(z.string().min(1)).min(1).max(4),
})

export const editionSchema = z.object({
  intent: z.string().max(140),
  opening: z.string().max(500),
  sections: z.array(editionSectionSchema).min(2).max(4),
  closing: z.string().max(300),
})

export const editionRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500),
})

export type Edition = z.infer<typeof editionSchema>
export type EditionKind = z.infer<typeof editionKindSchema>
