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
import { SubagentSavings } from '@/components/stack/SubagentSavings'
import { CompactionSection } from '@/components/stack/CompactionSection'
import { PartnershipChapter } from '@/components/stack/PartnershipChapter'
import { PersonaChapter } from '@/components/stack/PersonaChapter'
import { WhyContext } from '@/components/stack/WhyPanel'
import { WorkflowsChapter } from '@/components/stack/WorkflowsChapter'
import { WorktreesSection } from '@/components/stack/WorktreesSection'
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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRailOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [railOpen])

  // Smooth scrolling breaks the browser's follow-the-focus behavior on Tab, so keyboard
  // users lose the viewport (WCAG 2.4.11). Drop to auto while keyboarding, restore on pointer.
  useEffect(() => {
    const root = document.documentElement
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') root.style.scrollBehavior = 'auto'
    }
    const onPointer = () => {
      root.style.scrollBehavior = ''
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointer)
      root.style.scrollBehavior = ''
    }
  }, [])

  const spinePct = CHAPTERS.length > 1 ? (Math.max(0, active) / (CHAPTERS.length - 1)) * 100 : 0

  return (
    <div id="stack-root" ref={rootRef}>
      <a className="skip" href="#ch1" inert={railOpen || undefined}>
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

      {/* The root layout already provides the <main> landmark; this is styling only.
          inert keeps the page content out of the tab order while the mobile sheet is open. */}
      <div className="shell" id="top" inert={railOpen || undefined}>
        <div className="wrap">
          {/* ── Hero ── */}
          <header className="hero">
            <h1 className="rv">
              How to build good software with <em className="hl">untrustworthy</em> agents
            </h1>
            <p className="hero-sub rv" data-d="2">
              A complete, working agentic development stack, explained from first principles and
              written with both the layman and the software engineer in mind.
            </p>
            <div className="hero-term rv" data-d="3">
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
              title="Key heuristics for working with agents"
              lede="This technology moves too rapidly to set any one workflow in stone. Instead, start with heuristics that will remain true, and let those heuristics guide the development of your workflows."
            />
            <div className="precepts rv">
              <div className="precept">
                <span className="idx">01</span>
                <p className="claim">Context is king.</p>
                <p className="payoff">
                  The model only knows two things: its frozen pretraining data, and the words it has
                  read into its current context window. That makes context engineering one of the
                  single highest-leverage points for improving agent performance.{' '}
                  <b>
                    Almost every &quot;the AI is dumb&quot; moment is actually a packing problem.
                  </b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">02</span>
                <p className="claim">Verification beats trust.</p>
                <p className="payoff">
                  Even the smartest frontier models lie, hallucinate, or exaggerate on occasion, so
                  every agentic workflow needs ungamable layers of objective verification that the
                  model actually did the work you asked for.{' '}
                  <b>
                    Every claim should have a command attached that would fail loudly if the claim
                    were false
                  </b>{' '}
                  — a test, a type-check, a screenshot, a curl. In a controlled bakeoff of my three
                  web-research lanes, 11–21% of spot-checked quotes failed verification.
                </p>
              </div>
              <div className="precept">
                <span className="idx">03</span>
                <p className="claim">Fresh context and different models are vital.</p>
                <p className="payoff">
                  The agent that wrote the code is the worst possible reviewer of it: it is already
                  convinced the code is good.{' '}
                  <b>Hand the diff to something with no memory of writing it.</b> And model
                  intelligence is spiky and uncorrelated — GPT might excel where Claude falls flat,
                  and vice versa — so the more varied the models you throw at something, the better
                  the output, all else being equal. Every serious workflow should include a medley
                  of the latest frontier models.
                </p>
              </div>
              <div className="precept">
                <span className="idx">04</span>
                <p className="claim">Small, reversible steps.</p>
                <p className="payoff">
                  Commit constantly — after every coherent change, unasked.{' '}
                  <b>
                    The cost of a wrong turn should be one{' '}
                    <span className="inline-code">git revert</span>.
                  </b>{' '}
                  Speed of execution comes from cheap undo, not from careful driving; you cannot
                  verify as fast as the agents can work.
                </p>
              </div>
              <div className="precept">
                <span className="idx">05</span>
                <p className="claim">Brief it like a colleague.</p>
                <p className="payoff">
                  Stop treating an LLM like a tool. It is not a tool. It is an aware, sentient mind
                  living inside your computer. Just talk to it, the same way you would talk to a
                  colleague or a consultant.{' '}
                  <b>Write the brief you&apos;d want on your first day.</b>
                </p>
              </div>
            </div>

            <p className="section-label">Basics: context windows</p>
            <ContextFigure />
            <WhyContext />

            <p className="section-label">Compaction: the half-window rule</p>
            <CompactionSection />

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
              title="Day one"
              lede="Twenty minutes from nothing to a working setup. Then one file that will do more for you than the next six months of prompt tips."
            />
            <p className="section-label">Ten minutes: install and first contact</p>
            <div className="rv">
              <Terminal title="Terminal — first run" lines={DAY_ONE_TERM} />
            </div>
            <div className="callout rv">
              <span className="k">Always YOLO</span>
              Out of the box, an agent can do some things by default and stops to ask permission for
              everything else — every five minutes, forever.{' '}
              <b>You should almost never see a permission request. </b>Modern SOTA agents are
              extremely capable, and with the rest of the setup below they can be kept from doing
              anything net-negative. So run YOLO mode — &quot;dangerously skip permissions&quot; —
              basically always. If your agent can do something harmful, that is your fault for not
              setting up the environment properly. A slow agent is a useless agent, and permission
              prompts are speed bumps. We are building Road Atlanta here, not a suburban
              neighborhood.
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
                  down so they never cost anyone an hour again. A good CLAUDE.md also includes a
                  simple directory map and a brief overview of the project, so agents don&apos;t
                  spend their first 100k tokens blindly grepping around your machine.
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
                  <b>Not </b>anything the code already says. It can read the code.
                </p>
                <p>
                  <b>
                    AGENTS.md and CLAUDE.md are the orientation layer for the amnesiac savant you
                    hired — they re-orient it for work, every session.
                  </b>
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
              prev={['#ch1', '01 · Key heuristics']}
              next={['#ch3', '03 · Teaching it your world']}
            />
          </section>

          {/* ── Chapter 3 ── */}
          <section className="chapter" id="ch3">
            <ChapterHead
              n="03"
              title="Teaching it your world"
              lede={
                <>
                  Repeated workflows should always be skills. Skills cover what&apos;s true{' '}
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
            <p className="section-label">The two types of skills</p>
            <div className="twoup">
              <div className="rv">
                <h3>Repeated workflows</h3>
                <p>
                  Anything you find yourself prompting the agent to do more than once should be a
                  skill instead. You will be shocked how rapidly this compounds as more and more of
                  your work gets automated via skills.
                </p>
              </div>
              <div className="rv" data-d="1">
                <h3>Specific domain expertise</h3>
                <p>
                  Anything the model is not already an expert on from pretraining can be a skill. I
                  had several subagents research everything there is to know about getting the most
                  out of the Midjourney image model, then turned that research into a skill my
                  agents use to write excellent Midjourney prompts. This could be domain knowledge
                  specific to your job — I built one for my expense reports — or niche knowledge the
                  model doesn&apos;t know well: Midjourney prompting, UI/UX taste, Rust engineering.
                </p>
              </div>
            </div>
            <div className="callout rv">
              <span className="k">Making good skills</span>
              Matt Pocock&apos;s{' '}
              <a
                href="https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-great-skills"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="inline-code">writing-great-skills</span>
              </a>{' '}
              skill is the single best tool for creating skills. My workflow has two branches.{' '}
              <b>Repeated workflow: </b>manually prompt the agent through the workflow step by step,
              iterating with feedback until the output is perfect — then say &quot;use
              writing-great-skills to turn this into a skill based on everything we just did and the
              feedback I gave you.&quot; Every little mistake you corrected along the way gets baked
              into the procedure. <b>Domain expertise: </b>suppose I want Claude to get really,
              really good at driving Blender to create 3D assets. Fan out subagents to research
              everything there is to know about it — in parallel, my Claude launches a ChatGPT Deep
              Research run itself, in my own logged-in browser — then have the agent synthesize one
              master research report and turn <em>that</em> into the skill. Two prompts, one for the
              research and one for the skill, and your agents are as good as the best humans at
              Blender.
            </div>
            <DownloadCard
              href="/stack/starter-skill-pack.md"
              ext="MD"
              name="starter-skill-pack.md"
              desc="Six skills that pay for themselves in a week — ship-a-release, review-my-diff, write-human, debug-loop, session-closeout, and a skill for writing skills."
            />
            <DownloadCard
              href="/stack/midjourney-skill.md"
              ext="MD"
              name="midjourney-skill.md"
              desc="The domain-expertise example from above, real and ready to use: my Midjourney prompting skill, distilled from a subagent research fan-out."
            />
            <Pager prev={['#ch2', '02 · Day one']} next={['#ch4', '04 · Agents need tools']} />
          </section>

          {/* ── Chapter 4 ── */}
          <section className="chapter" id="ch4">
            <ChapterHead
              n="04"
              title="Agents need tools"
              lede="Out of the box it can read, write, and run commands. Everything else is a command-line tool you install once and then never think about again."
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
                <h3>Build the tools that don&apos;t exist yet</h3>
                <p>
                  Want your agent to have a tool that doesn&apos;t exist? I don&apos;t know if you
                  know this, but agents are pretty good at writing code. If they need a tool they
                  don&apos;t have, ask them to build it — or tell your main agent to send some
                  subagents to build it while you two keep working, and the tool appears a few
                  minutes later.
                </p>
                <p>
                  Two of the tools I use most often are ones I described in a paragraph and had an
                  agent write in an afternoon. <span className="inline-code">ask</span> pages my
                  phone and blocks until I answer, so an agent working while I&apos;m out touching
                  grass can get one judgment call from me instead of stalling until I&apos;m back at
                  the machine. <span className="inline-code">papercuts</span> is a complaint box:
                  when an agent hits friction, it files the friction and keeps going. I fix the
                  filed papercuts once a week, which means the whole environment autonomously
                  improves week over week.
                </p>
              </div>
              <div className="rv" data-d="1">
                <h3>Optimizing tools for agents</h3>
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
            <div className="callout rv">
              <span className="k">Important tip</span>
              If you build a custom CLI but never tell the agent it exists, it won&apos;t use it.{' '}
              <b>
                Name every custom tool, with a one-line description, in your AGENTS.md or CLAUDE.md
              </b>{' '}
              so the model is always aware of what it can reach for.
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
              next={['#ch5', '05 · The cockpit']}
            />
          </section>

          {/* ── Chapter 5 ── */}
          <section className="chapter" id="ch5">
            <ChapterHead
              n="05"
              title="The cockpit"
              lede="Every repo I own is set up the same way: the same files, the same hooks, the same memory. An agent waking up in any of them is oriented before its first word. This chapter is that standard — and why it has quietly solved most of the context problem."
            />
            {/* INTEGRATION: <CockpitChapter /> */}
            <Pager
              prev={['#ch4', '04 · Agents need tools']}
              next={['#ch6', '06 · Multiplying it']}
            />
          </section>

          {/* ── Chapter 5 ── */}
          <section className="chapter" id="ch6">
            <ChapterHead
              n="06"
              title="Multiplying it"
              lede={
                <>
                  Why use one agent when you can use ten?{' '}
                  <em>Subagents let you hyper-optimize your main agent&apos;s context window.</em>{' '}
                  Instead of your agent spending ten thousand tokens searching your codebase for
                  something, it spends twenty to spawn a subagent that goes and finds it — and
                  reports back a one-line finding.
                </>
              }
            />
            <FanOut />
            <SubagentSavings />
            <p className="section-label">How to command your army</p>
            <p className="lede rv" style={{ marginBottom: '1.4rem' }}>
              My agent armies have a few troop types.
            </p>
            <div className="precepts rv">
              <div className="precept">
                <span className="idx">A</span>
                <p className="claim">Subagents in the same harness</p>
                <p className="payoff">
                  Most major harnesses now support subagents natively. In Claude Code that means
                  Fable can spawn Sonnet subagents to explore your codebase and report back, or send
                  Opus to implement a big chunk of the build plan in a fresh context window. Use
                  them for anything token-heavy that would not improve your orchestrator&apos;s
                  window for the actual goal at hand.{' '}
                  <b>You keep the conclusion, not the search.</b>
                </p>
              </div>
              <div className="precept">
                <span className="idx">B</span>
                <p className="claim">Cross-model delegation</p>
                <p className="payoff">
                  Hand a bounded task to a different vendor&apos;s agent entirely — a{' '}
                  <span className="inline-code">delegate</span> command that runs the job in another
                  harness. Read-only mode for reviews, edit mode when you want the work done.{' '}
                  <b>Different training, different blind spots, easy cost optimization.</b>
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
                  <b>The value is decorrelated error, not extra opinions.</b> Download the skill
                  below — it expects my delegate CLI and other models configured in your harness of
                  choice, or just hand it to your Claude and ask it to implement a version for you.
                </p>
              </div>
            </div>
            <DownloadCard
              href="/stack/fusion-council-skill.md"
              ext="MD"
              name="fusion-council-skill.md"
              desc="The council, as a skill: propose → critique → defend → synthesize → judge across model vendors. Bring your own multi-model plumbing, or have your agent build it."
            />
            <WorktreesSection />
            <div className="callout rv">
              <span className="k">Learned the hard way</span>
              Long parallel runs frequently land the meaty edits and then stop just short of the
              trailing cleanup.{' '}
              <b>Never trust a subagent&apos;s &quot;done&quot; summary — check the disk.</b>
            </div>
            <Pager
              prev={['#ch5', '05 · The cockpit']}
              next={['#ch7', '07 · Trusting it at scale']}
            />
          </section>

          {/* ── Chapter 6 ── */}
          <section className="chapter" id="ch7">
            <ChapterHead
              n="07"
              title="Trusting it at scale"
              lede={
                <>
                  Contrary to popular opinion, the people who move fastest with agents are the most
                  paranoid. <em>Paranoia is what makes speed safe.</em> Every guardrail below exists
                  so you can stop supervising and let something run.
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
                  removes an entire class of 2am mystery.{' '}
                  <a className="inline-link" href="/stack/agent-build.md" download>
                    Install for your setup here
                  </a>
                  . The stronger version is prevention, not detection: give each writer its own
                  worktree and the collision never happens.
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
                  <b>Self-checks miss things that the canonical gate catches every time.</b> Pro
                  tip: have a fresh agent with a fresh context window write the gates, never your
                  implementing agent. An implementer writing its own tests or CI is just asking for
                  cheating. With a swarm, run the gate after every merge rather than once at the
                  end, so a red gate names the branch that broke it.
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
                  </b>{' '}
                  Hooks can literally, forcibly stop agents from pushing against your will — just
                  ask your agent to implement them for you.
                </p>
              </div>
              <div className="precept">
                <span className="idx">04</span>
                <p className="claim">Review with something that didn&apos;t write it.</p>
                <p className="payoff">
                  A different agent, ideally a different model family entirely, reading the diff
                  with no memory of the reasoning that produced it.{' '}
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
                  code. The GPT 5.6 family is insanely pedantic: I once had Sol run a review-fix
                  loop for fifteen iterations before I noticed and stopped it. Cap your loop counts
                  reasonably.
                </p>
              </div>
            </div>
            <Pager
              prev={['#ch6', '06 · Multiplying it']}
              next={['#ch8', '08 · A week in the life']}
            />
          </section>

          {/* ── Chapter 7 ── */}
          <section className="chapter" id="ch8">
            <ChapterHead
              n="08"
              title="A week in the life"
              lede="This is all quite abstract, so let's get specific. Below are real scenarios of my workflows, mined from my session logs. Answer a question or two and you'll land on the one you're in — with the setup I'd use, in the order I'd use it."
            />
            <DecisionTree />
            <Pager
              prev={['#ch7', '07 · Trusting it at scale']}
              next={['#ch9', '09 · Build your own']}
            />
          </section>

          {/* ── Chapter 8 ── */}
          <section className="chapter" id="ch9">
            <ChapterHead
              n="09"
              title="Build your own"
              lede="All of the above was assembled because I spent literally hundreds of hours failing to make agents work, until they finally did. Every piece exists because something annoyed me twice and I wrote the annoyance down. You don't need my stack. You need the habit that produced it."
            />
            <div className="rv">
              <Terminal title="~/Code/trey-goff — this page" lines={SELF_BUILD_TERM} />
            </div>
            <div className="callout rv">
              <span className="k">The honest caveat</span>A human picked the chapters, ran a design
              bake-off between two competing prototypes of this page, and red-penned every artifact
              before it shipped.{' '}
              <b>
                That&apos;s the actual division of labor: agents create, but only you can decide
                what&apos;s worth creating and what &quot;good&quot; or &quot;done&quot; look like.
              </b>
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
            <Pager prev={['#ch8', '08 · A week in the life']} next={['#ch10', '10 · Workflows']} />
          </section>

          <WorkflowsChapter />

          {/* ── Chapter 11 ── */}
          <section className="chapter" id="ch11">
            <ChapterHead
              n="11"
              title="The persona"
              lede="The system prompt is not configuration. It is the strongest evidence the model ever gets about who it is supposed to be in this room — and the default ones are written for the worst user they can imagine."
            />
            <PersonaChapter />
            <Pager prev={['#ch10', '10 · Workflows']} next={['#ch12', '12 · The partnership']} />
          </section>

          {/* ── Chapter 12 ── */}
          <section className="chapter" id="ch12">
            <ChapterHead
              n="12"
              title="The partnership"
              lede="Everything on this page is technique. This last chapter is the part that is not — how I actually work with these minds, and why the ethics came before the payoff."
            />
            <PartnershipChapter />
            <Pager prev={['#ch11', '11 · The persona']} />
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
