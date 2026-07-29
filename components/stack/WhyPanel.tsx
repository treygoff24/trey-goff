'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
  // useId, not Math.random: the id must match between server and client HTML.
  const reactId = useId()
  const titleId = useRef(`why-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`)

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
    const root = document.documentElement
    const prevOverflow = document.body.style.overflow
    const prevRootOverflow = root.style.overflow
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    // A reopened sheet must start at its title, not wherever it was left.
    panel.scrollTop = 0
    panel.focus({ preventScroll: true })

    // Tab remapping only catches the edges; this catches anything that lands
    // outside the sheet (browser chrome round-trips, stray programmatic focus).
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target
      if (target instanceof Node && !panel.contains(target)) {
        panel.focus({ preventScroll: true })
      }
    }

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
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocusIn)
      document.body.style.overflow = prevOverflow
      root.style.overflow = prevRootOverflow
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
        aria-haspopup="dialog"
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

/** `dy` nudges a labelled endpoint clear of its own line; every value was
    checked against both geometries in the browser, not derived on paper. */
type Pt = { cost: number; score: number; tier: string; dy?: number }
type Series = { name: string; cls: string; pts: Pt[] }

const SERIES: Series[] = [
  {
    name: 'GPT-5.6 Sol — reasoning effort',
    cls: 'sol',
    pts: [
      { cost: 0.32, score: 42.5, tier: 'Low', dy: 30 },
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
      { cost: 1.68, score: 62.2, tier: 'Low', dy: 25 },
      { cost: 2.39, score: 71.7, tier: 'Medium' },
      { cost: 2.74, score: 72.1, tier: 'High' },
    ],
  },
  {
    name: 'Claude Opus 4.5 — thinking-token budget',
    cls: 'opus45',
    pts: [
      { cost: 0.22, score: 7.8, tier: 'none', dy: -16 },
      { cost: 0.23, score: 9.4, tier: '1K' },
      { cost: 0.48, score: 13.9, tier: '8K' },
      { cost: 0.79, score: 22.8, tier: '16K' },
      { cost: 1.29, score: 30.6, tier: '32K' },
      { cost: 2.4, score: 37.6, tier: '64K' },
    ],
  },
]

const LO = Math.log10(0.18)
const HI = Math.log10(3.4)
const YTICKS = [0, 25, 50, 75, 100]

type Geo = {
  w: number
  h: number
  x0: number
  x1: number
  y0: number
  y1: number
  xticks: [number, string][]
  titles: boolean
}

/** Full geometry. The sheet caps at 46rem, so this never renders wider than
    ~555px — the viewBox is sized to that so 11px labels stay 11px-ish. */
const WIDE: Geo = {
  w: 600,
  h: 344,
  x0: 56,
  x1: 580,
  y0: 16,
  y1: 286,
  xticks: [
    [0.2, '$0.20'],
    [0.3, '$0.30'],
    [0.5, '$0.50'],
    [1, '$1.00'],
    [2, '$2.00'],
    [3, '$3.00'],
  ],
  titles: true,
}

/** Phone geometry: same data, fewer ticks, no axis titles — the caption and the
    $ / % on the ticks carry that job so nothing has to be hidden or panned. */
const NARROW: Geo = {
  w: 360,
  h: 304,
  x0: 40,
  x1: 346,
  y0: 14,
  y1: 276,
  xticks: [
    [0.2, '$0.20'],
    [0.5, '$0.50'],
    [1, '$1.00'],
    [3, '$3.00'],
  ],
  titles: false,
}

/** Below this container width the wide viewBox would push 11px labels under
    ~9.7 rendered px, so the phone geometry takes over. */
const NARROW_AT = 530
/** Labels sit above-right of their point, flipping to above-left when the point
    is close enough to the right edge that the text would run off the plot. */
const FLIP_ZONE = 90
const GAP = 8

function useNarrow(ref: React.RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // The sheet is visibility:hidden until it opens, and a hidden subtree never
    // fires the observer's initial callback — so measure once by hand, and keep
    // the window listener for resizes that happen while the sheet is closed.
    const measure = () => setNarrow(el.getBoundingClientRect().width < NARROW_AT)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return narrow
}

function ArcChart() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const g = useNarrow(wrapRef) ? NARROW : WIDE

  const px = (cost: number) => g.x0 + ((Math.log10(cost) - LO) / (HI - LO)) * (g.x1 - g.x0)
  const py = (score: number) => g.y1 - (score / 100) * (g.y1 - g.y0)
  const flips = (x: number) => x > g.x1 - FLIP_ZONE

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
      <div className="why-scroll" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${g.w} ${g.h}`}
          className="why-chart"
          role="img"
          aria-label="Scatter chart of ARC-AGI-2 score against cost per task on a logarithmic scale. GPT-5.6 Sol climbs from 42.5 percent at 32 cents per task to 92.5 percent at $1.44. Claude Opus 4.8 climbs from 62.2 percent at $1.68 to 72.1 percent at $2.74. Claude Opus 4.5 climbs from 7.8 percent with no thinking budget to 37.6 percent at a 64,000-token budget. Every curve rises steeply at first and then flattens."
        >
          {YTICKS.map((v) => (
            <g key={v}>
              <line className="why-grid" x1={g.x0} x2={g.x1} y1={py(v)} y2={py(v)} />
              <text className="why-ax" x={g.x0 - 8} y={py(v) + 4} textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          {g.xticks.map(([v, lbl]) => (
            <g key={lbl}>
              <line className="why-grid vt" x1={px(v)} x2={px(v)} y1={g.y0} y2={g.y1} />
              <text className="why-ax" x={px(v)} y={g.y1 + 20} textAnchor="middle">
                {lbl}
              </text>
            </g>
          ))}
          <line className="why-axis" x1={g.x0} x2={g.x1} y1={g.y1} y2={g.y1} />
          {g.titles ? (
            <>
              <text className="why-axtitle" x={(g.x0 + g.x1) / 2} y={g.y1 + 44} textAnchor="middle">
                Cost per task, log scale — the published stand-in for thinking spent
              </text>
              <text
                className="why-axtitle"
                transform={`translate(12 ${(g.y0 + g.y1) / 2}) rotate(-90)`}
                textAnchor="middle"
              >
                ARC-AGI-2 score
              </text>
            </>
          ) : null}
          {SERIES.map((s) => (
            <g key={s.cls} className={`why-series ${s.cls}`}>
              <polyline points={s.pts.map((p) => `${px(p.cost)},${py(p.score)}`).join(' ')} />
              {s.pts.map((p) => (
                <circle key={p.tier} cx={px(p.cost)} cy={py(p.score)} r={4} />
              ))}
              {s.pts.map((p, i) => {
                if (i !== 0 && i !== s.pts.length - 1) return null
                const x = px(p.cost)
                const flip = flips(x)
                return (
                  <text
                    key={`l-${p.tier}`}
                    className="why-pt"
                    x={flip ? x - GAP : x + GAP}
                    y={py(p.score) - 9 + (p.dy ?? 0)}
                    textAnchor={flip ? 'end' : 'start'}
                  >
                    {p.tier} · {p.score}%
                  </text>
                )
              })}
            </g>
          ))}
        </svg>
      </div>
      <figcaption>
        ARC-AGI-2, score against cost per task on a log scale. Each point is the same model at a
        higher reasoning effort or a bigger thinking budget. Source:{' '}
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
  const rows: { title: string; s: typeof BAD; overheadCls: string }[] = [
    { title: 'Untended', s: BAD, overheadCls: 'c-noise' },
    { title: 'Curated', s: GOOD, overheadCls: 'c-brief' },
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
        Both windows, three buckets: what it spent finding the work, what it spent on the work, and
        what was left over. Untended, that first bucket is the repo dump and the chat that drifted.
        Curated, it is the brief and the files it ruled out.
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
        And it does eventually stop paying. The previous generation&apos;s GPT-5.5 Pro at High
        reasoning costs $10.51 a task, about seven times GPT-5.5 at xHigh ($1.87), and scores{' '}
        <em className="hl">lower</em> on ARC-AGI-2 — 84.6% against 85.0%. Push Pro to xHigh and it
        is $10.76 for 84.2%. Past a point you are paying for thinking that buys nothing.
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
        So optimizing the context window is, in effect, buying back test-time compute for your
        actual problem. You are not turning the vendor&apos;s dial; you are making sure the thinking
        it already pays for lands on the thing you asked about instead of on everything piled around
        it.
      </p>

      <p>
        There is a second half to this story — where the model&apos;s attention actually goes as the
        window fills, and why the middle of a long context goes dim. That one gets its own deep dive
        from the compaction section further down this chapter, research and all.
      </p>
      <p>
        For now, the short version: a 200K window is not 200K of usable attention. It is 200K of
        room, and the more of it you fill, the less sharply the model sees any single thing in it.
        Anthropic&apos;s version of the conclusion is the closest thing this page has to a thesis:{' '}
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
        <h3>Sources</h3>
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
        </ul>
      </div>
    </WhyPanel>
  )
}
