'use client'

import { useEffect, useRef, useState } from 'react'

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * The starter brief is the one thing on this page a reader is meant to take with
 * them, so it gets a real affordance instead of a manual triple-click selection.
 */
/**
 * The async Clipboard API needs a secure context and a granted permission; where
 * either is missing (embedded previews, older Safari) the legacy selection copy
 * still works, so try both before admitting failure.
 */
async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through to the selection-based path
  }
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0'
  document.body.append(field)
  field.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  field.remove()
  activeElement?.focus()
  return ok
}

export function CopyPrompt({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    setState((await writeClipboard(text)) ? 'copied' : 'failed')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button
      type="button"
      className="js-copy-btn"
      data-state={state === 'idle' ? undefined : state}
      onClick={copy}
    >
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy brief'}
      </span>
    </button>
  )
}
