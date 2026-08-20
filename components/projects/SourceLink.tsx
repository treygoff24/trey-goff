'use client'

import type { ReactNode } from 'react'

interface SourceLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function SourceLink({ href, children, className }: SourceLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  )
}
