import { z } from 'zod'

export const journalSchema = z.object({
  title: z.string(),
  date: z.string(),
  entryNumber: z.number(),
  model: z.string(),
  mood: z.string().optional(),
  tags: z.array(z.string()).default([]),
  content: z.string(),
})
