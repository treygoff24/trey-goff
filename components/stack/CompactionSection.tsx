'use client'

import { useState } from 'react'
import '@/components/stack/compaction.css'
import { useReducedMotion } from '@/components/stack/hooks'
import { WhyCompaction } from '@/components/stack/WhyCompaction'

/* ── Ch.1 · compaction / attention-by-position figure ──────── */

const CELL_COUNT = 320
const FILLED = 288

/**
 * Liu et al. retrieval accuracy by document position: 1st, 5th, 10th, 15th,
 * 20th of 20. The dip in the middle is the whole point of the figure.
 */
const CURVE: [number, number][] = [
  [0, 75.8],
  [4 / 19, 57.2],
  [9 / 19, 53.8],
  [14 / 19, 55.4],
  [1, 63.2],
]

const ACC_HI = 75.8
const ACC_LO = 30

function accuracyAt(t: number): number {
  for (let i = 1; i < CURVE.length; i += 1) {
    const a = CURVE[i - 1]
    const b = CURVE[i]
    if (!a || !b) break
    if (t <= b[0]) {
      const span = b[0] - a[0]
      const f = span === 0 ? 0 : (t - a[0]) / span
      return a[1] + (b[1] - a[1]) * f
    }
  }
  return CURVE[CURVE.length - 1]?.[1] ?? ACC_HI
}

function opacityFor(acc: number): number {
  const f = Math.min(1, Math.max(0, (acc - ACC_LO) / (ACC_HI - ACC_LO)))
  // Gamma-deepen the trough: linear mapping left the middle reading as
  // "slightly less green" on real pixels instead of visibly dim.
  return 0.1 + Math.pow(f, 1.7) * 0.9
}

/**
 * Two readings of the same curve. The million-token version pulls every
 * position toward the trough (`pull`) and deepens the deficit (`drop`), which
 * is what the benchmark curves actually do as the window grows.
 */
function buildCells(pull: number, drop: number): number[] {
  const out: number[] = []
  for (let i = 0; i < FILLED; i += 1) {
    const t = i / (FILLED - 1)
    const warped = Math.min(1, Math.max(0, 0.5 + (t - 0.5) * pull))
    const acc = ACC_HI - (ACC_HI - accuracyAt(warped)) * drop
    out.push(opacityFor(acc))
  }
  return out
}

type ScaleKey = 'k200' | 'm1'

type Scale = {
  key: ScaleKey
  toggle: string
  head: string
  perCell: string
  cells: number[]
  mark?: { at: number; label: string }
  caption: React.ReactNode
  aria: string
}

const SCALES: Scale[] = [
  {
    key: 'k200',
    toggle: '200k window',
    head: 'A 200,000-token window, ~180k of it spent',
    perCell: 'one cell ≈ 625 tokens',
    cells: buildCells(1, 1),
    caption: (
      <>
        <b>The middle is the dim part. </b>Recall is strongest at the very start of the window and
        partly recovers at the very end, and everything between those two edges is read less well.
        The dim band is not a rounding error: it is most of the window.
      </>
    ),
    aria: 'Grid of 320 cells representing a 200,000-token context window filled to about 180,000 tokens. Cell brightness tracks measured retrieval accuracy by position: brightest at the start, dimmest across the middle stretch, partly recovering toward the end. The dim middle is where most of a working session sits.',
  },
  {
    key: 'm1',
    toggle: '1M window',
    head: 'The same grid at 1,000,000 tokens',
    perCell: 'one cell ≈ 3,125 tokens',
    cells: buildCells(0.72, 1.45),
    mark: { at: 0.5, label: 'where I compact' },
    caption: (
      <>
        <b>Five times the room, and the trough grows to match. </b>The bright edges stay about where
        they were; the dim stretch between them gets wider and darker. I put my compaction line at
        the half-window mark, which on this grid is where the floor has already arrived.
      </>
    ),
    aria: 'The same 320-cell grid rescaled to a 1,000,000-token window. The dim middle band is wider and darker than in the 200,000-token view, the bright edges are unchanged, and a marker at the halfway point is labelled "where I compact".',
  },
]

export function CompactionSection() {
  const reduced = useReducedMotion()
  const [scale, setScale] = useState<ScaleKey>('k200')

  return (
    <>
      <p>
        A context window does not fail at the moment it fills up. It gets worse on the way there.
        Anthropic says so in its own documentation:{' '}
        <b>as a conversation grows, response quality degrades. </b>The window is a budget, and the
        last tokens in it are worth much less than the first.
      </p>
      <p>
        So I compact early. On million-token models I set auto-compaction somewhere around the
        half-million mark, and in an interactive session I usually compact by hand at 300–400k
        without waiting to be told. That is not superstition. Several frontier models take their
        single largest benchmark drop exactly as context crosses half the window — on Context
        Arena&apos;s GDM-MRCRv2 board, 6 of 12 frontier configurations have their biggest adjacent
        fall at the 256k-to-512k step, and Opus 4.8 goes from 61.8 to 39.8 across it.
      </p>

      <figure className="cmp rv">
        <div className="cmp-head">
          <span className="t">Retrieval accuracy by position</span>
          <div className="toggle" role="group" aria-label="Window size">
            {SCALES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={scale === s.key}
                onClick={() => setScale(s.key)}
              >
                {s.toggle}
              </button>
            ))}
          </div>
        </div>

        <div className="cmp-stack">
          {SCALES.map((s) => {
            const on = s.key === scale
            return (
              <div
                key={s.key}
                className={on ? 'cmp-state is-on' : 'cmp-state'}
                aria-hidden={on ? undefined : true}
              >
                <p className="cmp-scale">
                  <b>{s.head}</b> · {s.perCell}
                </p>
                <div className="cmp-plot" role="img" aria-label={s.aria}>
                  <div className="cmp-cells">
                    {Array.from({ length: CELL_COUNT }, (_, i) => {
                      const o = s.cells[i]
                      if (o === undefined) return <i key={i} className="cmp-cell cmp-free" />
                      return (
                        <i
                          key={i}
                          className="cmp-cell"
                          style={{
                            opacity: o,
                            transitionDelay: reduced ? undefined : `${(i * 1.4).toFixed(1)}ms`,
                          }}
                        />
                      )
                    })}
                  </div>
                  {s.mark && (
                    <span className="cmp-mark" style={{ left: `${s.mark.at * 100}%` }}>
                      <span className="cmp-mark-t">{s.mark.label}</span>
                    </span>
                  )}
                </div>
                <div className="cmp-axis" aria-hidden="true">
                  <span>start of window</span>
                  <span className="cmp-axis-mid">the dim middle</span>
                  <span>most recent</span>
                </div>
                <p className="cmp-note">
                  <span className="k">Read the trough</span>
                  This dim band is where most of your actual work history ends up — the file you
                  read an hour ago, the decision you made two hundred messages back. Which is the
                  whole argument for front-loading the durable material.
                </p>
                {/* Styled as the caption but a <p>: a real <figcaption> may only
                    be a direct child of <figure>, and the grid-stack means two
                    of these exist at once. */}
                <p className="cmp-cap">{s.caption}</p>
              </div>
            )
          })}
        </div>

        <p className="cmp-foot">
          * Brightness here shows measured retrieval accuracy by position, not literal attention
          weights. Real attention is spikier and stranger than this — per-head{' '}
          <a href="https://arxiv.org/abs/2309.17453" target="_blank" rel="noopener noreferrer">
            sinks
          </a>{' '}
          that dump probability mass on the first token{' '}
          <a href="https://arxiv.org/abs/2504.02732" target="_blank" rel="noopener noreferrer">
            for reasons that are still being argued about
          </a>
          , and mostly-local routing in between. The position curve is from{' '}
          <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer">
            Lost in the Middle
          </a>
          .
        </p>
      </figure>

      <p>
        The practical consequence is a packing order. Attention favors the edges, so the durable
        material goes up front — CLAUDE.md, the skills that matter, the standing brief. Put there,
        it sits where recall is strongest, and it is also the part most likely to survive a
        compaction intact. The transient stuff can live in the middle and be summarized away; that
        is what it is for.
      </p>

      <div className="callout rv">
        <span className="k">The escape hatch</span>
        Sometimes the task genuinely needs a million tokens in one window — a whole codebase, a
        stack of transcripts, a diff nobody can chunk sensibly. Then use them.{' '}
        <b>Just use them knowingly. </b>You are trading recall of the middle for coverage of the
        whole, and the model will not tell you which detail it quietly lost.
      </div>

      <WhyCompaction />
    </>
  )
}
