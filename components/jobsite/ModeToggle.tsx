'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export function ModeToggle({ mode }: { mode: 'easy' | 'hard' }) {
  useEffect(() => {
    try {
      localStorage.setItem('stack-mode', mode)
    } catch {}
  }, [mode])

  const remember = (next: 'easy' | 'hard') => {
    try {
      localStorage.setItem('stack-mode', next)
    } catch {}
  }

  return (
    <nav className="setup-mode-toggle" aria-label="Choose version">
      <Link
        href="/jobsite"
        aria-current={mode === 'easy' ? 'page' : undefined}
        onClick={() => remember('easy')}
      >
        Easy mode
      </Link>
      <Link
        href="/stack"
        aria-current={mode === 'hard' ? 'page' : undefined}
        onClick={() => remember('hard')}
      >
        Hard mode
      </Link>
    </nav>
  )
}
