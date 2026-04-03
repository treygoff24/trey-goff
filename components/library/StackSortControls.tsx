'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import { SORT_MODES, type SortMode } from '@/lib/library/sorting'

type StackSortControlsProps = {
  activeSort: SortMode
  onSortChange: (mode: SortMode) => void
}

export function StackSortControls({ activeSort, onSortChange }: StackSortControlsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Sort book stacks">
      {SORT_MODES.map((mode) => {
        const active = mode.key === activeSort

        return (
          <motion.button
            key={mode.key}
            type="button"
            aria-pressed={active}
            onClick={() => onSortChange(mode.key)}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              'touch-manipulation rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
              active ? 'bg-warm text-bg-0' : 'bg-surface-1 text-text-2 hover:bg-surface-2',
            )}
          >
            {mode.label}
          </motion.button>
        )
      })}
    </div>
  )
}
