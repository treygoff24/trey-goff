'use client'

import { useCallback, useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

interface ModalDismissOptions {
  /**
   * Truthy while the modal is open. Pass the modal's content object rather than a plain
   * boolean to also re-arm the focus trap whenever that content changes.
   */
  open: boolean | object | null | undefined
  /** Close callback */
  onClose: () => void
  /** Container whose focusable children the Tab cycle is confined to */
  containerRef: RefObject<HTMLElement | null>
}

interface ModalDismissHandlers {
  onBackdropClick: (event: React.MouseEvent) => void
  onBackdropKeyDown: (event: React.KeyboardEvent) => void
}

/**
 * Escape-to-close, backdrop-to-close, and a Tab focus trap for a dialog.
 * While open, focus moves to the first focusable child and cycles inside the container.
 */
export function useModalDismiss({
  open,
  onClose,
  containerRef,
}: ModalDismissOptions): ModalDismissHandlers {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const onBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!open || !container) return

    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref identity is stable; re-running on open is the intent
  }, [open])

  return { onBackdropClick, onBackdropKeyDown }
}
