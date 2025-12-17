import { Feed } from 'feed'
import { allEssays } from 'content-collections'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'

export async function GET() {
  const feed = new Feed({
    title: 'Trey Goff — Writing',
    description: 'Essays on governance, technology, and institutional innovation.',
    id: `${siteUrl}/writing`,
    link: `${siteUrl}/writing`,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Trey Goff`,
    author: {
      name: 'Trey Goff',
      link: siteUrl,
    },
  })

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

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
