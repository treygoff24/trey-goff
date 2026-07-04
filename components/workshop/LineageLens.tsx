'use client'

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  layoutLineage,
  REFERENCE_HEIGHT,
  REFERENCE_WIDTH,
  type LineageLayout,
  type LineageLayoutEdge,
} from '@/lib/lineage-layout'
import type { LineageEdge, Project, ProjectDiscipline } from '@/lib/projects'
import styles from './workshop.module.css'

type LineageLensProps = {
  projects: readonly Project[]
  edges: readonly LineageEdge[]
  disciplineLabels: Record<ProjectDiscipline, string>
}

type DrawTokens = {
  green: string
  accent: string
  text1: string
  text3: string
  serif: string
  mono: string
}

type DrawState = {
  elapsed: number
  complete: boolean
}

const COMPLETE_DRAW: DrawState = { elapsed: Number.POSITIVE_INFINITY, complete: true }
const ENTRANCE_MS = 3200

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function easeOutCubic(value: number): number {
  const t = clamp01(value)
  return 1 - (1 - t) ** 3
}

function cssToken(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim()
}

function rgba(color: string, alpha: number): string {
  const trimmed = color.trim()
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const value = hex[1]!
    const pairs =
      value.length === 3
        ? [...value].map((char) => `${char}${char}`)
        : [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)]
    const r = Number.parseInt(pairs[0] ?? '00', 16)
    const g = Number.parseInt(pairs[1] ?? '00', 16)
    const b = Number.parseInt(pairs[2] ?? '00', 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const rgb = trimmed.match(/^rgba?\((.+)\)$/i)
  if (rgb) {
    const [r = '0', g = '0', b = '0'] = rgb[1]!
      .replaceAll('/', ' ')
      .split(/[,\s]+/)
      .filter(Boolean)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return trimmed
}

function tokensFor(canvas: HTMLCanvasElement): DrawTokens {
  const style = getComputedStyle(canvas)
  return {
    green: cssToken(style, '--color-warm'),
    accent: cssToken(style, '--color-accent'),
    text1: cssToken(style, '--color-text-1'),
    text3: cssToken(style, '--color-text-3'),
    serif: cssToken(style, '--font-newsreader') || "Georgia, 'Times New Roman', serif",
    mono:
      cssToken(style, '--font-mono') ||
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  }
}

function point(point: { x: number; y: number }, width: number, height: number) {
  return { x: point.x * width, y: point.y * height }
}

function nodeProgress(index: number, total: number, drawState: DrawState): number {
  if (drawState.complete) return 1
  const delay = total <= 1 ? 0 : (index / (total - 1)) * 450
  return easeOutCubic((drawState.elapsed - delay) / 450)
}

function edgeProgress(drawState: DrawState): number {
  return drawState.complete ? 1 : easeOutCubic((drawState.elapsed - 900) / 700)
}

function threadProgress(drawState: DrawState): number {
  return drawState.complete ? 1 : easeOutCubic((drawState.elapsed - 1600) / 1600)
}

function quadraticPoint(edge: LineageLayoutEdge, t: number, width: number, height: number) {
  const [a, b, c] = edge.points.map((item) => point(item, width, height))
  const mt = 1 - t
  return {
    x: mt * mt * a!.x + 2 * mt * t * b!.x + t * t * c!.x,
    y: mt * mt * a!.y + 2 * mt * t * b!.y + t * t * c!.y,
  }
}

function quadraticLength(edge: LineageLayoutEdge, width: number, height: number): number {
  let length = 0
  let previous = quadraticPoint(edge, 0, width, height)
  for (let step = 1; step <= 18; step += 1) {
    const next = quadraticPoint(edge, step / 18, width, height)
    length += Math.hypot(next.x - previous.x, next.y - previous.y)
    previous = next
  }
  return length
}

function drawQuadratic(
  context: CanvasRenderingContext2D,
  edge: LineageLayoutEdge,
  width: number,
  height: number,
) {
  const [start, control, end] = edge.points.map((item) => point(item, width, height))
  context.beginPath()
  context.moveTo(start!.x, start!.y)
  context.quadraticCurveTo(control!.x, control!.y, end!.x, end!.y)
  context.stroke()
}

function smoothPath(
  context: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  width: number,
  height: number,
) {
  if (points.length === 0) return
  const scaled = points.map((item) => point(item, width, height))
  context.beginPath()
  context.moveTo(scaled[0]!.x, scaled[0]!.y)
  for (let index = 0; index < scaled.length - 1; index += 1) {
    const p0 = scaled[Math.max(0, index - 1)]!
    const p1 = scaled[index]!
    const p2 = scaled[index + 1]!
    const p3 = scaled[Math.min(scaled.length - 1, index + 2)]!
    context.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    )
  }
}

function threadLength(points: readonly { x: number; y: number }[], width: number, height: number) {
  let length = 0
  for (let index = 1; index < points.length; index += 1) {
    const a = point(points[index - 1]!, width, height)
    const b = point(points[index]!, width, height)
    length += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return length
}

function drawYears(
  context: CanvasRenderingContext2D,
  ticks: LineageLayout['ticks'],
  width: number,
  height: number,
  tokens: DrawTokens,
) {
  if (ticks.length === 0) return
  const y = height - 26

  context.save()
  context.strokeStyle = rgba(tokens.text3, 0.34)
  context.fillStyle = rgba(tokens.text3, 0.62)
  context.font = `10px ${tokens.mono}`
  context.textAlign = 'center'
  context.textBaseline = 'top'

  for (const tick of ticks) {
    const x = tick.x * width
    if (x < 14 || x > width - 14) continue
    context.beginPath()
    context.moveTo(x, y - 7)
    context.lineTo(x, y)
    context.stroke()
    context.fillText(String(tick.year), x, y + 4)
  }
  context.restore()
}

type LabelRect = {
  x: number
  y: number
  w: number
  h: number
}

function rectsIntersect(a: LabelRect, b: LabelRect, pad = 3): boolean {
  return (
    a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad
  )
}

function drawDisciplineLabels(
  context: CanvasRenderingContext2D,
  projects: readonly Project[],
  layout: LineageLayout,
  width: number,
  height: number,
  labels: Record<ProjectDiscipline, string>,
  tokens: DrawTokens,
): LabelRect[] {
  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]))
  const bands = new Map<ProjectDiscipline, number[]>()
  for (const project of projects) {
    const node = nodesById.get(project.id)
    if (!node) continue
    bands.set(project.discipline, [...(bands.get(project.discipline) ?? []), node.y])
  }

  const rects: LabelRect[] = []
  context.save()
  context.fillStyle = rgba(tokens.text3, 0.68)
  context.font = `10px ${tokens.mono}`
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  for (const [discipline, values] of bands.entries()) {
    const y = (values.reduce((sum, value) => sum + value, 0) / values.length) * height
    const text = labels[discipline].toUpperCase()
    context.fillText(text, 14, y)
    rects.push({ x: 14, y: y - 6, w: context.measureText(text).width, h: 12 })
  }
  context.restore()
  return rects
}

function lineageChain(activeId: string, edges: readonly LineageLayoutEdge[]): Set<string> {
  const chain = new Set([activeId])
  const forward = new Map<string, string[]>()
  const backward = new Map<string, string[]>()
  for (const edge of edges) {
    forward.set(edge.from, [...(forward.get(edge.from) ?? []), edge.to])
    backward.set(edge.to, [...(backward.get(edge.to) ?? []), edge.from])
  }

  const walk = (start: string, graph: Map<string, string[]>) => {
    const queue = [start]
    for (let index = 0; index < queue.length; index += 1) {
      for (const next of graph.get(queue[index]!) ?? []) {
        if (chain.has(next)) continue
        chain.add(next)
        queue.push(next)
      }
    }
  }

  walk(activeId, forward)
  walk(activeId, backward)
  return chain
}

function truncatedLabel(
  context: CanvasRenderingContext2D,
  label: string,
  maxWidth: number,
): string {
  if (context.measureText(label).width <= maxWidth) return label
  let text = label
  while (text.length > 3 && context.measureText(`${text}...`).width > maxWidth) {
    text = text.slice(0, -1)
  }
  return `${text}...`
}

function drawLineage({
  canvas,
  layout,
  projects,
  labels,
  activeId,
  focusedId,
  drawState,
  width,
  height,
}: {
  canvas: HTMLCanvasElement
  layout: LineageLayout
  projects: readonly Project[]
  labels: Record<ProjectDiscipline, string>
  activeId: string | null
  focusedId: string | null
  drawState: DrawState
  width: number
  height: number
}) {
  const context = canvas.getContext('2d')
  if (!context) return
  if (width <= 1 || height <= 1) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const targetWidth = Math.max(1, Math.floor(width * dpr))
  const targetHeight = Math.max(1, Math.floor(height * dpr))
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)

  const tokens = tokensFor(canvas)
  const projectsById = new Map(projects.map((project) => [project.id, project]))
  const chain = activeId ? lineageChain(activeId, layout.edges) : null
  const edgeT = edgeProgress(drawState)
  const threadT = threadProgress(drawState)

  drawYears(context, layout.ticks, width, height, tokens)
  const occupied = drawDisciplineLabels(context, projects, layout, width, height, labels, tokens)
  // Reserve the year-axis strip so node labels never sit on the tick labels.
  occupied.push({ x: 0, y: height - 34, w: width, h: 34 })

  for (const edge of layout.edges) {
    if (edgeT <= 0) continue
    const highlighted = !!chain?.has(edge.from) && chain.has(edge.to)
    const baseAlpha = edge.kind === 'descends' ? 0.35 : 0.18
    const alpha = chain ? (highlighted ? 0.7 : baseAlpha * 0.25) : baseAlpha
    const length = quadraticLength(edge, width, height)

    context.save()
    context.strokeStyle = rgba(tokens.green, alpha)
    context.lineWidth = edge.kind === 'descends' ? 1.25 : 1
    if (edgeT < 1) context.setLineDash([length, length])
    else if (edge.kind === 'builtWith') context.setLineDash([4, 6])
    context.lineDashOffset = edgeT < 1 ? length * (1 - edgeT) : 0
    drawQuadratic(context, edge, width, height)
    context.restore()
  }

  if (threadT > 0 && layout.thread.length > 1) {
    const length = threadLength(layout.thread, width, height)
    context.save()
    context.strokeStyle = rgba(tokens.green, 0.1 * threadT)
    context.lineWidth = 1.5
    context.setLineDash(threadT < 1 ? [length, length] : [2, 14])
    context.lineDashOffset = threadT < 1 ? length * (1 - threadT) : 0
    smoothPath(context, layout.thread, width, height)
    context.stroke()
    context.restore()
  }

  layout.nodes.forEach((node, index) => {
    const project = projectsById.get(node.id)
    if (!project) return
    const progress = nodeProgress(index, layout.nodes.length, drawState)
    if (progress <= 0) return

    const p = point(node, width, height)
    const radius = node.r * Math.min(width, height)
    const scale = 0.65 + progress * 0.35
    const highlighted = !!chain?.has(node.id)
    const tierAlpha = project.tier === 'flagship' ? 0.95 : project.tier === 'solid' ? 0.7 : 0.5
    const alpha = (chain ? (highlighted ? 1 : tierAlpha * 0.25) : tierAlpha) * progress

    context.save()
    context.beginPath()
    context.arc(p.x, p.y, radius * scale, 0, Math.PI * 2)
    if (project.dateApprox) {
      context.setLineDash([3, 3])
      context.strokeStyle = rgba(tokens.green, alpha)
      context.lineWidth = 1.25
      context.stroke()
    } else {
      context.fillStyle = rgba(tokens.green, alpha)
      context.fill()
    }

    if (node.id === activeId) {
      context.setLineDash(focusedId === node.id ? [] : [2, 4])
      context.strokeStyle = rgba(tokens.accent, 0.92)
      context.lineWidth = 1.5
      context.beginPath()
      context.arc(p.x, p.y, radius + 7, 0, Math.PI * 2)
      context.stroke()
    }
    context.restore()
  })

  // Reserve every node dot so labels never get punched through by a circle.
  for (const node of layout.nodes) {
    const p = point(node, width, height)
    const r = node.r * Math.min(width, height)
    occupied.push({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 })
  }

  const small = width < 640
  const fontSize = small ? 10 : 12
  const labelFont = `${fontSize}px ${tokens.serif}`
  const labelMaxWidth = small ? 118 : 210
  const tierRank: Record<Project['tier'], number> = { flagship: 0, solid: 1, minor: 2 }
  const labelAlpha: Record<Project['tier'], number> = { flagship: 0.9, solid: 0.72, minor: 0.55 }

  const labelable = layout.nodes
    .map((node, index) => ({ node, index, project: projectsById.get(node.id) }))
    .filter(
      (item): item is { node: (typeof layout.nodes)[number]; index: number; project: Project } =>
        !!item.project,
    )
    .filter(({ node, project }) => node.id === activeId || !small || project.tier !== 'minor')
    .sort((a, b) => {
      const activeDelta = Number(b.node.id === activeId) - Number(a.node.id === activeId)
      if (activeDelta !== 0) return activeDelta
      return tierRank[a.project.tier] - tierRank[b.project.tier] || a.node.x - b.node.x
    })

  context.save()
  context.font = labelFont
  context.textAlign = 'left'
  context.textBaseline = 'top'

  for (const { node, index, project } of labelable) {
    const progress = nodeProgress(index, layout.nodes.length, drawState)
    if (progress <= 0) continue

    const isActiveNode = node.id === activeId
    const priority = isActiveNode || project.tier === 'flagship'
    const p = point(node, width, height)
    const radius = node.r * Math.min(width, height)
    const text = truncatedLabel(context, project.name ?? node.id, labelMaxWidth)
    const w = context.measureText(text).width
    const h = fontSize + 2
    const baseX = p.x < width * 0.12 ? p.x : p.x > width * 0.88 ? p.x - w : p.x - w / 2
    const gap = radius + 8
    const candidates: LabelRect[] = [
      { x: baseX, y: p.y - gap - h, w, h },
      { x: baseX, y: p.y + gap, w, h },
    ]
    if (priority) {
      candidates.push(
        { x: baseX, y: p.y - gap - h * 2 - 4, w, h },
        { x: baseX, y: p.y + gap + h + 4, w, h },
        { x: baseX - w / 2 - 8, y: p.y - gap - h, w, h },
        { x: baseX + w / 2 + 8, y: p.y + gap, w, h },
      )
    }

    const fits = (rect: LabelRect) =>
      rect.x >= 2 &&
      rect.x + rect.w <= width - 2 &&
      rect.y >= 2 &&
      rect.y + rect.h <= height - 2 &&
      !occupied.some((placed) => rectsIntersect(rect, placed))
    const chosen = candidates.find(fits) ?? (isActiveNode ? candidates[0]! : null)
    if (!chosen) continue

    context.fillStyle = rgba(
      tokens.text1,
      (isActiveNode ? 0.95 : labelAlpha[project.tier]) * progress,
    )
    context.fillText(text, chosen.x, chosen.y)
    occupied.push(chosen)
  }
  context.restore()
}

export function LineageLens({ projects, edges, disciplineLabels }: LineageLensProps) {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const drawRef = useRef<(drawState: DrawState) => void>(() => {})
  const frameRef = useRef(0)
  const entranceStartedRef = useRef(false)
  const entranceDoneRef = useRef(false)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [rovingIndex, setRovingIndex] = useState(0)
  const measured = size.width > 1 && size.height > 1
  const viewport = useMemo(
    () => (measured ? size : { width: REFERENCE_WIDTH, height: REFERENCE_HEIGHT }),
    [measured, size],
  )
  const layout = useMemo(
    () => layoutLineage(projects, edges, viewport),
    [edges, projects, viewport],
  )
  const nodesById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout])
  const activeId = focusedId ?? hoveredId

  const draw = useCallback(
    (drawState: DrawState) => {
      const canvas = canvasRef.current
      if (!canvas || !measured) return
      drawLineage({
        canvas,
        layout,
        projects,
        labels: disciplineLabels,
        activeId,
        focusedId,
        drawState,
        width: size.width,
        height: size.height,
      })
    },
    [activeId, disciplineLabels, focusedId, layout, measured, projects, size.height, size.width],
  )

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  // Size-gating entrance/interaction on `measured` naturally suppresses drawing
  // while the panel is hidden (display:none reports a 0×0 rect), so no extra
  // IntersectionObserver or active-lens prop is needed.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect
      if (!rect) return
      setSize((current) => {
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        return current.width === width && current.height === height ? current : { width, height }
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
    const onContextRestored = () => drawRef.current(COMPLETE_DRAW)

    canvas.addEventListener('contextlost', onContextLost)
    canvas.addEventListener('contextrestored', onContextRestored)
    return () => {
      canvas.removeEventListener('contextlost', onContextLost)
      canvas.removeEventListener('contextrestored', onContextRestored)
    }
  }, [])

  useEffect(() => {
    if (!measured) return
    if (reducedMotion) {
      entranceDoneRef.current = true
      drawRef.current(COMPLETE_DRAW)
      return
    }

    let seen = false
    try {
      seen = sessionStorage.getItem('workshop-lineage-entrance') === 'done'
    } catch {
      seen = false
    }

    if (seen) {
      entranceDoneRef.current = true
      drawRef.current(COMPLETE_DRAW)
      return
    }
    if (entranceStartedRef.current) return

    entranceStartedRef.current = true
    let start = 0
    const step = (time: number) => {
      if (start === 0) start = time
      const elapsed = time - start
      drawRef.current({ elapsed, complete: false })
      if (elapsed < ENTRANCE_MS) {
        frameRef.current = requestAnimationFrame(step)
        return
      }

      frameRef.current = 0
      entranceDoneRef.current = true
      try {
        sessionStorage.setItem('workshop-lineage-entrance', 'done')
      } catch {
        // sessionStorage can be unavailable in hardened browsing modes.
      }
      drawRef.current(COMPLETE_DRAW)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
  }, [measured, reducedMotion])

  useEffect(() => {
    if (!measured || !entranceDoneRef.current) return
    if (reducedMotion) {
      drawRef.current(COMPLETE_DRAW)
      return
    }
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0
      drawRef.current(COMPLETE_DRAW)
    })
  }, [activeId, focusedId, layout, measured, reducedMotion])

  const moveFocus = (index: number, direction: 1 | -1) => {
    if (projects.length === 0) return
    const next = (index + direction + projects.length) % projects.length
    setRovingIndex(next)
    buttonRefs.current[next]?.focus()
  }

  const onNodeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index, 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index, -1)
    }
  }

  return (
    <section aria-label="Lineage graph" className="mx-auto max-w-6xl">
      <div ref={containerRef} className={styles.lineageLens}>
        <canvas ref={canvasRef} aria-hidden="true" className={styles.lineageCanvas} />
        <ol className={styles.lineageIndex} aria-label="Chronological project lineage">
          {projects.map((project, index) => {
            const node = nodesById.get(project.id)
            if (!node) return null
            const label = `${project.name ?? project.id} — ${project.year}, ${
              disciplineLabels[project.discipline]
            }`
            return (
              <li
                key={project.id}
                className={styles.lineageNodeItem}
                style={{
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                }}
              >
                <button
                  ref={(element) => {
                    buttonRefs.current[index] = element
                  }}
                  type="button"
                  className={styles.lineageNodeButton}
                  aria-label={label}
                  data-workshop-project={project.id}
                  tabIndex={index === rovingIndex ? 0 : -1}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() =>
                    setHoveredId((current) => (current === project.id ? null : current))
                  }
                  onFocus={() => {
                    setFocusedId(project.id)
                    setRovingIndex(index)
                  }}
                  onBlur={() =>
                    setFocusedId((current) => (current === project.id ? null : current))
                  }
                  onKeyDown={(event) => onNodeKeyDown(event, index)}
                />
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
