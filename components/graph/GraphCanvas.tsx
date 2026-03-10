'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { GraphData, GraphNode } from '@/lib/graph/types'

interface GraphCanvasProps {
  data: GraphData
  onNodeClick?: (node: GraphNode | null) => void
  className?: string
}

export function GraphCanvas({ data, onNodeClick, className }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const [isLayoutRunning, setIsLayoutRunning] = useState(false)
  const [useFallbackCanvas, setUseFallbackCanvas] = useState(false)

  // Initialize graph and sigma
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

    // Create graphology instance
    const graph = new Graph()

    // Add nodes
    for (const node of data.nodes) {
      graph.addNode(node.id, {
        label: node.label,
        size: node.size,
        color: node.color,
        x: Math.random() * 100,
        y: Math.random() * 100,
        // Store metadata for inspector
        nodeType: node.type,
        url: node.url,
        meta: node.meta,
      })
    }

    // Add edges
    for (const edge of data.edges) {
      // Skip if nodes don't exist
      if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue

      try {
        graph.addEdge(edge.source, edge.target, {
          weight: edge.weight,
          edgeType: edge.type, // Store as edgeType to avoid Sigma's reserved 'type' attribute
          color: 'rgba(255, 255, 255, 0.15)',
        })
      } catch {
        // Edge might already exist
      }
    }

    // Run ForceAtlas2 layout
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

    try {
      sigma = new Sigma(graph, containerRef.current, {
        renderLabels: true,
        labelFont: 'Satoshi, system-ui, sans-serif',
        labelSize: 12,
        labelColor: { color: 'rgba(255, 255, 255, 0.92)' },
        labelRenderedSizeThreshold: 8,
        defaultEdgeColor: 'rgba(255, 255, 255, 0.15)',
        defaultNodeColor: '#7C5CFF',
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
      })
    } catch {
      setUseFallbackCanvas(true)
      return
    }

    sigmaRef.current = sigma

    // Handle node click
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

    // Handle background click
    sigma.on('clickStage', () => {
      if (onNodeClick) {
        onNodeClick(null)
      }
    })

    // Hover effects
    sigma.on('enterNode', ({ node }) => {
      sigma.setSetting('labelRenderedSizeThreshold', 0)
      const neighbors = new Set(graph.neighbors(node))
      neighbors.add(node)

      sigma.setSetting('nodeReducer', (n, attrs) => {
        if (neighbors.has(n)) {
          return { ...attrs, zIndex: 1 }
        }
        return { ...attrs, color: 'rgba(255, 255, 255, 0.1)', zIndex: 0 }
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
      sigma.setSetting('labelRenderedSizeThreshold', 8)
      sigma.setSetting('nodeReducer', null)
      sigma.setSetting('edgeReducer', null)
      sigma.refresh()
    })

    // Cleanup
    return () => {
      sigma.kill()
      sigmaRef.current = null
    }
  }, [data, onNodeClick, useFallbackCanvas])

  // Zoom controls
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
        style={{ minHeight: '500px' }}
      />
      {useFallbackCanvas && (
        <canvas
          ref={fallbackCanvasRef}
          className="sigma-mouse h-full w-full rounded-lg bg-bg-1"
          width={1200}
          height={800}
          aria-label="Knowledge graph canvas"
          style={{ minHeight: '500px' }}
        />
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="rounded-md bg-surface-2 p-2 text-text-1 hover:bg-surface-3 transition-colors"
          aria-label="Zoom in"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={zoomOut}
          className="rounded-md bg-surface-2 p-2 text-text-1 hover:bg-surface-3 transition-colors"
          aria-label="Zoom out"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={resetView}
          className="rounded-md bg-surface-2 p-2 text-text-1 hover:bg-surface-3 transition-colors"
          aria-label="Reset view"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
