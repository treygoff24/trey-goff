'use client'

import { useEffect, useState, type RefObject } from 'react'
import { CHAPTERS } from '@/components/stack/data'

export function StackRail({
  rootRef,
  meterRef,
  railOpen,
  setRailOpen,
  railRef,
  toggleRef,
}: {
  rootRef: RefObject<HTMLDivElement | null>
  meterRef: RefObject<HTMLDivElement | null>
  railOpen: boolean
  setRailOpen: (open: boolean) => void
  railRef: RefObject<HTMLElement | null>
  toggleRef: RefObject<HTMLButtonElement | null>
}) {
  const [active, setActive] = useState(-1)
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('#stack-rail .rail-nav')
    const link = nav?.querySelector<HTMLElement>('.rail-link[aria-current="true"]')
    if (!nav || !link) return
    const navRect = nav.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    if (linkRect.top < navRect.top) nav.scrollTop += linkRect.top - navRect.top
    else if (linkRect.bottom > navRect.bottom) nav.scrollTop += linkRect.bottom - navRect.bottom
  }, [active])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.chapter'))
    let offsets = sections.map((section) => section.offsetTop)
    let ticking = false
    let frame = 0
    const refreshOffsets = () => {
      offsets = sections.map((section) => section.offsetTop)
      onScroll()
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      frame = requestAnimationFrame(() => {
        ticking = false
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        const mid = window.scrollY + window.innerHeight * 0.35
        let idx = -1
        offsets.forEach((offset, i) => {
          if (offset <= mid) idx = i
        })
        setPct(Math.round(p * 100))
        setActive(idx)
        if (meterRef.current) meterRef.current.style.transform = `scaleX(${p.toFixed(4)})`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', refreshOffsets)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', refreshOffsets)
      cancelAnimationFrame(frame)
    }
  }, [meterRef, rootRef])

  const spinePct = CHAPTERS.length > 1 ? (Math.max(0, active) / (CHAPTERS.length - 1)) * 100 : 0

  return (
    <>
      <nav
        className={railOpen ? 'rail open' : 'rail'}
        id="stack-rail"
        aria-label="Chapters"
        ref={railRef}
      >
        <a className="rail-mark" href="#top">
          Trey Goff / treygoff.com
          <strong>The Setup</strong>
        </a>
        <div className="rail-nav">
          <div className="rail-spine" aria-hidden="true">
            <i style={{ height: `${spinePct}%` }} />
          </div>
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              className={i < active ? 'rail-link done' : 'rail-link'}
              href={`#${c.id}`}
              aria-current={i === active ? 'true' : 'false'}
              onClick={() => setRailOpen(false)}
            >
              <span className="n">{c.n}</span>
              <span>{c.title}</span>
            </a>
          ))}
        </div>
        <div className="rail-foot">
          <span>Progress</span>
          <span>
            <b>{pct}%</b>
          </span>
        </div>
      </nav>
      <button
        className="rail-toggle"
        type="button"
        aria-expanded={railOpen}
        aria-controls="stack-rail"
        onClick={() => setRailOpen(!railOpen)}
        ref={toggleRef}
      >
        <span>Chapters</span>
        <span className="pct">{CHAPTERS[active]?.n ?? '—'}</span>
      </button>
    </>
  )
}
