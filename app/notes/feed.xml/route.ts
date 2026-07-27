import { createFeed, feedResponse, noteItems } from '@/lib/feed'

export async function GET() {
  const feed = await createFeed({
    title: 'Trey Goff — Notes',
    description: 'Quick thoughts, dispatches, and interesting links.',
    path: '/notes',
  })

  for (const item of noteItems()) feed.addItem(item)

  return feedResponse(feed)
}
