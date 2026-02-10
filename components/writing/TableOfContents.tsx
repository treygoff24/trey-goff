'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentSelector: string
  sourceId?: string
}

function parseHeadingsFromDom(contentSelector: string): TocItem[] {
  const container = document.querySelector(contentSelector)
  if (!container) return []

  const headingElements = Array.from(
    container.querySelectorAll('h1, h2, h3')
  ) as HTMLElement[]

  return headingElements
    .map((heading) => {
      const level = Number(heading.tagName.replace('H', ''))
      const text = heading.textContent?.trim() || ''
      const id = heading.id
      if (!id || !text || !level) return null
      return { id, text, level }
    })
    .filter(Boolean) as TocItem[]
}

export function TableOfContents({ contentSelector, sourceId }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [items, setItems] = useState<TocItem[]>([])

  // Parse headings from rendered DOM
  useEffect(() => {
    setItems(parseHeadingsFromDom(contentSelector))
    setActiveId('')
  }, [contentSelector, sourceId])

  // Track active heading on scroll
  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[]

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [items])

  if (items.length < 2) {
    return null
  }

  return (
    <nav className="hidden lg:block" aria-label="Table of contents">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
          On this page
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
            >
              <a
                href={`#${item.id}`}
                className={cn(
                  'block text-sm transition-colors hover:text-text-1',
                  activeId === item.id
                    ? 'text-warm font-medium'
                    : 'text-text-3'
                )}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

// Mobile TOC dropdown - intentionally simpler than desktop version.
// No active heading tracking since mobile uses a collapsible dropdown
// that closes on selection, making scroll-based highlighting unnecessary.
export function MobileTableOfContents({
  contentSelector,
  sourceId,
}: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    setItems(parseHeadingsFromDom(contentSelector))
  }, [contentSelector, sourceId])

  if (items.length < 2) {
    return null
  }

  return (
    <div className="mb-8 lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border-1 bg-surface-1 px-4 py-3"
        aria-expanded={isOpen}
      >
        <span className="font-satoshi text-sm font-medium text-text-2">
          On this page
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-text-3 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-border-1 bg-surface-1 p-4">
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
              >
                <a
                  href={`#${item.id}`}
                  className="block text-sm text-text-2 hover:text-text-1"
                  onClick={() => setIsOpen(false)}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
