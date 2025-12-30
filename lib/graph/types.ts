/**
 * Knowledge Graph Types
 *
 * Node types represent different content entities.
 * Edges represent relationships between them.
 */

export type NodeType = 'essay' | 'note' | 'book' | 'tag' | 'idea' | 'transmission'

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  url: string
  size: number
  color: string
  /** Additional metadata for the inspector panel */
  meta?: {
    date?: string
    summary?: string
    author?: string
    wordCount?: number
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  weight: number
  /** Relationship type for edge styling */
  type: 'tag' | 'reference' | 'topic' | 'author'
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/** Colors for each node type, matching design tokens */
export const NODE_COLORS: Record<NodeType, string> = {
  essay: '#FFB86B', // warm accent
  note: '#7C5CFF', // electric accent
  book: '#4ECDC4', // teal
  tag: 'rgba(255, 255, 255, 0.52)', // text-3
  idea: '#FF6B6B', // coral
  transmission: '#34D399', // success/green - broadcast signal
}

/** Base sizes for each node type */
export const NODE_SIZES: Record<NodeType, number> = {
  essay: 12,
  note: 8,
  book: 10,
  tag: 6,
  idea: 7,
  transmission: 11,
}
