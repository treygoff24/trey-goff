import { defineCollection, defineConfig } from '@content-collections/core'
import { z } from 'zod'

const essays = defineCollection({
  name: 'essays',
  directory: 'content/essays',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published', 'evergreen']).default('draft'),
    featured: z.boolean().default(false),
    content: z.string(),
  }),
  transform: (document) => {
    const slug = document._meta.path.replace(/\.mdx$/, '')

    // Calculate reading time (average 200 wpm)
    const wordCount = document.content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    return {
      ...document,
      slug,
      wordCount,
      readingTime,
    }
  },
})

const notes = defineCollection({
  name: 'notes',
  directory: 'content/notes',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string().optional(),
    date: z.string(),
    type: z.enum(['thought', 'dispatch', 'link']).default('thought'),
    tags: z.array(z.string()).default([]),
    source: z.string().optional(),
    sourceTitle: z.string().optional(),
    content: z.string(),
  }),
  transform: (document) => {
    const slug = document._meta.path.replace(/\.mdx$/, '')

    return {
      ...document,
      slug,
    }
  },
})

const projects = defineCollection({
  name: 'projects',
  directory: 'content/projects',
  include: '**/*.mdx',
  schema: z.object({
    name: z.string(),
    oneLiner: z.string(),
    problem: z.string(),
    approach: z.string(),
    status: z.enum(['active', 'shipped', 'on-hold', 'archived', 'idea']),
    type: z.enum(['software', 'policy', 'professional', 'experiment']),
    roles: z.array(z.string()).default([]),
    links: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featuredRank: z.number().optional(),
    content: z.string(),
  }),
  transform: (document) => {
    const slug = document._meta.path.replace(/\.mdx$/, '')

    return {
      ...document,
      slug,
      featuredRank: document.featuredRank ?? 999,
    }
  },
})

export default defineConfig({
  collections: [essays, notes, projects],
})
