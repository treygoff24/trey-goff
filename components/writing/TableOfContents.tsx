'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [items, setItems] = useState<TocItem[]>([])

  // Parse headings from content
  useEffect(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    const matches = [...content.matchAll(headingRegex)]

    const tocItems: TocItem[] = matches
      .filter((match) => match[1] && match[2])
      .map((match) => {
        const level = match[1]!.length
        const text = match[2]!.replace(/[*_`]/g, '') // Remove markdown formatting
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        return { id, text, level }
      })

    setItems(tocItems)
  }, [content])

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

// Mobile TOC dropdown
export function MobileTableOfContents({ content }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm
    const matches = [...content.matchAll(headingRegex)]

    const tocItems: TocItem[] = matches
      .filter((match) => match[1] && match[2])
      .map((match) => {
        const level = match[1]!.length
        const text = match[2]!.replace(/[*_`]/g, '')
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        return { id, text, level }
      })

    setItems(tocItems)
  }, [content])

  if (items.length < 2) {
    return null
  }

  return (
    <div className="mb-8 lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border-1 bg-surface-1 px-4 py-3"
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
