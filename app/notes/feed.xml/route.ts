import { Feed } from 'feed'
import { allNotes } from 'content-collections'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trey.world'

export async function GET() {
  const feed = new Feed({
    title: 'Trey Goff — Notes',
    description: 'Quick thoughts, dispatches, and interesting links.',
    id: `${siteUrl}/notes`,
    link: `${siteUrl}/notes`,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Trey Goff`,
    author: {
      name: 'Trey Goff',
      link: siteUrl,
    },
  })

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
