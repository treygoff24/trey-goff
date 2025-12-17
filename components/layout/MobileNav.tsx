'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: Array<{ href: string; label: string }>
  currentPath: string | null
}

export function MobileNav({
  isOpen,
  onClose,
  navItems,
  currentPath,
}: MobileNavProps) {
  const prefersReducedMotion = useReducedMotion()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Close when navigating
  useEffect(() => {
    if (isOpen) {
      onClose()
    }
    // Only close on path change, not on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
          !prefersReducedMotion && 'animate-fade-in'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-72 border-l border-border-1 bg-bg-1 shadow-2xl',
          !prefersReducedMotion && 'animate-slide-in-right'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <div className="flex h-16 items-center justify-end border-b border-border-1 px-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
            aria-label="Close menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                currentPath === item.href || currentPath?.startsWith(item.href + '/')
                  ? 'bg-surface-2 text-text-1'
                  : 'text-text-2 hover:bg-surface-1 hover:text-text-1'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Secondary links */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border-1 p-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/now"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
            >
              Now
            </Link>
            <Link
              href="/subscribe"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
            >
              Subscribe
            </Link>
            <Link
              href="/colophon"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
            >
              Colophon
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
