import type { MetadataRoute } from 'next'
import { allEssays, allNotes } from 'content-collections'
import { getTopicsIndex } from '@/lib/topics'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/writing',
    '/notes',
    '/library',
    '/graph',
    '/projects',
    '/about',
    '/now',
    '/subscribe',
    '/colophon',
    '/topics',
  ]

  const staticEntries = staticPages.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  const essayEntries = visibleEssays.map((essay) => ({
    url: `${siteUrl}/writing/${essay.slug}`,
    lastModified: new Date(essay.date),
    changeFrequency: 'monthly' as const,
    priority: essay.status === 'evergreen' ? 0.9 : 0.7,
  }))

  const noteEntries = allNotes.map((note) => ({
    url: `${siteUrl}/notes#${encodeURIComponent(note.slug)}`,
    lastModified: new Date(note.date),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const topicEntries = getTopicsIndex().map((topic) => ({
    url: `${siteUrl}/topics/${encodeURIComponent(topic.tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  return [...staticEntries, ...essayEntries, ...noteEntries, ...topicEntries]
}
