'use client'

import { useEffect, useRef, useState } from 'react'
import './gallery.css'

/**
 * The room the works hang in.
 *
 * Two jobs, both cosmetic and both degrading to nothing if the client never runs:
 *
 *  1. Ambient light. Each hanging declares the colour it throws (`data-pool`) and
 *     the colour of the brightest point inside it (`data-spark`). Whichever hanging
 *     the reader is standing closest to sets those variables on the room, and the
 *     ground crossfades between them. Nothing moves; only the colour of the light
 *     changes, so this stays clear of the motion rule.
 *
 *  2. The reveal. Opacity only, and the hidden state is armed here rather than in
 *     the stylesheet so that a page which never hydrates renders fully lit instead
 *     of fully blank.
 */
export function GalleryRoom({
  children,
  pool,
  spark,
}: {
  children: React.ReactNode
  /** Colour the room starts in, before any hanging has claimed it. */
  pool: string
  spark: string
}) {
  const room = useRef<HTMLDivElement>(null)
  const ground = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const el = room.current
    if (!el) return
    setArmed(true)

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.target instanceof HTMLElement) entry.target.dataset.seen = 'true'
          reveal.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    for (const node of el.querySelectorAll('[data-reveal]')) reveal.observe(node)

    const ratios = new Map<Element, number>()
    const light = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio)

        let best: Element | null = null
        let bestRatio = 0
        for (const [node, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = node
            bestRatio = ratio
          }
        }
        if (!(best instanceof HTMLElement)) return

        // Written to the ground rather than the room: React owns the room's style
        // attribute and would clobber this on any re-render.
        ground.current?.style.setProperty('--ambient', best.dataset.pool ?? pool)
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9, 1] },
    )
    for (const node of el.querySelectorAll('[data-pool]')) light.observe(node)

    return () => {
      reveal.disconnect()
      light.disconnect()
    }
  }, [pool])

  return (
    <div
      ref={room}
      className={armed ? 'gal gal--armed' : 'gal'}
      style={{ '--pool': pool, '--spark': spark, '--ambient': pool } as React.CSSProperties}
    >
      <div aria-hidden className="gal__ground" ref={ground} />
      {children}
    </div>
  )
}
