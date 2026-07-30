import type { MetadataRoute } from 'next'
import { allEssays, allNotes } from 'content-collections'
import { getTopicsIndex } from '@/lib/topics'
import { isNewsletterEnabled, siteUrl } from '@/lib/site-config'

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

function newestDate(dates: string[]): Date | undefined {
  if (dates.length === 0) return undefined
  let newest = dates[0]!
  for (let i = 1; i < dates.length; i++) {
    const candidate = dates[i]!
    if (candidate > newest) newest = candidate
  }
  return new Date(newest)
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/writing',
    '/notes',
    '/library',
    '/graph',
    '/machine',
    '/projects',
    '/about',
    '/now',
    '/colophon',
    '/topics',
    '/resident',
    '/stack',
    '/transmissions',
    '/media',
  ]

  if (isNewsletterEnabled) {
    staticPages.splice(8, 0, '/subscribe')
  }

  const newestEssayDate = newestDate(visibleEssays.map((essay) => essay.date))
  const newestNoteDate = newestDate(allNotes.map((note) => note.date))

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((route) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${siteUrl}${route}`,
      changeFrequency: 'weekly',
      priority: route === '' ? 1 : 0.8,
    }

    if (route === '/writing' && newestEssayDate) {
      entry.lastModified = newestEssayDate
    } else if (route === '/notes' && newestNoteDate) {
      entry.lastModified = newestNoteDate
    }

    return entry
  })

  const essayEntries: MetadataRoute.Sitemap = visibleEssays.map((essay) => ({
    url: `${siteUrl}/writing/${essay.slug}`,
    lastModified: new Date(essay.date),
    changeFrequency: 'monthly',
    priority: essay.status === 'evergreen' ? 0.9 : 0.7,
  }))

  const topicEntries: MetadataRoute.Sitemap = getTopicsIndex().map((topic) => {
    const essayDates = visibleEssays
      .filter((essay) => essay.tags.includes(topic.tag))
      .map((essay) => essay.date)
    const lastModified = newestDate(essayDates)

    return {
      url: `${siteUrl}/topics/${encodeURIComponent(topic.tag)}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    }
  })

  return [...staticEntries, ...essayEntries, ...topicEntries]
}
