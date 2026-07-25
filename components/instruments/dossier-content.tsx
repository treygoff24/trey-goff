import type { ReactElement } from 'react'
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { dossierToHast, getInstrumentManifest } from '@/lib/instruments/manifest'
import { hastToReact } from '@/lib/instruments/render'

export interface RenderedDossier {
  slug: string
  title: string
  content: ReactElement
}

const CLAIM_ID = /\b(C\d{3})\b/g

function isElement(node: RootContent | ElementContent): node is Element {
  return node.type === 'element'
}

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

function textOf(node: Element): string {
  return node.children
    .map((child) => (child.type === 'text' ? child.value : isElement(child) ? textOf(child) : ''))
    .join('')
}

/**
 * Renders a piece's dossiers on the server. Consumers receive React elements, never markdown
 * and never an HTML string.
 */
export async function renderDossiers(
  slug: string,
  claimIds: ReadonlySet<string>,
): Promise<RenderedDossier[]> {
  const manifest = getInstrumentManifest(slug)
  if (!manifest) return []

  return Promise.all(
    manifest.dossiers.map(async (dossier) => {
      const tree = await dossierToHast(slug, dossier)
      const { title, body } = splitTitle(tree)
      const linked: Root = {
        ...body,
        children: linkClaimIds(body.children as ElementContent[], claimIds) as RootContent[],
      }
      return {
        slug: dossier,
        title: title || dossier.replace(/-/g, ' '),
        content: hastToReact(linked),
      }
    }),
  )
}
