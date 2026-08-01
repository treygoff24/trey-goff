'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import '@/components/stack/cockpit-chapter.css'
import { useOnceVisible, useReducedMotion } from '@/components/stack/hooks'

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

type PhaseKey = 'work' | 'done' | 'close' | 'hydrate' | 'brief'

type Station = {
  key: PhaseKey
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

/* ── The stage ────────────────────────────────────────────
   One object crosses the session boundary, and it is the same object the
   whole way: the STATE.md card is written in the old window, left on disk
   when the window dies, and lifted into the new one. Everything else on the
   stage exists to be lost. The card travels by transform between three
   anchors the stylesheet owns, so the horizontal desktop reading and the
   vertical phone reading are two coordinate sets, not two figures. */

/* Residue is what a real session leaves behind: mostly noise, a little
   signal. The kept ones are the ones that turn into lines of the file. */
const RESIDUE: { t: string; keep: boolean }[] = [
  { t: 'tried the ring layout, reverted', keep: false },
  { t: 'callout restyle shipped', keep: true },
  { t: '41 tool calls, 6 subagents', keep: false },
  { t: 'the mirrors drift — nothing guards it', keep: true },
  { t: 'a long argument about naming', keep: false },
  { t: 'gate green, one commit unpushed', keep: true },
  { t: 'three screenshots, two dead ends', keep: false },
  { t: 'cert still pending at close', keep: true },
]

const FILE_LINES = [
  'Callout restyle live on main — 9c3e190.',
  'Mirrors are hand-written; nothing guards the drift.',
  'Gate green. One commit unpushed.',
  'Watch: the cert was still pending at close.',
]

/* The card's status chip is the shortest possible statement of what is
   happening to the file at this station. */
const FILE_TAG: Record<PhaseKey, string> = {
  work: 'stale · 6 days',
  done: 'rewriting',
  close: 'on disk',
  hydrate: 'injected verbatim',
  brief: 'read by the scout',
}

const PHASE_LABEL: Record<PhaseKey, string> = {
  work: 'Station one. A working session is full of residue — reverted attempts, tool calls, arguments — and the repository’s STATE.md is six days stale.',
  done: 'Station two. The /done skill sorts the residue: most of it is discarded, four facts survive, and STATE.md is rewritten from them.',
  close:
    'Station three. The window is gone and its context with it. The STATE.md file, alone on disk, is the only thing that crossed the session boundary.',
  hydrate:
    'Station four. A SessionStart hook lifts that same file, unchanged, into a fresh session before the first prompt is typed.',
  brief:
    'Station five. The first prompt arrives packaged with STATE.md, the last twenty commits and the file map, and comes back as an orientation briefing.',
}

function LoopStage({ phase }: { phase: PhaseKey }) {
  return (
    <div className="cs-stage" data-phase={phase} role="img" aria-label={PHASE_LABEL[phase]}>
      <div className="cs-win cs-a">
        <span className="cs-win-t">session 47 · working window</span>
        <ul className="cs-chips">
          {RESIDUE.map((r) => (
            <li key={r.t} data-keep={r.keep ? '1' : '0'}>
              {r.t}
            </li>
          ))}
        </ul>
        <span className="cs-stamp">context gone</span>
      </div>

      <div className="cs-rail">
        <span className="cs-rail-t">disk</span>
      </div>

      <div className="cs-win cs-b">
        <span className="cs-win-t">session 48 · fresh window</span>
        <p className="cs-empty">no memory of session 47</p>
        <ul className="cs-brief">
          <li>STATE.md, verbatim</li>
          <li>last 20 commits</li>
          <li>500 file paths</li>
        </ul>
        <span className="cs-prompt">orientation briefing, before prompt one</span>
      </div>

      <div className="cs-file">
        <span className="cs-file-h">
          STATE.md
          <span className="cs-file-tag">{FILE_TAG[phase]}</span>
        </span>
        <span className="cs-file-stale">…as of last week. Nobody has rewritten it.</span>
        <ul className="cs-file-lines">
          {FILE_LINES.map((l, i) => (
            <li key={l} style={{ '--i': i } as React.CSSProperties}>
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="cs-return">
        <span>session 48 becomes the next session 47</span>
      </div>
    </div>
  )
}

const STEP_MS = 3400

function LoopFigure() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(false)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (!reduced) setAuto(true)
  }, 0.3)

  // One timer per step rather than a standing interval, so the tour can retire
  // itself the moment it closes the loop back onto station one. Autoplay that
  // never ends is a WCAG 2.2.2 failure; this one ends on its own, and the
  // control below can stop it sooner.
  useEffect(() => {
    if (!auto || reduced) return
    const id = setTimeout(() => {
      const next = (active + 1) % STATIONS.length
      setActive(next)
      if (next === 0) setAuto(false)
    }, STEP_MS)
    return () => clearTimeout(id)
  }, [auto, reduced, active])

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
    <div
      className="cp-loop rv"
      ref={figRef}
      // A pointer arriving over the figure means someone is reading it, so the
      // tour yields to them without waiting to be told.
      onPointerEnter={() => setAuto(false)}
    >
      <LoopStage phase={STATIONS[active]?.key ?? 'work'} />
      <p className="sr-only">{LOOP_LABEL}</p>

      {/* Under reduced motion there is no tour to stop, so the control would be
          a dead button; the stations stay reachable through the tabs. */}
      {reduced ? null : (
        <div className="cp-ctl">
          <button className="btn ghost cp-ctl-btn" type="button" onClick={() => setAuto((v) => !v)}>
            {auto ? 'Pause tour' : 'Play tour'}
          </button>
          <span className="cp-ctl-note">
            {auto
              ? 'Advancing through the loop — click any station to take over.'
              : 'Paused. Pick a station, or play the loop through once.'}
          </span>
        </div>
      )}

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

/* Same markup and same `.dl` grammar as the shell's card. Kept local because
   the shell imports this chapter, and importing it back would close a cycle
   over a twelve-line component. */
function DownloadCard({
  href,
  ext,
  name,
  desc,
}: {
  href: string
  ext: string
  name: string
  desc: React.ReactNode
}) {
  return (
    <a className="dl rv" href={href} download>
      <span className="ext">{ext}</span>
      <span className="nm">
        {name}
        <span className="ds">{desc}</span>
      </span>
      <span className="go">Download ↓</span>
    </a>
  )
}

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
            Every repository I do serious work in carries the same instruments in the same places.
            Not similar ones — the same filenames, at the root, holding the same kinds of sentence.
            That sameness is the whole feature:{' '}
            <b>an agent that has read one of my repos already knows how to read the next one.</b>
          </p>
          <p>
            Nothing here is clever. It is four files and a handful of scripts, and it is the best
            effort-to-payoff trade in this entire manual.
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

      <p className="lede rv">
        Both halves of that loop are yours to take. The template is the shape of the file, with the
        reasoning left in the margins; the skill is the closeout sweep that rewrites it, generic
        enough to drop into any repository.
      </p>
      <DownloadCard
        href="/stack/STATE-template.md"
        ext="md"
        name="STATE-template.md"
        desc="The sitrep, as a fill-in-the-blanks file — with the rules for keeping it honest written into the comments."
      />
      <DownloadCard
        href="/stack/skills/done.md"
        ext="skill"
        name="done · closeout sweep"
        desc="The skill I invoke at the end of every session. It reconciles the ledger, rewrites STATE.md, and leaves a handoff if work is unfinished."
      />

      <p className="section-label">Tripwires and valets</p>
      <div className="twoup">
        <div className="rv">
          <h3>A hook is a script the harness runs on its own events</h3>
          <p>
            Not a prompt, and not a line in an instruction file the model may or may not weigh
            heavily this morning. <b>A shell command, fired on a lifecycle event: </b>
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
            to be a sentence in a CLAUDE.md; now, in the repos where I have wired it, it is a
            machine that runs after every edit and costs zero tokens to obey.{' '}
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
