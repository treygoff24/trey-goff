import type { Element, ElementContent, Root } from 'hast'
import {
  INSTRUMENT_TAGS,
  hastToReact,
  type InstrumentComponents,
} from '@/lib/instruments/hast-to-react'
import { createMarkdownProcessor } from '@/lib/markdown-pipeline'

export {
  INSTRUMENT_TAGS,
  hastToReact,
  type InstrumentComponents,
  type InstrumentTag,
} from '@/lib/instruments/hast-to-react'

/**
 * The same processor `lib/markdown.ts` builds, with the instrument tags as its only
 * schema delta and stopped one step short of stringification.
 * `test/instruments-render.test.ts` holds the two paths byte-identical for ordinary
 * markdown, and holds the delta one-directional: instrument tags do not survive the
 * ordinary path.
 */
export async function markdownToHast(markdown: string): Promise<Root> {
  const pipeline = createMarkdownProcessor({ allowedCustomTags: INSTRUMENT_TAGS })
  const tree = (await pipeline.run(pipeline.parse(markdown))) as Root
  unwrapInstrumentParagraphs(tree)
  return tree
}

const INSTRUMENT_TAG_SET: ReadonlySet<string> = new Set(INSTRUMENT_TAGS)

function isInstrument(node: ElementContent): node is Element {
  return node.type === 'element' && INSTRUMENT_TAG_SET.has(node.tagName)
}

/**
 * An instrument tag written on one line — `<instrument-spine></instrument-spine>` — is inline
 * HTML by CommonMark's reckoning, so markdown wraps it in a paragraph and the block-level
 * component it compiles to lands inside a `<p>`: invalid nesting, and a hydration mismatch on
 * every load. Authoring the tags on their own lines avoids it; lifting a paragraph whose only
 * content is an instrument means the next author cannot reintroduce it.
 */
function unwrapInstrumentParagraphs(node: Root | Element): void {
  const children: ElementContent[] = []
  let changed = false

  for (const child of node.children as ElementContent[]) {
    if (child.type === 'element') unwrapInstrumentParagraphs(child)
    if (child.type === 'element' && child.tagName === 'p') {
      const kept = child.children.filter(
        (grandchild) => grandchild.type !== 'text' || grandchild.value.trim() !== '',
      )
      if (kept.length > 0 && kept.every(isInstrument)) {
        children.push(...kept)
        changed = true
        continue
      }
    }
    children.push(child)
  }

  if (changed) node.children = children as typeof node.children
}
