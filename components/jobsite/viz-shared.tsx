'use client'

/**
 * Pieces both /jobsite figures share: the block vocabulary, the flat grid used
 * for the reduced-motion diagrams, and the legend.
 *
 * The vocabulary is the point. Every block is named for the thing on the site
 * first and the software thing second, because a reader who has never opened a
 * terminal has to be able to read the picture with no tooltips.
 */

export type Kind =
  | 'brief'
  | 'rules'
  | 'file'
  | 'talk'
  | 'dig'
  | 'ledger'
  | 'catalog'
  | 'work'
  | 'note'
  | 'free'

export const KIND_LABEL: Record<Kind, { name: string; real?: string }> = {
  brief: { name: 'Your brief', real: 'the prompt' },
  rules: { name: 'The site rules', real: 'CLAUDE.md' },
  file: { name: 'Blueprints he pulled', real: 'files he opened' },
  talk: { name: 'Everything you two have said', real: 'the conversation' },
  dig: { name: 'Paperwork he dug through', real: 'the searching' },
  ledger: { name: 'Invoice stacks he skimmed', real: 'logs' },
  catalog: { name: 'Catalogues he ruled out', real: 'documentation' },
  work: { name: 'The actual job' },
  note: { name: 'What a runner brought back', real: 'a one-line report' },
  free: { name: 'Empty bench', real: 'room to think' },
}

/** Expands `[kind, count]` runs into one class name per slot, padded with empties. */
export function fill(runs: [Kind, number][], total: number): Kind[] {
  const out: Kind[] = []
  for (const [kind, count] of runs) {
    for (let i = 0; i < count; i += 1) out.push(kind)
  }
  while (out.length < total) out.push('free')
  return out.slice(0, total)
}

/**
 * The flat grid. It is the whole picture under `prefers-reduced-motion` (where
 * every state is drawn at once instead of animated between) and the slot bed
 * the flying blocks land on in the runners figure.
 */
export function CellGrid({
  cells,
  cols,
  dim,
  className = '',
}: {
  cells: Kind[]
  cols: number
  dim?: (index: number) => number
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={`js-vgrid ${className}`.trim()}
      style={{ '--js-vcols': cols } as React.CSSProperties}
    >
      {cells.map((kind, index) => (
        <i
          className={`js-vblk k-${kind}`}
          key={index}
          style={dim ? { opacity: dim(index) } : undefined}
        />
      ))}
    </div>
  )
}

export function Legend({ kinds }: { kinds: Kind[] }) {
  return (
    <p className="js-vlegend">
      {kinds.map((kind) => (
        <span key={kind}>
          <i aria-hidden="true" className={`js-vblk k-${kind}`} />
          {KIND_LABEL[kind].name}
          {KIND_LABEL[kind].real ? <em> · {KIND_LABEL[kind].real}</em> : null}
        </span>
      ))}
    </p>
  )
}
