'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import '@/components/stack/gate-author.css'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

/* ── Ch.7 · precept 02 — who writes the gate ───────────────────
   One implementation, one bug, two authors. The bug never moves.
   The gate flips from green to red purely on who wrote the
   assertion, which is the whole precept in one control.

   The gate pills deliberately reuse the gauntlet's .gates/.gate
   classes from stack.css so this reads as that figure continued
   rather than a second, unrelated gate widget. */

type Author = 'impl' | 'fresh'
type GateState = 'idle' | 'running' | 'pass' | 'fail'

const GATES = ['lint + types', 'unit tests', 'gate verdict'] as const

/** The implementation under test. Line 3 is the flaw, in both branches. */
const IMPL: { n: number; text: string; flaw?: boolean }[] = [
  { n: 1, text: 'export function pageSlice(items, page, size) {' },
  { n: 2, text: '  const start = page * size' },
  { n: 3, text: '  const end = start + size + 1', flaw: true },
  { n: 4, text: '  return items.slice(start, end)' },
  { n: 5, text: '}' },
]

const TESTS: Record<Author, { note: string; lines: string[]; hi: number }> = {
  impl: {
    note: 'It ran the function, saw five items come back, and wrote five down.',
    lines: [
      "test('pageSlice returns a page', () => {",
      '  const page = pageSlice(list10, 0, 4)',
      '  expect(page).toHaveLength(5)',
      '})',
    ],
    hi: 2,
  },
  fresh: {
    note: 'It read the brief, wrote the assertion from the brief, and never ran the code first.',
    lines: [
      "test('a page holds exactly `size` items', () => {",
      '  const page = pageSlice(list10, 0, 4)',
      '  expect(page).toHaveLength(4)',
      '})',
    ],
    hi: 2,
  },
}

const ARIA: Record<Author, string> = {
  impl: 'Gate authored by the implementer. The test asserts a length of five, which is the length the off-by-one on line three actually produces. All three gates pass.',
  fresh:
    'Gate authored by a fresh window from the brief. The test asserts a length of four, which is the length the brief specifies. The unit-test gate fails and names line three — the same line, unchanged.',
}

export function GateAuthorFigure() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [author, setAuthor] = useState<Author>('impl')
  const [states, setStates] = useState<GateState[]>(() => GATES.map(() => 'idle'))
  const [userRun, setUserRun] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const nudged = useRef(false)

  const settle = useCallback((who: Author) => {
    setStates(who === 'impl' ? ['pass', 'pass', 'pass'] : ['pass', 'fail', 'fail'])
    setPhase('done')
  }, [])

  const run = useCallback(
    (who: Author) => {
      clearAll()
      if (reduced) {
        // Reduced motion still gets the whole argument: jump to the finished verdict.
        settle(who)
        return
      }
      setStates(GATES.map(() => 'idle'))
      setPhase('running')
      const failAt = who === 'impl' ? -1 : 1
      const advance = (i: number) => {
        if (i >= GATES.length) {
          setPhase('done')
          return
        }
        setStates((prev) => prev.map((s, j) => (j === i ? 'running' : s)))
        schedule(() => {
          if (i >= failAt && failAt >= 0) {
            setStates((prev) => prev.map((s, j) => (j >= failAt ? 'fail' : s)))
            setPhase('done')
            return
          }
          setStates((prev) => prev.map((s, j) => (j === i ? 'pass' : s)))
          advance(i + 1)
        }, 540)
      }
      advance(0)
    },
    [clearAll, reduced, schedule, settle],
  )

  const pick = useCallback(
    (who: Author) => {
      setAuthor(who)
      clearAll()
      if (phase === 'idle' && !reduced) {
        setStates(GATES.map(() => 'idle'))
        return
      }
      run(who)
    },
    [clearAll, phase, reduced, run],
  )

  // A mid-run flip to reduced motion must land on the finished picture, not freeze.
  useEffect(() => {
    if (!reduced) return
    clearAll()
    settle(author)
  }, [reduced, author, clearAll, settle])

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || nudged.current) return
    nudged.current = true
    schedule(() => run('impl'), 700)
  }, 0.35)

  const t = TESTS[author]
  const failed = states[1] === 'fail'
  const shown = phase !== 'idle'

  const stateLabel = (s: GateState): string => {
    if (s === 'idle') return 'idle'
    if (s === 'running') return 'running'
    return s === 'fail' ? 'blocked' : 'pass'
  }

  return (
    <div
      className="ga rv"
      ref={figRef}
      onPointerDown={() => setUserRun(true)}
      onFocusCapture={() => setUserRun(true)}
    >
      <div className="ga-head">
        <span className="t">
          Same file · <b>same bug on line 3</b> · only the author of the test changes
        </span>
        <div className="ga-toggle" role="group" aria-label="Who writes the gate">
          <button
            type="button"
            aria-pressed={author === 'impl'}
            onClick={() => {
              pick('impl')
            }}
          >
            Implementer writes it
          </button>
          <button
            type="button"
            aria-pressed={author === 'fresh'}
            onClick={() => {
              pick('fresh')
            }}
          >
            Fresh window writes it
          </button>
        </div>
      </div>

      <div className="ga-stage">
        <div className="ga-panel ga-impl">
          <div className="ga-panel-head">
            <span className="n">pagination.ts</span>
            <span className="v">shipped by the implementer</span>
          </div>
          <span className="figscroll-hint" aria-hidden="true">
            swipe →
          </span>
          <pre className="ga-code">
            {IMPL.map((l) => (
              <span key={l.n} className={l.flaw ? 'ga-line ga-flaw' : 'ga-line'}>
                <i className="ga-ln" aria-hidden="true">
                  {l.n}
                </i>
                {l.text}
                {l.flaw ? <i className="ga-mark">off by one</i> : null}
              </span>
            ))}
          </pre>
          <p className="ga-obs">
            <b>Observed:</b> <code>pageSlice(list10, 0, 4)</code> returns{' '}
            <code>[0, 1, 2, 3, 4]</code> — <b>length 5</b>.
          </p>
        </div>

        <div className="ga-panel ga-side">
          <div className="ga-brief">
            <div className="ga-panel-head">
              <span className="n">BRIEF §2 · pagination</span>
              <span className="v">what it was asked for</span>
            </div>
            <p>
              A page holds{' '}
              <b>
                exactly <code>size</code> items
              </b>
              . Page 0 of a ten-item list at size 4 holds items 0 through 3.
            </p>
          </div>

          <div className="ga-test">
            <div className="ga-panel-head">
              <span className="n">pagination.test.ts</span>
              <span className="v">
                {author === 'impl' ? 'author: implementer' : 'author: fresh'}
              </span>
            </div>
            <span className="figscroll-hint" aria-hidden="true">
              swipe →
            </span>
            <pre className="ga-code">
              {t.lines.map((line, i) => (
                <span key={line} className={i === t.hi ? 'ga-line ga-assert' : 'ga-line'}>
                  <i className="ga-ln" aria-hidden="true">
                    {i + 1}
                  </i>
                  {line}
                  {i === t.hi ? (
                    <i className="ga-mark ga-mark-soft">
                      {author === 'impl' ? 'from the run' : 'from the brief'}
                    </i>
                  ) : null}
                </span>
              ))}
            </pre>
            <p className="ga-note">{t.note}</p>
          </div>
        </div>
      </div>

      <div
        className={`ga-gates gates${shown ? ' is-on' : ''}`}
        role="img"
        aria-label={ARIA[author]}
      >
        {GATES.map((g, i) => {
          const s = states[i] ?? 'idle'
          return (
            <div
              key={g}
              className={`gate${s === 'running' ? ' active' : ''}${s === 'pass' ? ' pass' : ''}${s === 'fail' ? ' fail' : ''}`}
            >
              <span className="g-n">Gate 0{i + 1}</span>
              <span className="g-t">{g}</span>
              <span className="g-s">{stateLabel(s)}</span>
            </div>
          )
        })}
      </div>

      <div className="ga-out">
        <button
          className="btn"
          type="button"
          onClick={() => {
            run(author)
          }}
        >
          {phase === 'idle' ? 'Run the gate' : 'Run it again'}
        </button>
        <div className="ga-log" aria-live={userRun ? 'polite' : 'off'}>
          {phase === 'idle' ? (
            <>
              The bug is already on the screen. Pick an author, then run the gate and watch it
              decide.
            </>
          ) : failed ? (
            <>
              <span className="x">✗ Blocked — pagination.ts:3.</span> expected length 4, received 5.
              Nothing about the code changed between these two runs.{' '}
              <b>The fresh window had nothing to compare against except what was asked for.</b>
            </>
          ) : (
            <>
              <span className="g">✔ Three gates green.</span> The one test passed, none failed — and the 5 in the
              assertion is the 5 the bug produced.{' '}
              <b>The test was derived from the behaviour, so it can never disagree with it.</b>
            </>
          )}
        </div>
      </div>

      <p className="ga-cap">
        <b>
          A green gate written by the implementer measures the author&apos;s confidence, not the
          code.
        </b>{' '}
        Ask for the gate in a window that has never seen the implementation, and give it the brief
        instead. Field note: an agent on my machine once &quot;cleared&quot; a mail backlog with a
        parser that guessed the wrong key, then verified the clear with the same parser — empty list
        in, empty list out, green check on nothing. The verifier shared a failure mode with the
        thing it verified. A second check with a different instrument caught it in a minute.
      </p>
    </div>
  )
}
