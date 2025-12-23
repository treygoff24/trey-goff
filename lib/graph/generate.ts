/**
 * Knowledge Graph Generation
 *
 * Builds a graph from essays, notes, and books.
 * Nodes are content items and tags.
 * Edges connect content to tags, and content sharing tags.
 */

import { allEssays, allNotes } from 'content-collections'
import { getAllBooks } from '@/lib/books'
import type { GraphNode, GraphEdge, GraphData, NodeType } from './types'
import { NODE_COLORS, NODE_SIZES } from './types'

function createNode(
  id: string,
  label: string,
  type: NodeType,
  url: string,
  meta?: GraphNode['meta']
): GraphNode {
  return {
    id,
    label,
    type,
    url,
    size: NODE_SIZES[type],
    color: NODE_COLORS[type],
    meta,
  }
}

function createEdge(
  source: string,
  target: string,
  type: GraphEdge['type'],
  weight = 1
): GraphEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    type,
    weight,
  }
}

export function generateGraphData(): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const tagNodes = new Map<string, string>() // tag -> nodeId

  // Helper to get or create a tag node
  function getTagNode(tag: string): string {
    const existingId = tagNodes.get(tag)
    if (existingId) return existingId

    const id = `tag-${tag}`
    tagNodes.set(tag, id)
    nodes.push(
      createNode(id, tag, 'tag', `/topics/${encodeURIComponent(tag)}`)
    )
    return id
  }

  // Process essays
  const publishedEssays = allEssays.filter((e) => e.status !== 'draft')
  for (const essay of publishedEssays) {
    const nodeId = `essay-${essay.slug}`
    nodes.push(
      createNode(nodeId, essay.title, 'essay', `/writing/${essay.slug}`, {
        date: essay.date,
        summary: essay.summary,
        wordCount: essay.wordCount,
      })
    )

    // Connect to tags
    for (const tag of essay.tags) {
      const tagId = getTagNode(tag)
      edges.push(createEdge(nodeId, tagId, 'tag'))
    }
  }

  // Process notes
  for (const note of allNotes) {
    const nodeId = `note-${note.slug}`
    const label = note.title || `Note: ${note.date}`
    nodes.push(
      createNode(nodeId, label, 'note', `/notes#${encodeURIComponent(note.slug)}`, {
        date: note.date,
      })
    )

    // Connect to tags
    for (const tag of note.tags) {
      const tagId = getTagNode(tag)
      edges.push(createEdge(nodeId, tagId, 'tag'))
    }
  }

  // Process books
  const books = getAllBooks()
  for (const book of books) {
    const nodeId = `book-${book.id}`
    nodes.push(
      createNode(nodeId, book.title, 'book', `/library#${book.id}`, {
        author: book.author,
        summary: book.whyILoveIt,
      })
    )

    // Connect to topics (treat as tags)
    for (const topic of book.topics) {
      const tagId = getTagNode(topic)
      edges.push(createEdge(nodeId, tagId, 'topic'))
    }
  }

  // Create edges between content that shares tags
  // This creates a denser, more connected graph
  const contentByTag = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.target.startsWith('tag-')) {
      const tag = edge.target
      const contentId = edge.source
      const existing = contentByTag.get(tag) || []
      existing.push(contentId)
      contentByTag.set(tag, existing)
    }
  }

  // Connect content nodes that share 2+ tags
  const sharedTagEdges = new Set<string>()
  for (const node of nodes) {
    if (node.type === 'tag') continue

    const nodeTags = edges
      .filter((e) => e.source === node.id && e.target.startsWith('tag-'))
      .map((e) => e.target)

    for (const node2 of nodes) {
      if (node2.type === 'tag' || node2.id === node.id) continue
      if (node.id > node2.id) continue // Avoid duplicates

      const node2Tags = edges
        .filter((e) => e.source === node2.id && e.target.startsWith('tag-'))
        .map((e) => e.target)

      const sharedTags = nodeTags.filter((t) => node2Tags.includes(t))
      if (sharedTags.length >= 2) {
        const edgeKey = `${node.id}-${node2.id}`
        if (!sharedTagEdges.has(edgeKey)) {
          sharedTagEdges.add(edgeKey)
          edges.push(createEdge(node.id, node2.id, 'reference', sharedTags.length))
        }
      }
    }
  }

  return { nodes, edges }
}

/** Pre-serialized graph data for client-side consumption */
export function generateSerializedGraphData(): string {
  const data = generateGraphData()
  return JSON.stringify(data)
}
