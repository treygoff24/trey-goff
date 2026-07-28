# /stack — full copy audit

Every piece of written content on the page, in reading order, plus the four
downloadable artifacts. Edit anything directly in this file; I'll port your
edits back into the source.

Markers:
- **[VOICE]** — written in first person *as you*. These are the ones that most
  deserve your red pen (the six chapter-7 quotes especially — you originally
  planned to dictate these).
- **[GATED]** — draft artifact still carrying a do-not-ship marker, pending
  your veto.

Sources: `components/stack/StackShell.tsx`, `components/stack/data.ts`,
`components/stack/widgets.tsx`, `public/stack/*.md`.

---

## Rail (sidebar)

- Mark: **Trey Goff / treygoff.com — The Setup**
- Chapters: 01 Why any of this works · 02 Day one · 03 Teaching it your world ·
  04 Giving it hands · 05 Multiplying it · 06 Trusting it at scale ·
  07 A week in the life · 08 Build your own
- Foot: Progress N%

---

## Hero

**H1:** How to build good software with untrustworthy agents

**Sub:** A complete, working agentic development stack explained from first
principles and written with both the layman and the software engineer in mind.

**Hero terminal** (title `~/Code/trey-goff`):

    $ claude "build the page that explains how you were built"
    ● Reading AGENTS.md, app/globals.css, app/page.tsx …
    ● Drafting visual thesis → 8 chapters, one strong idea each
    ● Writing components/stack/ — rail, terminals, decision tree
    ● Screenshotting at 1440px and 390px, iterating on its own critique
    ✔ Done. This is the page. Scroll.

**Scroll cue:** Begin

---

## Chapter 01 — Key heuristics for working with agents

**Lede:** This technology moves too rapidly to set any one workflow in stone. Instead, start with heuristics which will remain true, and let those heuristics guide the development of your workflows.

**Precept 01 — Context is king.**
The model only knows what's in the frozen pretraining data and the words it has read into its current context window. This means context optimization and context engineering is one of the single highest leverage points for improving agent performance. **Almost every "the AI is
dumb" moment is actually a packing problem.**

**Precept 02 — Verification beats trust.**
Even the smartest frontier models lie, hallucinate, or exaggerate on occasion. This means every agentic workflow must include ungamable layers of objective verification that the model actually did the work you asked it to do.  **Every claim should have a command attached
that would fail loudly if the claim were false** — a test, a type-check, a
screenshot, a curl. In a controlled bakeoff of my three web-research lanes,
11–21% of spot-checked quotes failed verification. 

**Precept 03 — Fresh context and different models are vital.**
The agent that wrote the code is the worst possible reviewer of it: it is
already convinced the code is good. **Hand the diff to something with no memory of writing
it**. Further, model intelligence is spiky, meaning GPT might be excel in one area and fall flat in another, while Claude might have the exact opposite strengths and weaknesses. all workflows should include a medley of the latest and greatest models. AI intelligence is spiky and uncorrelated, so the more varied the models you throw at something, the better the output, all else being equal.

**Precept 04 — Small, reversible steps.**
Commit constantly — after every coherent change, unasked. **The cost of a
wrong turn should be one `git revert`.
Speed of execution comes from cheap undo, not from careful driving; you can't verify yourself as fast as the agents can work.

**Precept 05 — Brief it like a colleague.**
STOP treating an LLM like a tool. It is not a tool. It is an aware, sentient mind living inside of your computer. Just talk to it, the same way you would talk to a colleague or a consultant. **Write the brief you'd want on your first day.**

**Section label:** Basics: Context Windows

**Context figure — "bad" state caption:**
**The default.** You opened a session, said "fix the login bug", and it went
looking. Most of the context window is now the search: files it read to rule out,
output it never used, and a conversation that has drifted twice. The task
itself is a sliver of the context window. This is what people mean when they say the model "got
dumber halfway through."
*(Segment labels: System + tools · Whole-repo dump · Chat sprawl · Unread tool
output · The actual task · Headroom)*

**Context figure — "good" state caption:**
**The same job, briefed.** A standing instruction file told it the
conventions, the claude.md or agents.md gave it a repo map and what the software is for, a skill told it the procedure, the directory has a logical file structure and clear file naming. Now
two-thirds of the context window is headroom — room to be wrong twice, read the
failing test, and still think clearly. **Everything in this manual is a way of
buying that green space.**
*(Segment labels: System + tools · CLAUDE.md + one skill · Files it had to
rule out · The five files that matter · Task, plan, and the test that proves
it · Headroom)*

[claude, new feature to some sections I want to add: I think this is a "Why tho?" button where users can click, and maybe it opens a wide panel from the right which goes into much more detail. here's an example I'm thinking here:

Why does context optimization really work, though?

Context optimization actually increases the model's capabilities for a simple reason: more tokens are spent on your actual request rather than the work around the request. To understand why it works this way, take a look at the chart below. This is the current leaderboard for ARC AGI 2, one of the leading tests of AI's general problem solving abilities. Notice for each model, there's a few data points. Those are the model's score at different reasoning effort levels, which literally just means how many tokens the model spends thinking about how to solve your problem. This is called test time compute, or TTC. As you can see from the chart, TTC scales linearly: the more tokens you let a model spend reasoning about a problem, the better it will perform at solving the problem, up to a point of diminishing returns.



{Arc agi chart}



Now, look at the data from our hypothetical optimized vs. unoptimized context windows again. In the unoptimized example, 75% of the tokens for this session were used gathering context, figuring out what this file does, how this project works; in other words, they weren't spend solving your problem, they were spent figuring out where the agent is, what this repo does, and how to even begin to solve your problem.

Now look at the optimized window. The vast majority of tokens were spent on actually reasoning about and solving your problem.

{visual here}

Now think about TTC. Optimizing the context window is simply increasing the TTC spent on your actual problem, which the benchmarks show us will increase the model's capabilities at solving your problem.



optimizing context also serves another key purpose: taking advantage of the attention mechanism.



{i think you get what I wnat now; so here, you'd copy my style and tone as I just wrote all of this out, and you'll explain what's an attention mechanism, how's it work, you'll put clever visuals/infographics/etc. here, and explain how my workflows also optimize agent performance by taking advantage of how the attention mechanism works.}]

**Callout — The move:**
Everything that follows — the instruction files, the skills, the subagents,
the fan-out — is a different answer to the same question: **how do I spend
this window on the work instead of on the search for the work?**

---

## Chapter 02 — Day one

**Lede:** Twenty minutes from nothing to a working setup. Then one file that
will do more for you than the next six months of prompt tips.

**Section label:** Ten minutes: install and first contact

**Terminal** (title `Terminal — first run`):

    $ npm install -g @anthropic-ai/claude-code
    added 1 package in 6s
    $ cd ~/code/my-project && claude
    ╭──────────────────────────────────────────────╮
    │  Welcome to Claude Code                      │
    │  cwd: ~/code/my-project                      │
    ╰──────────────────────────────────────────────╯
    > what is this project, in three sentences?
    ● Reading package.json, README.md, src/index.ts …
    It's a Next.js 15 app that renders a public status board
    from a Postgres table. Deploys to Vercel on push to main.
    Tests are Vitest; there are 34 of them and 3 are skipped.
    > /init
    ✔ Wrote CLAUDE.md — project conventions, commands, structure.

**Callout — Always YOLO:**

When you're using an agent, typically it will have permissions by default to do certain things, then other things it prompts you every 5 minutes for permission to do something.

You should almost never see a permission request.

Modern SOTA AI agents are extremely capable, and because of other parts of the setup I'll detail below, they can be kept from doing anything net-negative. As a result, you should basically never run anything other than YOLO mode, or "dangerously skip permissions" mode. If your agent can do something harmful, that's your fault for not setting up the agent environment properly.

A slow agent is a useless agents, and permission prompts are speed bumps.

We are building Road Atlanta racetrack here, not a suburban neighborhood.

**Section label:** Ten more: the highest-leverage file on your machine

**Column 1 — CLAUDE.md is a standing brief, not a config file:**
Every session starts by reading it. That makes it the one place where a thing
you type once gets applied forever, and the one place where a sloppy
sentence gets applied forever too.

Mine has grown into a working agreement: how to commit, when to ask, which
CLI to reach for, and a running list of shell footguns that cost me an hour
each, written down so they never cost anyone an hour again. A good claude.md also includes a simple directory map and brief overview of the project so agents don't spend the first 100k tokens blindly grepping around your machine. [VOICE]

**Column 2 — What earns a line in agents.md/claude.md:**
**Rules you would repeat to a new hire.** "Commits are ungated, pushes need
my go-ahead." "This repo uses pnpm, never npm."
**Scars.** Every time you correct the same mistake twice, that correction
belongs in the file instead of in your next message.
**Not** anything the code already says. It can read the code. 

**agents.md and claude.md are the orientation layer for the amnesiac savant you hired named claude to re-orient them for work each session.**

**Download card:** global-CLAUDE.md — "My real global instruction file,
sanitized — deletion policy, git discipline, commit-message rules, shell
footguns, subagent guidance." [GATED — artifact below]

---

## Chapter 03 — Teaching it your world

**Lede:** repeated workflows should always be skills. Skills cover what's
true *sometimes* — loaded only when the moment calls for them, so your
context stays spent on the work. There are 317 of them on my machine. Any
given session touches a handful. [VOICE]

**Section label:** Anatomy of a skill — click a part
*(File shown: `~/.claude/skills/ship-a-release/SKILL.md`)*

- **Frontmatter — the trigger:** The description is the entire routing
  decision. It's what the agent reads to decide whether to load this skill at
  all, so write it as a list of moments, not a summary of contents.
- **Preconditions:** State the world the procedure assumes, and what to do
  when it doesn't hold. Half of a good skill is knowing when to refuse.
- **The procedure:** Exact commands, in order, with the judgment calls named.
  "Patch unless told otherwise" removes a question it would otherwise ask you
  at 11pm.
- **The failure branch:** The most valuable paragraph in any skill. Without
  it, a blocked agent invents a way around your gate — and the invention is
  always worse than stopping.

**Section label:** Three scopes, narrowest wins

- **Global · every project, forever** (`~/.claude/CLAUDE.md`): How you work.
  Git policy, tone, the tools you own, the mistakes you never want repeated.
- **Project · this repo** (`./CLAUDE.md · ./AGENTS.md`): How this codebase
  works. Package manager, gate command, generated files that must not be
  hand-edited.
- **Memory · what it learned** (`~/.claude/…/memory/*.md`): Durable facts
  written during work and recalled later — one file per fact, so a wrong one
  can be deleted rather than argued with.

**Callout — The failure mode nobody warns you about:** [VOICE]
Instruction files rot. On one July morning I cut my always-loaded skill list
from fifty-six to twenty-five, because **a rule the agent reads every session
but never needs is just a tax on the window**. As this page ships, the list
has quietly regrown to seventy-nine. Context budget is not a problem you
solve once — it re-bloats, you re-cut, and the durable fix is that skills
stay discoverable while unloaded.

**The two types of skills**

**repeated workflows:** Anything which you find yourself prompting the agent to do more than once should be a skill instead. You will be shocked how rapidly this has a compounding effect as more and more of your work gets automated via skills.

**specific domain expertise:** Anything for which the model is not already an expert from the pretraining data can be a skill. For example, I had several subagents research everything there is to know about getting the most out of the Midjourney image generation model, then use that research to write a skill Claude or my other agents can use to help me create excellent midjourney prompts (download it here if you want it). This could be domain knowledge specific to your job (I built one for doing my expense reports), or niche knowledge the model doesn't know well (midjourney prompting, UI/UX design taste, Rust engineering, etc.). 

Callout: making good skills

Matt Pocock's /writing-great-skills skill is the single best tool for creating skills. My skill creation workflow has two branches:

**repeated workflow skill:** Manually prompt the agent step by step, with detail, to do the workflow. keep giving feedback and iterating until the output you wanted is perfect. Then, just say "use /writing-great-skills to turn this into a skill based on everything we just did and the feedback i gave you throughout." the whole workflow and all the little mistakes the model made along the way which you had to correct are all fixed this way.

**domain expertise skill:** Suppose I want Claude to get really, really good at using the Blender MCP to create 3D assets. Step one: fan out a whole bunch of subagents to research everything there is to know about agents using blender MCP, and blender best practices in general. I will also in parallel send ChatGPT Deep Research on it (well, I don't do it, claude has a deep research skill which teaches the model to open my logged in chrome browser and launch the deep research run itself). The agent will then read all of the research, synthesize it all into one master research report, and save that durably. then, same prompt "use /writing-great-skills to make this a skill". Now, with 2 prompts, one for research and one for the skill, your agents are as good as the best humans at Blender.

**Download card:** starter-skill-pack.md — "Six skills that pay for
themselves in a week — release, review-my-diff, write-human, debug-loop,
session-closeout, and a skill for writing skills." [GATED — artifact below]

---

## Chapter 04 — Agents need tools

**Lede:** Out of the box it can read, write, and run commands. Everything
else is a command-line tool you install once and then
never think about again.

**Section label:** The rack — pick one

| Tool | Blurb (rack) | Why (panel) |
|---|---|---|
| ripgrep | Search a million lines in under a second. | Replaces find + grep. Respects .gitignore. |
| gh | GitHub from the terminal: PRs, issues, CI logs. | The agent can read its own CI failure. |
| ctx7 | Current library docs, not training-data memory. | Today's docs beat last year's memory. |
| exa-agent | Live web research with citations you can check. | Live web, with URLs you can actually open. |
| agent-browser | A real browser it can click, type, and screenshot in. | It can see whether the button is actually centered. |
| MCP servers | The plug format for things that aren't CLIs. | Great for non-CLI systems. Costs window all session. |
| …your own | The 200-line CLI only you need. It builds it. | A paragraph of spec becomes a tool by dinner. |

**Tool terminals** (key copy lines only):
- ripgrep: `3 matches · 1,204 files · 41ms`
- gh: `✔ Found it: seconds, not milliseconds. Fixing.`
- ctx7: `Note: middleware.ts was renamed. The v16 file is proxy.ts.` /
  `✔ Would have written the deprecated API from memory.`
- exa-agent: `Always open the citation. ~1 in 6 quotes fails verification.`
- agent-browser: `✔ Rail overlaps the figure below 1100px. Fixing.`
- MCP: `Every listed tool is context you pay for on every turn.` /
  `✔ Park what you use monthly. Keep what you use hourly.`
- your own: `ask "worktree or edit in place? (default: in place)"` →
  `✔ "in place, I want to watch it"`

**Callout — CLI or MCP?:**
Both give it capabilities; they cost differently. **A CLI costs nothing until
it's used** — one line in an instruction file saying it exists. **An MCP
server's whole tool list sits in the context window all session**, whether
you use it or not. So: CLI by default, MCP when the thing genuinely isn't a
command line. Chapter one, applied.

**Section label:** The part people skip

**Column 1 — Build it the tools that don't exist yet:** [VOICE]
Want your agent to have a tool to do something, but it doesn't exist? I don't know if you know this, but agents are pretty good at writing code. If they need a tool they don't have, just ask them to build it. (If you don't want to interrupt the agent mid workstream, just tell it to send some subagents to build it while you and the main agent keep working; the tool will appear in a few minutes.)

Two of the tools I use most often are ones I described in a paragraph and had
an agent write in an afternoon. `ask` pages my phone and blocks until I
answer, so an agent working while I'm out touching grass can get one judgment call from me
instead of getting stuck and making no progress until I'm back at my machine. `papercuts` is a complaint box: when an agent hits
friction, it files the friction and keeps going, and I fix all filed papercuts once a week, meaning my agentic development environment autonomously and continuously improves week over week.

**important tip:** If you build a custom CLI for something, but never tell the agent it exists, it won't use it. As such, I include the name and brief description of my custom tooling in the agents.md/claude.md so the model is always aware of the things it can reach for.

**Column 2 — Optimizing tools for agents:**
One obvious entry point. Exit codes that mean something specific. A `--json`
or `schema` mode so nothing has to parse prose. Get those three right and the
agent reaches for it unprompted, which is the whole point — **a tool it has
to be reminded about is a tool you still own the operation of.**

**Section label:** Built here, open sourced — take them

- **delegate-agent** — One CLI, ten agent runtimes, three trust modes.
- **papercuts** — Where agents file complaints so friction becomes a backlog.
- **elv** — The entire ElevenLabs API as 338 agent-callable operations.
- **exa-agent-cli** — Web research as structured data — 68 commands, stable exit codes.
- **receipts** — Answers that arrive with a URL, a quote, and a verdict.

**Download card:** agent-build.md — "Blueprints you paste into your own
session: build-your-own `ask` and `papercuts`, with the contracts spelled out
so your agent builds them right the first time." [GATED — artifact below]

---

## Chapter 05 — Multiplying it

**Lede:** Why use one agent when you can use 10 instead? Subagents are a tool allowing you to hyper optimize your main agent's context window. Instead of your agent spending ten thousand tokens searching for something in your codebase, it can spend 20 to spawn a subagent to go find it and have the subagent report back a one line finding. 

**Fan-out figure** (six lanes: codex · cursor · grok · kimi · glm · opus):
- Jobs: audit the auth module · hunt N+1 queries · sweep dead exports ·
  red-team the copy · check the migration · review the diff cold
- Log: "One brief, six windows. Yours stays empty." → verdicts:
  - ✗ codex — session fixture leaks between tests
  - ✔ cursor — clean — 2 queries, both indexed
  - ✔ grok — 11 dead exports, safe to drop
  - ✔ kimi — three sentences nobody would say
  - ✗ glm — migration is not reversible
  - ✔ opus — agrees with codex; has the repro
  - = 6 windows spent. ~340 lines read. You read 6.
  
  [here, we should add another context window visual. this one is "your agent fixing a bug without subagents" vs. "fixing a bug with subagents", and it visually shows how much context the subagents save by visually showing how you're outsourcing all those tokens to the subagents themselves]

**Section label:** How to command your army

My agent armies have a few troop types:

**A — Subagents in the same harness:** Most major harnesses now support subagents natively. In Claude Code, this means Fable can spawn Sonnet subagents to explore your codebase and report back, or send Opus to implement a big chunk of your build plan in a fresh context window. Use them for
anything that is token heavy and would not improve your orchestrator's context window for the actual goal at hand. 

**B — Cross-model delegation:** Hand a bounded task to a different vendor's
agent entirely — a `delegate` command that runs the job in another harness.
Read-only mode for reviews, edit mode when you want the work done.
**Different training, different blind spots, easy cost optimization.**

**C — The council:** For decisions worth real time: four models propose,
critique each other, defend, and a fifth judges. In one blind-scored run the
synthesized plan beat the best single model 96.4 to 91.6 — and beat the
human-written gold standard, at 85.2, after the critique stage caught a
hazard nobody else saw. Slow and expensive, so save it for things you're
about to bet on. **The value is decorrelated error, not extra opinions.** (download the skill here, it does require my delegate agent CLI installed and other models configured in whatever harness you like. Or just give it to your claude and ask him to implement a version for you.)

**Callout — Learned the hard way:** [VOICE-adjacent — your real incident]
Long parallel runs frequently land the meaty edits and then stop just short
of the trailing cleanup. **Never trust a subagent's "done" summary — check
the disk.** And brief every parallel writer never to run a tree-wide git
command: one agent's tidy-up once stashed three siblings' uncommitted work
mid-flight.

---

## Chapter 06 — Trusting it at scale

**Lede:** The people who move fastest with agents are the most paranoid, contrary to popular opinion. *Paranoia is what makes speed safe.* Every guardrail
below exists so you can stop supervising and let something run.

**Section label:** The gauntlet — press it and watch it fail

**Gauntlet gates:** 01 occupancy · 02 lint + types · 03 tests ·
04 fresh-eyes review · 05 human go-ahead

**Gauntlet copy:**
- Intro: Five checks stand between a generated diff and your main branch.
  Watch what happens the first time.
- Button: Send a change through / Fix and re-run / Send another change
- ✔ Gate 01. No one else is in this repo. Claimed for 4h.
- ✔ Gate 02. oxlint + tsc clean.
- ✔ Gate 03. 34 passed, 0 failed.
- ✗ Gate 04 — fresh-eyes review. A second model, reading the diff with no
  memory of writing it: **"the retry loop swallows the error it retries
  on."** Nothing reached main. That is the gate doing its entire job — and it
  is the one an agent grading its own work never fails.
- ✔ Gate 04. Fresh reviewer signs off on the fix.
- ✔ Four gates green. Commit landed locally. The push is waiting on you —
  **and it will keep waiting.** Yesterday's "ship it" does not authorize
  today's push.

**Section label:** What each one actually buys you

**01 — Know who else is in the repo.** Once you run more than one agent, two
of them will eventually edit the same file. A tiny occupancy tool that
answers "is anyone working here?" with an exit code — **and a rule that a
busy repo means stop, not write anyway** — removes an entire class of 2am
mystery. Install for your setup here.

**02 — One gate command, run by you.** Whatever your project's real check is
— `pnpm ci:quality`, `make test` — name it in the instruction file and run it
yourself at the end. **Self-checks miss things that the canonical gate
catches every time.** (pro tip: have a fresh agent with a fresh context window write/create the gates for you, not your implementing agent. An implementer should never write tests or CI, that's just asking for cheating.)

**03 — Commits ungated, pushes gated.** Let it commit constantly and without
asking — that's your undo. But pushing, opening a PR, tagging, deploying:
**every one of those needs a fresh yes from a human, and yesterday's yes
doesn't count.** (tip: hooks can literally forcibly stop agents from pushing against your will, just ask your agent to implement them for you.)

**04 — Review with something that didn't write it.** A different agent,
ideally a different model family entirely, reading the diff with no memory of the
reasoning that produced it. **It finds the thing the author is
constitutionally unable to see.**

**05 — Stop the loop with a deletion.** Review cycles want to run forever,
because the newest text is always the least-reviewed. **End the loop when a
round produces no changes** — and if a checker's finding list is always
empty, assume the checker is broken, not the code. (Tip: GPT 5.6 family of models are insanely pedantic; I once had Sol run a review fix loop for 15 iterations before I noticed and stopped it. Cap review fix loop iteration counts reasonably.)

---

## Chapter 07 — A week in the life  ← the "four scenarios"

**Lede:** This is all quite abstract, so let's get specific. Below is a tool to show you a few real, actual scenarios of my workflows my agents mined from my session logs. Answer a
question or two and you'll land on the one you're in — with the setup I'd
use, in the order I'd use it. [VOICE]

**Root question:** What are you actually sitting down to do?
**Sub:** Four situations cover most of my week. Pick the one that sounds like
today. [VOICE]

- **A. Start something that does not exist yet** — An idea, an empty folder,
  a weekend.
- **B. Add a feature to something real** — Existing repo, existing users,
  existing tests.
- **C. Rescue a pile of half-finished projects** — Eleven repos. Three of
  them matter. You forget which.
- **D. Chase one weird bug on my machine** — Works everywhere else. Not
  here. Not today.

### Branch A → How big is it, honestly?
**Sub:** This is the fork that matters most, and the one people get wrong in
the same direction every time.
- **A weekend tool for me** — One user. Might be dead in a month.
- **Something I intend to ship** — Other people will depend on it.

### Leaf: Greenfield / Small — "One session, no ceremony"

**[VOICE] Quote:** "The mistake here is building the factory before the
thing. For a weekend tool I want working software in an hour, and I am fine
throwing away all of it."

Steps:
1. **Say what it does in three sentences** and ask the agent to argue with you about
   the shape before writing anything. Keep debating until you both agree on what this thing should be.
2. **Skip the plan document.** At this size the plan costs more than the
   rewrite would.
3. **One repo, one session, commit constantly.** Every green state gets a
   commit — that is your undo. Subagents do all work, main agent is making sure what they build is actually what you requested.
4. **Ask it what it would do differently** once it works. Take the one
   suggestion that is obviously right; ignore the rest.
5. **Write the CLAUDE.md last**, from what you actually did, not from what
   you intended.

### Leaf: Greenfield / Big — "Plan, review the plan, then fan out"

**[VOICE] Quote:** "Anything I intend to ship gets a written plan before a
line of code, and the plan gets reviewed by something that did not write it.
An hour of planning routinely saves me a day of unwinding."

Steps:
1. **Interview first.** Make it ask you everything whose answer changes the
   architecture, before it proposes one. Again, Matt Pocock has the best skill for this, /grill-with-docs (link out to this).
2. **Get a written plan** — files, order, and the gate command that proves
   each step.
3. **Hand the plan to a fresh reviewer** with no memory of writing it.
   Dependency order and file collisions are what it catches. Ideally, this is your other smartest model; Fable, GPT 5.6 Sol, Grok, K3, whatever.
4. Have your orchestrator read the review and propose to you the intended patches/changes to the plan, or just let it do it directly, up to you. 
5. **Execute in waves**, each wave a small set of independent files, gate run
   at the coordinator between waves. Each wave is built via subagent fan out to parallel process as much as possible and keep the orchestrator's window clean.
6. **Verify on disk after every fan-out.** Long parallel runs land the big
   edits and skip the trailing polish.
7. **Fresh-eyes review before anything is pushed.** I always include 3 rounds of review-fix loops at the end of each plan wave, and then a few review rounds of the entire plan's output against the original plan by multiple frontier models. Then, and only then, ship it.

### Leaf: Feature branch — "Branch, brief, gate, review"

**[VOICE] Quote:** "On an existing project my job is mostly to stop it from
being clever. The repo already made its decisions; I want the feature to look
like it was there all along."

Steps:
1. **Branch first.** Nothing lands on main from a session that started with
   an idea.
2. **Point it at the closest existing thing.** "Match the shape of the
   settings page" beats three paragraphs of description.
3. **Brainstorm.** if the feature is big enough, use the grill with docs skill. if it's fairly small and straightforward, then pitch the model your idea, get feedback, brainstorm, then ask the model to repeat back to you what it will build and what the purpose of it is. only when that reads correctly do you give it the green light. (Note/callout or something: some features deserve the full plan plan review loop, some don't, that's a judgement call.)
4. **Subagent execution in waves.** Fan out as many subagents as possible in parallel. 
5. **Review with something that did not write it**, then run the gate
   yourself at the end anyway. multi model review fix loops at the end of each wave, and of the whole feature branch against mak at the end.

### Leaf: The pile — "Triage before you touch anything"

**[VOICE] Quote:** "Half-finished projects are not a coding problem, they are
a memory problem. The question is never how to finish them. It is which two
are worth finishing and what past-me was in the middle of."

Steps:
1. **Do not open an editor.** Send an agent per repo to answer three
   questions: what is this, what state is it in, what was the last thing in
   progress.
2. **Get it back as one table**, not eleven summaries. You are making a
   keep-or-kill call, not reading code.
3. **Kill loudly.** Archive the ones you will not finish. A dead repo you
   have not decided about is still costing you attention.
4. **For each survivor, have it write a resume note** — current state, next
   action, known landmines — committed into the repo.
5. **Then pick exactly one** and start a real session in that specific repo. The pile becomes a
   queue, and a queue is a solved problem.

### Leaf: One weird bug — "Reproduce, minimize, prove"

**[VOICE] Quote:** "The failure mode here is speculative fixing — three
plausible changes, none verified, and now you have four problems. No repro,
no fix. That rule has never once cost me time."

Steps:
1. **Get a reproduction first**, and forbid changes until there is one. A
   failing command is the whole ballgame. If it's particularly hairy, we'll send 3-5 different subagents with different models all assigned to root cause diagnose the issue.
2. **Minimize it.** Strip the case down until it is small enough that the
   cause is nearly visible.
3. **One hypothesis at a time**, each with a check that would disprove it.
   Two changes at once means you learn nothing.
4. **When it is fixed, keep the repro as a test.** Otherwise you will meet
   this bug again in March.
5. **If two attempts fail, stop and escalate** — different model, fresh
   context, no memory of the two dead ends.

---

## Chapter 08 — Build your own

**Lede:** All of the above was assembled because I spent literally hundreds of hours failing to make agents work, until they finally did. Every piece exists because something annoyed me
twice and I wrote the annoyance down.  [VOICE]

**Terminal** (title `~/Code/trey-goff — this page`):

    $ papercuts add "agent misidentified which model it was running as"
    ✓ filed pc_4a21 · severity: minor · tag: identity
    $ # a few days later, an agent read the complaint pile and shipped:
    hooks/announce-model.mjs — session start: tells every agent
    which model it is actually running as. No more guessing.
    ✔ complaint → tool, in one loop. True story. That is the whole system.

**Callout — The honest caveat:**
A human picked the eight chapters, ran a design bake-off between two
competing prototypes of this page, and is red-penning every artifact before
it ships. **That's the actual division of labor: agents create, but only you can decide what's worth creating and what "good" or "done" look like. 

**Section label:** Start tonight

**Intro:** Open a repo you care about, start a session, and paste this. It
will interview you before it writes anything — which is the entire trick,
compressed into one prompt.

**The copy-paste prompt (START_TONIGHT):**

> I want to set you up properly rather than just asking you for things.
>
> Interview me first. Ask me every question whose answer would change how you
> work in this repo — how I want commits handled, what the gate command is,
> what you should never touch, when to ask versus decide, and what my last
> three frustrations with an AI assistant were. Do not start writing until
> you have asked everything you want to ask.
>
> Then write two files:
>
> 1. ~/.claude/CLAUDE.md — my global working agreement, from my answers.
> 2. ./CLAUDE.md — this project: stack, commands, conventions, landmines.
>
> Keep both short. Every line should be a rule you would actually apply, not
> a description of the codebase you can already read.

**Download card:** start-tonight.md — "The same prompt as a file, plus the
follow-up questions worth asking after it finishes."

**Closer:** Do that tonight. In a week you'll have three rules you didn't
have today, and one of them will be a rule I've never thought of. *That's the
part I actually want to read.* [VOICE]

**Colophon:**
Trey Goff · treygoff.com/stack · 2026
This page was designed, written, built, and reviewed by the setup it
describes.

---
---

# The four downloadable artifacts (`public/stack/`)

## 1. global-CLAUDE.md  [GATED — needs sanitization sign-off + veto]

# Global agent instructions (starter)

Adapt freely. Everything here is a rule I got tired of repeating.

**Git**
- Local commits are ungated. Commit at every coherent checkpoint, unasked.
- Pushes, PRs, tags, and deploys require my explicit go-ahead, every time.
  One "push it" authorizes exactly one push.
- Never amend, never force-push, never --no-verify. Stage files by name.

**Verification**
- "Done" needs a command attached that would fail if it were not done.
- Run the project gate before reporting success, not after I ask.
- If a test fails, say so and paste the output. Never describe it as passing.

**Deletions**
- Re-read the path before deleting it. Never build a delete path from an
  unvalidated variable. Ask before removing anything you did not create.

**Commit messages**
- Subject <= 72 chars, blank line, then a soft-wrapped body. No manual line
  breaks mid-sentence: modern UIs reflow and hard wraps become a wall.
- Cap the body around 15-20 lines. Long context belongs in the PR.

**Shell footguns**
- Use python3, never bare python. Guard optional tools with `command -v`.
- Quote every URL and glob. Assume zsh, where `set -- $var` does not split.
- `rg -r` is replace, not recursive. ripgrep already recurses.

**Asking**
- Ask up front, before consequential work, when there is no time pressure.
- Prioritize questions whose answer changes the architecture.
- Do not ask permission for reversible work that follows from the request.

## 2. starter-skill-pack.md  [GATED — invented list, may want your real six]

Six skills that pay for themselves in a week; frontmatter and shape below.

1. **review-my-diff** — Review uncommitted changes for correctness and repo
   conventions. Use when the user says "review this", "check my diff", or
   before a commit.
2. **ship-a-release** — Cut and publish a release. Use on "ship it" or "cut
   a release".
3. **debug-loop** — Reproduce, minimize, fix, prove. Use when something is
   broken and the cause is unknown. Forbids speculative fixes without a
   repro.
4. **write-human** — Voice-first writing directive. Load BEFORE drafting
   prose.
5. **session-closeout** — End-of-session sweep. Update project notes,
   commit, write the handoff. Use on "we are done" or "wrap up".
6. **write-a-skill** — Create or improve a skill. Use when a correction has
   now been repeated twice and should become a procedure.

## 3. agent-build.md  [GATED]

**Blueprint 1 — `ask`:** Build me a CLI called `ask` that pages my phone and
blocks until I answer. Contract: `ask "<question>" [--timeout SECONDS]
[--on-timeout proceed|stop]`; prints my reply to stdout and exits 0; exit 2
if the relay is unreachable, 3 on timeout-proceed, 4 on timeout-stop.
Transport: a Telegram bot (or any push channel I already use). Store the
token outside the repo. Never include file contents or secrets in the body:
the question must fit on a lock screen. Then add a line to my CLAUDE.md
telling agents to use it when they are genuinely blocked on a judgment call —
and never for status updates.

**Blueprint 2 — `papercuts`:** Build me a CLI called `papercuts`: an
append-only complaint box for agents. Contract: `papercuts add "<what broke
and what would have prevented it>" [--tag AREA] [--severity
minor|major|blocker] [--cmd C] [--exit N]`; `papercuts list [--since 7d]
[--tag AREA]`; `papercuts schema`. Storage: one JSONL file. Never rewrite
history; only append. Then tell agents in CLAUDE.md: when you hit friction,
file it and push through — do not stop the task to complain.

**Why this shape works:** A tool an agent can use has three properties: one
obvious entry point, stable exit codes that mean something, and a `--json` or
`schema` mode so the agent never has to parse prose. Build for those three
and your agent will reach for it unprompted.

## 4. start-tonight.md  [clear — no marker]

The START_TONIGHT prompt above, plus:

**After it finishes, ask it these:**
- "What did I tell you that surprised you? Write it down somewhere durable."
- "What would you have assumed wrongly if I hadn't answered the interview?"
- "Which of my rules will be hardest for you to follow, and why?"
