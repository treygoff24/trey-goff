'use client'

import Link from 'next/link'
import type { GraphNode } from '@/lib/graph/types'
import { NODE_COLORS } from '@/lib/graph/types'
import { formatDate } from '@/lib/utils'

interface NodeInspectorProps {
  node: GraphNode | null
}

const TYPE_LABELS: Record<string, string> = {
  essay: 'Essay',
  note: 'Note',
  book: 'Book',
  tag: 'Tag',
  idea: 'Idea',
}

export function NodeInspector({ node }: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
        <p className="text-center text-text-3">
          Click a node to view details
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
      {/* Type badge */}
      <div className="mb-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${NODE_COLORS[node.type]}20`,
            color: NODE_COLORS[node.type],
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: NODE_COLORS[node.type] }}
          />
          {TYPE_LABELS[node.type] || node.type}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 font-satoshi text-lg font-medium text-text-1">
        {node.label}
      </h3>

      {/* Metadata */}
      {node.meta && (
        <div className="mb-4 space-y-1 text-sm text-text-2">
          {node.meta.author && (
            <p>
              <span className="text-text-3">by</span> {node.meta.author}
            </p>
          )}
          {node.meta.date && (
            <p>
              <span className="text-text-3">Date:</span>{' '}
              {formatDate(node.meta.date)}
            </p>
          )}
          {node.meta.wordCount && (
            <p>
              <span className="text-text-3">Words:</span>{' '}
              {node.meta.wordCount.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      {node.meta?.summary && (
        <p className="mb-4 text-sm text-text-2 line-clamp-3">
          {node.meta.summary}
        </p>
      )}

      {/* Link */}
      {node.type !== 'tag' && (
        <Link
          href={node.url}
          className="inline-flex items-center gap-2 rounded-md bg-warm px-4 py-2 text-sm font-medium text-bg-1 transition-colors hover:bg-warm/90"
        >
          View {TYPE_LABELS[node.type]?.toLowerCase() || 'content'}
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      )}

      {node.type === 'tag' && (
        <Link
          href={node.url}
          className="inline-flex items-center gap-2 text-sm text-warm hover:underline"
        >
          View all content with this tag
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      )}
    </div>
  )
}
