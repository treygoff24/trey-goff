'use client'

import { useEffect } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

export function SkipLink() {
  const focusMainContent = () => {
    const target = document.getElementById('main-content')
    if (!target) return

    window.location.hash = 'main-content'
    target.focus()
    target.scrollIntoView({ block: 'start' })
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    focusMainContent()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    focusMainContent()
  }

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== '#main-content') return
      focusMainContent()
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-warm focus:px-4 focus:py-2 focus:text-bg-1"
    >
      Skip to main content
    </a>
  )
}
