'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MobileNav } from './MobileNav'

const navItems = [
  { href: '/writing', label: 'Writing' },
  { href: '/library', label: 'Library' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function TopNav() {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-1 bg-bg-1/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-satoshi text-lg font-medium text-text-1 transition-colors hover:text-warm"
          >
            Trey
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'text-text-1 font-medium'
                    : 'text-text-2 hover:text-text-1'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <button
              className="flex items-center gap-2 rounded-md border border-border-1 px-3 py-1.5 text-sm text-text-3 transition-colors hover:border-border-2 hover:text-text-2"
              aria-label="Open search (Command K)"
            >
              Search
              <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Mobile nav controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Search button - opens command palette */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
              aria-label="Search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Hamburger button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        currentPath={pathname}
      />
    </>
  )
}
