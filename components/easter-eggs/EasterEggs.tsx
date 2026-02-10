'use client'

import { useEffect, useState } from 'react'
import { useKonamiCode } from '@/hooks/useKonamiCode'
import { printConsoleEasterEgg } from '@/lib/console-easter-egg'

export function EasterEggs() {
  const [retroMode, setRetroMode] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useKonamiCode(() => {
    setRetroMode((prev) => {
      const next = !prev
      setToast(next ? 'Retro mode unlocked.' : 'Retro mode disabled.')
      return next
    })
  })

  useEffect(() => {
    printConsoleEasterEgg()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (retroMode) {
      root.setAttribute('data-konami', 'true')
    } else {
      root.removeAttribute('data-konami')
    }
  }, [retroMode])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border-1 bg-bg-1/90 px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-2 shadow-lg backdrop-blur" role="alert">
      {toast}
    </div>
  )
}
