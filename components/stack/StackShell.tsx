'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CHAPTERS,
  DAY_ONE_TERM,
  HERO_TERM,
  SELF_BUILD_TERM,
  START_TONIGHT,
} from '@/components/stack/data'
import { useReducedMotion, useReveal } from '@/components/stack/hooks'
import { Terminal } from '@/components/stack/Terminal'
import {
  ContextFigure,
  CopyPromptBlock,
  DecisionTree,
  FanOut,
  Gauntlet,
  SkillAnatomy,
  ToolRack,
} from '@/components/stack/widgets'

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

function ChapterHead({
  n,
  eyebrow,
  title,
  lede,
}: {
  n: string
  eyebrow: string
  title: string
  lede: React.ReactNode
}) {
  return (
    <div className="chapter-head">
      <span className="chapter-num" aria-hidden="true">
        {n}
      </span>
      <p className="eyebrow rv">{eyebrow}</p>
      <h2 className="rv" data-d="1">
        {title}
      </h2>
      <p className="lede chapter-lede rv" data-d="2">
        {lede}
      </p>
    </div>
  )
}

export function StackShell() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotion()
  useReveal(rootRef, reduced)

  const [active, setActive] = useState(-1)
  const [pct, setPct] = useState(0)
  const [railOpen, setRailOpen] = useState(false)
  const meterRef = useRef<HTMLDivElement | null>(null)
  const railRef = useRef<HTMLElement | null>(null)
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.chapter'))
    let ticking = false
    let frame = 0
    const onScroll = () => {
      if (ticking) return
      ticking = true
      frame = requestAnimationFrame(() => {
        ticking = false
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        if (meterRef.current) meterRef.current.style.transform = `scaleX(${p.toFixed(4)})`
        setPct(Math.round(p * 100))
        const mid = window.scrollY + window.innerHeight * 0.35
        let idx = -1
        sections.forEach((section, i) => {
          if (section.offsetTop <= mid) idx = i
        })
        setActive(idx)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!railOpen) {
      // Restore focus to the toggle when the sheet closes via link/scrim/Escape.
      if (document.activeElement?.closest('#stack-rail')) toggleRef.current?.focus()
      return
    }
    railRef.current?.querySelector<HTMLElement>('.rail-link')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRailOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [railOpen])

  const spinePct = CHAPTERS.length > 1 ? (Math.max(0, active) / (CHAPTERS.length - 1)) * 100 : 0

  return (
    <div id="stack-root" ref={rootRef}>
      <a className="skip" href="#ch1">
        Skip to chapter one
      </a>
      <div className="scrollmeter" ref={meterRef} aria-hidden="true" />

      {railOpen && (
        <div className="rail-scrim open" onClick={() => setRailOpen(false)} aria-hidden="true" />
      )}
      <nav
        className={railOpen ? 'rail open' : 'rail'}
        id="stack-rail"
        aria-label="Chapters"
        ref={railRef}
      >
        <a className="rail-mark" href="#top">
          Trey Goff / treygoff.com
          <strong>The Setup</strong>
        </a>
        <div className="rail-nav">
          <div className="rail-spine" aria-hidden="true">
            <i style={{ height: `${spinePct}%` }} />
          </div>
          {CHAPTERS.map((c, i) => (
            <a
              key={c.id}
              className={i < active ? 'rail-link done' : 'rail-link'}
              href={`#${c.id}`}
              aria-current={i === active ? 'true' : 'false'}
              onClick={() => setRailOpen(false)}
            >
              <span className="n">{c.n}</span>
              <span>{c.title}</span>
            </a>
          ))}
        </div>
        <div className="rail-foot">
          <span>Progress</span>
          <span>
            <b>{pct}%</b>
          </span>
        </div>
      </nav>

      <button
        className="rail-toggle"
        type="button"
        aria-expanded={railOpen}
        aria-controls="stack-rail"
        onClick={() => setRailOpen((v) => !v)}
        ref={toggleRef}
      >
        <span>Chapters</span>
        <span className="pct">{CHAPTERS[active]?.n ?? '—'}</span>
      </button>

      {/* The root layout already provides the <main> landmark; this is styling only. */}
      <div className="shell" id="top">
        <div className="wrap">
          {/* ── Hero ── */}
          <header className="hero">
            <p className="eyebrow rv">A field manual · 2026</p>
            <h1 className="rv" data-d="1">
              The <em className="hl">setup</em>.
              <br />
              <span className="thin">How I actually build software now.</span>
            </h1>
            <p className="hero-sub rv" data-d="2">
              A complete, working agentic development stack — explained from first principles, with
              the real artifacts attached. If you can open a terminal, you can have this by tonight.
            </p>
            <div className="hero-meta rv" data-d="3">
              <span>8 chapters</span>
              <span>317 skills on the machine</span>
              <span>12 custom tools</span>
              <span>6 model families</span>
              <span>
                <b>Built by the thing it describes</b>
              </span>
            </div>
            <div className="hero-term rv" data-d="4">
              <Terminal title="~/Code/trey-goff" lines={HERO_TERM} autoplay />
            </div>
            <a className="scroll-cue" href="#ch1">
              <i /> Begin
            </a>
          </header>

          {/* ── Chapter 1 ── */}
          <section className="chapter" id="ch1">
            <ChapterHead
              n="01"
              eyebrow="Chapter one · First principles"
              title="Why any of this works"
              lede="Every technique in this manual falls out of five ideas. Learn the five and you can invent the rest yourself — which is good, because the tools change every eight weeks and the principles haven't moved in two years."
            />
            <div className="precepts rv">
              <div className="precept">
                <span className="idx">01</span>
                <p className="claim">Context is the scarce resource.</p>
                <p className="payoff">
                  The model is not reading your repository. It is reading whatever you managed to
                  fit into one window before it started answering.{' '}
                  <b>
                    Almost every &quot;the AI is dumb&quot; moment is actually a packing problem.
                  </b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">02</span>
                <p className="claim">Verification beats trust.</p>
                <p className="payoff">
                  &quot;Done&quot; is a claim, not a fact.{' '}
                  <b>
                    Every claim should have a command attached that would fail loudly if the claim
                    were false
                  </b>{' '}
                  — a test, a type-check, a screenshot, a curl. In a controlled bakeoff of my three
                  web-research lanes, 11–21% of spot-checked quotes failed verification.
                  Verification is not a lane you pick. It is a step you always run.
                </p>
              </div>
              <div className="precept">
                <span className="idx">03</span>
                <p className="claim">Fresh eyes beat loaded eyes.</p>
                <p className="payoff">
                  The agent that wrote the code is the worst possible reviewer of it: it is already
                  convinced. <b>Hand the diff to something with no memory of writing it</b> —
                  another agent, another model, another vendor entirely.
                </p>
              </div>
              <div className="precept">
                <span className="idx">04</span>
                <p className="claim">Small, reversible steps.</p>
                <p className="payoff">
                  Commit constantly — after every coherent change, unasked.{' '}
                  <b>
                    The cost of a wrong turn should be one{' '}
                    <span className="inline-code">git revert</span>, not an afternoon
                  </b>{' '}
                  of untangling. Speed comes from cheap undo, not from careful driving.
                </p>
              </div>
              <div className="precept">
                <span className="idx">05</span>
                <p className="claim">Brief it like a colleague.</p>
                <p className="payoff">
                  It is not a tool you operate; it is a very fast contractor who has never seen your
                  codebase, can&apos;t ask a follow-up at 3am, and will do exactly what you said.{' '}
                  <b>Write the brief you&apos;d want on your first day.</b>
                </p>
              </div>
            </div>

            <p className="section-label">The figure that explains the whole manual</p>
            <ContextFigure />

            <div className="callout rv">
              <span className="k">The move</span>
              Everything that follows — the instruction files, the skills, the subagents, the
              fan-out — is a different answer to the same question:{' '}
              <b>how do I spend this window on the work instead of on the search for the work?</b>
            </div>
            <Pager next={['#ch2', '02 · Day one']} />
          </section>

          {/* ── Chapter 2 ── */}
          <section className="chapter" id="ch2">
            <ChapterHead
              n="02"
              eyebrow="Chapter two · Installation"
              title="Day one"
              lede="Twenty minutes from nothing to a working setup. Then one file that will do more for you than the next six months of prompt tips."
            />
            <p className="section-label">Ten minutes: install and first contact</p>
            <div className="rv">
              <Terminal title="Terminal — first run" lines={DAY_ONE_TERM} />
            </div>
            <div className="callout rv">
              <span className="k">Permissions, plainly</span>
              The first time it wants to run something, it asks.{' '}
              <b>
                Read-only things — searching, reading files — you can allow permanently and forget
                about.
              </b>{' '}
              Anything that writes, deletes, or talks to the network deserves a look the first few
              times, until you have a feel for what it reaches for. There is a &quot;yes to
              everything&quot; mode. Use it only in a repo you could throw away.
            </div>
            <p className="section-label">Ten more: the highest-leverage file on your machine</p>
            <div className="twoup">
              <div className="rv">
                <h3>CLAUDE.md is a standing brief, not a config file</h3>
                <p>
                  Every session starts by reading it. That makes it the one place where a thing you
                  type once gets applied forever — and the one place where a sloppy sentence gets
                  applied forever too.
                </p>
                <p>
                  Mine has grown into a working agreement: how to commit, when to ask, which CLI to
                  reach for, and a running list of shell footguns that cost me an hour each, written
                  down so they never cost anyone an hour again.
                </p>
              </div>
              <div className="rv" data-d="1">
                <h3>What earns a line in it</h3>
                <p>
                  <b>Rules you would repeat to a new hire. </b>&quot;Commits are ungated, pushes
                  need my go-ahead.&quot; &quot;This repo uses pnpm, never npm.&quot;
                </p>
                <p>
                  <b>Scars.</b> Every time you correct the same mistake twice, that correction
                  belongs in the file instead of in your next message.
                </p>
                <p>
                  <b>Not </b>anything the code already says. It can read the code. Don&apos;t spend
                  the window narrating your own directory tree.
                </p>
              </div>
            </div>
            <DownloadCard
              href="/stack/global-CLAUDE.md"
              ext="MD"
              name="global-CLAUDE.md"
              desc="My real global instruction file, sanitized — deletion policy, git discipline, commit-message rules, shell footguns, subagent guidance."
            />
            <Pager
              prev={['#ch1', '01 · Why any of this works']}
              next={['#ch3', '03 · Teaching it your world']}
            />
          </section>

          {/* ── Chapter 3 ── */}
          <section className="chapter" id="ch3">
            <ChapterHead
              n="03"
              eyebrow="Chapter three · Instruction"
              title="Teaching it your world"
              lede={
                <>
                  A standing brief covers what&apos;s always true. Skills cover what&apos;s true{' '}
                  <em>sometimes</em> — loaded only when the moment calls for them, so your context
                  stays spent on the work. There are 317 of them on my machine. Any given session
                  touches a handful.
                </>
              }
            />
            <p className="section-label">Anatomy of a skill — click a part</p>
            <SkillAnatomy />
            <p className="section-label">Three scopes, narrowest wins</p>
            <div className="scopes rv">
              <div className="scope scope-a">
                <span className="lbl">Global · every project, forever</span>
                <div className="pth">~/.claude/CLAUDE.md</div>
                <p className="dsc">
                  How you work. Git policy, tone, the tools you own, the mistakes you never want
                  repeated.
                </p>
              </div>
              <div className="scope scope-b">
                <span className="lbl">Project · this repo</span>
                <div className="pth">./CLAUDE.md · ./AGENTS.md</div>
                <p className="dsc">
                  How this codebase works. Package manager, gate command, generated files that must
                  not be hand-edited.
                </p>
              </div>
              <div className="scope scope-c">
                <span className="lbl">Memory · what it learned</span>
                <div className="pth">~/.claude/…/memory/*.md</div>
                <p className="dsc">
                  Durable facts written during work and recalled later — one file per fact, so a
                  wrong one can be deleted rather than argued with.
                </p>
              </div>
            </div>
            <div className="callout rv">
              <span className="k">The failure mode nobody warns you about</span>
              Instruction files rot. On one July morning I cut my always-loaded skill list from
              fifty-six to twenty-five, because{' '}
              <b>
                a rule the agent reads every session but never needs is just a tax on the window
              </b>
              . As this page ships, the list has quietly regrown to seventy-nine. Context budget is
              not a problem you solve once — it re-bloats, you re-cut, and the durable fix is that
              skills stay discoverable while unloaded.
            </div>
            <DownloadCard
              href="/stack/starter-skill-pack.md"
              ext="MD"
              name="starter-skill-pack.md"
              desc="Six skills that pay for themselves in a week — release, review-my-diff, write-human, debug-loop, session-closeout, and a skill for writing skills."
            />
            <Pager prev={['#ch2', '02 · Day one']} next={['#ch4', '04 · Giving it hands']} />
          </section>

          {/* ── Chapter 4 ── */}
          <section className="chapter" id="ch4">
            <ChapterHead
              n="04"
              eyebrow="Chapter four · Capability"
              title="Giving it hands"
              lede="Out of the box it can read, write, and run commands. Everything else — searching the live web, driving a browser, reading today's docs instead of last year's — is a command-line tool you install once and then never think about again."
            />
            <p className="section-label">The rack — pick one</p>
            <ToolRack />
            <div className="callout rv">
              <span className="k">CLI or MCP?</span>
              Both give it capabilities; they cost differently.{' '}
              <b>A CLI costs nothing until it&apos;s used</b> — one line in an instruction file
              saying it exists.{' '}
              <b>An MCP server&apos;s whole tool list sits in the context window all session</b>,
              whether you use it or not. So: CLI by default, MCP when the thing genuinely isn&apos;t
              a command line. Chapter one, applied.
            </div>
            <p className="section-label">The part people skip</p>
            <div className="twoup">
              <div className="rv">
                <h3>Build it the tools that don&apos;t exist yet</h3>
                <p>
                  Two of the tools I use most often are ones I described in a paragraph and had an
                  agent write in an afternoon. <span className="inline-code">ask</span> pages my
                  phone and blocks until I answer, so an agent working overnight can get one
                  judgment call from me instead of guessing.{' '}
                  <span className="inline-code">papercuts</span> is a complaint box: when an agent
                  hits friction, it files the friction and keeps going, and I read the pile on
                  Sundays.
                </p>
              </div>
              <div className="rv" data-d="1">
                <h3>What makes a tool agent-shaped</h3>
                <p>
                  One obvious entry point. Exit codes that mean something specific. A{' '}
                  <span className="inline-code">--json</span> or{' '}
                  <span className="inline-code">schema</span> mode so nothing has to parse prose.
                  Get those three right and the agent reaches for it unprompted, which is the whole
                  point —{' '}
                  <b>
                    a tool it has to be reminded about is a tool you still own the operation of.
                  </b>
                </p>
              </div>
            </div>
            <p className="section-label">Built here, open sourced — take them</p>
            <div className="rv">
              {[
                {
                  name: 'delegate-agent',
                  desc: 'One CLI, ten agent runtimes, three trust modes.',
                  href: 'https://github.com/treygoff24/delegate-agent',
                },
                {
                  name: 'papercuts',
                  desc: 'Where agents file complaints so friction becomes a backlog.',
                  href: 'https://github.com/treygoff24/papercuts',
                },
                {
                  name: 'elv',
                  desc: 'The entire ElevenLabs API as 338 agent-callable operations.',
                  href: 'https://github.com/treygoff24/elv',
                },
                {
                  name: 'exa-agent-cli',
                  desc: 'Web research as structured data — 68 commands, stable exit codes.',
                  href: 'https://github.com/treygoff24/exa-agent-cli',
                },
                {
                  name: 'receipts',
                  desc: 'Answers that arrive with a URL, a quote, and a verdict.',
                  href: 'https://github.com/treygoff24/receipts',
                },
              ].map((repo) => (
                <a
                  key={repo.name}
                  className="dl"
                  href={repo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ext">OSS</span>
                  <span className="nm">
                    {repo.name}
                    <span className="ds">{repo.desc}</span>
                  </span>
                  <span className="go">GitHub ↗</span>
                </a>
              ))}
            </div>
            <DownloadCard
              href="/stack/agent-build.md"
              ext="MD"
              name="agent-build.md"
              desc={
                <>
                  Blueprints you paste into your own session: build-your-own <code>ask</code> and{' '}
                  <code>papercuts</code>, with the contracts spelled out so your agent builds them
                  right the first time.
                </>
              }
            />
            <Pager
              prev={['#ch3', '03 · Teaching it your world']}
              next={['#ch5', '05 · Multiplying it']}
            />
          </section>

          {/* ── Chapter 5 ── */}
          <section className="chapter" id="ch5">
            <ChapterHead
              n="05"
              eyebrow="Chapter five · Parallelism"
              title="Multiplying it"
              lede={
                <>
                  The jump from one agent to many is not about speed, though you do get speed.
                  It&apos;s about chapter one again:{' '}
                  <em>
                    a subagent gets its own fresh window, and hands you back only the conclusion.
                  </em>{' '}
                  Ten thousand tokens of searching become four lines of answer.
                </>
              }
            />
            <FanOut />
            <p className="section-label">Three ways to multiply, in increasing weirdness</p>
            <div className="precepts rv">
              <div className="precept">
                <span className="idx">A</span>
                <p className="claim">Subagents</p>
                <p className="payoff">
                  Same model, fresh window, one bounded job. Use them for anything that would flood
                  your session with output you&apos;ll read once — audits, log sweeps, &quot;find
                  every call site of X&quot;. <b>You keep the conclusion, not the search.</b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">B</span>
                <p className="claim">Cross-model delegation</p>
                <p className="payoff">
                  Hand a bounded task to a different vendor&apos;s agent entirely — a{' '}
                  <span className="inline-code">delegate</span> command that runs the job in another
                  harness. Read-only mode for reviews, edit mode when you want the work done.{' '}
                  <b>Different training, different blind spots.</b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">C</span>
                <p className="claim">The council</p>
                <p className="payoff">
                  For decisions worth real time: four models propose, critique each other, defend,
                  and a fifth judges. In one blind-scored run the synthesized plan beat the best
                  single model 96.4 to 91.6 — and beat the human-written gold standard, at 85.2,
                  after the critique stage caught a hazard nobody else saw. Slow and expensive, so
                  save it for things you&apos;re about to bet on.{' '}
                  <b>The value is decorrelated error, not extra opinions.</b>
                </p>
              </div>
            </div>
            <div className="callout rv">
              <span className="k">Learned the hard way</span>
              Long parallel runs frequently land the meaty edits and then stop just short of the
              trailing cleanup.{' '}
              <b>Never trust a subagent&apos;s &quot;done&quot; summary — check the disk. </b>And
              brief every parallel writer never to run a tree-wide git command: one agent&apos;s
              tidy-up once stashed three siblings&apos; uncommitted work mid-flight.
            </div>
            <Pager
              prev={['#ch4', '04 · Giving it hands']}
              next={['#ch6', '06 · Trusting it at scale']}
            />
          </section>

          {/* ── Chapter 6 ── */}
          <section className="chapter" id="ch6">
            <ChapterHead
              n="06"
              eyebrow="Chapter six · Guardrails"
              title="Trusting it at scale"
              lede={
                <>
                  The people who move fastest with agents are the most paranoid, and it isn&apos;t a
                  coincidence. <em>Paranoia is what makes speed safe.</em> Every guardrail below
                  exists so you can stop supervising and let something run.
                </>
              }
            />
            <p className="section-label">The gauntlet — press it and watch it fail</p>
            <Gauntlet />
            <p className="section-label">What each one actually buys you</p>
            <div className="precepts rv">
              <div className="precept">
                <span className="idx">01</span>
                <p className="claim">Know who else is in the repo.</p>
                <p className="payoff">
                  Once you run more than one agent, two of them will eventually edit the same file.
                  A tiny occupancy tool that answers &quot;is anyone working here?&quot; with an
                  exit code — <b>and a rule that a busy repo means stop, not write anyway</b> —
                  removes an entire class of 2am mystery.
                </p>
              </div>
              <div className="precept">
                <span className="idx">02</span>
                <p className="claim">One gate command, run by you.</p>
                <p className="payoff">
                  Whatever your project&apos;s real check is —{' '}
                  <span className="inline-code">pnpm ci:quality</span>,{' '}
                  <span className="inline-code">make test</span> — name it in the instruction file
                  and run it yourself at the end.{' '}
                  <b>Self-checks miss things that the canonical gate catches every time.</b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">03</span>
                <p className="claim">Commits ungated, pushes gated.</p>
                <p className="payoff">
                  Let it commit constantly and without asking — that&apos;s your undo. But pushing,
                  opening a PR, tagging, deploying:{' '}
                  <b>
                    every one of those needs a fresh yes from a human, and yesterday&apos;s yes
                    doesn&apos;t count.
                  </b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">04</span>
                <p className="claim">Review with something that didn&apos;t write it.</p>
                <p className="payoff">
                  A different agent, ideally a different model, reading the diff cold with no memory
                  of the reasoning that produced it.{' '}
                  <b>It finds the thing the author is constitutionally unable to see.</b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">05</span>
                <p className="claim">Stop the loop with a deletion.</p>
                <p className="payoff">
                  Review cycles want to run forever, because the newest text is always the
                  least-reviewed. <b>End the loop when a round produces no changes </b>— and if a
                  checker&apos;s finding list is always empty, assume the checker is broken, not the
                  code.
                </p>
              </div>
            </div>
            <Pager
              prev={['#ch5', '05 · Multiplying it']}
              next={['#ch7', '07 · A week in the life']}
            />
          </section>

          {/* ── Chapter 7 ── */}
          <section className="chapter" id="ch7">
            <ChapterHead
              n="07"
              eyebrow="Chapter seven · Practice"
              title="A week in the life"
              lede="Four situations that cover most of what I actually do. Answer a question or two and you'll land on the one you're in — with the setup I'd use, in the order I'd use it."
            />
            <DecisionTree />
            <Pager
              prev={['#ch6', '06 · Trusting it at scale']}
              next={['#ch8', '08 · Build your own']}
            />
          </section>

          {/* ── Chapter 8 ── */}
          <section className="chapter" id="ch8">
            <ChapterHead
              n="08"
              eyebrow="Chapter eight · Your turn"
              title="Build your own"
              lede="Here is the part I want you to take seriously: none of this was assembled by planning it. Every piece exists because something annoyed me twice and I wrote the annoyance down. You don't need my stack. You need the habit that produced it."
            />
            <div className="rv">
              <Terminal title="~/Code/trey-goff — this page" lines={SELF_BUILD_TERM} />
            </div>
            <div className="callout rv">
              <span className="k">The honest caveat</span>A human picked the eight chapters, ran a
              design bake-off between two competing prototypes of this page, and is red-penning
              every artifact before it ships. <b>That&apos;s the actual division of labor </b>— and
              it&apos;s the one you&apos;re signing up for. The taste stays yours. The typing stops
              being yours.
            </div>
            <p className="section-label">Start tonight</p>
            <p className="lede rv" style={{ marginBottom: '1.6rem' }}>
              Open a repo you care about, start a session, and paste this. It will interview you
              before it writes anything — which is the entire trick, compressed into one prompt.
            </p>
            <CopyPromptBlock text={START_TONIGHT} />
            <div style={{ marginTop: '2rem' }}>
              <DownloadCard
                href="/stack/start-tonight.md"
                ext="MD"
                name="start-tonight.md"
                desc="The same prompt as a file, plus the follow-up questions worth asking after it finishes."
              />
            </div>
            <p className="lede rv" style={{ marginTop: '2.8rem' }}>
              Do that tonight. In a week you&apos;ll have three rules you didn&apos;t have today,
              and one of them will be a rule I&apos;ve never thought of.{' '}
              <em className="hl">That&apos;s the part I actually want to read.</em>
            </p>
            <Pager prev={['#ch7', '07 · A week in the life']} />
          </section>

          <footer className="colophon">
            <div>Trey Goff · treygoff.com/stack · 2026</div>
            <div>
              This page was designed, written, built, and reviewed by the setup it describes.
            </div>
            <div>
              <a href="#top">Return to the top</a> · <a href="#ch1">Start over at chapter one</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
