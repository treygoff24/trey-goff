'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '@/components/stack/why-panel.css'
import { CTX, CTX_CELL_COUNT, type CtxKey } from '@/components/stack/data'
import { useReducedMotion } from '@/components/stack/hooks'

/* ── The reusable primitive ───────────────────────────────── */

type WhyPanelProps = {
  /** Text on the quiet inline trigger. */
  label?: string
  /** Panel heading; also names the dialog for assistive tech. */
  title: string
  children: React.ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function WhyPanel({ label = 'Why tho?', title, children }: WhyPanelProps) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const wasOpen = useRef(false)
  const titleId = useRef(`why-${Math.random().toString(36).slice(2, 9)}`)

  // Portal into #stack-root so the panel escapes .rv's transform (which would
  // otherwise become the containing block for position: fixed) while still
  // inheriting every --sk-* token.
  useEffect(() => {
    setHost(document.getElementById('stack-root') ?? document.body)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) {
        e.preventDefault()
        panel.focus({ preventScroll: true })
        return
      }
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  // Send focus home, but only on a real close — never on first mount.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  const panel = (
    <div className={`why-root${reduced ? ' why-still' : ''}${open ? ' open' : ''}`}>
      <div className="why-scrim" onClick={close} aria-hidden="true" />
      <div
        className="why-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        ref={panelRef}
        tabIndex={-1}
        inert={!open}
      >
        <div className="why-bar-top">
          <span className="why-kicker">Going deeper</span>
          <button className="why-close" type="button" onClick={close}>
            Close
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <h2 className="why-title" id={titleId.current}>
          {title}
        </h2>
        <div className="why-body">{children}</div>
      </div>
    </div>
  )

  return (
    <>
      <button
        className="why-trigger"
        type="button"
        ref={triggerRef}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {label}
        <span aria-hidden="true">→</span>
      </button>
      {host ? createPortal(panel, host) : null}
    </>
  )
}

/* ── ARC-AGI-2 chart ──────────────────────────────────────────
   Every point below was read off arcprize.org/leaderboard on
   2026-07-28. There is no JSON or CSV behind that page, so these
   are hardcoded on purpose and carry a retrieval date. */

type Pt = { cost: number; score: number; tier: string }
type Series = { name: string; cls: string; pts: Pt[] }

const SERIES: Series[] = [
  {
    name: 'GPT-5.6 Sol — reasoning effort',
    cls: 'sol',
    pts: [
      { cost: 0.32, score: 42.5, tier: 'Low' },
      { cost: 0.47, score: 67.1, tier: 'Medium' },
      { cost: 0.74, score: 85.4, tier: 'High' },
      { cost: 1.04, score: 90.0, tier: 'xHigh' },
      { cost: 1.44, score: 92.5, tier: 'Max' },
    ],
  },
  {
    name: 'Claude Opus 4.8 — reasoning effort',
    cls: 'opus48',
    pts: [
      { cost: 1.68, score: 62.2, tier: 'Low' },
      { cost: 2.39, score: 71.7, tier: 'Medium' },
      { cost: 2.74, score: 72.1, tier: 'High' },
    ],
  },
  {
    name: 'Claude Opus 4.5 — thinking-token budget',
    cls: 'opus45',
    pts: [
      { cost: 0.22, score: 7.8, tier: 'none' },
      { cost: 0.23, score: 9.4, tier: '1K' },
      { cost: 0.48, score: 13.9, tier: '8K' },
      { cost: 0.79, score: 22.8, tier: '16K' },
      { cost: 1.29, score: 30.6, tier: '32K' },
      { cost: 2.4, score: 37.6, tier: '64K' },
    ],
  },
]

const X0 = 62
const X1 = 736
const Y0 = 18
const Y1 = 352
const LO = Math.log10(0.18)
const HI = Math.log10(3.4)

const px = (cost: number) => X0 + ((Math.log10(cost) - LO) / (HI - LO)) * (X1 - X0)
const py = (score: number) => Y1 - (score / 100) * (Y1 - Y0)

const XTICKS: [number, string][] = [
  [0.2, '$0.20'],
  [0.3, '$0.30'],
  [0.5, '$0.50'],
  [1, '$1.00'],
  [2, '$2.00'],
  [3, '$3.00'],
]
const YTICKS = [0, 25, 50, 75, 100]

function ArcChart() {
  return (
    <figure className="why-fig">
      <div className="why-legend">
        {SERIES.map((s) => (
          <span key={s.cls} className={`why-key ${s.cls}`}>
            <i />
            {s.name}
          </span>
        ))}
      </div>
      <div className="why-scroll">
        <svg
          viewBox="0 0 760 404"
          className="why-chart"
          role="img"
          aria-label="Scatter chart of ARC-AGI-2 score against cost per task on a logarithmic scale. GPT-5.6 Sol climbs from 42.5 percent at 32 cents per task to 92.5 percent at $1.44. Claude Opus 4.8 climbs from 62.2 percent at $1.68 to 72.1 percent at $2.74. Claude Opus 4.5 climbs from 7.8 percent with no thinking budget to 37.6 percent at a 64,000-token budget. Every curve rises steeply at first and then flattens."
        >
          {YTICKS.map((v) => (
            <g key={v}>
              <line className="why-grid" x1={X0} x2={X1} y1={py(v)} y2={py(v)} />
              <text className="why-ax" x={X0 - 10} y={py(v) + 4} textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          {XTICKS.map(([v, lbl]) => (
            <g key={lbl}>
              <line className="why-grid vt" x1={px(v)} x2={px(v)} y1={Y0} y2={Y1} />
              <text className="why-ax" x={px(v)} y={Y1 + 22} textAnchor="middle">
                {lbl}
              </text>
            </g>
          ))}
          <line className="why-axis" x1={X0} x2={X1} y1={Y1} y2={Y1} />
          <text className="why-axtitle" x={(X0 + X1) / 2} y={Y1 + 46} textAnchor="middle">
            Cost per task, log scale — the published stand-in for thinking spent
          </text>
          <text
            className="why-axtitle"
            transform={`translate(16 ${(Y0 + Y1) / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            ARC-AGI-2 score
          </text>
          {SERIES.map((s) => (
            <g key={s.cls} className={`why-series ${s.cls}`}>
              <polyline points={s.pts.map((p) => `${px(p.cost)},${py(p.score)}`).join(' ')} />
              {s.pts.map((p) => (
                <circle key={p.tier} cx={px(p.cost)} cy={py(p.score)} r={4} />
              ))}
              {s.pts.map((p, i) =>
                i === 0 || i === s.pts.length - 1 ? (
                  <text
                    key={`l-${p.tier}`}
                    className="why-pt"
                    x={px(p.cost) + (i === 0 ? 10 : 6)}
                    y={py(p.score) + (i === 0 ? 4 : -11)}
                    textAnchor={i === 0 ? 'start' : 'end'}
                  >
                    {p.tier} · {p.score}%
                  </text>
                ) : null,
              )}
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        ARC-AGI-2, score against cost per task. Each point is the same model at a higher reasoning
        effort or a bigger thinking budget. Source:{' '}
        <a href="https://arcprize.org/leaderboard" target="_blank" rel="noopener noreferrer">
          arcprize.org/leaderboard
        </a>
        , retrieved 2026-07-28. ARC publishes cost per task, not token counts, so cost is the honest
        proxy for how much thinking was bought.
      </figcaption>
    </figure>
  )
}

/* ── Token-allocation strip (ties back to the ch.1 figure) ── */

function shares(key: CtxKey) {
  let work = 0
  let headroom = 0
  let overhead = 0
  for (const [cls, n] of CTX[key].segs) {
    if (cls === 'c-task' || cls === 'c-verify') work += n
    else if (cls === 'c-free') headroom += n
    else overhead += n
  }
  const pct = (n: number) => Math.round((n / CTX_CELL_COUNT) * 100)
  return { work: pct(work), headroom: pct(headroom), overhead: pct(overhead) }
}

const BAD = shares('bad')
const GOOD = shares('good')

function AllocStrip() {
  const rows: { title: string; s: typeof BAD; overheadCls: string; note: string }[] = [
    {
      title: 'Untended',
      s: BAD,
      overheadCls: 'c-noise',
      note: 'Finding the work — repo dump, drifted chat, tool output nobody read',
    },
    {
      title: 'Curated',
      s: GOOD,
      overheadCls: 'c-brief',
      note: 'Getting oriented — the brief, one skill, the files it ruled out',
    },
  ]
  return (
    <figure className="why-fig">
      <div
        className="why-alloc"
        role="img"
        aria-label={`Token allocation in the two context windows from the figure above. Untended: ${BAD.overhead} percent on finding the work, ${BAD.work} percent on the problem itself, ${BAD.headroom} percent headroom. Curated: ${GOOD.overhead} percent getting oriented, ${GOOD.work} percent on the problem itself, ${GOOD.headroom} percent headroom.`}
      >
        {rows.map((r) => (
          <div className="why-alloc-row" key={r.title}>
            <span className="why-alloc-t">{r.title}</span>
            <div className="why-alloc-bar">
              <i className={r.overheadCls} style={{ flexGrow: r.s.overhead }} />
              <i className="c-task" style={{ flexGrow: r.s.work }} />
              <i className="c-free" style={{ flexGrow: r.s.headroom }} />
            </div>
            <span className="why-alloc-n">
              <b>{r.s.work}%</b> on the problem
            </span>
          </div>
        ))}
      </div>
      <figcaption>
        The same two windows, collapsed to three buckets, left to right: overhead ({rows[0]?.note}{' '}
        on top, {rows[1]?.note} below), then the problem itself, then unused headroom.
      </figcaption>
    </figure>
  )
}

/* ── Attention degradation strip ──────────────────────────── */

function NoLimaStrip() {
  const bars: { label: string; v: number; tone: string }[] = [
    { label: 'Under 1K tokens of context', v: 99.3, tone: 'hi' },
    { label: 'At 32K tokens of context', v: 69.7, tone: 'lo' },
  ]
  return (
    <figure className="why-fig">
      <div
        className="why-needle"
        role="img"
        aria-label="GPT-4o's NoLiMa retrieval score falls from 99.3 percent with under 1,000 tokens of context to 69.7 percent at 32,000 tokens."
      >
        {bars.map((b) => (
          <div className="why-needle-row" key={b.label}>
            <span className="why-needle-l">{b.label}</span>
            <div className="why-needle-track">
              <span className={`why-needle-fill ${b.tone}`} style={{ width: `${b.v}%` }} />
            </div>
            <span className="why-needle-v">{b.v}%</span>
          </div>
        ))}
      </div>
      <figcaption>
        GPT-4o finding one fact buried in its context, as the context gets longer. It was one of the
        best performers in the batch. Source: NoLiMa, 2025.
      </figcaption>
    </figure>
  )
}

/* ── The chapter-1 instance ───────────────────────────────── */

export function WhyContext() {
  return (
    <WhyPanel title="Why does context optimization really work, though?">
      <p>
        Context optimization increases the model&apos;s effective capability for a simple reason:
        more of the tokens get spent on your actual request instead of on the work around the
        request. That is the whole mechanism. The rest of this is why it holds.
      </p>

      <h3>Thinking is a dial, and you can watch it move</h3>
      <p>
        Every frontier model now ships with some version of the same knob — reasoning effort,
        thinking budget, extended thinking. Turning it up means exactly one thing: the model spends
        more tokens thinking before it answers you. That is test-time compute, or TTC.
      </p>
      <p>
        Here is what the knob buys. This is ARC-AGI-2, one of the harder tests of general problem
        solving, and each line is a single model measured at increasing effort. The Opus 4.5 line is
        the most literal version of the argument: its points are not vague effort tiers, they are
        thinking-token budgets — none, 1K, 8K, all the way to 64K.
      </p>
      <ArcChart />
      <p>
        The shape is honest and it is the same on every line: more thinking buys more capability,
        steeply at first, then with real diminishing returns. Opus 4.5 goes from 7.8% with no
        thinking to 37.6% at a 64K budget. Sol goes from 42.5% to 92.5%, but look where the curve
        bends — the last 2.5 points cost nearly as much as the first 43.
      </p>
      <p>
        And it does eventually stop paying. GPT-5.5 Pro at High reasoning costs $10.51 a task, about
        seven times GPT-5.5 at xHigh ($1.87), and scores <em className="hl">lower</em> on ARC-AGI-2
        — 84.6% against 85.0%. Push Pro to xHigh and it is $10.76 for 84.2%. Past a point you are
        paying for thinking that buys nothing.
      </p>

      <h3>Now look at the two windows again</h3>
      <p>
        Go back to the figure you just scrolled past. In the untended session, {BAD.overhead}% of
        the window went to finding the work — the repo dump, the conversation that drifted twice,
        tool output nobody read. Only {BAD.work}% of it was the problem you actually asked about. In
        the curated one, {GOOD.work}% went to the problem and half the window is still empty.
      </p>
      <AllocStrip />
      <p>
        So optimizing the context window is simply increasing the TTC spent on your actual problem.
        It is the same dial as the one on the chart, with your hand on it instead of the
        vendor&apos;s. The benchmarks say what happens next.
      </p>

      <h3>The other reason: the attention mechanism</h3>
      <p>
        Optimizing context also serves another key purpose: taking advantage of the attention
        mechanism.
      </p>
      <p>
        Attention is how a transformer decides what matters. It does not read your context front to
        back the way you would. Every token gets related to every other token, all at once — that is
        self-attention, and it is where the understanding actually happens. It is how the model
        works out that this <em className="hl">it</em> refers to that function, that this stack
        trace belongs to that test.
      </p>
      <p>
        The catch is that those pairs multiply as the context grows. Anthropic&apos;s own
        engineering write-up puts it plainly: models have an{' '}
        <b>“attention budget” they draw on when parsing large volumes of context</b>, every new
        token depletes it, and “as its context length increases, a model&apos;s ability to capture
        these pairwise relationships gets stretched thin, creating a natural tension between context
        size and attention focus.”
      </p>
      <p>
        It is measurable, too. NoLiMa tested 13 models that all claim to handle at least 128K
        tokens. By 32K — a sixth of a 200K window — 11 of them had fallen below half their
        short-context performance. GPT-4o, one of the top performers in the batch, dropped from an
        almost-perfect 99.3% to 69.7%.
      </p>
      <NoLimaStrip />
      <p>
        The older “Lost in the Middle” result is the positional version of the same problem: models
        do best with information at the beginning or the end of the context and significantly worse
        when the thing they need is buried in the middle — even models sold specifically as
        long-context.
      </p>
      <p>
        So a 200K window is not 200K of usable attention. It is 200K of room, and the more of it you
        fill, the less sharply the model sees any single thing in it. Anthropic&apos;s version of
        the conclusion is the closest thing this page has to a thesis:{' '}
        <b>
          good context engineering means finding the smallest possible set of high-signal tokens
          that maximize the likelihood of some desired outcome.
        </b>
      </p>
      <p>
        Everything in this manual is that sentence in practice. A lean CLAUDE.md instead of a
        repo-wide dump. Skills that load at the moment they apply instead of sitting in the window
        all session. Subagents that absorb an entire search and hand back six lines. None of it is
        thrift for its own sake. Every token you do not spend is attention that stays on the thing
        you actually asked for.
      </p>

      <div className="why-sources">
        <span className="why-kicker">Sources</span>
        <ul>
          <li>
            <a href="https://arcprize.org/leaderboard" target="_blank" rel="noopener noreferrer">
              ARC Prize leaderboard
            </a>{' '}
            — all scores and costs above, retrieved 2026-07-28
          </li>
          <li>
            <a
              href="https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic — Effective context engineering for AI agents
            </a>{' '}
            — the attention budget
          </li>
          <li>
            <a href="https://arxiv.org/abs/2502.05167" target="_blank" rel="noopener noreferrer">
              NoLiMa — Long-Context Evaluation Beyond Literal Matching
            </a>{' '}
            — the 13-model degradation study
          </li>
          <li>
            <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer">
              Lost in the Middle — How Language Models Use Long Contexts
            </a>{' '}
            (
            <a
              href="https://aclanthology.org/2024.tacl-1.9/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TACL
            </a>
            )
          </li>
          <li>
            <a
              href="https://jalammar.github.io/illustrated-transformer/"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Illustrated Transformer
            </a>{' '}
            — the readable explanation of self-attention, and{' '}
            <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer">
              Attention Is All You Need
            </a>{' '}
            — the paper underneath it
          </li>
        </ul>
      </div>
    </WhyPanel>
  )
}
