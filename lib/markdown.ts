import rehypeStringify from 'rehype-stringify'
import { createMarkdownProcessor } from '@/lib/markdown-pipeline'

/**
 * Converts markdown to HTML using unified/remark/rehype pipeline.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, autolinks, task lists)
 * - Raw HTML passthrough (for embedded HTML in markdown)
 * - Sanitization (strips script tags, event handlers, and javascript: URLs)
 * - Automatic slug generation for headings (id attributes for anchor links)
 *
 * Used by notes page and essay pages to render content-collections raw markdown.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await createMarkdownProcessor().use(rehypeStringify).process(markdown)

  return String(file)
}
