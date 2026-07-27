import { createFeed, feedResponse, noteItems, publishedEssayItems } from '@/lib/feed'

export async function GET() {
  const feed = await createFeed({
    title: 'Trey Goff',
    description: 'Essays and notes on governance, technology, and institutional innovation.',
    path: '',
  })

  for (const item of publishedEssayItems()) feed.addItem(item)
  for (const item of noteItems()) feed.addItem(item)

  return feedResponse(feed)
}
