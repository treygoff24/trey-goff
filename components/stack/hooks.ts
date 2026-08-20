'use client'

import { useCallback, useEffect, useRef } from 'react'

export { useReducedMotion } from '@/hooks/useReducedMotion'

/** Fires `onVisible` once, the first time the element crosses `threshold`. */
export function useOnceVisible<T extends HTMLElement>(onVisible: () => void, threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const fired = useRef(false)
  const cb = useRef(onVisible)
  useEffect(() => {
    cb.current = onVisible
  })
  useEffect(() => {
    const el = ref.current
    if (!el || fired.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const rootH = e.rootBounds?.height ?? window.innerHeight
          const covers = e.intersectionRect.height >= rootH * 0.5
          if (e.isIntersecting && (e.intersectionRatio >= threshold || covers) && !fired.current) {
            fired.current = true
            cb.current()
            io.disconnect()
          }
        }
      },
      { threshold: [0, 0.1, 0.2, threshold] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return ref
}

/**
 * Scroll-reveal for every `.rv` under root. Progressive-enhancement shape:
 * content is VISIBLE by default (SSR, JS failure, hydration error all safe).
 * The observer's first callback arms offscreen elements (hides them) so they
 * can animate in on intersection; anything already in view never hides.
 */
export function useReveal(rootRef: React.RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll<HTMLElement>('.rv')
    if (reduced) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement
          if (e.isIntersecting) {
            el.classList.add('in')
            io.unobserve(el)
          } else {
            el.classList.add('rv-armed')
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef, reduced])
}

/** Managed timeout pool: schedule() replaces nothing, clearAll() cancels everything. */
export function useTimeouts() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  const schedule = useCallback((fn: () => void, ms: number) => {
    const handle = setTimeout(() => {
      timers.current = timers.current.filter((timer) => timer !== handle)
      fn()
    }, ms)
    timers.current.push(handle)
  }, [])
  useEffect(() => clearAll, [clearAll])
  return { schedule, clearAll }
}
