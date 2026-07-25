'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * The one way an instrument opens a modal.
 *
 * Two rules, both learned the hard way. The `<dialog>` stays mounted and is driven by
 * `showModal()`/`close()` — unmounting an open dialog skips the browser's own teardown, so the
 * top layer is torn down without anything being told where focus should land, and the reader
 * is dropped on `<body>` at the top of the page.
 *
 * And focus is returned explicitly rather than left to the native restore. The native path
 * only holds while the element that opened the dialog is still the same node it was; a claim
 * row behind a filter, or a stat inside a re-rendered paragraph, is not, and focus falls to
 * the body again. Capturing the trigger at open and calling it back on close covers both.
 */
export function useModalDialog(open: boolean): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) {
        trigger.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog.showModal()
      }
      return
    }

    if (dialog.open) dialog.close()
    const back = trigger.current
    trigger.current = null
    if (back?.isConnected) back.focus()
  }, [open])

  return ref
}
