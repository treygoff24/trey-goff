'use client'

import { useCallback, useEffect, useState } from 'react'
import '@/components/stack/review-loop-figure.css'
import { useReducedMotion } from '@/components/stack/hooks'

/* ── Ch.7 · precept 05 · what stops a review loop ──────────────
   Two scripted transcripts, no randomness: a loop with a floor
   terminates itself, and a loop without one plateaus and runs
   until a human notices. Rounds are appended by the reader, one
   press at a time, so the plateau is felt rather than asserted. */

type Round = { findings: number; lines: number }

/** A reviewer with a floor: each round has less to find, and round four has none. */
const NORMAL: Round[] = [
  { findings: 9, lines: 124 },
  { findings: 5, lines: 46 },
  { findings: 2, lines: 11 },
  { findings: 0, lines: 0 },
]

/** A reviewer with no floor: it objects to the text the last round just wrote. */
const PEDANTIC: Round[] = [
  { findings: 9, lines: 124 },
  { findings: 6, lines: 58 },
  { findings: 5, lines: 41 },
  { findings: 4, lines: 33 },
  { findings: 4, lines: 29 },
  { findings: 3, lines: 26 },
  { findings: 4, lines: 28 },
  { findings: 3, lines: 24 },
  { findings: 3, lines: 27 },
  { findings: 4, lines: 25 },
  { findings: 3, lines: 23 },
  { findings: 3, lines: 26 },
  { findings: 4, lines: 24 },
  { findings: 3, lines: 25 },
  { findings: 3, lines: 22 },
]

const SCALE = 124

export function ReviewLoopFigure() {
  const reduced = useReducedMotion()
  const [pedantic, setPedantic] = useState(false)
  const [shown, setShown] = useState(1)

  const script = pedantic ? PEDANTIC : NORMAL
  const done = shown >= script.length

  const setMode = useCallback((next: boolean) => {
    setPedantic(next)
    setShown(1)
  }, [])

  useEffect(() => {
    if (!reduced) return
    // The finished transcript is the argument; reduced motion gets it whole.
    setShown(pedantic ? PEDANTIC.length : NORMAL.length)
  }, [reduced, pedantic])

  const rows = script.slice(0, shown)
  const spent = rows.reduce((n, r) => n + r.lines, 0)

  return (
    <div className="rl rv">
      <div className="rl-head">
        <span className="rl-title">review → fix → review</span>
        <div className="toggle" role="group" aria-label="Reviewer temperament">
          <button type="button" aria-pressed={!pedantic} onClick={() => setMode(false)}>
            Reviewer with a floor
          </button>
          <button type="button" aria-pressed={pedantic} onClick={() => setMode(true)}>
            Pedantic reviewer
          </button>
        </div>
      </div>

      <ol className="rl-rounds">
        {rows.map((r, i) => (
          <li key={i} className={r.findings === 0 ? 'rl-round zero' : 'rl-round'}>
            <span className="rl-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="rl-bars">
              <span className="rl-bar find">
                <i style={{ width: `${(r.findings / 9) * 100}%` }} />
                <em>
                  {r.findings} finding{r.findings === 1 ? '' : 's'}
                </em>
              </span>
              <span className="rl-bar churn">
                <i style={{ width: `${(r.lines / SCALE) * 100}%` }} />
                <em>{r.lines} lines changed</em>
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="rl-ctl">
        <button
          className="btn"
          type="button"
          onClick={() => setShown((n) => Math.min(n + 1, script.length))}
          disabled={done}
        >
          Run another round
        </button>
        <span className="rl-meter">
          round {shown} of {pedantic ? '∞' : '4'} · {spent} lines rewritten
        </span>
      </div>

      <div className="rl-verdict" aria-live="polite">
        {done && !pedantic && (
          <p className="rl-stamp ok">
            <b>no changes — done.</b> The loop ended itself: a round that produces nothing to apply
            is the only honest terminator.
          </p>
        )}
        {done && pedantic && (
          <p className="rl-stamp halt">
            <b>stopped at fifteen — by me, not by it.</b> I once let this run fifteen rounds before
            I noticed.
          </p>
        )}
        {!done && pedantic && shown >= 5 && (
          <p className="rl-stamp warn">
            Findings have stopped falling. The churn is the loop reviewing its own last edit.
          </p>
        )}
      </div>

      <p className="rl-cap">
        <b>The newest text is always the least-reviewed,</b> so a loop with no floor never runs out
        of things to find.
      </p>
    </div>
  )
}
