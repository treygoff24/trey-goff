import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'

/**
 * Converts markdown to HTML using unified/remark/rehype pipeline.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, autolinks, task lists)
 * - Raw HTML passthrough (for embedded HTML in markdown)
 * - Automatic slug generation for headings (id attributes for anchor links)
 *
 * Used by notes page and essay pages to render content-collections raw markdown.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}
