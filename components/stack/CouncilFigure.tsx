'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import '@/components/stack/council-figure.css'
import { useOnceVisible, useReducedMotion } from '@/components/stack/hooks'

/* ── Ch.6 · the council ────────────────────────────────────────
   The chapter claims the council's gain is decorrelated error and
   that the critique stage is where that gain actually lives. This
   figure is that claim, drawn.

   Geometry is authored here rather than measured from the DOM, so
   the server and the browser draw the identical picture and every
   chip animates on the compositor. Horizontal positions are in
   `cqw` — one percent of the stage's own width, since the stage is
   an inline-size container — and vertical positions are in `rem`,
   so the type never shrinks with the viewport. A chip is ONE DOM
   element for the whole figure: critique stamps it under its
   target, synthesis hands it a new address, and nothing about it
   is re-created in between. That is the point of the figure —
   the surviving flaw is literally the same object. */

const STAGES = ['propose', 'critique', 'defend', 'synthesize', 'judge'] as const
type StageName = (typeof STAGES)[number]

/* ── Geometry ───────────────────────────────────────────── */

const COL_W = 23.2
const COL_X = [0, 25.6, 51.2, 76.8]

/* Row pitch clears the tallest chip in the band — the hazard, which carries
   three lines of text plus its "found by 1 of 4" tag. */
const ROW_Y = 4.7
const ROW_PITCH = 3.6

const SYN_X = [2.4, 34.2]
const SYN_W = 29.5
const SYN_ROW_Y = 20.5
const SYN_ROW_PITCH = 2.9

/* ── Cast ───────────────────────────────────────────────── */

type Model = { key: string; name: string; vendor: string; score: number; hue: string }

const MODELS: Model[] = [
  { key: 'codex', name: 'Codex', vendor: 'OpenAI', score: 91.6, hue: 'sky' },
  { key: 'gemini', name: 'Gemini', vendor: 'Google', score: 88.9, hue: 'violet' },
  { key: 'grok', name: 'Grok', vendor: 'xAI', score: 86.4, hue: 'amber' },
  { key: 'kimi', name: 'Kimi', vendor: 'Moonshot', score: 84.1, hue: 'plain' },
]

const SYNTHESIS = 96.4
const HUMAN = 85.2
const BEST_SINGLE = 91.6

type Flaw = {
  id: string
  /** Index into MODELS — who raised it. */
  from: number
  /** Index into MODELS — whose proposal it lands on. */
  to: number
  text: string
  /** False once the author defended it successfully at the defend stage. */
  survives: boolean
  /** Struck flaws carry the defence that killed them. */
  rebuttal?: string
  /** The one nobody else saw. */
  sole?: boolean
}

/* Ordered by target column, then by the row they occupy in it. */
const FLAWS: Flaw[] = [
  { id: 'f1', from: 1, to: 0, text: 'assumes a single writer', survives: true },
  {
    id: 'f2',
    from: 2,
    to: 0,
    text: 'no backpressure on the queue',
    survives: false,
    rebuttal: 'the pool is bounded — defended',
  },
  { id: 'f3', from: 0, to: 1, text: 'retry loop swallows its own error', survives: true },
  {
    id: 'f4',
    from: 3,
    to: 1,
    text: 'migration and backfill share one transaction — a rollback loses both',
    survives: true,
    sole: true,
  },
  {
    id: 'f5',
    from: 2,
    to: 1,
    text: 'duplicate config parse per request',
    survives: false,
    rebuttal: 'parse is memoised — defended',
  },
  {
    id: 'f6',
    from: 1,
    to: 2,
    text: 'cache key omits the tenant',
    survives: false,
    rebuttal: 'keys are tenant-scoped upstream — defended',
  },
  {
    id: 'f7',
    from: 3,
    to: 2,
    text: 'silent truncation at 4k',
    survives: false,
    rebuttal: 'the writer already errors — defended',
  },
  { id: 'f8', from: 0, to: 3, text: 'three round-trips where one would do', survives: true },
]

/** Where each flaw sits under its target: column = target, row = order within it. */
const BAND_ROW = new Map<string, number>()
{
  const used = [0, 0, 0, 0]
  for (const f of FLAWS) {
    BAND_ROW.set(f.id, used[f.to] ?? 0)
    used[f.to] = (used[f.to] ?? 0) + 1
  }
}

/** The hazard leads the synthesis panel; the rest follow in the order they were raised. */
const SURVIVORS = FLAWS.filter((f) => f.survives).sort(
  (a, b) => Number(!!b.sole) - Number(!!a.sole),
)

const SYN_SLOT = new Map<string, { x: number; y: number }>(
  SURVIVORS.map((f, i) => [
    f.id,
    { x: SYN_X[i % 2] ?? 0, y: SYN_ROW_Y + Math.floor(i / 2) * SYN_ROW_PITCH },
  ]),
)

/* ── Copy ───────────────────────────────────────────────── */

const CAPTIONS: Record<StageName, { lead: string; body: string; tail?: string }> = {
  propose: {
    lead: 'Four vendors, one brief, no cross-talk.',
    body: ' Each model writes the plan alone, and a blind grader scores it. Codex wins the round at 91.6. If the council stopped here it would be an expensive way to run four prompts — the scores barely move, and every model is confident.',
  },
  critique: {
    lead: 'This is the stage the whole thing exists for.',
    body: ' Every model reads every other plan and files what it thinks is wrong. Eight objections land. Seven of them are things at least two models would have caught. One of them — the transaction hazard, filed by the lowest-scoring model in the room — nobody else saw at all.',
  },
  defend: {
    lead: 'Half the objections do not survive contact.',
    body: ' Authors answer their critics, and four flaws turn out to be misreadings of code the critic never had. That is the tax on decorrelated error: different blind spots also means different false alarms, and you pay for the filtering.',
  },
  synthesize: {
    lead: 'The surviving four go into one plan.',
    body: ' Not an average of the four proposals — a fifth plan that inherits every objection still standing. It scores 96.4, ahead of the best single model by 4.8 points that no single model had any way to find.',
  },
  judge: {
    lead: 'The synthesis did not win by averaging them.',
    body: ' It won by inheriting the one flaw only one of them could see. ',
    tail: 'Drop the critique stage and this is four opinions and a coin toss.',
  },
}

const ARIA: Record<StageName, string> = {
  propose:
    'Four proposal cards — Codex 91.6, Gemini 88.9, Grok 86.4, Kimi 84.1 — each with a score bar, and nothing else on the board.',
  critique:
    'Eight thin lines shoot between the cards and stamp eight flaw chips beneath their targets: three on Gemini, two on Codex, two on Grok, one on Kimi. One chip, raised by Kimi against Gemini, glows emerald — a shared transaction between the migration and the backfill that no other model raised.',
  defend:
    'Four of the eight chips are struck through as their authors defend successfully. Four survive, the emerald hazard chip among them.',
  synthesize:
    'The four surviving chips leave their columns and migrate into a single synthesis card, whose score bar grows to 96.4 — past the dashed marker at 91.6 that was the best single model.',
  judge:
    'A human gold-standard card slides in at 85.2, and a second dashed marker at 85.2 lands on the synthesis bar well behind its fill. The synthesis leads both.',
}

/* ── Board ──────────────────────────────────────────────── */

type BoardProps = {
  stage: number
  focus: number | null
  onFocus?: (i: number | null) => void
  reduced: boolean
}

function ScoreBar({ value, live, hue }: { value: number; live: boolean; hue: string }) {
  return (
    <span className="cnc-bar" data-hue={hue}>
      <span className="cnc-bar-fill" style={{ width: live ? `${value}%` : '0%' }} />
    </span>
  )
}

function CouncilBoard({ stage, focus, onFocus, reduced }: BoardProps) {
  const critiqued = stage >= 1
  const defended = stage >= 2
  const synthesized = stage >= 3
  const judged = stage >= 4
  const pickable = !!onFocus

  return (
    <div className="cnc-board">
      <div className="cnc-props">
        {MODELS.map((m, i) => {
          const dim = focus !== null && focus !== i
          const cls = `cnc-prop${dim ? ' is-dim' : ''}${focus === i ? ' is-on' : ''}`
          const inner = (
            <>
              <span className="cnc-prop-name">
                {m.name}
                <i>{m.vendor}</i>
              </span>
              <ScoreBar value={m.score} live hue={m.hue} />
              <span className="cnc-prop-score">{m.score.toFixed(1)}</span>
            </>
          )
          // The stills render the same card with no affordance, so a reduced-motion
          // reader is never handed a control that does nothing.
          return pickable ? (
            <button
              key={m.key}
              type="button"
              className={cls}
              data-hue={m.hue}
              aria-pressed={focus === i}
              onClick={() => onFocus(focus === i ? null : i)}
            >
              {inner}
            </button>
          ) : (
            <div key={m.key} className={cls} data-hue={m.hue}>
              {inner}
            </div>
          )
        })}
      </div>

      <div className="cnc-stage">
        <svg
          className={`cnc-wires${critiqued ? ' is-on' : ''}`}
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {FLAWS.map((f, i) => {
            const sx = (COL_X[f.from] ?? 0) + COL_W / 2
            const tx = (COL_X[f.to] ?? 0) + COL_W / 2
            const dim = focus !== null && focus !== f.from && focus !== f.to
            return (
              <path
                key={f.id}
                // The band is ~15x wider than it is tall, which flattens any
                // curve into a streak. Orthogonal routing survives the stretch:
                // drop out of the source, run along a lane of its own, drop into
                // the target. It reads as wiring because it is wiring.
                d={`M${sx},0 V ${5 + i * 2.6} H ${tx} V 30`}
                className={`cnc-wire${f.sole ? ' is-sole' : ''}${dim ? ' is-dim' : ''}`}
                data-hue={MODELS[f.from]?.hue}
                style={reduced ? undefined : ({ '--cnc-d': `${i * 70}ms` } as CSSProperties)}
              />
            )
          })}
        </svg>

        {/* The verdict band is reserved from the first stage so scrubbing never
            moves the page; the ghost turns that reservation into anticipation
            instead of a hole. */}
        <div className={`cnc-ghost${synthesized ? ' is-off' : ''}`} aria-hidden="true">
          <span>synthesis · not written yet</span>
        </div>

        <div className={`cnc-panel cnc-syn${synthesized ? ' is-on' : ''}`}>
          <div className="cnc-panel-head">
            <span className="cnc-panel-name">
              Synthesis
              <i>inherits every objection still standing</i>
            </span>
            <span className="cnc-panel-score">{SYNTHESIS.toFixed(1)}</span>
          </div>
          <span className="cnc-bar cnc-bar-wide" data-hue="accent">
            <span
              className="cnc-bar-fill"
              style={{ width: synthesized ? `${SYNTHESIS}%` : '0%' }}
            />
            <span className="cnc-mark" style={{ left: `${BEST_SINGLE}%` }}>
              <i>best single · 91.6</i>
            </span>
            <span
              className={`cnc-mark cnc-mark-late${judged ? ' is-on' : ''}`}
              style={{ left: `${HUMAN}%` }}
            >
              <i>human · 85.2</i>
            </span>
          </span>
        </div>

        <div className={`cnc-panel cnc-human${judged ? ' is-on' : ''}`}>
          <div className="cnc-panel-head">
            <span className="cnc-panel-name">
              Human gold standard
              <i>written first, scored blind</i>
            </span>
            <span className="cnc-panel-score">{HUMAN.toFixed(1)}</span>
          </div>
          <ScoreBar value={HUMAN} live={judged} hue="plain" />
        </div>

        {/* One element per flaw for the life of the figure. Only its address changes. */}
        <div className="cnc-chips">
          {FLAWS.map((f, i) => {
            const slot = SYN_SLOT.get(f.id)
            const migrating = synthesized && !!slot
            const x = migrating ? (slot?.x ?? 0) : (COL_X[f.to] ?? 0)
            const y = migrating ? (slot?.y ?? 0) : ROW_Y + (BAND_ROW.get(f.id) ?? 0) * ROW_PITCH
            const w = migrating ? SYN_W : COL_W
            const dim = focus !== null && focus !== f.from && focus !== f.to
            const struck = defended && !f.survives
            return (
              <span
                key={f.id}
                className={[
                  'cnc-chip',
                  critiqued ? 'is-in' : '',
                  migrating ? 'is-moved' : '',
                  struck ? 'is-struck' : '',
                  f.sole ? 'is-sole' : '',
                  dim ? 'is-dim' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-hue={MODELS[f.from]?.hue}
                style={
                  {
                    '--cnc-x': `${x}cqw`,
                    '--cnc-y': `${y}rem`,
                    '--cnc-w': `${w}cqw`,
                    '--cnc-d': reduced ? '0ms' : `${i * 70}ms`,
                  } as CSSProperties
                }
              >
                <i className="cnc-chip-dot" />
                <span className="cnc-chip-text">{f.text}</span>
                {f.sole ? <b className="cnc-chip-tag">found by 1 of 4</b> : null}
                {struck && f.rebuttal ? <b className="cnc-chip-tag">{f.rebuttal}</b> : null}
                <i className="cnc-chip-strike" />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Caption({ stage }: { stage: number }) {
  const c = CAPTIONS[STAGES[stage] ?? 'propose']
  return (
    <>
      <b>{c.lead}</b>
      {c.body}
      {c.tail ? <b>{c.tail}</b> : null}
    </>
  )
}

/* ── Figure ─────────────────────────────────────────────── */

const TOUR_MS = 2600

export function CouncilFigure() {
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)
  const [focus, setFocus] = useState<number | null>(null)
  const [auto, setAuto] = useState(false)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (!reduced) setAuto(true)
  }, 0.35)

  useEffect(() => {
    if (!auto || reduced) return
    if (stage >= STAGES.length - 1) {
      setAuto(false)
      return
    }
    const id = setTimeout(() => setStage((s) => s + 1), TOUR_MS)
    return () => clearTimeout(id)
  }, [auto, reduced, stage])

  // Any deliberate pick ends the tour: the reader is scrubbing now.
  const pick = useCallback((i: number) => {
    setAuto(false)
    setStage(i)
  }, [])

  const onKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let next = -1
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (stage + 1) % STAGES.length
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        next = (stage - 1 + STAGES.length) % STAGES.length
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = STAGES.length - 1
      if (next < 0) return
      e.preventDefault()
      pick(next)
      tabs.current[next]?.focus()
    },
    [stage, pick],
  )

  if (reduced) {
    return (
      <div className="cf rv">
        <p className="cnc-head">
          One brief · four vendors · <b>blind-scored</b>
        </p>
        <div className="cnc-stills">
          {STAGES.map((name, i) => (
            <section className="cnc-still" key={name} aria-label={`Stage ${i + 1} of 5: ${name}`}>
              <h4 className="cnc-still-h">
                <span className="cnc-still-n">{String(i + 1).padStart(2, '0')}</span>
                {name}
              </h4>
              <div className="cnc-still-fig" role="img" aria-label={ARIA[name]}>
                <CouncilBoard stage={i} focus={null} reduced />
              </div>
              <p className="cnc-cap is-on">
                <Caption stage={i} />
              </p>
            </section>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="cf rv" ref={figRef} onPointerEnter={() => setAuto(false)}>
      <div className="cnc-top">
        <p className="cnc-head">
          One brief · four vendors · <b>blind-scored</b>
        </p>
        <button className="cnc-play" type="button" onClick={() => setAuto((v) => !v)}>
          {auto ? 'Pause' : stage >= STAGES.length - 1 ? 'Replay' : 'Play'}
        </button>
      </div>

      <div
        className="cnc-rail"
        role="tablist"
        aria-label="Stages of the council run"
        onKeyDown={onKey}
        // Focus arriving on the rail ends the tour, so autoplay can never move
        // the selection out from under a keyboard reader.
        onFocusCapture={() => setAuto(false)}
      >
        {STAGES.map((name, i) => (
          <button
            key={name}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`cnc-tab-${name}`}
            aria-controls={`cnc-cap-${name}`}
            aria-selected={i === stage}
            tabIndex={i === stage ? 0 : -1}
            className={`cnc-step${i === stage ? ' is-on' : ''}${i < stage ? ' is-past' : ''}`}
            onClick={() => pick(i)}
          >
            <span className="cnc-step-n">{String(i + 1).padStart(2, '0')}</span>
            {name}
          </button>
        ))}
      </div>

      <div
        className="cnc-scroll"
        tabIndex={0}
        role="region"
        aria-label="Council board, scrolls horizontally on small screens"
      >
        <span className="figscroll-hint" aria-hidden="true">
          swipe →
        </span>
        <div className="cnc-scroll-in" role="img" aria-label={ARIA[STAGES[stage] ?? 'propose']}>
          <CouncilBoard stage={stage} focus={focus} onFocus={setFocus} reduced={reduced} />
        </div>
      </div>

      <p className="cnc-hint">
        {focus === null
          ? 'Pick a model above to isolate its thread — what it filed, and what was filed against it.'
          : `Showing only ${MODELS[focus]?.name}'s thread. Pick it again to show all four.`}
      </p>

      {/* Every caption occupies the same grid cell, so the block reserves the
          tallest and scrubbing the rail never moves the page. */}
      <div className="cnc-caps">
        {STAGES.map((name, i) => (
          <p
            key={name}
            id={`cnc-cap-${name}`}
            role="tabpanel"
            aria-labelledby={`cnc-tab-${name}`}
            className={`cnc-cap${i === stage ? ' is-on' : ''}`}
            aria-hidden={i === stage ? undefined : true}
            inert={i === stage ? undefined : true}
          >
            <Caption stage={i} />
          </p>
        ))}
      </div>
    </div>
  )
}
