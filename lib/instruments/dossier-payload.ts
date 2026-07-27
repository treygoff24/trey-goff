import type { Element, ElementContent, Root, RootContent } from 'hast'
import type { Node } from 'unist'
import { dossierToHast, getClaimsLedger, getInstrumentManifest } from '@/lib/instruments/manifest'
import { isElement, textOf } from '@/lib/instruments/hast'

/**
 * A dossier as it crosses the wire: the sanitized tree the markdown pipeline produced, with
 * claim ids already turned into controls. Sent on demand rather than rendered into the page,
 * because a finding nobody opens should not cost every reader its bytes — and sent as a tree
 * rather than HTML, so the slide-over still never assembles markup from a string.
 */
export interface DossierPayload {
  slug: string
  title: string
  hast: Root
}

const CLAIM_ID = /\b(C\d{3})\b/g

/**
 * Turns every claim id mentioned in a dossier into a real control. Done here, on the tree,
 * rather than on the markdown, so no HTML is ever assembled from strings — the slide-over
 * renders the sanitized hast the pipeline produced and nothing else.
 */
function linkClaimIds(nodes: ElementContent[], known: ReadonlySet<string>): ElementContent[] {
  return nodes.flatMap((node): ElementContent[] => {
    if (isElement(node)) {
      if (node.tagName === 'a' || node.tagName === 'code') return [node]
      return [{ ...node, children: linkClaimIds(node.children, known) }]
    }
    if (node.type !== 'text') return [node]

    const parts: ElementContent[] = []
    let cursor = 0
    for (const match of node.value.matchAll(CLAIM_ID)) {
      const id = match[1]!
      if (!known.has(id)) continue
      const at = match.index
      if (at > cursor) parts.push({ type: 'text', value: node.value.slice(cursor, at) })
      parts.push({
        type: 'element',
        tagName: 'button',
        properties: { type: 'button', dataClaimRef: id, className: ['tg-claim-ref'] },
        children: [{ type: 'text', value: id }],
      })
      cursor = at + id.length
    }
    if (parts.length === 0) return [node]
    if (cursor < node.value.length) parts.push({ type: 'text', value: node.value.slice(cursor) })
    return parts
  })
}

/** The dossier's own h1 becomes the panel's title, so it is not printed twice. */
function splitTitle(tree: Root): { title: string; body: Root } {
  const index = tree.children.findIndex((node) => isElement(node) && node.tagName === 'h1')
  if (index === -1) return { title: '', body: tree }
  const heading = tree.children[index] as Element
  const title = textOf(heading)
  return {
    title,
    body: { ...tree, children: tree.children.filter((_, at) => at !== index) },
  }
}

/**
 * Parser positions carry no meaning past the build and roughly double the payload. The
 * constraint is a real unist node rather than "anything with those two keys", so passing an
 * unrelated object that happens to carry a `children` field is a compile error.
 */
function stripPositions<T extends Node>(node: T): T {
  delete node.position
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children as Node[]) stripPositions(child)
  }
  return node
}

export async function getDossierPayload(
  slug: string,
  dossier: string,
): Promise<DossierPayload | null> {
  const manifest = getInstrumentManifest(slug)
  if (!manifest?.dossiers.includes(dossier)) return null

  const ledger = getClaimsLedger(slug)
  const claimIds = new Set((ledger?.claims ?? []).map((claim) => claim.id))

  const tree = await dossierToHast(slug, dossier)
  const { title, body } = splitTitle(tree)

  return {
    slug: dossier,
    title: title || dossier.replace(/-/g, ' '),
    hast: stripPositions({
      ...body,
      children: linkClaimIds(body.children as ElementContent[], claimIds) as RootContent[],
    }),
  }
}
