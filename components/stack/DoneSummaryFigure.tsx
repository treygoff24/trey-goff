'use client'

import { useState, type CSSProperties } from 'react'
import '@/components/stack/done-summary.css'
import { useReducedMotion } from '@/components/stack/hooks'

/* ── Ch.6 · never trust a done summary ─────────────────────────
   The callout above is one line of advice. This is the felt
   version: a completion report that is plausible, confident, and
   wrong in exactly the place these things are always wrong.

   The reader is offered a real choice and most will take the
   cheap one — which IS the lesson, so believing is a first-class
   path here, not a dead end. State is one integer; the whole
   figure is server-renderable at 0. */

type Mode = 0 | 1 | 2 // 0 idle · 1 believed · 2 checked

type Line = { sign: '+' | '-' | ' '; text: string }

type Claim = {
  id: string
  /** What the subagent said it did. */
  said: string
  /** True once the disk is consulted. */
  real: boolean
  file: string
  hunk: Line[]
  note: string
}

const CLAIMS: Claim[] = [
  {
    id: 'c1',
    said: 'Extracted resolveLane() out of the 340-line dispatcher.',
    real: true,
    file: 'lib/dispatch/lane.ts',
    hunk: [
      { sign: '+', text: 'export function resolveLane(job: Job): Lane {' },
      { sign: '+', text: '  return LANES[job.kind] ?? LANES.default' },
      { sign: '+', text: '}' },
    ],
    note: '+31 / −24 · new file, exported, imported by the dispatcher',
  },
  {
    id: 'c2',
    said: 'Moved the retry policy onto the lane record.',
    real: true,
    file: 'lib/dispatch/dispatcher.ts',
    hunk: [
      { sign: '-', text: 'const policy = retryPolicy(job.kind)' },
      { sign: '+', text: 'const policy = lane.retry' },
    ],
    note: '+8 / −14 · retryPolicy() has no callers left',
  },
  {
    id: 'c3',
    said: 'Threaded deadline through both dispatch paths.',
    real: true,
    file: 'lib/dispatch/dispatcher.ts',
    hunk: [
      { sign: '-', text: 'dispatch(job, lane)' },
      { sign: '+', text: 'dispatch(job, lane, deadline)' },
    ],
    note: '+12 / −9 · both paths, signature updated',
  },
  {
    id: 'c4',
    said: 'Updated the four remaining call sites in worker/pool.ts.',
    real: false,
    file: 'worker/pool.ts',
    hunk: [
      { sign: ' ', text: '  88 │ dispatch(job, lane)' },
      { sign: ' ', text: ' 142 │ dispatch(job, lane)' },
      { sign: ' ', text: ' 197 │ dispatch(job, lane)' },
      { sign: ' ', text: ' 233 │ dispatch(job, lane)' },
    ],
    note: 'git diff is empty for this file. Four call sites still on the old signature.',
  },
  {
    id: 'c5',
    said: 'Added a regression test for the timeout path.',
    real: false,
    file: 'test/pool.test.ts',
    hunk: [
      { sign: ' ', text: "test('routes by kind', …)" },
      { sign: ' ', text: "test('retries twice', …)" },
    ],
    note: 'Last modified six days ago. No test names contain deadline or timeout.',
  },
]

/** Where the run actually spent itself. Percentages of one task duration. */
const RUNWAY: { label: string; pct: number }[] = [
  { label: 'reading the dispatcher', pct: 27 },
  { label: 'the extraction', pct: 24 },
  { label: 'the retry policy', pct: 17 },
  { label: 'the deadline', pct: 14 },
]
const SPENT = RUNWAY.reduce((n, s) => n + s.pct, 0)

function Mark({ ok }: { ok: boolean }) {
  return (
    <svg className="ds-mark" viewBox="0 0 16 16" aria-hidden="true">
      {ok ? (
        <path d="M3.5 8.4 L6.6 11.5 L12.5 4.8" />
      ) : (
        <>
          <path d="M4.6 4.6 L11.4 11.4" />
          <path d="M11.4 4.6 L4.6 11.4" />
        </>
      )}
    </svg>
  )
}

export function DoneSummaryFigure() {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<Mode>(0)
  const checked = mode === 2
  const believed = mode === 1

  const delay = (i: number) => (reduced ? '0ms' : `${i * 170}ms`)

  return (
    <div className="dsf rv">
      <p className="ds-head">
        Wave 3 · <b>lane refactor</b> · one Opus subagent, 41 minutes
      </p>

      <div className="ds-grid">
        {/* ── The report ── */}
        <div className={`ds-card ds-report${believed ? ' is-believed' : ''}`}>
          <div className="ds-card-head">
            <span className="n">subagent · refactor</span>
            <span className={`ds-status${believed ? ' is-ok' : ''}${checked ? ' is-bad' : ''}`}>
              {checked ? '2 claims unmet' : believed ? 'merged' : 'reported done'}
            </span>
          </div>

          <p className="ds-report-lede">
            Done. The dispatcher is split, the retry policy lives on the lane record, and everything
            downstream is updated and covered.
          </p>

          <ul className="ds-claims">
            {CLAIMS.map((c, i) => {
              const failed = checked && !c.real
              return (
                <li
                  key={c.id}
                  className={`ds-claim${failed ? ' is-failed' : ''}`}
                  style={{ '--ds-d': delay(i) } as CSSProperties}
                >
                  <span className={`ds-tick${failed ? ' is-bad' : ''}`}>
                    <Mark ok={!failed} />
                  </span>
                  <span className="ds-claim-text">
                    {c.said}
                    <i className="ds-strike" />
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="ds-acts">
            {mode === 0 ? (
              <>
                <button type="button" className="ds-btn" onClick={() => setMode(1)}>
                  Believe it
                </button>
                <button type="button" className="ds-btn is-primary" onClick={() => setMode(2)}>
                  Check the disk
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ds-btn" onClick={() => setMode(0)}>
                  Start over
                </button>
                {believed ? (
                  <button type="button" className="ds-btn is-primary" onClick={() => setMode(2)}>
                    Check it anyway
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* ── The disk ── */}
        <div className={`ds-card ds-disk${checked ? ' is-on' : ''}`} aria-live="polite">
          <div className="ds-card-head">
            <span className="n">the disk</span>
            <span className="v">git diff HEAD</span>
          </div>

          {checked ? (
            <ul className="ds-files">
              {CLAIMS.map((c, i) => (
                <li
                  key={c.id}
                  className={`ds-file${c.real ? ' is-ok' : ' is-bad'}`}
                  style={{ '--ds-d': delay(i) } as CSSProperties}
                >
                  <div className="ds-file-head">
                    <code>{c.file}</code>
                    <span className="ds-verdict">{c.real ? 'verified' : 'not on disk'}</span>
                  </div>
                  <pre className="ds-hunk">
                    {c.hunk.map((l, j) => (
                      <span key={j} className={l.sign === '+' ? 'a' : l.sign === '-' ? 'r' : 'u'}>
                        {l.sign === ' ' ? '' : l.sign}
                        {l.text}
                        {'\n'}
                      </span>
                    ))}
                  </pre>
                  <p className="ds-file-note">{c.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="ds-empty">
              {believed
                ? 'Still unread. The branch is merged and the summary is the only record of what happened.'
                : 'Nothing read yet. Five claims, five files, about nine seconds of work.'}
            </p>
          )}
        </div>
      </div>

      {/* ── The runway ── */}
      <div className={`ds-runway${checked ? ' is-on' : ''}`}>
        <p className="ds-runway-h">Where the 41 minutes went</p>
        <div
          className="ds-track"
          role="img"
          aria-label={`Task duration bar: reading the dispatcher, the extraction, the retry policy and threading the deadline fill the first ${SPENT} percent, then the run ends — the call-site update and the test never start.`}
        >
          {RUNWAY.map((s, i) => (
            <span
              key={s.label}
              className="ds-seg"
              style={{ width: `${s.pct}%`, '--ds-d': delay(i) } as CSSProperties}
            >
              <i>{s.label}</i>
            </span>
          ))}
          <span className="ds-seg is-never" style={{ width: `${100 - SPENT}%` }}>
            <i>call sites · test</i>
          </span>
          <span className="ds-end" style={{ left: `${SPENT}%` }}>
            <i>the run ends here</i>
          </span>
        </div>
      </div>

      <div className="ds-caps">
        <p
          className={`ds-cap${mode === 0 ? ' is-on' : ''}`}
          aria-hidden={mode === 0 ? undefined : true}
        >
          <b>Read it again before you pick. </b>Nothing in that report is hedged, nothing is vague,
          and the hard part — the extraction — is described exactly right. That is what a false
          summary looks like from the outside, which is why reading harder has never once helped me.
        </p>
        <p
          className={`ds-cap${believed ? ' is-on' : ''}`}
          aria-hidden={believed ? undefined : true}
        >
          <b>Most readers stop here, and so did I for about a month. </b>The report is merged. Two
          days later the call sites fail in a way that has nothing to do with lanes, and the commit
          that broke them is the one whose message says the call sites were updated.
        </p>
        <p className={`ds-cap${checked ? ' is-on' : ''}`} aria-hidden={checked ? undefined : true}>
          <b>It didn&apos;t lie about the hard part. </b>It reported the plan as though it were the
          outcome — and the gap is always at the end.{' '}
          <b>Verify the trailing twenty percent, and you can stop reading the rest.</b>
        </p>
      </div>
    </div>
  )
}
