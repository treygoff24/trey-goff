'use client'

import Link from 'next/link'
import { useEffect, useRef, type RefObject } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { isNewsletterEnabled } from '@/lib/site-config'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: Array<{ href: string; label: string }>
  currentPath: string | null
  triggerRef: RefObject<HTMLButtonElement | null>
}

export function MobileNav({ isOpen, onClose, navItems, currentPath, triggerRef }: MobileNavProps) {
  const prefersReducedMotion = useReducedMotion()
  const previousPath = useRef(currentPath)
  const drawerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Save focus on open and restore it on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      return
    }

    const elementToRestore = previousFocusRef.current ?? triggerRef.current
    elementToRestore?.focus()
    previousFocusRef.current = null
  }, [isOpen, triggerRef])

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
    if (!isOpen) {
      previousPath.current = currentPath
      return
    }

    if (previousPath.current && currentPath && previousPath.current !== currentPath) {
      onClose()
    }

    previousPath.current = currentPath
  }, [currentPath, isOpen, onClose])

  // Move focus into the drawer when it opens
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    focusableElements[0]?.focus()
  }, [isOpen])

  // Prevent tabbing outside the drawer while it is open
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const getFocusableElements = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      const activeElement = document.activeElement

      if (!drawerRef.current?.contains(activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? lastElement : firstElement).focus()
        return
      }

      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
          !prefersReducedMotion && 'animate-fade-in',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        ref={drawerRef}
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-72 border-l border-border-1 bg-bg-1 shadow-2xl',
          !prefersReducedMotion && 'animate-slide-in-right',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
      >
        {/* Close button */}
        <div className="flex h-16 items-center justify-end border-b border-border-1 px-4">
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
            aria-label="Close menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
          {navItems.map((item, index) => {
            const isActive = currentPath === item.href || currentPath?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'min-h-11 rounded-lg px-4 py-3 text-base font-medium transition-all',
                  !prefersReducedMotion && 'stagger-item',
                  isActive
                    ? 'bg-warm/10 text-warm border-l-2 border-warm'
                    : 'text-text-2 hover:bg-surface-1 hover:text-text-1 hover:translate-x-1',
                )}
                style={!prefersReducedMotion ? { animationDelay: `${index * 50}ms` } : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Secondary links */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border-1 p-4">
          <div className="flex flex-col gap-1">
            <Link
              href="/now"
              onClick={onClose}
              className="min-h-11 px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
            >
              Now
            </Link>
            {isNewsletterEnabled && (
              <Link
                href="/subscribe"
                onClick={onClose}
                className="min-h-11 px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
              >
                Subscribe
              </Link>
            )}
            <Link
              href="/colophon"
              onClick={onClose}
              className="min-h-11 px-4 py-2 text-sm text-text-3 transition-colors hover:text-text-2"
            >
              Colophon
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
