'use client'

import { useCommandPalette } from '@/components/command/CommandProvider'

export function SearchButton() {
  const { toggle } = useCommandPalette()

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 text-xs text-text-3 transition-colors hover:text-text-2 [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:min-w-[44px]"
    >
      <span>Search</span>
      <kbd className="hidden rounded border border-border-1 bg-surface-1 px-1.5 py-0.5 font-mono text-text-2 [@media(pointer:fine)]:inline">
        ⌘K
      </kbd>
    </button>
  )
}
