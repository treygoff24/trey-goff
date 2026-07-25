import type { Element, ElementContent, Parent, Root, RootContent, Text } from 'hast'
import type { Mark } from '@/lib/instruments/types'

const HEADING_TAGS = new Map([
  ['h1', 1],
  ['h2', 2],
  ['h3', 3],
  ['h4', 4],
  ['h5', 5],
  ['h6', 6],
])

interface TextSlot {
  node: Text
  parent: Parent
  index: number
  start: number
  end: number
}

interface Region {
  start: number
  end: number
}

interface ResolvedMark {
  mark: Mark
  order: number
  start: number
  end: number
}

export class MarkResolutionError extends Error {
  constructor(mark: Mark, reason: string) {
    super(`mark ${mark.id} (${mark.kind}) ${reason}: ${JSON.stringify(mark.text)}`)
    this.name = 'MarkResolutionError'
  }
}

/**
 * Elements that end a run of prose. Text in two different blocks is never contiguous for
 * a reader, so the flat string keeps them apart with `BLOCK_BOUNDARY` — otherwise a mark
 * could "uniquely" match a substring that only exists because two paragraphs were joined.
 */
const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])

/**
 * Void separators: childless elements that still break a run of prose (`<br>` splits a
 * line, `<hr>` splits a section). Containment-based boundaries never fire for them, so
 * the walk inserts a boundary explicitly when it passes one.
 */
const VOID_SEPARATORS = new Set(['br', 'hr'])

/**
 * Unmatchable by construction: mark text is authored prose, and `resolve` rejects any
 * mark that contains this character outright.
 */
export const BLOCK_BOUNDARY = '\u0000'

interface FlatText {
  slots: TextSlot[]
  flat: string
  offsets: Map<Text, number>
}

function collectTextSlots(tree: Root): FlatText {
  const slots: TextSlot[] = []
  const offsets = new Map<Text, number>()
  const chunks: string[] = []
  let offset = 0
  let lastBlock: Parent | null = null

  const walk = (parent: Parent, block: Parent) => {
    for (const [index, child] of parent.children.entries()) {
      if (child.type === 'text') {
        if (lastBlock !== null && lastBlock !== block) {
          chunks.push(BLOCK_BOUNDARY)
          offset += BLOCK_BOUNDARY.length
        }
        lastBlock = block

        slots.push({
          node: child,
          parent,
          index,
          start: offset,
          end: offset + child.value.length,
        })
        offsets.set(child, offset)
        chunks.push(child.value)
        offset += child.value.length
        continue
      }
      if (child.type === 'element' && VOID_SEPARATORS.has(child.tagName)) {
        if (lastBlock !== null) {
          chunks.push(BLOCK_BOUNDARY)
          offset += BLOCK_BOUNDARY.length
          lastBlock = null
        }
        continue
      }
      if ('children' in child) {
        const nested =
          child.type === 'element' && BLOCK_TAGS.has(child.tagName) ? (child as Parent) : block
        walk(child, nested)
      }
    }
  }

  walk(tree, tree)
  return { slots, flat: chunks.join(''), offsets }
}

function headingRegions(
  tree: Root,
  offsets: Map<Text, number>,
  total: number,
): Map<string, Region> {
  const headings: { id: string; depth: number; start: number }[] = []

  /**
   * The lowest offset of any text anywhere under the heading — not the first direct text
   * child. `## *First* rest` starts at `First`, not at ` rest`.
   */
  const firstOffsetIn = (node: RootContent | Root): number | null => {
    if (node.type === 'text') return offsets.get(node) ?? null
    if (!('children' in node)) return null
    let lowest: number | null = null
    for (const child of node.children) {
      const nested = firstOffsetIn(child)
      if (nested !== null && (lowest === null || nested < lowest)) lowest = nested
    }
    return lowest
  }

  const walk = (parent: Parent) => {
    for (const child of parent.children) {
      if (child.type === 'element') {
        const depth = HEADING_TAGS.get(child.tagName)
        const id = child.properties?.id
        if (depth !== undefined && typeof id === 'string') {
          headings.push({ id, depth, start: firstOffsetIn(child) ?? total })
        }
      }
      if ('children' in child) walk(child)
    }
  }

  walk(tree)

  const regions = new Map<string, Region>()
  for (const [index, heading] of headings.entries()) {
    const next = headings.slice(index + 1).find((candidate) => candidate.depth <= heading.depth)
    regions.set(heading.id, { start: heading.start, end: next ? next.start : total })
  }
  return regions
}

function resolve(marks: readonly Mark[], flat: string, regions: Map<string, Region>) {
  const resolved: ResolvedMark[] = []
  const ids = new Set<string>()

  for (const [order, mark] of marks.entries()) {
    if (ids.has(mark.id)) throw new MarkResolutionError(mark, 'duplicates an earlier mark id')
    ids.add(mark.id)

    if (mark.text.includes(BLOCK_BOUNDARY)) {
      throw new MarkResolutionError(mark, 'contains the block-boundary sentinel')
    }

    let region: Region
    if (mark.anchor === null) {
      region = { start: 0, end: flat.length }
    } else {
      const found = regions.get(mark.anchor)
      if (!found) throw new MarkResolutionError(mark, `names unknown anchor #${mark.anchor}`)
      region = found
    }

    const matches: number[] = []
    for (
      let at = flat.indexOf(mark.text, region.start);
      at !== -1 && at + mark.text.length <= region.end;
      at = flat.indexOf(mark.text, at + 1)
    ) {
      matches.push(at)
    }

    if (matches.length === 0) {
      throw new MarkResolutionError(
        mark,
        mark.anchor === null
          ? 'does not occur in the document'
          : `does not occur under #${mark.anchor}`,
      )
    }
    if (mark.occurrence === undefined && matches.length > 1) {
      throw new MarkResolutionError(mark, `occurs ${matches.length} times and names no occurrence`)
    }
    const start = matches[(mark.occurrence ?? 1) - 1]
    if (start === undefined) {
      throw new MarkResolutionError(
        mark,
        `names occurrence ${mark.occurrence} but occurs ${matches.length} time(s)`,
      )
    }

    resolved.push({ mark, order, start, end: start + mark.text.length })
  }

  return resolved
}

function wrap(node: ElementContent, mark: Mark): Element {
  return {
    type: 'element',
    tagName: 'mark',
    properties: {
      className: ['instrument-mark'],
      dataMarkId: mark.id,
      dataMarkKind: mark.kind,
    },
    children: [node],
  }
}

function rebuildSlot(slot: TextSlot, covering: ResolvedMark[]): ElementContent[] {
  const boundaries = new Set([0, slot.node.value.length])
  for (const { start, end } of covering) {
    boundaries.add(Math.max(0, start - slot.start))
    boundaries.add(Math.min(slot.node.value.length, end - slot.start))
  }

  const cuts = [...boundaries].sort((a, b) => a - b)
  const out: ElementContent[] = []

  for (let i = 0; i < cuts.length - 1; i += 1) {
    const from = cuts[i] ?? 0
    const to = cuts[i + 1] ?? 0
    if (from === to) continue

    const absolute = slot.start + from
    const applied = covering
      .filter((candidate) => candidate.start <= absolute && candidate.end > absolute)
      .sort((a, b) => a.start - b.start || b.end - a.end || a.order - b.order)

    let node: ElementContent = { type: 'text', value: slot.node.value.slice(from, to) }
    for (const { mark } of applied.reverse()) node = wrap(node, mark)
    out.push(node)
  }

  return out
}

/**
 * Wraps each mark's span in `<mark>` elements, resolved against the final tree rather than
 * the markdown source. A span crossing element boundaries is split into one wrap per text
 * node it touches. Anything that fails to resolve to exactly one span throws, which fails
 * the build — a mark that silently doesn't render is worse than no mark.
 *
 * Mutates `tree` in place and returns it.
 */
export function applyMarks(tree: Root, marks: readonly Mark[]): Root {
  if (marks.length === 0) return tree

  const { slots, flat, offsets } = collectTextSlots(tree)
  const resolved = resolve(marks, flat, headingRegions(tree, offsets, flat.length))

  for (const slot of [...slots].reverse()) {
    const covering = resolved.filter((mark) => mark.start < slot.end && mark.end > slot.start)
    if (covering.length === 0) continue
    slot.parent.children.splice(slot.index, 1, ...rebuildSlot(slot, covering))
  }

  return tree
}
