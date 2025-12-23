import { resolveWikiLink, splitWikilinkText } from '@/lib/wikilinks'

type MdastNode = {
  type: string
  value?: string
  url?: string
  children?: MdastNode[]
}

const skipParentTypes = new Set(['link', 'linkReference', 'inlineCode', 'code'])

export function remarkWikilinks() {
  return (tree: MdastNode) => {
    transformNode(tree)
  }
}

function transformNode(node: MdastNode) {
  if (!node.children) return

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]
    if (!child) continue

    if (
      child.type === 'text' &&
      child.value &&
      !skipParentTypes.has(node.type) &&
      child.value.includes('[[')
    ) {
      const segments = splitWikilinkText(child.value)
      const hasLinks = segments.some((segment) => segment.type === 'link')

      if (hasLinks) {
        const replacement: MdastNode[] = []
        for (const segment of segments) {
          if (segment.type === 'text') {
            if (segment.value) {
              replacement.push({ type: 'text', value: segment.value })
            }
            continue
          }

          const resolved = resolveWikiLink(segment.target)
          if (!resolved) {
            replacement.push({ type: 'text', value: segment.label })
            continue
          }

          replacement.push({
            type: 'link',
            url: resolved.url,
            children: [{ type: 'text', value: segment.label || resolved.title }],
          })
        }

        if (replacement.length > 0) {
          node.children.splice(index, 1, ...replacement)
          index += replacement.length - 1
          continue
        }
      }
    }

    transformNode(child)
  }
}
