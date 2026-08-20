'use client'

import Link from 'next/link'

export function ModeToggle({ mode }: { mode: 'easy' | 'hard' }) {
  return (
    <nav className="setup-mode-toggle" aria-label="Choose version">
      <Link href="/jobsite" aria-current={mode === 'easy' ? 'page' : undefined}>
        Easy mode
      </Link>
      <Link href="/stack" aria-current={mode === 'hard' ? 'page' : undefined}>
        Hard mode
      </Link>
    </nav>
  )
}
