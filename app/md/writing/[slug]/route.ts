import { buildEssayMarkdown, publishedEssays } from '@/lib/markdown-mirrors'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return publishedEssays().map((essay) => ({ slug: essay.slug }))
}

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params

  const markdown = buildEssayMarkdown(slug)

  if (markdown === null) return new Response(null, { status: 404 })

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  })
}
