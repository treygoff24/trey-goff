'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/writing', label: 'Writing' },
  { href: '/projects', label: 'Projects' },
  { href: '/library', label: 'Library' },
  { href: '/machine', label: 'Machine' },
  { href: '/jobsite', label: 'AI, explained' },
  { href: '/stack', label: 'The Setup' },
  { href: '/resident', label: 'Resident' },
  { href: '/about', label: 'About' },
]

export function TopNav() {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [hideForLibraryLens, setHideForLibraryLens] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const wasMenuOpen = useRef(false)
  const hideNav =
    pathname === '/stack' || pathname?.startsWith('/stack/') || pathname === '/jobsite'

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.topNavHidden = hideNav ? 'true' : 'false'
    return () => document.documentElement.removeAttribute('data-top-nav-hidden')
  }, [hideNav])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) {
      wasMenuOpen.current = true
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus()
      return () => {
        document.body.style.overflow = ''
      }
    }

    document.body.style.overflow = ''
    if (wasMenuOpen.current) {
      wasMenuOpen.current = false
      menuButtonRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 16)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!pathname?.startsWith('/library')) {
      setHideForLibraryLens(false)
      return
    }

    const update = () => setHideForLibraryLens(window.scrollY > 120)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [pathname])

  // /stack is an immersive field-manual route with its own chapter rail.
  if (hideNav) return null

  return (
    <header
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 transition duration-300 ease-out max-md:bg-bg-0',
        scrolled &&
          !hideForLibraryLens &&
          'border-b border-border-1 bg-bg-0/85 shadow-[0_12px_40px_color-mix(in_oklab,var(--color-bg-0)_45%,transparent)] backdrop-blur-md',
        hideForLibraryLens && '-translate-y-8 opacity-0',
      )}
      data-top-nav-ready={hydrated ? 'true' : 'false'}
    >
      <nav
        className={cn(
          'mx-auto flex h-16 max-w-[92rem] items-center justify-between px-6 md:h-24 md:flex-row md:gap-8 md:px-12',
          hideForLibraryLens ? 'pointer-events-none' : 'pointer-events-auto',
        )}
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="font-newsreader text-[1.42rem] font-semibold tracking-[-0.02em] text-text-1 transition-colors hover:text-warm"
        >
          Trey Goff
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[0.86rem] font-semibold text-text-2 transition-colors hover:text-text-1 max-[360px]:text-[0.78rem]',
                  isActive && 'text-warm',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center border border-border-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-text-1 transition-colors hover:border-border-2 hover:text-warm md:hidden"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-sheet"
          onClick={() => setMenuOpen(true)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true" className="flex flex-col gap-1">
            <span className="h-px w-4 bg-current" />
            <span className="h-px w-4 bg-current" />
          </span>
        </button>
      </nav>
      <div
        id="mobile-navigation-sheet"
        className={cn(
          'fixed inset-x-0 top-16 bottom-0 z-50 bg-bg-0 px-6 py-4 md:hidden',
          menuOpen ? 'block' : 'hidden',
        )}
        aria-hidden={!menuOpen}
      >
        <div className="flex items-center justify-between border-b border-border-1 pb-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-text-3">
            Navigate
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center border border-border-1 px-3 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-text-1 transition-colors hover:border-border-2 hover:text-warm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 items-center border-b border-border-1 font-mono text-sm uppercase tracking-[0.08em] text-text-2 transition-colors hover:text-text-1',
                  isActive && 'text-warm',
                )}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
