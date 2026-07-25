import type { ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import type { Root } from 'hast'
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime'
import { createMarkdownProcessor } from '@/lib/markdown-pipeline'
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

/**
 * The same processor `lib/markdown.ts` builds, with the instrument tags as its only
 * schema delta and stopped one step short of stringification.
 * `test/instruments-render.test.ts` holds the two paths byte-identical for ordinary
 * markdown, and holds the delta one-directional: instrument tags do not survive the
 * ordinary path.
 */
export async function markdownToHast(markdown: string): Promise<Root> {
  const pipeline = createMarkdownProcessor({ allowedCustomTags: INSTRUMENT_TAGS })
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
