'use client'

import '@/components/stack/workflows-chapter.css'

/* Pager is a 15-line private helper in StackShell; replicated here so this
   chapter is a single self-contained file the shell only has to render. */
function Pager({ prev, next }: { prev?: [string, string]; next?: [string, string] }) {
  return (
    <div className="chapter-foot">
      {prev ? (
        <a className="pager" href={prev[0]}>
          ← Prev <b>{prev[1]}</b>
        </a>
      ) : (
        <span className="pager" aria-hidden="true" />
      )}
      {next ? (
        <a className="pager" href={next[0]}>
          Next <b>{next[1]}</b> →
        </a>
      ) : (
        <a className="pager" href="#top">
          Back to top ↑
        </a>
      )}
    </div>
  )
}

function ChapterHead({ n, title, lede }: { n: string; title: string; lede: React.ReactNode }) {
  return (
    <div className="chapter-head">
      <span className="chapter-num" aria-hidden="true">
        {n}
      </span>
      <h2 className="rv">{title}</h2>
      <p className="lede chapter-lede rv" data-d="1">
        {lede}
      </p>
    </div>
  )
}

/* ── Figure 1 · the script is the harness ─────────────────── */

const STAGES: { label: string; chips: string[]; note: string }[] = [
  {
    label: 'stage 1 · find',
    chips: ['agent — read the logs', 'agent — read the call sites', 'agent — read the history'],
    note: 'parallel() is a barrier — all three land before stage 2',
  },
  {
    label: 'stage 2 · verify',
    chips: ['agent — check claim 1', 'agent — check claim 2', 'agent — check claim 3'],
    note: 'one fresh window per claim, and none of them the author',
  },
  {
    label: 'stage 3 · synthesize',
    chips: ['agent — write the one report'],
    note: 'the only stage that gets to see everything',
  },
]

/* Bands are laid out top-down from their chip counts so the per-stage note
   always lands in clear space instead of under the next band. */
const BAND_TOP = 18
const BAND_GAP = 16
const CHIP_PITCH = 30
const CHIP_H = 24
const HEAD_OFFSET = 34

const bandHeight = (chips: number) => HEAD_OFFSET + (chips - 1) * CHIP_PITCH + CHIP_H / 2 + 22

const BANDS = STAGES.map((stage, i) => ({
  ...stage,
  y: STAGES.slice(0, i).reduce((acc, s) => acc + bandHeight(s.chips.length) + BAND_GAP, BAND_TOP),
  h: bandHeight(stage.chips.length),
}))

const SPINE_H = BANDS.reduce((acc, b) => Math.max(acc, b.y + b.h), 0) + 16

const WORKFLOW_CODE = `// the harness, written for this one task
const claims = await agent(
  "extract every factual claim in the draft",
  { schema: ClaimList, model: "haiku" }
)

const checked = await parallel(
  claims.map(c => () =>
    agent(verify(c), { agentType: "reviewer" }))
)

return agent(report(checked), { model: "opus" })`

function WorkflowSpine() {
  const SPINE_X = 40
  const CHIP_X = 78
  const CHIP_W = 300

  return (
    <div className="wf-fig rv">
      <div className="wf-spine">
        <div className="wf-code">
          <div className="wf-code-name">audit-the-draft.workflow.js</div>
          <pre>{WORKFLOW_CODE}</pre>
        </div>
        <div className="wf-diagram">
          <svg
            viewBox={`0 0 420 ${SPINE_H}`}
            role="img"
            aria-label="A workflow script running three stages in order: three agents find evidence in parallel, three fresh agents verify each claim, and one agent synthesizes the report."
          >
            <line
              className="wf-rail"
              x1={SPINE_X}
              y1={12}
              x2={SPINE_X}
              y2={SPINE_H - 8}
              strokeDasharray="3 4"
            />
            {BANDS.map((stage) => {
              const mid = stage.y + stage.h / 2
              const lastChip = stage.y + HEAD_OFFSET + (stage.chips.length - 1) * CHIP_PITCH
              return (
                <g key={stage.label}>
                  <rect
                    className="wf-band"
                    x={SPINE_X - 16}
                    y={stage.y}
                    width={410 - SPINE_X + 16}
                    height={stage.h}
                    rx={6}
                  />
                  <circle className="wf-tick" cx={SPINE_X} cy={mid} r={4} />
                  {stage.chips.map((chip, j) => {
                    const cy = stage.y + HEAD_OFFSET + j * CHIP_PITCH
                    return (
                      <g key={chip}>
                        <path
                          className="wf-hop"
                          d={`M${SPINE_X},${mid} C ${SPINE_X + 20},${mid} ${CHIP_X - 20},${cy} ${CHIP_X},${cy}`}
                        />
                        <rect
                          className="wf-chip"
                          x={CHIP_X}
                          y={cy - CHIP_H / 2}
                          width={CHIP_W}
                          height={CHIP_H}
                          rx={4}
                        />
                        <text className="wf-chip-t" x={CHIP_X + 11} y={cy + 3.5}>
                          {chip}
                        </text>
                      </g>
                    )
                  })}
                  <text className="wf-band-t" x={SPINE_X + 38} y={stage.y + 16}>
                    {stage.label}
                  </text>
                  <text className="wf-note" x={SPINE_X + 38} y={lastChip + CHIP_H / 2 + 14}>
                    {stage.note}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <p className="wf-cap">
        <b>Left is the whole harness. </b>The control flow is ordinary JavaScript — the loop, the
        fan-out and the ordering are deterministic, decided by the script rather than improvised by
        a model mid-run. Only the boxes on the right are model calls, and each one gets its own
        clean window.
      </p>
    </div>
  )
}

/* ── Figure 2 · one family vs many families ───────────────── */

type Lane = { t: string; vendor: string; cls: string }

const CLAUDE_LANES: Lane[] = [
  { t: 'agent()  ·  opus  ·  worktree', vendor: 'claude', cls: 'wf-l-claude' },
  { t: 'agent()  ·  sonnet  ·  worktree', vendor: 'claude', cls: 'wf-l-claude' },
  { t: 'agent()  ·  sonnet  ·  reviews', vendor: 'claude', cls: 'wf-l-claude' },
  { t: 'agent()  ·  haiku  ·  classifies', vendor: 'claude', cls: 'wf-l-claude' },
]

const DELEGATE_LANES: Lane[] = [
  { t: 'agent(engine="codex")  ·  authors', vendor: 'openai', cls: 'wf-l-codex' },
  { t: 'agent(engine="cursor")  ·  reviews', vendor: 'xai', cls: 'wf-l-grok' },
  { t: 'agent(engine="kimi")  ·  reviews', vendor: 'moonshot', cls: 'wf-l-kimi' },
  { t: 'judges(engines=["claude", …])', vendor: 'anthropic', cls: 'wf-l-claude' },
]

function LanePanel({
  lanes,
  hub,
  rule,
  ruleTone,
  merge,
  label,
}: {
  lanes: Lane[]
  hub: string
  rule: string
  ruleTone: 'gate' | 'note'
  merge: string
  label: string
}) {
  const HUB_R = 62
  const CHIP_X = 94
  const CHIP_W = 258
  return (
    <svg viewBox="0 0 360 252" role="img" aria-label={label}>
      <rect className="wf-hub" x={8} y={78} width={54} height={30} rx={5} />
      <text className="wf-hub-t" x={35} y={97} textAnchor="middle">
        {hub}
      </text>
      {lanes.map((lane, i) => {
        const cy = 32 + i * 38
        return (
          <g key={`${lane.vendor}-${i}`}>
            <path
              className={`wf-hop ${lane.cls}`}
              d={`M${HUB_R},93 C ${HUB_R + 12},93 ${CHIP_X - 12},${cy} ${CHIP_X},${cy}`}
            />
            <rect
              className={`wf-chip ${lane.cls}`}
              x={CHIP_X}
              y={cy - 12}
              width={CHIP_W}
              height={24}
              rx={4}
            />
            <rect className={`wf-bar ${lane.cls}`} x={CHIP_X} y={cy - 12} width={4} height={24} />
            <text className="wf-chip-t" x={CHIP_X + 14} y={cy + 3.5}>
              {lane.t}
            </text>
            <text
              className={`wf-vendor ${lane.cls}`}
              x={CHIP_X + CHIP_W - 10}
              y={cy + 3}
              textAnchor="end"
            >
              {lane.vendor}
            </text>
          </g>
        )
      })}
      <line
        className={ruleTone === 'gate' ? 'wf-gate' : 'wf-rail'}
        x1={8}
        y1={190}
        x2={352}
        y2={190}
        strokeDasharray="5 5"
      />
      <text className={ruleTone === 'gate' ? 'wf-note wf-note-gate' : 'wf-note'} x={8} y={182}>
        {rule}
      </text>
      <rect className="wf-merge" x={8} y={202} width={344} height={30} rx={5} />
      <text className="wf-merge-t" x={180} y={221} textAnchor="middle">
        {merge}
      </text>
    </svg>
  )
}

function VersusFigure() {
  return (
    <div className="wf-versus rv">
      <div className="wf-panel">
        <h4>Dynamic workflows — one family, many windows</h4>
        <LanePanel
          hub="script"
          lanes={CLAUDE_LANES}
          rule="interrupted? resuming the session picks the workflow back up"
          ruleTone="note"
          merge="one result"
          label="Dynamic workflows: a script fanning out to four Claude agents — opus, sonnet, sonnet and haiku — each in its own worktree, merging into one result."
        />
        <p>
          Every lane is a Claude with a fresh window. The script chooses the intelligence level and
          whether the agent gets its own worktree.
        </p>
      </div>
      <div className="wf-panel wf-panel-alt">
        <h4>Delegate workflows — many families, many windows</h4>
        <LanePanel
          hub="script"
          lanes={DELEGATE_LANES}
          rule="gate=True — the whole run pauses here until I approve it"
          ruleTone="gate"
          merge="one result"
          label="Delegate workflows: a script fanning out to four different vendors' agents — Codex, Cursor, Kimi and a Claude judge panel — through a human approval gate into one result."
        />
        <p>
          Same deterministic script, but <b>each lane is a different vendor&apos;s model</b>. Codex
          authors, Cursor and Kimi review, Claude judges. The disagreement between families is the
          product.
        </p>
      </div>
      <ul className="wf-badges">
        <li>
          <span className="k">resume</span>Kill it, resume it. Finished agents replay from the
          journal instead of re-running; children still in flight get adopted.
        </li>
        <li>
          <span className="k">gate</span>
          <span className="inline-code">gate=True</span> stops the whole tree, drains what&apos;s in
          flight, and waits for <span className="inline-code">workflow approve</span>.
        </li>
        <li>
          <span className="k">detached</span>A supervisor process owns the run, so closing the
          laptop lid is not an interruption. <span className="inline-code">--budget N</span> caps
          how many child runs it may ever spend.
        </li>
      </ul>
    </div>
  )
}

/* ── The chapter ──────────────────────────────────────────── */

export function WorkflowsChapter() {
  return (
    <section className="chapter" id="ch9">
      <ChapterHead
        n="09"
        title="Workflows"
        lede={
          <>
            This is the advanced stuff, and it is the last move. Once you have agents, tools, skills
            and guardrails, the thing still living in your head is the <em>choreography</em> — who
            runs, in what order, who checks whom. Write that down as code and stop improvising it in
            a chat window.
          </>
        }
      />

      <p className="section-label">Credit where it is due</p>
      <div className="twoup">
        <div className="rv">
          <h3>Anthropic shipped this, and Thariq Shihipar and Sid Bidasaria built it</h3>
          <p>
            Anthropic shipped dynamic workflows at the end of May 2026. The idea is a genuinely new
            primitive, not a feature: <b>Claude writes its own harness on the fly</b>, custom-built
            for the task in front of it, instead of you hand-rolling a bespoke orchestrator every
            time a task outgrows one context window.
          </p>
          <p>
            Thariq Shihipar and Sid Bidasaria — <span className="inline-code">@trq212</span> and{' '}
            <span className="inline-code">@sidbid</span>, members of technical staff at Anthropic
            working on Claude Code — introduced it and wrote the article that taught me how to think
            about it. Everything in the next section is theirs, faithfully distilled. Go read the
            original; it is better than my summary.
          </p>
          <p className="wf-links">
            <a
              className="wf-link"
              href="https://x.com/trq212/article/2061907337154367865"
              target="_blank"
              rel="noopener noreferrer"
            >
              The article on X ↗
            </a>
            <a
              className="wf-link"
              href="https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code"
              target="_blank"
              rel="noopener noreferrer"
            >
              The same piece on the Claude blog ↗
            </a>
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>Why it is a big deal</h3>
          <p>
            Ask the default harness to do something big and it has to plan and execute in the same
            context window. That works for most coding, and it falls apart on long-running,
            massively parallel or adversarial work — which is exactly the work I care about most.
          </p>
          <p>
            You could always build a static harness with the Agent SDK or{' '}
            <span className="inline-code">claude -p</span>. But a static harness has to handle every
            edge case, so it ends up generic. The bet here is that the model is now good enough to
            write a{' '}
            <b>disposable harness tailored to one task, and throw it away when the task is done</b>.
          </p>
        </div>
      </div>

      <p className="section-label">The cliffnotes</p>
      <p className="lede rv">
        A dynamic workflow is a JavaScript file with a few special functions that spawn and
        coordinate subagents. That is the whole trick, and the whole trick is enough.
      </p>
      <WorkflowSpine />

      <div className="wf-api rv">
        <div className="wf-api-row">
          <span className="sig">agent(prompt, opts?)</span>
          <span className="dsc">
            One subagent, one fresh window, one job. Options pick the model, hand it a JSON schema
            so the output comes back validated instead of prosaic, isolate it in a worktree, or
            route it to a named subagent type.
          </span>
        </div>
        <div className="wf-api-row">
          <span className="sig">parallel([fns])</span>
          <span className="dsc">
            Fan out and wait. It is a barrier: every branch finishes before the next line runs, so
            the synthesize step always sees the complete set.
          </span>
        </div>
        <div className="wf-api-row">
          <span className="sig">pipeline(items, ...stages)</span>
          <span className="dsc">
            Every item streams through every stage. No barrier — item three can be at the verify
            stage while item nine is still drafting.
          </span>
        </div>
      </div>

      <p className="section-label">What structure actually buys you</p>
      <div className="precepts rv">
        <div className="precept">
          <span className="idx">01</span>
          <p className="claim">Agentic laziness</p>
          <p className="payoff">
            One long window declares victory after partial progress — twenty of the fifty items in a
            security review, and a confident summary.{' '}
            <b>A loop that spawns one agent per item cannot get bored on item twenty-one.</b>
          </p>
        </div>
        <div className="precept">
          <span className="idx">02</span>
          <p className="claim">Self-preferential bias</p>
          <p className="payoff">
            A model asked to judge its own findings against a rubric likes them. This is precept
            three from chapter one, and a workflow enforces it structurally rather than politely:{' '}
            <b>the verifier is a different process that never saw the work get made.</b>
          </p>
        </div>
        <div className="precept">
          <span className="idx">03</span>
          <p className="claim">Goal drift</p>
          <p className="payoff">
            Fidelity to the original objective leaks away across many turns, and every compaction is
            lossy — the &quot;don&apos;t do X&quot; constraint is exactly the sort of thing a
            summary drops. <b>The script does not compact. It still holds the goal on turn 400.</b>
          </p>
        </div>
      </div>

      <div className="callout rv">
        <span className="k">The patterns worth stealing</span>
        They name six, and I have used every one of them since: <b>classify-and-act</b> (a router
        agent decides which specialist handles it), <b>fan-out-and-synthesize</b> (many small
        windows, one merge), <b>adversarial verification</b> (a separate agent attacks each output
        against a rubric), <b>generate-and-filter</b> (make many, keep the survivors),{' '}
        <b>tournament</b> (agents compete, pairwise judges pick a winner — comparative judgment is
        more reliable than absolute scoring), and <b>loop-until-done</b> (keep spawning until no new
        findings, instead of a fixed number of passes). Bun was rewritten from Zig to Rust this way.
        The <span className="inline-code">/deep-research</span> skill in Claude Code is this,
        pointed at the web.
      </div>

      <p className="section-label">Then we went one step further</p>
      <p className="lede rv">
        I had been building the same shape for months, from the other direction — and once I read
        their piece I knew exactly what mine was missing and what it had that theirs did not. Mine
        is a Python script instead of a JavaScript one, and{' '}
        <em>every agent call can be a different company&apos;s model.</em>
      </p>
      <VersusFigure />

      <div className="twoup">
        <div className="rv">
          <h3>Why cross-vendor is the whole point</h3>
          <p>
            Precept three, upgraded from a habit into a control structure. In a Claude-native
            workflow every window is fresh, which kills self-preference — but every window still
            shares one pretraining run, one set of blind spots, one taste in bad ideas.{' '}
            <b>
              Fresh context decorrelates the conversation. Different vendors decorrelate the model.
            </b>
          </p>
          <p>
            So my <span className="inline-code">agent()</span> takes an{' '}
            <span className="inline-code">engine=</span> — codex, cursor, grok, claude, kimi, droid
            — and my <span className="inline-code">judges()</span> takes a list of them, because a
            ballot counted by three engines from three labs is a different instrument than a ballot
            counted three times by one. My standing routing: Codex authors, Cursor and Grok review,
            Claude judges. And the lanes have to be genuinely different families to count — Cursor
            and Grok are both running Grok 4.5, so putting both on a judging panel buys you nothing.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>The three things I needed that a chat session cannot give me</h3>
          <p>
            <b>It survives dying.</b> Resume replays finished agents from the journal by structural
            key — scope plus prompt plus options — so a crash three hours into an overnight run
            costs you the one agent that was mid-flight, not the run. Which is also why the script
            may not call <span className="inline-code">time</span>,{' '}
            <span className="inline-code">random</span> or <span className="inline-code">uuid</span>
            : a nondeterministic prompt is a cache key that never matches itself.
          </p>
          <p>
            <b>It can wait for me.</b> A gate is not a prompt in a terminal I have to be sitting at.
            It checkpoints the entire tree, drains what is in flight, and the supervisor exits
            paused until I run <span className="inline-code">workflow approve</span> — from my
            phone, tomorrow, whenever.
          </p>
          <p>
            <b>It runs without me.</b> Detached supervisor, hard run-count budget, and every child
            is an ordinary tagged run I can inspect, snapshot or cancel mid-flight. Before spending
            anything, <span className="inline-code">--dry-run</span> stubs every call and prints the
            run tree.
          </p>
        </div>
      </div>

      <div className="callout rv">
        <span className="k">When to actually reach for one</span>
        Reach for a workflow when <b>the orchestration itself is the hard part</b> — when you need a
        real loop, a fan-out over a work list, a barrier, a panel of judges, a budget, a gate. If
        the shape of the work is &quot;do this thing, well,&quot; just talk to one agent; a single
        bounded task does not need a supervisor and a journal.{' '}
        <b>And be honest about the bill: workflows use significantly more tokens.</b> The article
        says it plainly and it is right — most coding tasks do not need a panel of five reviewers.
        The test I use is whether structure would change the answer, not just the confidence. If I
        would accept the first agent&apos;s output anyway, I saved myself a hundred thousand tokens
        by asking.
      </div>

      <Pager prev={['#ch8', '08 · Build your own']} />
    </section>
  )
}
