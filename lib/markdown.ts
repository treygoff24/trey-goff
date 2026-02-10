import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { remarkWikilinks } from '@/lib/remark-wikilinks'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'

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
  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] || [])],
    },
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeSlug)
    .use(rehypeStringify)
    .process(markdown)

  return String(file)
}
