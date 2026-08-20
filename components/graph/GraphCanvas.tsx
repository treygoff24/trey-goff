'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NodeHoverDrawingFunction, NodeLabelDrawingFunction } from 'sigma/rendering'
import { createNodeCompoundProgram, NodePointProgram } from 'sigma/rendering'
import type { GraphData, GraphNode } from '@/lib/graph/types'

const GRAPH_BG = '#04130c'
const GRAPH_TEXT = '#e8f3ec'

function seededPosition(id: string) {
  let hash = 2166136261
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  const random = () => {
    hash += 0x6d2b79f5
    let value = hash
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
  return { x: random() * 100, y: random() * 100 }
}

function drawLabel(
  context: CanvasRenderingContext2D,
  data: Parameters<NodeLabelDrawingFunction>[1],
  expanded: boolean,
  fontSize: number,
) {
  if (!data.label || (!expanded && !data.forceLabel)) return
  const padding = 5
  context.font = `500 ${fontSize}px Satoshi, system-ui, sans-serif`
  const width = context.measureText(data.label).width
  // Sigma scales the context by devicePixelRatio, so clamp against CSS pixels, not the
  // backing store. A label that will not fit to the right is drawn to the left of the node.
  const maxX = context.canvas.clientWidth || context.canvas.width
  const maxY = context.canvas.clientHeight || context.canvas.height
  const rightX = data.x + data.size + 4
  const left =
    rightX + width + padding <= maxX ? rightX : Math.max(2, data.x - data.size - 4 - width)
  const top = Math.max(fontSize + 2, Math.min(data.y + fontSize / 2, maxY - 2))
  context.fillStyle = GRAPH_TEXT
  context.textAlign = 'left'
  context.textBaseline = 'bottom'
  context.fillText(data.label, left, top)
}

const drawHover: NodeHoverDrawingFunction = (context, data) => {
  const label = data.label || ''
  const paddingX = 10
  const paddingY = 7
  const fontSize = Math.max(12, data.size || 12)
  context.font = `600 ${fontSize}px Satoshi, system-ui, sans-serif`
  const width = context.measureText(label).width + paddingX * 2
  const height = fontSize + paddingY * 2
  const maxX = context.canvas.clientWidth || context.canvas.width
  const maxY = context.canvas.clientHeight || context.canvas.height
  const rightX = data.x + (data.size || 0) + 10
  const x = rightX + width <= maxX - 2 ? rightX : data.x - (data.size || 0) - width - 10
  const y = Math.max(2, Math.min(data.y - height / 2, maxY - height - 2))
  context.fillStyle = GRAPH_BG
  context.beginPath()
  context.roundRect(x, y, width, height, 5)
  context.fill()
  context.fillStyle = GRAPH_TEXT
  context.textAlign = x === rightX ? 'left' : 'right'
  context.textBaseline = 'middle'
  context.fillText(label, x === rightX ? x + paddingX : x + width - paddingX, y + height / 2)
}

interface GraphCanvasProps {
  data: GraphData
  onNodeClick?: (node: GraphNode | null) => void
  className?: string
  isMobile?: boolean
}

export function GraphCanvas({ data, onNodeClick, className, isMobile = false }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)
  const [useFallbackCanvas, setUseFallbackCanvas] = useState(false)

  useEffect(() => {
    if (!useFallbackCanvas || !fallbackCanvasRef.current) return

    const canvas = fallbackCanvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    const width = canvas.width
    const height = canvas.height

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#0b1020'
    context.fillRect(0, 0, width, height)

    for (const edge of data.edges.slice(0, 400)) {
      const sourceIndex = data.nodes.findIndex((node) => node.id === edge.source)
      const targetIndex = data.nodes.findIndex((node) => node.id === edge.target)
      if (sourceIndex === -1 || targetIndex === -1) continue

      const sourceX = ((sourceIndex * 37) % width) + 12
      const sourceY = ((sourceIndex * 53) % height) + 12
      const targetX = ((targetIndex * 37) % width) + 12
      const targetY = ((targetIndex * 53) % height) + 12

      context.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(sourceX, sourceY)
      context.lineTo(targetX, targetY)
      context.stroke()
    }

    for (const [index, node] of data.nodes.entries()) {
      const x = ((index * 37) % width) + 12
      const y = ((index * 53) % height) + 12
      context.fillStyle = node.color
      context.beginPath()
      context.arc(x, y, Math.max(2, Math.min(node.size / 2, 8)), 0, Math.PI * 2)
      context.fill()
    }
  }, [data, useFallbackCanvas])

  useEffect(() => {
    if (useFallbackCanvas) return
    if (!containerRef.current) return

    const graph = new Graph()

    const degree = new Map(data.nodes.map((node) => [node.id, 0]))
    for (const edge of data.edges) {
      degree.set(edge.source, (degree.get(edge.source) || 0) + 1)
      degree.set(edge.target, (degree.get(edge.target) || 0) + 1)
    }
    const forcedLabels = new Set(
      [...degree.entries()]
        .sort(
          ([leftId, leftDegree], [rightId, rightDegree]) =>
            rightDegree - leftDegree || leftId.localeCompare(rightId),
        )
        .slice(0, 10)
        .map(([id]) => id),
    )

    for (const node of data.nodes) {
      const position = seededPosition(node.id)
      graph.addNode(node.id, {
        label: forcedLabels.has(node.id) ? node.label : '',
        originalLabel: node.label,
        size: node.size,
        color: node.color,
        x: position.x,
        y: position.y,
        forceLabel: forcedLabels.has(node.id),
        nodeType: node.type,
        type: 'point',
        url: node.url,
        meta: node.meta,
      })
    }

    for (const edge of data.edges) {
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue
      // The generated graph can list the same pair twice; skip the duplicate rather than
      // letting addEdge throw, so any *other* failure from addEdge still surfaces.
      if (graph.hasEdge(edge.source, edge.target)) continue

      graph.addEdge(edge.source, edge.target, {
        weight: edge.weight,
        edgeType: edge.type, // Store as edgeType to avoid Sigma's reserved 'type' attribute
        color: 'rgba(255, 255, 255, 0.15)',
      })
    }

    setIsLayoutRunning(true)
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: {
        gravity: 1,
        scalingRatio: 10,
        strongGravityMode: true,
        barnesHutOptimize: true,
      },
    })
    setIsLayoutRunning(false)

    let sigma: Sigma
    let expandedLabels = false
    const labelSize = isMobile ? 10.5 : 12

    try {
      sigma = new Sigma(graph, containerRef.current, {
        nodeProgramClasses: {
          point: createNodeCompoundProgram(
            [NodePointProgram],
            (context, data) => drawLabel(context, data, expandedLabels, labelSize),
            drawHover,
          ),
        },
        renderLabels: true,
        labelFont: 'Satoshi, system-ui, sans-serif',
        labelSize,
        labelColor: { color: GRAPH_TEXT },
        labelRenderedSizeThreshold: 0,
        defaultDrawNodeLabel: (context, data) =>
          drawLabel(context, data, expandedLabels, labelSize),
        defaultDrawNodeHover: drawHover,
        defaultEdgeColor: 'rgba(255, 255, 255, 0.15)',
        defaultNodeColor: '#7C5CFF',
        minCameraRatio: 0.1,
        maxCameraRatio: isMobile ? 14 : 10,
      })
    } catch {
      setUseFallbackCanvas(true)
      return
    }

    sigmaRef.current = sigma

    sigma.getCamera().on('updated', () => {
      const shouldExpandLabels = sigma.getCamera().getState().ratio < 0.25
      if (shouldExpandLabels === expandedLabels) return
      expandedLabels = shouldExpandLabels
      sigma.setSetting(
        'labelRenderedSizeThreshold',
        shouldExpandLabels ? 0 : Number.POSITIVE_INFINITY,
      )
      sigma.setSetting(
        'nodeReducer',
        shouldExpandLabels ? (_node, attrs) => ({ ...attrs, label: attrs.originalLabel }) : null,
      )
    })
    sigma.refresh()

    sigma.on('clickNode', ({ node }) => {
      const nodeData = graph.getNodeAttributes(node)
      if (onNodeClick) {
        onNodeClick({
          id: node,
          label: nodeData.label as string,
          type: nodeData.nodeType,
          url: nodeData.url as string,
          size: nodeData.size as number,
          color: nodeData.color as string,
          meta: nodeData.meta,
        })
      }
    })

    sigma.on('clickStage', () => {
      if (onNodeClick) {
        onNodeClick(null)
      }
    })

    sigma.on('enterNode', ({ node }) => {
      sigma.setSetting('labelRenderedSizeThreshold', 0)
      const neighbors = new Set(graph.neighbors(node))
      neighbors.add(node)

      sigma.setSetting('nodeReducer', (n, attrs) => {
        if (neighbors.has(n)) {
          return { ...attrs, label: n === node ? attrs.originalLabel : '', zIndex: 1 }
        }
        return { ...attrs, label: '', zIndex: 0 }
      })

      sigma.setSetting('edgeReducer', (e, attrs) => {
        const source = graph.source(e)
        const target = graph.target(e)
        if (neighbors.has(source) && neighbors.has(target)) {
          return { ...attrs, color: 'rgba(255, 255, 255, 0.4)' }
        }
        return { ...attrs, color: 'rgba(255, 255, 255, 0.05)' }
      })

      sigma.refresh()
    })

    sigma.on('leaveNode', () => {
      sigma.setSetting('labelRenderedSizeThreshold', Number.POSITIVE_INFINITY)
      sigma.setSetting('nodeReducer', null)
      sigma.setSetting('edgeReducer', null)
      sigma.refresh()
    })

    return () => {
      sigma.kill()
      sigmaRef.current = null
    }
  }, [data, isMobile, onNodeClick, useFallbackCanvas])

  const zoomIn = useCallback(() => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      void camera.animatedZoom({ duration: 300 })
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      void camera.animatedUnzoom({ duration: 300 })
    }
  }, [])

  const resetView = useCallback(() => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera()
      void camera.animatedReset({ duration: 300 })
    }
  }, [])

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className={`h-full w-full rounded-lg bg-bg-1 ${useFallbackCanvas ? 'hidden' : ''}`}
        style={{ minHeight: isMobile ? '360px' : '500px' }}
      />
      {useFallbackCanvas && (
        <canvas
          ref={fallbackCanvasRef}
          className="sigma-mouse h-full w-full rounded-lg bg-bg-1"
          width={1200}
          height={800}
          aria-label="Knowledge graph canvas"
          style={{ minHeight: isMobile ? '360px' : '500px' }}
        />
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-text-1 transition-colors hover:bg-surface-3"
          aria-label="Zoom in"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-text-1 transition-colors hover:bg-surface-3"
          aria-label="Zoom out"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-text-1 transition-colors hover:bg-surface-3"
          aria-label="Reset view"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
            />
          </svg>
        </button>
      </div>

      {/* Loading indicator */}
      {isLayoutRunning && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-1/50">
          <div className="text-text-2">Computing layout...</div>
        </div>
      )}
    </div>
  )
}
