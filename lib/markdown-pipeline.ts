import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { remarkWikilinks } from '@/lib/remark-wikilinks'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'

export interface MarkdownProcessorOptions {
  /**
   * Custom element names to allow through sanitization, each carrying `data-*` attributes
   * only. This is the single intentional delta between the ordinary essay pipeline and the
   * instrument one; every other plugin and schema rule is shared.
   */
  allowedCustomTags?: readonly string[]
}

/**
 * The sanitize schema both pipelines run. `allowedCustomTags` is layered on top of the
 * shared base, so the ordinary path's schema is the base itself and cannot drift from the
 * instrument path's when either is edited.
 */
function sanitizeSchema(allowedCustomTags: readonly string[]) {
  return {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames ?? []), ...allowedCustomTags],
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] || [])],
      // `id` is deliberately absent from custom tags: sanitization clobbers it to
      // `user-content-*`, so instrument nodes identify themselves through `data-*`.
      ...Object.fromEntries(allowedCustomTags.map((tag) => [tag, ['data*']])),
    },
  }
}

/**
 * The one markdown chain this site runs: GFM, wikilinks, raw HTML passthrough,
 * sanitization, heading slugs. Stops short of stringification so callers can either
 * stringify (`lib/markdown.ts`) or keep the HAST (`lib/instruments/render.ts`).
 */
export function createMarkdownProcessor({ allowedCustomTags = [] }: MarkdownProcessorOptions = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema(allowedCustomTags))
    .use(rehypeSlug)
}
