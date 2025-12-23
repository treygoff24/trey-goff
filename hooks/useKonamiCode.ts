'use client'

import { useEffect, useRef } from 'react'

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
]

const TAP_THRESHOLD = 12
const SWIPE_THRESHOLD = 30

function isEditableTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    target.isContentEditable
  )
}

export function useKonamiCode(callback: () => void) {
  const indexRef = useRef(0)
  const callbackRef = useRef(callback)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const advance = (code: string) => {
      const current = indexRef.current
      if (code === KONAMI_SEQUENCE[current]) {
        const nextIndex = current + 1
        if (nextIndex === KONAMI_SEQUENCE.length) {
          callbackRef.current()
          indexRef.current = 0
          return
        }
        indexRef.current = nextIndex
        return
      }

      indexRef.current = code === KONAMI_SEQUENCE[0] ? 1 : 0
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      advance(event.code)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      if (!touch) return
      touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      const start = touchStartRef.current
      if (!start) return
      const touch = event.changedTouches[0]
      if (!touch) return
      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX < TAP_THRESHOLD && absY < TAP_THRESHOLD) {
        const isLeft = start.x < window.innerWidth / 2
        advance(isLeft ? 'KeyB' : 'KeyA')
        return
      }

      if (Math.max(absX, absY) < SWIPE_THRESHOLD) return

      if (absX > absY) {
        advance(deltaX > 0 ? 'ArrowRight' : 'ArrowLeft')
      } else {
        advance(deltaY > 0 ? 'ArrowDown' : 'ArrowUp')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])
}
