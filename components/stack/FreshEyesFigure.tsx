'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import '@/components/stack/fresh-eyes.css'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'

/* ── Ch.7 · precept 04 — review with something that did not write it ──
   One diff, one planted bug, three reviewers. The argument is the
   PEEL: the author's own justifications are pinned to the diff as a
   translucent sheet, and moving to a fresh window lifts that sheet
   off in one piece. Same diff, explanations gone — and the defective
   line becomes the only line nobody has explained.

   The sheet occupies its own interleaved rows under the lines it
   defends — never on top of them — and holds those rows through
   CSS subgrid, so it stays a single transformable element. Detached,
   it leaves the slots it used to fill visibly empty.

   The context window at left reuses the page's cell-grid idiom
   (Ch.1 ContextFigure, Ch.5 SubagentSavings) so "full" and "nearly
   empty" read instantly. Colour classes carry an f- prefix so they
   never collide with the c- or s- cells elsewhere. */

type Who = 'author' | 'fresh' | 'other'

const CELLS = 120

type Seg = [cls: string, count: number, label: string]

const WINDOWS: Record<Who, { label: string; used: string; segs: Seg[] }> = {
  author: {
    label: 'the agent that wrote the diff',
    used: '164k / 200k',
    segs: [
      ['f-sys', 6, 'System + tools'],
      ['f-plan', 22, 'Its own plan'],
      ['f-fail', 30, 'Two failed attempts'],
      ['f-tool', 34, 'Tool output it accumulated'],
      ['f-diff', 6, 'The diff'],
    ],
  },
  fresh: {
    label: 'a fresh window, same model',
    used: '9k / 200k',
    segs: [
      ['f-sys', 6, 'System + tools'],
      ['f-diff', 6, 'The diff'],
    ],
  },
  other: {
    label: 'a fresh window, different model family',
    used: '9k / 200k',
    segs: [
      ['f-sys', 6, 'System + tools'],
      ['f-diff', 6, 'The diff'],
    ],
  },
}

const CHOICES: { key: Who; t: string }[] = [
  { key: 'author', t: 'The author itself' },
  { key: 'fresh', t: 'Fresh window, same model' },
  { key: 'other', t: 'Different family' },
]

type DiffLine = { sign: ' ' | '+' | '-'; text: string; bug?: boolean }

const DIFF: DiffLine[] = [
  { sign: ' ', text: 'export function mergeConfig(base, override) {' },
  { sign: '-', text: '  return { ...base, ...override }' },
  { sign: '+', text: '  const out = { ...base }' },
  { sign: '+', text: '  for (const k of Object.keys(override)) {' },
  {
    sign: '+',
    text: '    if (override[k] !== undefined) out[k] = override[k]',
  },
  { sign: '+', text: '  }' },
  {
    sign: '+',
    text: '  out.headers = override.headers ?? base.headers',
    bug: true,
  },
  { sign: '+', text: '  return out' },
  { sign: ' ', text: '}' },
]

/** Justifications the author still has in its window, pinned to the lines they defend. */
const NOTES: { row: number; text: string; onBug?: boolean }[] = [
  { row: 2, text: 'shallow copy — callers never mutate what we hand back' },
  { row: 4, text: 'the undefined-skip is deliberate, it came from the brief' },
  { row: 6, text: 'intentional, matches the helper above', onBug: true },
  { row: 7, text: 'no clone needed, `out` is already fresh' },
]

/** Row map: every diff line gets a row, and an annotated line gets a second one
    under it for its note. Both halves address the same grid. */
const ROWS = (() => {
  const line: number[] = []
  const note: Record<number, number> = {}
  let r = 1
  DIFF.forEach((_, i) => {
    line[i] = r
    r += 1
    if (NOTES.some((n) => n.row === i)) {
      note[i] = r
      r += 1
    }
  })
  return { line, note, total: r - 1 }
})()

/** Backticked spans in the prose are real inline code, not literal backticks. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/`([^`]+)`/)
        .map((part, i) =>
          i % 2 === 1 ? <code key={i}>{part}</code> : <span key={i}>{part}</span>,
        )}
    </>
  )
}

type Finding = { tone: 'ok' | 'flag' | 'note'; head: string; body: string }

const FINDINGS: Record<Who, Finding[]> = {
  author: [
    {
      tone: 'ok',
      head: '0 findings — reads consistent',
      body: 'Every line matches something already in the window: a plan step, an earlier decision, or a helper it wrote an hour ago. Nothing looks unexplained, because nothing is.',
    },
  ],
  fresh: [
    {
      tone: 'flag',
      head: 'line 7 — headers replaced, not merged',
      body: '`override.headers ?? base.headers` drops every base header the moment a caller passes one of its own. The rest of the function merges key by key; this line does not.',
    },
  ],
  other: [
    {
      tone: 'flag',
      head: 'line 7 — headers replaced, not merged',
      body: '`override.headers ?? base.headers` drops every base header the moment a caller passes one of its own. The rest of the function merges key by key; this line does not.',
    },
    {
      tone: 'flag',
      head: 'line 4 — `Object.keys` carries `__proto__` through',
      body: 'Untrusted override objects can write `__proto__` or `constructor` straight onto `out`. A whole class of finding, not a slip on one line — and the same-family reviewer never raised it.',
    },
    {
      tone: 'note',
      head: 'why the second flag needed a second family',
      body: 'A fresh window of the same model shares the author’s priors about what is worth looking at. It reliably catches the local mistake and reliably skips the same categories. Decorrelated error is the entire reason to pay for a different vendor.',
    },
  ],
}

const ARIA: Record<Who, string> = {
  author:
    'The author reviewing its own diff. Its context window is 164 of 200 thousand tokens full — plan, two failed attempts and accumulated tool output — and a translucent sheet of its own justifications is pinned line by line onto the diff, including the defective line seven, labelled “intentional, matches the helper above”. It reports zero findings.',
  fresh:
    'A fresh window of the same model. The justification sheet has peeled away from the diff; the diff is unchanged. The window holds 9 of 200 thousand tokens. Line seven is now the only line with no explanation attached and is flagged: headers are replaced rather than merged.',
  other:
    'A fresh window of a different model family. The justification sheet is gone, the diff is unchanged, and two findings are raised: the replaced headers on line seven, and a class of bug the same-family reviewer missed entirely — Object.keys carrying a prototype key through onto the result.',
}

function cellClasses(who: Who): string[] {
  const out: string[] = []
  for (const [cls, count] of WINDOWS[who].segs) {
    for (let i = 0; i < count; i += 1) out.push(cls)
  }
  while (out.length < CELLS) out.push('f-free')
  return out.slice(0, CELLS)
}

/** One reviewer, whole. Rendered once when interactive, three times side by side when reduced. */
function ReviewerPanel({
  who,
  attached,
  reduced,
  compact,
}: {
  who: Who
  attached: boolean
  reduced: boolean
  compact: boolean
}) {
  const win = WINDOWS[who]
  const cells = cellClasses(who)
  return (
    <div
      className={compact ? 'fe-panel fe-compact' : 'fe-panel'}
      role={compact ? 'img' : undefined}
      aria-label={compact ? ARIA[who] : undefined}
    >
      {compact ? (
        <div className="fe-compact-head">
          <span className="n">{CHOICES.find((c) => c.key === who)?.t}</span>
          <span className={attached ? 'fe-chip fe-chip-on' : 'fe-chip'}>
            overlay {attached ? 'attached' : 'detached'}
          </span>
        </div>
      ) : null}

      <div className="fe-win">
        <div className="fe-win-head">
          <span className="n">reviewer context</span>
          <span className="v">{win.used}</span>
        </div>
        <div className="fe-cells" aria-hidden="true">
          {cells.map((cls, i) => (
            <i
              key={i}
              className={cls}
              style={reduced ? undefined : { transitionDelay: `${(i * 2.4).toFixed(0)}ms` }}
            />
          ))}
        </div>
        <p className="fe-win-cap">{win.label}</p>
      </div>

      <div className="fe-diffwrap">
        <div className="fe-win-head">
          <span className="n">config.ts</span>
          <span className="v">+7 −1</span>
        </div>
        {/* The sheet spans 1 / -1, which only resolves against explicit tracks. */}
        <div className="fe-diff" style={{ '--fe-rows': ROWS.total } as React.CSSProperties}>
          {DIFF.map((l, i) => {
            const unexplained = l.bug && !attached
            return (
              <span
                key={l.text}
                className={`fe-l fe-s${l.sign === '+' ? 'add' : l.sign === '-' ? 'del' : 'ctx'}${
                  unexplained ? ' fe-unexplained' : ''
                }${attached ? ' fe-vouched' : ''}`}
                style={{ gridRow: ROWS.line[i] }}
              >
                <i className="fe-ln" aria-hidden="true">
                  {i + 1}
                </i>
                <i className="fe-sg" aria-hidden="true">
                  {l.sign}
                </i>
                {l.text}
              </span>
            )
          })}

          {/* One sheet, one element: the peel has to read as a single object
              lifting off, not four notes fading independently. Subgrid lets it
              hold interleaved rows without ever covering a line of code. */}
          <div className={attached ? 'fe-sheet is-on' : 'fe-sheet'} aria-hidden="true">
            {NOTES.map((n) => (
              <span
                key={n.row}
                className={n.onBug ? 'fe-note fe-note-bug' : 'fe-note'}
                style={{ gridRow: ROWS.note[n.row] }}
              >
                <Rich text={n.text} />
              </span>
            ))}
          </div>
        </div>
        <p className="fe-diff-cap">
          {attached ? (
            <>
              <b>Every line is spoken for.</b> The explanations are not in the diff — they are in
              the window of the thing that wrote it.
            </>
          ) : (
            <>
              <b>Same diff. The explanations are gone.</b> Line 7 is now the only line nobody has
              accounted for.
            </>
          )}
        </p>
      </div>

      <div className="fe-findings">
        {FINDINGS[who].map((f) => (
          <div key={f.head} className={`fe-find fe-tone-${f.tone}`}>
            <span className="h">
              <i aria-hidden="true">{f.tone === 'ok' ? '✔' : f.tone === 'flag' ? '✗' : '·'}</i>
              <Rich text={f.head} />
            </span>
            <p>
              <Rich text={f.body} />
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FreshEyesFigure() {
  const reduced = useReducedMotion()
  const { schedule, clearAll } = useTimeouts()
  const [who, setWho] = useState<Who>('author')
  const nudged = useRef(false)

  const pick = useCallback(
    (next: Who) => {
      clearAll()
      setWho(next)
    },
    [clearAll],
  )

  // The nudge can be in flight when the motion preference flips.
  useEffect(() => {
    if (reduced) clearAll()
  }, [reduced, clearAll])

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || nudged.current) return
    nudged.current = true
    schedule(() => setWho('fresh'), 2800)
  }, 0.3)

  return (
    <div className="fe rv" ref={figRef}>
      <div className="fe-head">
        <span className="t">
          One diff · <b>one planted bug on line 7</b> · three reviewers
        </span>
        {!reduced && (
          <div className="fe-toggle" role="group" aria-label="Who reviews the diff">
            {CHOICES.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={who === c.key}
                onClick={() => pick(c.key)}
              >
                {c.t}
              </button>
            ))}
          </div>
        )}
      </div>

      {reduced ? (
        // Reduced motion gets the whole argument as three settled states,
        // overlay attached beside overlay detached — no peel required.
        <div className="fe-static">
          {CHOICES.map((c) => (
            <ReviewerPanel key={c.key} who={c.key} attached={c.key === 'author'} reduced compact />
          ))}
        </div>
      ) : (
        <div className="fe-stage" role="img" aria-label={ARIA[who]}>
          <ReviewerPanel who={who} attached={who === 'author'} reduced={false} compact={false} />
        </div>
      )}

      <p className="fe-cap">
        <b>
          The author is not lazy. It is contaminated — the justification is still in the window.
        </b>{' '}
        It cannot read the diff as a stranger would, because it is not reading the diff. It is
        reading the diff plus every reason it had for writing it that way. Emptying the window is
        what buys you a real second opinion; changing vendor is what buys you a second set of blind
        spots.
      </p>
    </div>
  )
}
