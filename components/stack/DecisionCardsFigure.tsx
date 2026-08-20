'use client'

import { useEffect, useState } from 'react'
import '@/components/stack/decision-cards.css'

type Kind = 'decision' | 'creation'

type Card = {
  id: string
  kind: Kind
  title: string
  /** What holding this card actually costs you, in one clause. */
  note: string
}

/* Four decisions, five pieces of creation work. The asymmetry is the point:
   the hand you must keep is small, and the deck you can hand over is not. */
const CARDS: Card[] = [
  { id: 'd1', kind: 'decision', title: 'What we build', note: 'which problem is worth a week' },
  {
    id: 'd2',
    kind: 'decision',
    title: 'What good looks like',
    note: 'the bar the output must clear',
  },
  {
    id: 'd3',
    kind: 'decision',
    title: 'Which tradeoff wins',
    note: 'speed, scope, or correctness — this time',
  },
  {
    id: 'd4',
    kind: 'decision',
    title: 'What ships',
    note: 'the call that it is done and goes out',
  },
  { id: 'c1', kind: 'creation', title: 'Implement it', note: 'turn the decision into code' },
  { id: 'c2', kind: 'creation', title: 'Test it', note: 'prove it does what it claims' },
  { id: 'c3', kind: 'creation', title: 'Refactor it', note: 'same behavior, better shape' },
  { id: 'c4', kind: 'creation', title: 'Wire it up', note: 'connect it to everything else' },
  { id: 'c5', kind: 'creation', title: 'Document it', note: 'write down how it works' },
]

const GATES = ['code review', 'test suite', 'ship check'] as const

/** Illustrative model. One human's bandwidth is the only thing that serializes. */
const BASE_DAYS = 3
const DAYS_PER_KEPT = 4
const MAX_DAYS = BASE_DAYS + DAYS_PER_KEPT * 5
const DRIFT_PER_DECISION = 22

type Preset = { id: string; label: string; delegated: string[] }

const PRESETS: Preset[] = [
  { id: 'solo', label: 'Do it all yourself', delegated: [] },
  {
    id: 'handover',
    label: 'Hand over a decision',
    delegated: ['c1', 'c2', 'c3', 'c4', 'c5', 'd2'],
  },
  {
    id: 'split',
    label: 'The healthy split',
    delegated: ['c1', 'c2', 'c3', 'c4', 'c5'],
  },
]

/* The three finished states, spelled out. These are what a reduced-motion
   reader gets instead of the moving meters — same argument, no animation. */
const REGIMES = [
  {
    name: 'Bottlenecked',
    setup: 'You keep all five creation cards and all four decisions.',
    result: `${MAX_DAYS} days to ship, 0% drift.`,
    reading: 'True to your intent, and gated behind one human typing.',
  },
  {
    name: 'Fast and wrong',
    setup: 'You delegate all five creation cards and one decision.',
    result: `${BASE_DAYS} days to ship, ${DRIFT_PER_DECISION}% drift.`,
    reading:
      'Every gate still reports PASS, because every gate now measures against the drifted target.',
  },
  {
    name: 'Fast and true',
    setup: 'You delegate all five creation cards and keep all four decisions.',
    result: `${BASE_DAYS} days to ship, 0% drift.`,
    reading: 'The only arrangement that is quick and still yours.',
  },
]

function initialState(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const c of CARDS) out[c.id] = false
  return out
}

function applyPreset(delegated: string[]): Record<string, boolean> {
  const out = initialState()
  for (const id of delegated) out[id] = true
  return out
}

export default function DecisionCardsFigure() {
  const [assigned, setAssigned] = useState<Record<string, boolean>>(initialState)
  const [thesisOpen, setThesisOpen] = useState(false)
  // A card that changes sides re-parents into the other column's list, so React
  // unmounts it and focus would land back on <body>. Hand it back deliberately.
  const [refocus, setRefocus] = useState<string | null>(null)

  useEffect(() => {
    if (!refocus) return
    document.getElementById(`dcf-${refocus}`)?.focus()
    setRefocus(null)
  }, [refocus])

  const keptCreation = CARDS.filter((c) => c.kind === 'creation' && !assigned[c.id]).length
  const handedDecisions = CARDS.filter((c) => c.kind === 'decision' && assigned[c.id]).length

  const days = BASE_DAYS + DAYS_PER_KEPT * keptCreation
  const drift = DRIFT_PER_DECISION * handedDecisions
  const healthy = keptCreation === 0 && handedDecisions === 0

  const regime =
    keptCreation > 0 && handedDecisions > 0
      ? 'Slow and wrong'
      : keptCreation > 0
        ? 'Bottlenecked'
        : handedDecisions > 0
          ? 'Fast and wrong'
          : 'Fast and true'

  const narrative = healthy
    ? `Every creation card delegated, every decision kept. ${days} days to ship, no drift: the build is fast and it is still the thing you marked.`
    : keptCreation > 0 && handedDecisions === 0
      ? `You are still holding ${keptCreation} creation ${keptCreation === 1 ? 'card' : 'cards'}. The target is exactly where you marked it, and shipping takes ${days} days, because that work runs at one human's typing speed.`
      : keptCreation === 0
        ? `You handed over ${handedDecisions} decision ${handedDecisions === 1 ? 'card' : 'cards'}. Shipping takes ${days} days, but the target has moved ${drift} percent off the mark you set, and all three gates report PASS because each one now measures against the moved target.`
        : `You are holding ${keptCreation} creation ${keptCreation === 1 ? 'card' : 'cards'} and you handed over ${handedDecisions} decision ${handedDecisions === 1 ? 'card' : 'cards'}: ${days} days to ship and ${drift} percent off your mark. Slow and wrong is the worst of the four.`

  // Drift track geometry. Fixed viewBox, uniform scaling, integer inputs only.
  const MARK_X = 58
  const BUILT_X = MARK_X + drift * 2.1

  const showThesis = thesisOpen || healthy

  return (
    <div className="dcf rv">
      <div className="dcf-head">
        <p className="dcf-lede">
          Nine cards, one build. You are the human; everything you hand over goes to agents.
        </p>
        <p className="dcf-regime" data-regime={regime}>
          {regime}
        </p>
      </div>

      <div className="dcf-board">
        {(
          [
            ['in', 'Your hand', 'You are doing all nine yourself.'],
            ['out', 'Delegated', 'Nothing handed over yet.'],
          ] as const
        ).map(([side, heading, empty]) => {
          const cards = CARDS.filter((c) => (side === 'out' ? assigned[c.id] : !assigned[c.id]))
          return (
            <section key={side} className={`dcf-side ${side}`} aria-label={heading}>
              <h4 className="dcf-col">{heading}</h4>
              {cards.length === 0 ? (
                <p className="dcf-empty">{empty}</p>
              ) : (
                <ul className="dcf-stack">
                  {cards.map((c) => (
                    <li key={c.id}>
                      <button
                        id={`dcf-${c.id}`}
                        type="button"
                        role="switch"
                        aria-checked={side === 'out'}
                        aria-label={`Delegate the ${c.kind} card: ${c.title}`}
                        className={`dcf-card ${c.kind} ${side}`}
                        onClick={() => {
                          setAssigned((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                          setRefocus(c.id)
                        }}
                      >
                        <span className="dcf-card-kind">
                          {c.kind}
                          <span className="dcf-card-state">
                            {side === 'out' ? 'delegated' : 'kept'}
                          </span>
                        </span>
                        <span className="dcf-card-title">{c.title}</span>
                        <span className="dcf-card-note">{c.note}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <div className="dcf-readout">
        <div className="dcf-meter">
          <p className="dcf-meter-label">
            Time to ship <b>{days} days</b>
          </p>
          <div className="dcf-bar">
            <span
              className={`dcf-bar-fill ${keptCreation > 0 ? 'slow' : ''}`}
              style={{ width: `${Math.round((days / MAX_DAYS) * 100)}%` }}
            />
          </div>
          <p className="dcf-meter-note">
            {keptCreation === 0
              ? 'Nothing is waiting on you to type it.'
              : `${keptCreation} creation ${keptCreation === 1 ? 'card runs' : 'cards run'} at one person's bandwidth.`}
          </p>
        </div>

        <div className="dcf-meter">
          <p className="dcf-meter-label">
            Distance from your mark <b>{drift}%</b>
          </p>
          <svg
            className="dcf-track"
            viewBox="0 0 320 96"
            role="img"
            aria-label={`Target track. Your mark is fixed; the build sits ${drift} percent away from it, and the gate reference sits on the build, not on your mark.`}
          >
            <line x1="24" y1="56" x2="296" y2="56" className="dcf-rail" />
            {drift > 0 && (
              <rect x={MARK_X} y="48" width={BUILT_X - MARK_X} height="16" className="dcf-gap" />
            )}
            <line x1={MARK_X} y1="34" x2={MARK_X} y2="78" className="dcf-mark" />
            <text x={MARK_X} y="26" className="dcf-tlabel mark">
              your mark
            </text>
            <line
              x1={BUILT_X}
              y1="30"
              x2={BUILT_X}
              y2="82"
              className={`dcf-gateref ${drift > 0 ? 'off' : ''}`}
            />
            <circle cx={BUILT_X} cy="56" r="6" className={`dcf-built ${drift > 0 ? 'off' : ''}`} />
            <text x={BUILT_X} y="93" className="dcf-tlabel built">
              built · gate ref
            </text>
          </svg>
          <p className="dcf-meter-note">
            {drift > 0
              ? 'The gate reference travels with the build. That is why nothing downstream catches it.'
              : 'Gates measure against the mark you set. A miss shows up as a failure.'}
          </p>
        </div>
      </div>

      <ul className="dcf-gates">
        {GATES.map((g) => (
          <li key={g} className={drift > 0 ? 'drifted' : ''}>
            <span className="g-name">{g}</span>
            <span className="g-ref">reference +{drift}%</span>
            <span className="g-verdict">PASS</span>
          </li>
        ))}
      </ul>

      <p className="dcf-live" aria-live="polite">
        {narrative}
      </p>

      <div className="dcf-actions">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="dcf-preset"
            onClick={() => setAssigned(applyPreset(p.delegated))}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className="dcf-preset"
          aria-expanded={thesisOpen}
          aria-controls="dcf-thesis"
          disabled={healthy}
          onClick={() => setThesisOpen((v) => !v)}
        >
          Say it plainly
        </button>
      </div>

      {showThesis && (
        <p className="dcf-thesis" id="dcf-thesis">
          The split isn&apos;t effort versus tedium. It&apos;s decisions that require knowing what{' '}
          <em className="hl">you</em> want versus work that only requires knowing what{' '}
          <em className="hl">correct</em> means — delegate all of the second, none of the first.
        </p>
      )}

      <ul className="dcf-regimes">
        {REGIMES.map((r) => (
          <li key={r.name}>
            <b>{r.name}.</b> {r.setup} {r.result} {r.reading}
          </li>
        ))}
      </ul>

      <p className="dcf-foot">
        Days and percentages are illustrative; the shape is the argument. The figure was pitched by
        one of the agents working on this page, which asked to stay anonymous.
      </p>
    </div>
  )
}
