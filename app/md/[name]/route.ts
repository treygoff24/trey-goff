import {
  buildNotesMarkdown,
  buildSitemapMarkdown,
  getMirrorMarkdown,
  getMirrorNames,
} from '@/lib/markdown-mirrors'

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return ['notes', 'sitemap', ...getMirrorNames()].map((name) => ({ name }))
}

function markdownFor(name: string): string | null {
  if (name === 'notes') return buildNotesMarkdown()
  if (name === 'sitemap') return buildSitemapMarkdown()
  return getMirrorMarkdown(name)
}

export async function GET(_: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params

  const markdown = markdownFor(name)

  if (markdown === null) return new Response(null, { status: 404 })

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  })
}
