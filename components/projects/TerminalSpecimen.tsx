'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface TerminalSpecimenProps {
  toolName: string
  prompt: string
  capturedAt: string
  body: string
  /**
   * Soft-wrap long lines instead of horizontal scrolling. Use for prose-heavy
   * captures (long JSON string values) whose meaning would otherwise be hidden
   * past the right edge; leave off for tabular output where alignment matters.
   */
  wrap?: boolean
}

/**
 * A typeset capture of a real CLI run — the "imagery" for a command-line
 * tool. The output is genuine, captured on the machine the tool lives on;
 * the capture date is part of the artifact.
 */
export function TerminalSpecimen({
  toolName,
  prompt,
  capturedAt,
  body,
  wrap = false,
}: TerminalSpecimenProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // The fade signals unseen content to the right, so it should only render
  // when the capture actually overflows and the user is not already at the
  // right end. Default to hidden so non-overflowing captures never dim.
  const [showFade, setShowFade] = useState(false)

  const updateFade = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // Inside a closed dossier the subtree is skipped (content-visibility),
    // so scrollWidth/clientWidth report garbage — never latch a fade from
    // that state; the toggle listener re-measures when the dossier opens.
    const dossier = el.closest('details')
    if (dossier && !dossier.open) {
      setShowFade(false)
      return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    setShowFade(maxScroll > 1 && el.scrollLeft < maxScroll - 1)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateFade()
    el.addEventListener('scroll', updateFade, { passive: true })
    const resizeObserver = new ResizeObserver(updateFade)
    resizeObserver.observe(el)
    // When the ancestor dossier <details> closes (e.g. the exclusive
    // accordion opens another row), Chrome skips the subtree via
    // content-visibility and the ResizeObserver never delivers — a fade set
    // while open would stay stuck at opacity 1 even though the capture no
    // longer overflows. Re-measure on every toggle so the fade state always
    // matches the live geometry.
    const dossier = el.closest('details')
    dossier?.addEventListener('toggle', updateFade)
    return () => {
      el.removeEventListener('scroll', updateFade)
      dossier?.removeEventListener('toggle', updateFade)
      resizeObserver.disconnect()
    }
  }, [updateFade])

  return (
    <figure
      className="mt-6 max-w-3xl border-t border-b border-border-1"
      role="group"
      aria-label={`Terminal capture of ${toolName}`}
    >
      <figcaption className="flex items-baseline justify-between gap-4 border-b border-border-1 px-1 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
          Live capture · {toolName}
        </span>
        <span className="shrink-0 whitespace-nowrap font-mono text-[11px] tracking-[0.08em] text-text-3">
          {capturedAt}
        </span>
      </figcaption>
      <div className="relative">
        <div ref={scrollerRef} className="overflow-x-auto px-1 py-4">
          <pre
            className={`font-mono text-[13px] leading-6 text-text-2 ${
              wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : ''
            }`}
          >
            <code>
              <span className="text-warm">$ </span>
              <span className="text-text-1">{prompt}</span>
              {'\n'}
              {body}
            </code>
          </pre>
        </div>
        {/* Right-edge fade: signals that the capture scrolls horizontally on
            narrow viewports where no persistent scrollbar is shown. Shown only
            while there is actually more content to the right. Deliberately no
            CSS transition: a transition kicked off while the row's <details>
            is still closed (subtree not rendered) can get stuck in Chrome and
            freeze the overlay at the wrong opacity. */}
        {showFade && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg-0 to-transparent"
          />
        )}
      </div>
    </figure>
  )
}
