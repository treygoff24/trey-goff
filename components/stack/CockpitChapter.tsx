'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import '@/components/stack/cockpit-chapter.css'

/* Local copies of the small viewport/timer hooks the other figures use, so this
   chapter stays self-contained. */

function useReducedMotionLocal(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useOnceVisibleLocal<T extends HTMLElement>(onVisible: () => void, threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const fired = useRef(false)
  const cb = useRef(onVisible)
  cb.current = onVisible
  useEffect(() => {
    const el = ref.current
    if (!el || fired.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true
            cb.current()
            io.disconnect()
          }
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return ref
}

/* ── The instrument set ───────────────────────────────────── */

const INSTRUMENTS: { name: string; kind: string; line: React.ReactNode }[] = [
  {
    name: 'CLAUDE.md',
    kind: 'standing brief',
    line: (
      <>
        The rules that do not change — how to commit, when to ask, which CLI to reach for. Chapter
        two is about writing it; every session after that is about it already being written.
      </>
    ),
  },
  {
    name: 'TASKS.md',
    kind: 'durable ledger',
    line: (
      <>
        Every open thread with an owner, a blocker and the next concrete action. It is detailed and
        it grows. This is the file you read when you need the whole history of a decision.
      </>
    ),
  },
  {
    name: 'STATE.md',
    kind: 'the sitrep',
    line: (
      <>
        Twenty-five lines of where things stand <em>right now</em>: what is done, what is next, what
        is worrying me. <b>Sitrep-shaped, not history-shaped. </b>It gets rewritten, never appended.
      </>
    ),
  },
  {
    name: 'hooks',
    kind: 'reflexes',
    line: (
      <>
        Scripts the harness runs on its own events — session start, after an edit, before a
        compaction. They fire whether or not anyone remembered to ask.
      </>
    ),
  },
  {
    name: 'memory',
    kind: 'what accrues',
    line: (
      <>
        Distilled facts rather than transcripts: one store scoped to this repo, one shared across
        every assistant on the machine.
      </>
    ),
  },
]

/* ── Figure 1 · the loop ──────────────────────────────────── */

type Station = {
  key: string
  /** the label that fits inside a node box */
  node: string
  /** the heading over the detail panel */
  head: string
  body: React.ReactNode
}

const STATIONS: Station[] = [
  {
    key: 'work',
    node: 'work happens',
    head: 'Ordinary work, in an ordinary window',
    body: (
      <>
        Windows fill up, subagents come and go, the plan changes twice. None of it survives on its
        own — <b>a context window is not a filing cabinet. </b>Everything that matters after today
        has to end up in a file, and the only reliable moment to do that is the end of the session.
      </>
    ),
  },
  {
    key: 'done',
    node: '/done writes it down',
    head: 'One skill makes durable state catch up with reality',
    body: (
      <>
        I type two words. A closeout skill checks the live state of the repo against what the docs
        claim, updates <span className="inline-code">TASKS.md</span>, rewrites{' '}
        <span className="inline-code">STATE.md</span> into a current sitrep, files anything worth
        keeping into memory, and leaves a handoff pointer if work is unfinished.{' '}
        <b>It is a skill, not a hook — I invoke it. </b>Which is the right design: a session that
        ended badly should not automatically be recorded as the truth.
      </>
    ),
  },
  {
    key: 'close',
    node: 'the window closes',
    head: 'Everything in context is gone',
    body: (
      <>
        No transcript is carried forward, nothing is quietly cached, and the next session has no
        privileged access to this one. What persists is exactly what got written to disk — which is
        why the previous step is the load-bearing one.
      </>
    ),
  },
  {
    key: 'hydrate',
    node: 'STATE.md injected',
    head: 'The next session opens already oriented',
    body: (
      <>
        A hook on <span className="inline-code">SessionStart</span> reads the repository&apos;s{' '}
        <span className="inline-code">STATE.md</span> and injects it verbatim, before I have typed a
        word.{' '}
        <b>
          The new session&apos;s first impression of the project is the last session&apos;s own
          summary of it.{' '}
        </b>
        Verbatim matters: nothing re-summarizes a summary.
      </>
    ),
  },
  {
    key: 'brief',
    node: 'briefing on prompt 1',
    head: 'Then the machine scouts the repo for it',
    body: (
      <>
        On the first substantive prompt, the same hook packages that prompt with{' '}
        <span className="inline-code">STATE.md</span>, the last twenty commits and up to five
        hundred file paths, has a small fast model turn them into an orientation briefing, and hands
        the briefing over alongside the prompt. It skips slash commands and one-liners, and it fails
        open — if the briefing model is down, the prompt goes through untouched.
      </>
    ),
  },
]

const LOOP_LABEL =
  'A five-station loop: work happens, then the /done skill rewrites STATE.md and updates TASKS.md and memory, then the session ends, then a SessionStart hook injects STATE.md verbatim into the next session, then the first prompt receives an orientation briefing built from STATE.md, the last twenty commits and the file map — and work happens again, already oriented.'

const CX = 280
const CY = 176
const RX = 190
const RY = 128
const NODE_W = 178
const NODE_H = 36

const ringPoint = (i: number) => {
  const t = (-90 + i * 72) * (Math.PI / 180)
  return { x: CX + RX * Math.cos(t), y: CY + RY * Math.sin(t) }
}

/* Chevrons sit between stations and point the way the loop runs. Rotation comes
   from the ellipse tangent so the arrowheads never disagree with the curve. */
const CHEVRONS = STATIONS.map((_, i) => {
  const t = (-90 + i * 72 + 36) * (Math.PI / 180)
  return {
    x: CX + RX * Math.cos(t),
    y: CY + RY * Math.sin(t),
    a: (Math.atan2(RY * Math.cos(t), -RX * Math.sin(t)) * 180) / Math.PI,
  }
})

function LoopRing({ active }: { active: number }) {
  return (
    <svg viewBox="0 0 560 336" role="img" aria-label={LOOP_LABEL}>
      <ellipse className="cp-ring" cx={CX} cy={CY} rx={RX} ry={RY} />
      {CHEVRONS.map((c, i) => (
        <path
          key={i}
          className="cp-chev"
          d="M -5 -5 L 5 0 L -5 5"
          transform={`translate(${c.x} ${c.y}) rotate(${c.a})`}
        />
      ))}
      <text className="cp-ring-hub" x={CX} y={CY - 4} textAnchor="middle">
        the session loop
      </text>
      <text className="cp-ring-sub" x={CX} y={CY + 16} textAnchor="middle">
        nothing here is me remembering
      </text>
      {STATIONS.map((s, i) => {
        const p = ringPoint(i)
        const on = i === active
        return (
          <g key={s.key} className={on ? 'cp-node on' : 'cp-node'}>
            <rect x={p.x - NODE_W / 2} y={p.y - NODE_H / 2} width={NODE_W} height={NODE_H} rx={5} />
            <text x={p.x} y={p.y + 4.5} textAnchor="middle">
              {s.node}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const N_TOP = 34
const N_PITCH = 56
const N_X = 46
const N_W = 246
const RAIL_X = 28

function LoopColumn({ active }: { active: number }) {
  const lastY = N_TOP + (STATIONS.length - 1) * N_PITCH
  return (
    <svg viewBox={`0 0 300 ${lastY + 54}`} role="img" aria-label={LOOP_LABEL}>
      <line className="cp-ring" x1={RAIL_X} y1={N_TOP} x2={RAIL_X} y2={lastY} />
      <path
        className="cp-ring"
        d={`M ${RAIL_X},${lastY} C 2,${lastY + 34} 2,${N_TOP - 26} ${RAIL_X},${N_TOP}`}
        fill="none"
      />
      {STATIONS.map((s, i) => {
        const cy = N_TOP + i * N_PITCH
        const on = i === active
        return (
          <g key={s.key}>
            <line className="cp-ring" x1={RAIL_X} y1={cy} x2={N_X} y2={cy} />
            {i < STATIONS.length - 1 ? (
              <path
                className="cp-chev"
                d="M -5 -5 L 5 0 L -5 5"
                transform={`translate(${RAIL_X} ${cy + N_PITCH / 2}) rotate(90)`}
              />
            ) : null}
            <g className={on ? 'cp-node on' : 'cp-node'}>
              <rect x={N_X} y={cy - NODE_H / 2} width={N_W} height={NODE_H} rx={5} />
              <text x={N_X + N_W / 2} y={cy + 4.5} textAnchor="middle">
                {s.node}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

const STEP_MS = 3400

function LoopFigure() {
  const reduced = useReducedMotionLocal()
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(false)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const figRef = useOnceVisibleLocal<HTMLDivElement>(() => {
    if (!reduced) setAuto(true)
  }, 0.3)

  useEffect(() => {
    if (!auto || reduced) return
    const id = setInterval(() => setActive((i) => (i + 1) % STATIONS.length), STEP_MS)
    return () => clearInterval(id)
  }, [auto, reduced])

  // Any deliberate pick ends the tour: the reader is driving now.
  const pick = useCallback((i: number) => {
    setAuto(false)
    setActive(i)
  }, [])

  const onKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const delta =
        e.key === 'ArrowRight' || e.key === 'ArrowDown'
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
            ? -1
            : 0
      if (delta === 0) return
      e.preventDefault()
      const next = (active + delta + STATIONS.length) % STATIONS.length
      pick(next)
      tabsRef.current[next]?.focus()
    },
    [active, pick],
  )

  return (
    <div className="cp-loop rv" ref={figRef}>
      <div className="cp-loop-wide">
        <LoopRing active={active} />
      </div>
      <div className="cp-loop-narrow">
        <LoopColumn active={active} />
      </div>

      <div
        className="cp-tabs"
        role="tablist"
        aria-label="Stations of the session loop"
        onKeyDown={onKey}
        // Focus arriving anywhere in the tablist ends the tour, so autoplay
        // can never move selection out from under a keyboard user.
        onFocusCapture={() => setAuto(false)}
      >
        {STATIONS.map((s, i) => (
          <button
            key={s.key}
            ref={(el) => {
              tabsRef.current[i] = el
            }}
            type="button"
            role="tab"
            id={`cp-tab-${s.key}`}
            aria-controls={`cp-panel-${s.key}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            className={i === active ? 'cp-tab on' : 'cp-tab'}
            onClick={() => pick(i)}
          >
            <span className="cp-tab-n">{String(i + 1).padStart(2, '0')}</span>
            {s.node}
          </button>
        ))}
      </div>

      {/* Every panel stays in the grid cell so the tallest one reserves the
          height; switching stations never moves the page under the reader.
          Inactive panels are hidden by class rather than the hidden attribute,
          whose UA display:none would collapse that reservation. */}
      <div className="cp-stack">
        {STATIONS.map((s, i) => (
          <div
            key={s.key}
            className={i === active ? 'cp-panel on' : 'cp-panel'}
            id={`cp-panel-${s.key}`}
            role="tabpanel"
            aria-labelledby={`cp-tab-${s.key}`}
            aria-hidden={i === active ? undefined : true}
            inert={i === active ? undefined : true}
          >
            <h4>{s.head}</h4>
            <p>{s.body}</p>
          </div>
        ))}
      </div>

      <p className="cp-cap">
        <b>I never explain where we left off. </b>The repo does it. Note the division of labor:{' '}
        <span className="inline-code">/done</span> writes, the hook only reads. There is no daemon
        maintaining state behind my back — one skill I invoke deliberately produces the file, and
        one dumb, fast, fail-open hook serves it to whoever opens the repo next.
      </p>
    </div>
  )
}

/* ── Figure 2 · the hooks I actually run ──────────────────── */

const HOOKS: { event: string; name: string; body: React.ReactNode }[] = [
  {
    event: 'SessionStart',
    name: 'State hydrator',
    body: (
      <>
        Reads the repository&apos;s <span className="inline-code">STATE.md</span> and injects it
        verbatim; on the first real prompt, adds an orientation briefing built from that file, the
        last twenty commits and the file map. The loop above is mostly this hook.
      </>
    ),
  },
  {
    event: 'PostToolUse · Write|Edit',
    name: 'Format on edit',
    body: (
      <>
        Every file the agent writes goes straight through that repository&apos;s own formatter —
        Ruff here, Prettier there, <span className="inline-code">swiftlint --fix</span> then{' '}
        <span className="inline-code">swift format</span> on the Swift one.{' '}
        <b>The agent never ships unformatted code and never spends a token on formatting. </b>It is
        deliberately per-repo, because the formatter is per-repo.
      </>
    ),
  },
  {
    event: 'PreCompact',
    name: 'Handoff writer',
    body: (
      <>
        Before an automatic compaction, a script reads the transcript for tasks, tool calls, edited
        paths and errors, writes a handoff document to disk, and returns a continuity note to the
        compacted session. <b>The summary is allowed to be lossy because the file is not. </b>
        Chapter one is the argument for why you want this.
      </>
    ),
  },
  {
    event: 'SessionStart',
    name: 'Session snapshot',
    body: (
      <>
        Points every later shell call at one shared environment, then takes a best-effort local
        filesystem snapshot, at most once every four hours. It is a deletion-recovery net. I have
        needed it exactly once, which was one more time than I expected to.
      </>
    ),
  },
  {
    event: 'PreToolUse · Agent',
    name: 'Subagent model guard',
    body: (
      <>
        Inspects every subagent spawn before it happens: an unspecified model becomes Opus, the
        cheap tier is upgraded, and the expensive tier is refused unless the prompt carries an
        explicit approval token. It never stalls the run — it corrects the call and says why.{' '}
        <b>Routing policy I would otherwise have to remember five times a day.</b>
      </>
    ),
  },
]

/* ── The chapter ──────────────────────────────────────────── */

export function CockpitChapter() {
  return (
    <>
      <p className="section-label">Every repo, the same cockpit</p>
      <div className="twoup">
        <div className="rv">
          <h3>An agent wakes up amnesiac, every single time</h3>
          <p>
            Every session is a stranger&apos;s first day. It has your standing instructions and
            nothing else: no memory of yesterday&apos;s argument, no idea which of the four
            half-finished branches is the live one, no sense of what you already tried and rejected.
          </p>
          <p>
            The default fix for that is <em>you</em>, typing it all out again, in every repo, every
            morning. It is a tax, you pay it forever, and it gets more expensive with every project
            you add. Worse, you pay it badly — the third time you explain a project you skip the
            parts that feel obvious, which are exactly the parts the agent did not know.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>So standardize the repo and let it do the briefing</h3>
          <p>
            Every repository I work in carries the same instruments in the same places. Not similar
            ones — the same filenames, at the root, holding the same kinds of sentence. That
            sameness is the whole feature:{' '}
            <b>an agent that has read one of my repos already knows how to read the next one.</b>
          </p>
          <p>
            Nothing here is clever. It is four files and a handful of scripts, and it is the
            cheapest problem-to-solution ratio in this entire manual.
          </p>
        </div>
      </div>

      <ul className="cp-instruments rv">
        {INSTRUMENTS.map((it) => (
          <li key={it.name}>
            <span className="cp-inst-name">{it.name}</span>
            <span className="cp-inst-kind">{it.kind}</span>
            <p>{it.line}</p>
          </li>
        ))}
        {/* Completes the final row's rule so the strip closes on a full-width
            hairline instead of a ragged one. */}
        <li className="cp-fill" aria-hidden="true" />
      </ul>

      <p className="section-label">The loop</p>
      <p className="lede rv">
        Those files are only worth having if something keeps them true and something else reads them
        back. That is a closed loop, and it runs five times a day without me thinking about it.
      </p>
      <LoopFigure />

      <p className="section-label">Tripwires and valets</p>
      <div className="twoup">
        <div className="rv">
          <h3>A hook is a script the harness runs on its own events</h3>
          <p>
            Not a prompt, not a suggestion, not a line in an instruction file the model may or may
            not weigh heavily this morning. <b>A shell command, fired on a lifecycle event: </b>
            session start, before a tool call, after a write, before a compaction. It can inject
            text into the conversation, block the call, or quietly do a chore.
          </p>
          <p>
            The distinction that matters: an instruction is something the model chooses to follow. A
            hook is something that happens.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>Hooks make the right thing the automatic thing</h3>
          <p>
            Every hook below replaces a rule I used to write down and then hope for. Formatting used
            to be a sentence in a CLAUDE.md; now it is a machine that runs after every edit and
            costs zero tokens to obey.{' '}
            <b>Policy enforced by machinery instead of by the model remembering. </b>
          </p>
          <p>
            The leverage is the same shape as the standing brief in chapter two — write it once, it
            applies to every session forever — except a hook cannot be skimmed, deprioritized or
            compacted away.
          </p>
        </div>
      </div>

      <ul className="cp-hooks rv">
        {HOOKS.map((h) => (
          <li key={h.name}>
            <span className="cp-hook-ev">{h.event}</span>
            <h4>{h.name}</h4>
            <p>{h.body}</p>
          </li>
        ))}
        <li className="cp-fill" aria-hidden="true" />
      </ul>

      <div className="callout rv">
        <span className="k">The honest caveat</span>
        Hooks are the sharpest instrument in the box and they cut both ways. A guard hook that
        false-positives is worse than no hook at all — mine once blocked ordinary commit messages,
        and blocked its own test suite, for months before I killed it.{' '}
        <b>Write hooks that do chores freely; write hooks that say no very carefully. </b>The test I
        use now: if it fires wrongly, does the agent get a clear correction, or does it get stuck?
      </div>

      <p className="section-label">The repo remembers, and so does the machine</p>
      <p className="lede rv">
        <span className="inline-code">STATE.md</span> answers &quot;where are we.&quot; Memory
        answers the slower question — what did we learn, and does it outlive this project.
      </p>

      <div className="cp-mem rv">
        <div className="cp-mem-col">
          <span className="cp-mem-tag">layer one · per repo</span>
          <h4>Distilled memory, keyed to this repository</h4>
          <p>
            An index file with a one-line pointer per fact, plus a topic page behind each pointer.
            The first two hundred lines of the index load at every session start; the topic pages
            are read on demand. Worktrees and subdirectories share the store, so a swarm of lanes is
            reading one memory, not five.
          </p>
          <p>
            What goes in it is <em>distilled</em> — a fact the agent decided was worth keeping, in
            its own words — not a transcript. That constraint is what keeps it small enough to load
            every time.
          </p>
        </div>
        <div className="cp-mem-arrow" aria-hidden="true">
          <span className="cp-mem-arrow-t">harvest · every 30 min</span>
        </div>
        <div className="cp-mem-col">
          <span className="cp-mem-tag">layer two · the machine</span>
          <h4>Memorum: one memory layer for every assistant</h4>
          <p>
            Per-repo memory is per-harness, which means the thing Claude learned about me on Tuesday
            is invisible to Codex on Wednesday. Memorum is the fix:{' '}
            <b>one shared local store every coding assistant on the machine can read. </b>Plain
            Markdown with frontmatter, version-controlled with git, no cloud and no telemetry, with
            a single owner-only daemon as the only writer.
          </p>
          <p>
            Writes are governed rather than trusted — low-confidence or unsafe material becomes a
            candidate or lands in quarantine instead of becoming a memory. An ambient harvest runs
            every thirty minutes, pulling the per-repo distilled stores into the canonical one. It
            holds about nine hundred memories today.
          </p>
        </div>
      </div>

      <div className="callout rv">
        <span className="k">Where this actually stands</span>
        Three legs of that diagram are live and load-bearing right now: closeout writing{' '}
        <span className="inline-code">STATE.md</span>, the hook injecting it, and the harvest. The
        fourth is not —{' '}
        <b>Memorum does not yet whisper relevant memories into a session by itself. </b>
        Today it is a store that fills itself and gets read on request. I am telling you that
        because a stack described one release ahead of what it does is how people end up debugging
        someone else&apos;s fantasy.
      </div>

      <div className="callout rv">
        <span className="k">Why it compounds</span>
        Every piece here is small. Four files, five scripts, a closeout habit — no single item on
        the list would survive a demo. Together they mean a fresh two-hundred-thousand-token window
        opens with the orientation of a colleague who never left: it knows the standing rules, the
        open threads, the current worry, what changed in the last twenty commits, and where
        everything lives.{' '}
        <b>
          This is the cheap, boring half of solving context, and it is the half almost nobody does.
        </b>{' '}
        Chapter one was the other half — spending the window well once you are in it. Do both and
        the amnesia stops being the thing you plan around.
      </div>
    </>
  )
}
