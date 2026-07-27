import type { Feed, Item } from 'feed'
import { allEssays, allNotes } from 'content-collections'
import { siteUrl } from '@/lib/site-config'

/**
 * `feed` is a chunky dependency and only three route handlers need it, so it is loaded on
 * first request rather than pulled into every server bundle that touches this module. The
 * `import type` above is erased at compile time and does not defeat that.
 */
let feedModule: typeof import('feed') | null = null

async function getFeedModule() {
  if (!feedModule) {
    feedModule = await import('feed')
  }
  return feedModule
}

/** Newest first, by date. */
function byNewest<T extends { date: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

interface FeedChannel {
  title: string
  description: string
  /** Path under the site root this feed represents, e.g. `/notes`. Empty for the site feed. */
  path: string
}

/** A channel with this site's standing identity (language, favicon, copyright, author) applied. */
export async function createFeed({ title, description, path }: FeedChannel): Promise<Feed> {
  const { Feed: FeedConstructor } = await getFeedModule()
  return new FeedConstructor({
    title,
    description,
    id: `${siteUrl}${path}`,
    link: `${siteUrl}${path}`,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Trey Goff`,
    author: {
      name: 'Trey Goff',
      link: siteUrl,
    },
  })
}

/** Published essays as feed items, newest first. Drafts never syndicate. */
export function publishedEssayItems(): Item[] {
  return byNewest(allEssays.filter((essay) => essay.status !== 'draft')).map((essay) => ({
    title: essay.title,
    id: `${siteUrl}/writing/${essay.slug}`,
    link: `${siteUrl}/writing/${essay.slug}`,
    description: essay.summary,
    date: new Date(essay.date),
    category: essay.tags.map((tag) => ({ name: tag })),
  }))
}

/** Notes as feed items, newest first. Untitled notes fall back to their date. */
export function noteItems(): Item[] {
  return byNewest(allNotes).map((note) => ({
    title: note.title || `Note: ${note.date}`,
    id: `${siteUrl}/notes#${note.slug}`,
    link: `${siteUrl}/notes#${note.slug}`,
    date: new Date(note.date),
  }))
}

export function feedResponse(feed: Feed): Response {
  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
