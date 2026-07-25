'use client'

import {
  LEDGER_STATES,
  stateLabel,
  verdictColor,
  type LedgerState,
} from '@/components/instruments/ledger-model'

interface SpectrumProps {
  counts: Record<LedgerState, number>
  /** A section's miniature spectrum sits inside a heading and carries no label of its own. */
  mini?: boolean
  label: string
}

/** The ledger at its true proportions, ordered confirmed to debunked with the two off-axis
 *  states held at the end. Decorative in the accessibility tree — the counts are stated in
 *  the chips beneath it and in the section headings. */
export function Spectrum({ counts, mini = false, label }: SpectrumProps) {
  const total = LEDGER_STATES.reduce((sum, state) => sum + counts[state], 0)
  if (total === 0) return null

  return (
    <span
      role="img"
      aria-label={label}
      className={
        mini
          ? 'flex h-1 w-24 gap-px overflow-hidden'
          : 'flex h-3 w-full gap-px overflow-hidden rounded-xs'
      }
    >
      {LEDGER_STATES.filter((state) => counts[state] > 0).map((state) => (
        <span
          key={state}
          style={{ flex: counts[state], backgroundColor: verdictColor(state) }}
          title={`${counts[state]} ${stateLabel(state)}`}
        />
      ))}
    </span>
  )
}
