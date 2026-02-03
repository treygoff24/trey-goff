import { allEssays, allNotes } from 'content-collections'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'
let feedModule: typeof import('feed') | null = null

const getFeedModule = async () => {
  if (!feedModule) {
    feedModule = await import('feed')
  }
  return feedModule
}

export async function GET() {
  const { Feed } = await getFeedModule()
  const feed = new Feed({
    title: 'Trey Goff',
    description:
      'Essays and notes on governance, technology, and institutional innovation.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Trey Goff`,
    author: {
      name: 'Trey Goff',
      link: siteUrl,
    },
  })

  // Add essays
  const publishedEssays = allEssays
    .filter((e) => e.status !== 'draft')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  for (const essay of publishedEssays) {
    feed.addItem({
      title: essay.title,
      id: `${siteUrl}/writing/${essay.slug}`,
      link: `${siteUrl}/writing/${essay.slug}`,
      description: essay.summary,
      date: new Date(essay.date),
      category: essay.tags.map((tag) => ({ name: tag })),
    })
  }

  // Add notes
  const sortedNotes = allNotes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const note of sortedNotes) {
    feed.addItem({
      title: note.title || `Note: ${note.date}`,
      id: `${siteUrl}/notes#${note.slug}`,
      link: `${siteUrl}/notes#${note.slug}`,
      date: new Date(note.date),
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
