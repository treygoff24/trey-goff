'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const StarfieldBackground = dynamic(
  () => import('@/components/ui/StarfieldBackground').then((m) => m.StarfieldBackground),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-bg-0" />,
  },
)

function StaticBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 bg-bg-0">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />
    </div>
  )
}

export function StarfieldClient() {
  const reducedMotion = useReducedMotion()
  const [deferDone, setDeferDone] = useState(false)

  useEffect(() => {
    if (reducedMotion) return

    const run = () => setDeferDone(true)
    const w = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(run, { timeout: 2500 })
      return () => w.cancelIdleCallback?.(id)
    }

    const t = window.setTimeout(run, 16)
    return () => clearTimeout(t)
  }, [reducedMotion])

  if (reducedMotion) {
    return <StaticBackdrop />
  }

  if (!deferDone) {
    return <div className="fixed inset-0 -z-10 bg-bg-0" aria-hidden />
  }

  return <StarfieldBackground />
}
