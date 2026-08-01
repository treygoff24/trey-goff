'use client'

import { useCallback, useEffect, useState } from 'react'
import '@/components/stack/ratchet-figure.css'
import { useReducedMotion } from '@/components/stack/hooks'

/* ── Ch.7 · precept 03 · commits ungated, pushes gated ─────────
   Two rails, deliberately asymmetric. The local rail is spammable
   and reversible; the push lane needs a fresh human yes for every
   single trip and forgets it the moment it is spent.

   Everything is derived from integers and fixed tables — no
   clocks, no randomness — so the first paint on the server and
   the first paint in the browser are the same picture. */

/** Fixed, so a bead's identity never changes between renders. */
const SHAS = [
  '9e00afd',
  '4c1b7e2',
  'a30df55',
  '17be9c4',
  'e5820aa',
  'bb4f301',
  '6d9ae18',
  'f21c840',
  '0ac7b6e',
  '73e15df',
]
const MSGS = [
  'wire the parser',
  'fix the off-by-one',
  'rename the helper',
  'add the failing test',
  'make the test pass',
  'drop the dead branch',
  'tighten the types',
  'handle the empty case',
  'inline the wrapper',
  'comment the footgun',
]

const MAX_BEADS = 10

const sha = (i: number) => SHAS[i % SHAS.length] ?? '0000000'
const msg = (i: number) => MSGS[i % MSGS.length] ?? 'work'

type Note = 'idle' | 'work' | 'reset' | 'armed' | 'pushed' | 'refused' | 'full'

const NOTES: Record<Note, string> = {
  idle: 'Nothing has happened yet. Press Work.',
  work: 'Commit landed. Nothing left this machine.',
  reset: 'git reset --hard — the rail rewound. Still nothing left this machine.',
  armed: 'One push authorized. It expires the moment it is spent.',
  pushed: 'Pushed. Consent spent — yesterday’s yes doesn’t count.',
  refused: 'hook: pre-push blocked — no fresh authorization. Ask, then push.',
  full: 'Rail full at ten. Reset to a bead to keep going.',
}

/** The settled argument: work done, an undo taken, one push spent, one refused. */
const REST = { count: 6, pushed: 4, armed: false, note: 'refused' as Note }

export function RatchetFigure() {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const [pushed, setPushed] = useState(0)
  const [armed, setArmed] = useState(false)
  const [note, setNote] = useState<Note>('idle')

  useEffect(() => {
    if (!reduced) return
    // Reduced motion still gets the whole argument, as a labelled static.
    setCount(REST.count)
    setPushed(REST.pushed)
    setArmed(REST.armed)
    setNote(REST.note)
  }, [reduced])

  const work = useCallback(() => {
    if (count >= MAX_BEADS) {
      setNote('full')
      return
    }
    setCount(count + 1)
    setNote('work')
  }, [count])

  // Clicking a bead rewinds to it: that bead survives, everything after it does not.
  const resetTo = useCallback(
    (i: number) => {
      const next = i + 1
      if (next >= count) return
      setCount(next)
      if (pushed > next) setPushed(next)
      setNote('reset')
    },
    [count, pushed],
  )

  const push = useCallback(() => {
    if (!armed) {
      setNote('refused')
      return
    }
    setArmed(false)
    setPushed(count)
    setNote('pushed')
  }, [armed, count])

  const unpushed = count - pushed
  const beads = Array.from({ length: count }, (_, i) => i)

  return (
    <div className="rt rv">
      <div className="rt-rail-head">
        <span className="rt-rail-name">local — your undo</span>
        <span className="rt-rail-meta">
          {count} commit{count === 1 ? '' : 's'} · {unpushed} unpushed
        </span>
      </div>

      <ol className="rt-rail" aria-label="Local commit rail, newest last">
        {beads.map((i) => {
          const isPushed = i < pushed
          const later = count - 1 - i
          return (
            <li key={i} className={isPushed ? 'rt-bead pushed' : 'rt-bead'}>
              <button
                type="button"
                onClick={() => resetTo(i)}
                disabled={later === 0}
                aria-label={
                  later === 0
                    ? `${sha(i)} — ${msg(i)}. Newest commit; nothing to rewind.`
                    : `Reset to ${sha(i)} — ${msg(i)}, discarding ${later} later commit${later === 1 ? '' : 's'}.`
                }
              >
                <span className="rt-sha" aria-hidden="true">
                  {sha(i)}
                </span>
                <span className="rt-msg" aria-hidden="true">
                  {msg(i)}
                </span>
                <span className="rt-tip" aria-hidden="true">
                  {later === 0 ? 'HEAD' : 'reset here'}
                </span>
              </button>
            </li>
          )
        })}
        {count === 0 && <li className="rt-empty">no commits yet</li>}
      </ol>

      <div className="rt-actions">
        <button className="btn" type="button" onClick={work}>
          Work
        </button>
        <span className="rt-hint">Press it as many times as you like. Nobody is asking you.</span>
      </div>

      <div className={armed ? 'rt-push armed' : 'rt-push'}>
        <div className="rt-rail-head">
          <span className="rt-rail-name">push — leaves the building</span>
          <span className={armed ? 'rt-lock open' : 'rt-lock'}>
            {armed ? 'one push authorized' : 'locked'}
          </span>
        </div>
        <div className="rt-actions">
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setArmed(true)
              setNote('armed')
            }}
            disabled={armed}
          >
            Give the go-ahead
          </button>
          <button className="btn" type="button" onClick={push} disabled={unpushed === 0}>
            {unpushed > 0
              ? `Push ${unpushed} commit${unpushed === 1 ? '' : 's'}`
              : 'Nothing to push'}
          </button>
        </div>
      </div>

      <p className={`rt-note ${note}`} aria-live="polite">
        {NOTES[note]}
      </p>

      <p className="rt-cap">
        <b>Commits are my undo;</b> pushes are the only thing that leaves the building.
      </p>
    </div>
  )
}
