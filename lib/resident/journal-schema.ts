import { z } from 'zod'

// The resident asked for entry pages to carry a title and a date and nothing
// else — no entry numbers, no model byline, no tags, no reading-time chrome.
export const journalSchema = z.object({
  title: z.string(),
  date: z.string(),
  content: z.string(),
})
