import type { ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Root } from 'hast'
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { remarkWikilinks } from '@/lib/remark-wikilinks'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import { applyMarks } from '@/lib/instruments/marks'
import type { Mark } from '@/lib/instruments/types'

/**
 * Instrument nodes are authored as custom elements so they survive sanitization and stay
 * legible in the markdown. `renderInstruments` maps each to a React component.
 */
export const INSTRUMENT_TAGS = [
  'instrument-stat',
  'instrument-forecast',
  'instrument-spine',
  'instrument-ledger',
  'instrument-notes',
  'instrument-scope',
] as const

export type InstrumentTag = (typeof INSTRUMENT_TAGS)[number]

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), ...INSTRUMENT_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || [])],
    // `id` is deliberately absent: sanitization clobbers it to `user-content-*`, so
    // instrument nodes identify themselves through `data-*` instead.
    ...Object.fromEntries(INSTRUMENT_TAGS.map((tag) => [tag, ['data*']])),
  },
}

function processor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeSlug)
}

/**
 * The same remark/rehype chain `lib/markdown.ts` runs, stopped one step short of
 * stringification. `test/instruments-render.test.ts` holds the two paths byte-identical
 * for ordinary markdown.
 */
export async function markdownToHast(markdown: string): Promise<Root> {
  const pipeline = processor()
  return (await pipeline.run(pipeline.parse(markdown))) as Root
}

export type InstrumentComponents = Partial<Record<InstrumentTag | 'mark', Components[string]>>

export function hastToReact(tree: Root, components?: InstrumentComponents): ReactElement {
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as Components,
  })
}

interface RenderOptions {
  marks?: readonly Mark[]
  components?: InstrumentComponents
}

export async function renderInstruments(
  markdown: string,
  options: RenderOptions = {},
): Promise<ReactElement> {
  const tree = await markdownToHast(markdown)
  applyMarks(tree, options.marks ?? [])
  return hastToReact(tree, options.components)
}
