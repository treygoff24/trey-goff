'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function CodeBlock({ children, className, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const code = extractTextFromChildren(children)
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Extract language from className (e.g., "language-typescript")
  const language = className?.replace('language-', '') || ''

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-border-1 bg-bg-0">
      {/* Header */}
      {(title || language) && (
        <div className="flex items-center justify-between border-b border-border-1 bg-surface-1 px-4 py-2 text-sm">
          <span className="font-mono text-text-3">{title || language}</span>
          <button
            onClick={handleCopy}
            className="text-text-3 transition-colors hover:text-text-2"
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Code */}
      <pre className={cn('overflow-x-auto p-4', className)}>
        <code className={cn('font-mono text-sm', className)}>{children}</code>
      </pre>

      {/* Floating copy button for blocks without header */}
      {!title && !language && (
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md bg-surface-1 p-2 text-text-3 opacity-0 transition-all hover:bg-surface-2 hover:text-text-2 group-hover:opacity-100"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
}

// Helper to extract text from React children
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('')
  }
  if (children && typeof children === 'object' && 'props' in children) {
    const childElement = children as { props: { children?: React.ReactNode } }
    return extractTextFromChildren(childElement.props.children)
  }
  return ''
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
