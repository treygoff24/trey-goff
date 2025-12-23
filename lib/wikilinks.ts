import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { allEssays, allNotes, allProjects } from 'content-collections'
import { getTopicsIndex } from '@/lib/topics'

const WIKILINK_REGEX = /\[\[([^[\]]+)\]\]/g

type MdastNode = {
  type: string
  value?: string
  children?: MdastNode[]
}

export type WikiLinkType = 'essay' | 'note' | 'project' | 'topic'

export interface WikiLinkTarget {
  id: string
  type: WikiLinkType
  title: string
  url: string
  slug: string
}

export interface WikiLinkIndex {
  keyToTargetId: Map<string, string>
  targets: Map<string, WikiLinkTarget>
}

let cachedIndex: WikiLinkIndex | null = null

const typePriority: Record<WikiLinkType, number> = {
  essay: 4,
  project: 3,
  note: 2,
  topic: 1,
}

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

export function normalizeWikiKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseWikilinkToken(raw: string): { target: string; label: string } {
  const [targetPart = '', labelPart = ''] = raw
    .split('|')
    .map((part) => part.trim())
  if (labelPart) {
    const target = targetPart || labelPart
    return { target, label: labelPart }
  }
  const fallback = targetPart || labelPart
  return { target: fallback, label: fallback }
}

export function splitWikilinkText(
  text: string
): Array<{ type: 'text'; value: string } | { type: 'link'; target: string; label: string }> {
  if (!text.includes('[[')) {
    return [{ type: 'text', value: text }]
  }

  const segments: Array<
    { type: 'text'; value: string } | { type: 'link'; target: string; label: string }
  > = []
  let lastIndex = 0
  let match: RegExpExecArray | null = null

  WIKILINK_REGEX.lastIndex = 0

  while ((match = WIKILINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    const token = match[1]?.trim()
    if (token) {
      const { target, label } = parseWikilinkToken(token)
      segments.push({ type: 'link', target, label })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

export function extractWikilinksFromMarkdown(markdown: string): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastNode
  const targets: string[] = []

  walkNodes(tree, null, (node, parentType) => {
    if (node.type !== 'text' || !node.value) return
    if (parentType && ['link', 'linkReference', 'inlineCode', 'code'].includes(parentType)) {
      return
    }

    const text = node.value
    if (!text.includes('[[')) return

    WIKILINK_REGEX.lastIndex = 0
    let match: RegExpExecArray | null = null
    while ((match = WIKILINK_REGEX.exec(text)) !== null) {
      const token = match[1]?.trim()
      if (!token) continue
      const { target } = parseWikilinkToken(token)
      if (target) targets.push(target)
    }
  })

  return targets
}

export function getWikiLinkIndex(): WikiLinkIndex {
  if (cachedIndex) return cachedIndex

  const keyToTargetId = new Map<string, string>()
  const targets = new Map<string, WikiLinkTarget>()

  const addTarget = (target: WikiLinkTarget, keys: string[]) => {
    targets.set(target.id, target)
    for (const key of keys) {
      const normalized = normalizeWikiKey(key)
      if (!normalized) continue
      const existingId = keyToTargetId.get(normalized)
      if (existingId) {
        const existingTarget = targets.get(existingId)
        if (existingTarget) {
          const existingPriority = typePriority[existingTarget.type] ?? 0
          const incomingPriority = typePriority[target.type] ?? 0
          if (incomingPriority <= existingPriority) continue
        }
      }
      keyToTargetId.set(normalized, target.id)
    }
  }

  for (const essay of visibleEssays) {
    addTarget(
      {
        id: `essay:${essay.slug}`,
        type: 'essay',
        title: essay.title,
        url: `/writing/${essay.slug}`,
        slug: essay.slug,
      },
      [essay.title, essay.slug]
    )
  }

  for (const note of allNotes) {
    const title = note.title || `Note from ${note.date}`
    addTarget(
      {
        id: `note:${note.slug}`,
        type: 'note',
        title,
        url: `/notes#${note.slug}`,
        slug: note.slug,
      },
      [title, note.slug]
    )
  }

  for (const project of allProjects) {
    addTarget(
      {
        id: `project:${project.slug}`,
        type: 'project',
        title: project.name,
        url: `/projects#${project.slug}`,
        slug: project.slug,
      },
      [project.name, project.slug]
    )
  }

  for (const topic of getTopicsIndex()) {
    addTarget(
      {
        id: `topic:${topic.tag}`,
        type: 'topic',
        title: topic.tag,
        url: `/topics/${encodeURIComponent(topic.tag)}`,
        slug: topic.tag,
      },
      [topic.tag]
    )
  }

  cachedIndex = { keyToTargetId, targets }
  return cachedIndex
}

export function resolveWikiLink(target: string): WikiLinkTarget | null {
  const index = getWikiLinkIndex()
  const key = normalizeWikiKey(target)
  const targetId = index.keyToTargetId.get(key)
  if (!targetId) return null
  return index.targets.get(targetId) ?? null
}

function walkNodes(
  node: MdastNode,
  parentType: string | null,
  visitor: (node: MdastNode, parentType: string | null) => void
) {
  visitor(node, parentType)
  if (!node.children) return
  for (const child of node.children) {
    walkNodes(child, node.type, visitor)
  }
}
