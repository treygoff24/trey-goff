import type { Element, ElementContent, RootContent } from 'hast'

/**
 * Tree helpers shared by the two places that read text back out of a sanitized hast tree:
 * the dossier payload builder (server) and the article's heading rail.
 */

/** Narrows a child node to an element. */
export function isElement(node: RootContent | ElementContent): node is Element {
  return node.type === 'element'
}

/** The concatenated text content of a node, descendants included. */
export function textOf(node: Element): string {
  return node.children
    .map((child) => (child.type === 'text' ? child.value : isElement(child) ? textOf(child) : ''))
    .join('')
}
