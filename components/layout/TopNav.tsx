'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/writing', label: 'Writing' },
  { href: '/projects', label: 'Projects' },
  { href: '/library', label: 'Library' },
  { href: '/machine', label: 'Machine' },
  { href: '/about', label: 'About' },
]

export function TopNav() {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)
  const [hideForLibraryLens, setHideForLibraryLens] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

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

  return (
    <header
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 transition duration-300 ease-out',
        scrolled && 'border-b border-border-1 bg-bg-0/85 backdrop-blur-md',
        hideForLibraryLens && '-translate-y-8 opacity-0',
      )}
      data-top-nav-ready={hydrated ? 'true' : 'false'}
    >
      <nav
        className={cn(
          'mx-auto flex max-w-[92rem] flex-col items-start gap-2 px-6 pb-4 pt-6 max-[520px]:max-w-[402px] md:h-24 md:flex-row md:items-center md:justify-between md:gap-8 md:px-12 md:pb-0 md:pt-0',
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

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 md:gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[0.86rem] font-semibold text-text-2 transition-colors hover:text-text-1',
                  isActive && 'text-warm',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
