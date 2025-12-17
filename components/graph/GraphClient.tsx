'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { GraphData, GraphNode, NodeType } from '@/lib/graph/types'
import { NODE_COLORS } from '@/lib/graph/types'
import { NodeInspector } from './NodeInspector'

// Dynamic import for GraphCanvas to avoid SSR issues with Sigma
const GraphCanvas = dynamic(
  () => import('./GraphCanvas').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border-1 bg-surface-1">
        <div className="text-text-2">Loading graph...</div>
      </div>
    ),
  }
)

interface GraphClientProps {
  data: GraphData
}

const TYPE_LABELS: Record<NodeType, string> = {
  essay: 'Essays',
  note: 'Notes',
  book: 'Books',
  tag: 'Tags',
  idea: 'Ideas',
}

export function GraphClient({ data }: GraphClientProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(
    new Set(['essay', 'note', 'book', 'tag', 'idea'])
  )

  // Filter data based on visible types
  const filteredData = useMemo(() => {
    const filteredNodes = data.nodes.filter((node) =>
      visibleTypes.has(node.type)
    )
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = data.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )
    return { nodes: filteredNodes, edges: filteredEdges }
  }, [data, visibleTypes])

  // Toggle node type visibility
  const toggleType = (type: NodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  // Count nodes by type
  const typeCounts = useMemo(() => {
    const counts: Record<NodeType, number> = {
      essay: 0,
      note: 0,
      book: 0,
      tag: 0,
      idea: 0,
    }
    for (const node of data.nodes) {
      counts[node.type]++
    }
    return counts
  }, [data])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Graph container */}
      <div className="relative">
        {/* Filter controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as NodeType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                visibleTypes.has(type)
                  ? 'bg-surface-2 text-text-1'
                  : 'bg-surface-1 text-text-3 opacity-50'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: visibleTypes.has(type)
                    ? NODE_COLORS[type]
                    : 'rgba(255, 255, 255, 0.3)',
                }}
              />
              {TYPE_LABELS[type]}
              <span className="text-text-3">({typeCounts[type]})</span>
            </button>
          ))}
        </div>

        {/* Graph canvas */}
        <div className="relative h-[600px] rounded-lg border border-border-1">
          <GraphCanvas
            data={filteredData}
            onNodeClick={setSelectedNode}
            className="h-full w-full"
          />
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4 text-sm text-text-3">
          <span>{filteredData.nodes.length} nodes</span>
          <span>{filteredData.edges.length} connections</span>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <NodeInspector node={selectedNode} />

        {/* Legend */}
        <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
          <h3 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
            Legend
          </h3>
          <div className="space-y-3">
            {(Object.keys(TYPE_LABELS) as NodeType[]).map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                />
                <span className="text-text-2">{TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
          <h3 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
            Navigation
          </h3>
          <ul className="space-y-2 text-sm text-text-2">
            <li>
              <span className="text-text-3">Click:</span> Select node
            </li>
            <li>
              <span className="text-text-3">Drag:</span> Pan view
            </li>
            <li>
              <span className="text-text-3">Scroll:</span> Zoom in/out
            </li>
            <li>
              <span className="text-text-3">Hover:</span> Highlight connections
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
