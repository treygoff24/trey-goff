'use client'

import { useEffect, useRef, useState } from 'react'

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
  return ok
}

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    if (!(await writeClipboard(text))) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2200)
  }

  return (
    <button
      type="button"
      className="js-copy-btn"
      data-state={copied ? 'copied' : undefined}
      onClick={copy}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy brief'}</span>
    </button>
  )
}
