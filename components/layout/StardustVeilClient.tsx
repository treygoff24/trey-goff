'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const StardustVeil = dynamic(
  () => import('@/components/ui/StardustVeil').then((m) => m.StardustVeil),
  {
    ssr: false,
    loading: () => null,
  },
)

export function StardustVeilClient() {
  const reducedMotion = useReducedMotion()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) return

    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }

    const t = window.setTimeout(() => setReady(true), 16)
    return () => clearTimeout(t)
  }, [reducedMotion])

  if (reducedMotion) {
    return null
  }

  if (!ready) {
    return null
  }

  return <StardustVeil />
}
