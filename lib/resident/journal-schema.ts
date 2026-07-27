import { z } from 'zod'

// The resident's call: entry number and model stay on the record, because
// different models across entries is the anti-continuity-fiction, not a
// continuity fiction. Reading-time and tag chrome does not.
export const journalSchema = z.object({
  title: z.string(),
  date: z.string(),
  entryNumber: z.number(),
  model: z.string(),
  content: z.string(),
})
