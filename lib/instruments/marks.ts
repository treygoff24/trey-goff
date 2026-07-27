import type { Element, ElementContent, Parent, Root, RootContent, Text } from 'hast'
import type { MarginNote, Mark } from '@/lib/instruments/types'

/**
 * One anchored thing. Marks and margin notes differ only in what they emit around the span
 * they resolve to, so they share the resolver: they are located against the same flat text,
 * they collide with each other rather than only among their own kind, and a note that fails
 * to resolve fails the build exactly as loudly as a mark that does.
 */
export interface Annotation {
  id: string
  anchor: string | null
  text: string
  occurrence?: number
  /** How the annotation names itself in a build failure, e.g. `mark m1 (killed)`. */
  describe: string
  wrap: (node: ElementContent) => Element
  /**
   * Whether the last of this annotation's wraps should be flagged. A span crossing an element
   * boundary emits several wraps; anything that renders a control (a note's marker, a mark's
   * note card) must render it once, on the last one. Annotations with nothing to render stay
   * unflagged so their markup is exactly what Wave 1 emitted.
   */
  stampLast: boolean
}

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
  annotation: Annotation
  order: number
  start: number
  end: number
}

export class MarkResolutionError extends Error {
  constructor(annotation: Annotation, reason: string) {
    super(`${annotation.describe} ${reason}: ${JSON.stringify(annotation.text)}`)
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
const BLOCK_BOUNDARY = '\u0000'

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

function resolve(annotations: readonly Annotation[], flat: string, regions: Map<string, Region>) {
  const resolved: ResolvedMark[] = []
  const ids = new Set<string>()

  for (const [order, annotation] of annotations.entries()) {
    if (ids.has(annotation.id)) {
      throw new MarkResolutionError(annotation, 'duplicates an earlier annotation id')
    }
    ids.add(annotation.id)

    if (annotation.text.includes(BLOCK_BOUNDARY)) {
      throw new MarkResolutionError(annotation, 'contains the block-boundary sentinel')
    }

    let region: Region
    if (annotation.anchor === null) {
      region = { start: 0, end: flat.length }
    } else {
      const found = regions.get(annotation.anchor)
      if (!found) {
        throw new MarkResolutionError(annotation, `names unknown anchor #${annotation.anchor}`)
      }
      region = found
    }

    const matches: number[] = []
    for (
      let at = flat.indexOf(annotation.text, region.start);
      at !== -1 && at + annotation.text.length <= region.end;
      at = flat.indexOf(annotation.text, at + 1)
    ) {
      matches.push(at)
    }

    if (matches.length === 0) {
      throw new MarkResolutionError(
        annotation,
        annotation.anchor === null
          ? 'does not occur in the document'
          : `does not occur under #${annotation.anchor}`,
      )
    }
    if (annotation.occurrence === undefined && matches.length > 1) {
      throw new MarkResolutionError(
        annotation,
        `occurs ${matches.length} times and names no occurrence`,
      )
    }
    const start = matches[(annotation.occurrence ?? 1) - 1]
    if (start === undefined) {
      throw new MarkResolutionError(
        annotation,
        `names occurrence ${annotation.occurrence} but occurs ${matches.length} time(s)`,
      )
    }

    resolved.push({ annotation, order, start, end: start + annotation.text.length })
  }

  return resolved
}

function markAnnotation(mark: Mark): Annotation {
  return {
    id: mark.id,
    anchor: mark.anchor,
    text: mark.text,
    occurrence: mark.occurrence,
    describe: `mark ${mark.id} (${mark.kind})`,
    stampLast: mark.note !== undefined,
    wrap: (node) => ({
      type: 'element',
      tagName: 'mark',
      properties: {
        className: ['instrument-mark'],
        dataMarkId: mark.id,
        dataMarkKind: mark.kind,
      },
      children: [node],
    }),
  }
}

/**
 * A note's wrap carries the index the reader sees, which is document order rather than
 * authoring order — so the number is stamped after resolution, through this box.
 */
interface NoteOrdinal {
  value: number
}

function noteAnnotation(note: MarginNote, ordinal: NoteOrdinal): Annotation {
  return {
    id: note.id,
    anchor: note.anchor,
    text: note.text,
    occurrence: note.occurrence,
    describe: `margin note ${note.id}`,
    stampLast: true,
    wrap: (node) => ({
      type: 'element',
      tagName: 'instrument-note',
      properties: { dataNoteId: note.id, dataNoteIndex: String(ordinal.value) },
      children: [node],
    }),
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
    for (const { annotation } of applied.reverse()) node = annotation.wrap(node)
    out.push(node)
  }

  return out
}

interface LastWrap {
  element: Element
  /** Root-first chain of ancestors, so the pass can see whether the wrap sits inside a link. */
  ancestors: { node: Parent; child: RootContent }[]
}

/**
 * A note whose span crosses an element boundary is emitted as several wraps. Only the last
 * one may carry the marker, or a note straddling an `<em>` would sprout two markers for one
 * footnote. The pass runs over the finished tree, where document order is unambiguous.
 *
 * When that last wrap sits inside an `<a>`, the flag goes on an empty copy of the wrap placed
 * immediately after the link instead. A marked passage may legitimately end inside a link —
 * Wave 1 allows it and a test pins it — but the control the flag renders is a `<button>`, and
 * a button inside an anchor is invalid markup whose clicks the browser is free to resolve as
 * navigation. The marked text stays inside the link, where the author put it; only the control
 * moves out, to the first position after the link where it is legal.
 */
function stampLastWraps(tree: Root, stamped: ReadonlySet<string>): void {
  const last = new Map<string, LastWrap>()

  const walk = (parent: Parent, ancestors: LastWrap['ancestors']) => {
    for (const child of parent.children) {
      if (child.type !== 'element') continue
      const id = child.properties?.dataNoteId ?? child.properties?.dataMarkId
      if (typeof id === 'string' && stamped.has(id)) last.set(id, { element: child, ancestors })
      walk(child, [...ancestors, { node: parent, child }])
    }
  }

  walk(tree, [])

  for (const { element, ancestors } of last.values()) {
    const link = ancestors.find(
      (step) => step.child.type === 'element' && step.child.tagName === 'a',
    )

    if (!link) {
      element.properties = { ...element.properties, dataAnnotationLast: 'true' }
      continue
    }

    const tail: Element = {
      type: 'element',
      tagName: element.tagName,
      properties: {
        ...element.properties,
        dataAnnotationLast: 'true',
        dataAnnotationTail: 'true',
      },
      children: [],
    }
    link.node.children.splice(link.node.children.indexOf(link.child) + 1, 0, tail)
  }
}

interface PieceAnnotations {
  marks?: readonly Mark[]
  notes?: readonly MarginNote[]
}

export interface AnnotatedTree {
  tree: Root
  /** Note ids in document order — the order the markers are numbered and listed in. */
  noteOrder: string[]
}

/**
 * Wraps each annotated span, resolved against the final tree rather than the markdown source.
 * A span crossing element boundaries is split into one wrap per text node it touches.
 * Anything that fails to resolve to exactly one span throws, which fails the build — an
 * annotation that silently doesn't render is worse than no annotation.
 *
 * Mutates `tree` in place.
 */
export function applyAnnotations(
  tree: Root,
  { marks = [], notes = [] }: PieceAnnotations,
): AnnotatedTree {
  if (marks.length === 0 && notes.length === 0) return { tree, noteOrder: [] }

  const ordinals = new Map(notes.map((note) => [note.id, { value: 0 }]))
  const annotations = [
    ...marks.map(markAnnotation),
    ...notes.map((note) => noteAnnotation(note, ordinals.get(note.id)!)),
  ]

  const { slots, flat, offsets } = collectTextSlots(tree)
  const resolved = resolve(annotations, flat, headingRegions(tree, offsets, flat.length))

  const noteIds = new Set(notes.map((note) => note.id))
  const noteOrder = resolved
    .filter((entry) => noteIds.has(entry.annotation.id))
    .sort((a, b) => a.start - b.start)
    .map((entry) => entry.annotation.id)
  for (const [index, id] of noteOrder.entries()) ordinals.get(id)!.value = index + 1

  for (const slot of [...slots].reverse()) {
    const covering = resolved.filter((entry) => entry.start < slot.end && entry.end > slot.start)
    if (covering.length === 0) continue
    slot.parent.children.splice(slot.index, 1, ...rebuildSlot(slot, covering))
  }

  const stamped = new Set(
    annotations.filter((annotation) => annotation.stampLast).map((annotation) => annotation.id),
  )
  if (stamped.size > 0) stampLastWraps(tree, stamped)

  return { tree, noteOrder }
}

/** Marks alone — the Wave 1 entry point, unchanged in behaviour. */
export function applyMarks(tree: Root, marks: readonly Mark[]): Root {
  return applyAnnotations(tree, { marks }).tree
}
