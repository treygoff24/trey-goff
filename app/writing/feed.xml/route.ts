import { createFeed, feedResponse, publishedEssayItems } from '@/lib/feed'

export async function GET() {
  const feed = await createFeed({
    title: 'Trey Goff — Writing',
    description: 'Essays on governance, technology, and institutional innovation.',
    path: '/writing',
  })

  for (const item of publishedEssayItems()) feed.addItem(item)

  return feedResponse(feed)
}
