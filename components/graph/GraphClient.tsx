'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GraphData, GraphNode, NodeType } from '@/lib/graph/types'
import { NODE_COLORS } from '@/lib/graph/types'
import { NodeInspector } from './NodeInspector'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// Dynamic import for GraphCanvas to avoid SSR issues with Sigma
const GraphCanvas = dynamic(() => import('./GraphCanvas').then((mod) => mod.GraphCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-border-1 bg-surface-1">
      <div className="text-text-2">Loading graph...</div>
    </div>
  ),
})

interface GraphClientProps {
  data: GraphData
}

const TYPE_LABELS: Record<NodeType, string> = {
  essay: 'Essays',
  note: 'Notes',
  book: 'Books',
  tag: 'Tags',
  idea: 'Ideas',
  transmission: 'Transmissions',
}

const ALL_TYPES: NodeType[] = ['essay', 'note', 'book', 'tag', 'idea', 'transmission']
const MOBILE_LENSES = {
  writing: ['essay', 'note', 'transmission'] as NodeType[],
  research: ['essay', 'book', 'tag'] as NodeType[],
  everything: ALL_TYPES,
} as const

export function GraphClient({ data }: GraphClientProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(ALL_TYPES))
  const [mobileLens, setMobileLens] = useState<keyof typeof MOBILE_LENSES>('everything')
  const hasAppliedMobileDefaultRef = useRef(false)

  useEffect(() => {
    if (!isMobile || hasAppliedMobileDefaultRef.current) return

    setVisibleTypes(new Set(MOBILE_LENSES.writing))
    setMobileLens('writing')
    hasAppliedMobileDefaultRef.current = true
  }, [isMobile])

  // Filter data based on visible types
  const filteredData = useMemo(() => {
    const filteredNodes = data.nodes.filter((node) => visibleTypes.has(node.type))
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = data.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
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
      transmission: 0,
    }
    for (const node of data.nodes) {
      counts[node.type]++
    }
    return counts
  }, [data])

  const mobileEntryPoints = useMemo(() => {
    const priority: Record<NodeType, number> = {
      essay: 0,
      transmission: 1,
      note: 2,
      book: 3,
      idea: 4,
      tag: 5,
    }

    return filteredData.nodes
      .filter((node) => node.type !== 'tag')
      .sort((a, b) => {
        const priorityDelta = priority[a.type] - priority[b.type]
        if (priorityDelta !== 0) return priorityDelta
        return a.label.localeCompare(b.label)
      })
      .slice(0, 6)
  }, [filteredData.nodes])

  const applyMobileLens = (lens: keyof typeof MOBILE_LENSES) => {
    setMobileLens(lens)
    setSelectedNode(null)
    setVisibleTypes(new Set(MOBILE_LENSES[lens]))
  }

  return (
    <div className="space-y-6">
      {isMobile && (
        <section className="glass-panel rounded-3xl p-5">
          <div className="flex flex-col gap-3">
            <div>
              <p className="eyebrow text-text-3">Mobile mode</p>
              <h2 className="mt-3 font-satoshi text-2xl font-medium text-text-1">
                Use lenses, then jump in.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-2">
                The full map is still live, but mobile works best when you narrow the field first.
                Start with a lens, then use a quick entry point or tap a node to inspect it.
              </p>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Graph mobile lenses">
              <button
                onClick={() => applyMobileLens('writing')}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  mobileLens === 'writing'
                    ? 'bg-warm text-bg-1'
                    : 'border border-border-1 bg-surface-1 text-text-2 hover:border-warm/40 hover:text-text-1'
                }`}
              >
                Writing lens
              </button>
              <button
                onClick={() => applyMobileLens('research')}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  mobileLens === 'research'
                    ? 'bg-accent text-bg-1'
                    : 'border border-border-1 bg-surface-1 text-text-2 hover:border-accent/40 hover:text-text-1'
                }`}
              >
                Research lens
              </button>
              <button
                onClick={() => applyMobileLens('everything')}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  mobileLens === 'everything'
                    ? 'bg-surface-2 text-text-1'
                    : 'border border-border-1 bg-surface-1 text-text-2 hover:border-border-2 hover:text-text-1'
                }`}
              >
                Everything
              </button>
            </div>

            {mobileEntryPoints.length > 0 && (
              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.24em] text-text-3">
                  Quick entry points
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {mobileEntryPoints.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-warm/25 hover:bg-white/[0.05]"
                    >
                      <span
                        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
                        style={{ color: NODE_COLORS[node.type] }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: NODE_COLORS[node.type] }}
                        />
                        {TYPE_LABELS[node.type]}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-text-1">
                        {node.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Graph container */}
        <div className="order-2 relative lg:order-1">
          {/* Filter controls */}
          <div
            className="mb-4 flex flex-wrap gap-2"
            role="group"
            aria-label="Visible graph node types"
          >
            {(Object.keys(TYPE_LABELS) as NodeType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                aria-pressed={visibleTypes.has(type) ? 'true' : 'false'}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
          <div
            className={`relative rounded-2xl border border-border-1 ${isMobile ? 'h-[420px]' : 'h-[600px]'}`}
          >
            <GraphCanvas
              data={filteredData}
              onNodeClick={setSelectedNode}
              className="h-full w-full"
              isMobile={isMobile}
            />
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-3">
            <span>{filteredData.nodes.length} nodes</span>
            <span>{filteredData.edges.length} connections</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-1 space-y-4 lg:order-2 lg:space-y-6">
          <NodeInspector node={selectedNode} isMobile={isMobile} />

          {/* Legend */}
          <div className="rounded-2xl border border-border-1 bg-surface-1 p-5 sm:p-6">
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
          <div className="rounded-2xl border border-border-1 bg-surface-1 p-5 sm:p-6">
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
    </div>
  )
}
