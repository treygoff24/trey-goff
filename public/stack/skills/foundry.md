<!--
Skill: foundry
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/foundry/SKILL.md
-->

---
name: foundry
description: Run the foundry — take an idea or validated prototype to a shipped product with the cross-model build loop, delegate lanes building/reviewing/fixing in waves under an independently-verifying coordinator. Use when the user asks for a recon/lens-style buildout, says "the playbook" or "foundry", or wants a product built end-to-end with delegate lanes.
---

# Foundry

The build loop that shipped recon and lens: decorrelated model families catch what authors miss, and the coordinator independently verifies every claim. You are the coordinator. Delegates cast; you inspect and stamp.

**The two invariants, above every phase:**

1. **Decorrelation.** Author ≠ reviewer ≠ fixer, three different model families (default lanes: Codex implements, Cursor reviews, GLM `droid glm` fixes). A lane that flakes twice is benched for the build; reroute to any different family.
2. **Claims are hypotheses.** A delegate saying "gate passed," "all fixed," or "done" is a hypothesis, not a result. Nothing is true until you have re-run it or read it yourself. This has caught a false gate claim, a flaky test the fixer's own sweep missed, and a blocker inside code a reviewer explicitly marked "verified OK" — one per build, every build.

**Adapted decorrelation (confidential repos).** When the tree itself is confidential (privileged litigation material, PII, unannounced product) and external lanes must not see it: Claude-family agents implement in-repo, external families run `safe` reviews only — against a neutralized allowlist export, never the real tree (see the `confidential-delegate-review` skill for the export/tripwire mechanics), and the coordinator applies fixes, gates, and commits. Reviewer decorrelation survives intact; author≠fixer decorrelation is deliberately waived, so the coordinator's own read and gate carry the weight the fix lane would have. Design docs travel into the export only if written export-neutral, and get re-tripwired after copy-in. Proven on a privileged build: three external review rounds, 27 findings, zero matter content exposed.

**Reduced foundry (solo/private repos, subscription-only).** When the user restricts lanes to Codex + native Claude subagents: Codex implements *and* fixes (author=fixer waived — the coordinator's diff-read of every fix carries that weight), Opus native subagents review, and one Fable pre-ship gate runs before the push. Reviewer decorrelation survives (Codex authored, Claude-family reviewed); the pre-ship gate is the backstop for the waived leg. Validated 2026-07-05 (land, a money-math build): the Fable gate found a real BLOCKER (a false "never insolvent" from a runway window bug) plus 2 majors *after* two Opus review rounds and the coordinator read had passed the same code — the gate earned its spend precisely because the reduced config has fewer independent eyes.

**Feature-scale foundry (mid-session feature, not a product build).** When the unit of work is a feature landing in an existing session — not "idea → shipped product" — run the Phase 3 per-wave loop standalone and skip Phases 0–2 ceremony (no design doc, no BUILD-STATE.md; the session conversation is the build memory). Brief files still go in the gitignored scratch dir; the two invariants and the loop hard stops apply unchanged. Two refinements validated 2026-07-06 (land, Zillow-intake + buy-existing build: 4 Codex lanes, 3 review rounds, 2 real catches — a silent wrong-price parse and a client-side money-math violation): (a) a **persistent native reviewer** — one Sonnet/Opus subagent held across all rounds via SendMessage — beats fresh per-round reviewers, because round N re-runs its own round-1 attack cases against the fix (that continuity caught a fix that closed the reported hole while opening an adjacent one); reviewers may idle silently after reporting — ping via SendMessage, don't respawn. (b) **Per-feature commits require checkpoints**: waves with disjoint file ownership still interleave diffs inside shared files, so commit (with user authorization) between features, or isolate later waves (`--isolation worktree --include-dirty`); discovering this at commit time is too late (delegate-agent#11).

Prompt files for every delegate call are in [`references/prompt-templates.md`](references/prompt-templates.md) — use them; their boilerplate lines are load-bearing, learned from lane failures.

## Loop discipline

Every iterative cycle in this playbook (review→fix per wave, acceptance→fix in Phase 4) runs under three hard stops, not just a success condition:

1. **Round cap** — 3 rounds per cycle by default. Hitting the cap is an escalation to the user with state written down, never a shrug or a silent fourth round.
2. **No-progress halt** — the same failure surviving two fix rounds, or a round producing zero new accepted findings, ends the cycle immediately. Diagnose or escalate; do not re-roll the dice. A halt on the same failure is the stuck-twice Fable gate: if pre-approved (or the user is present to ask), one Fable diagnosis pass before escalating is usually cheaper than another blind round.
3. **Spend ceiling** — the Phase 0 budget is per-build architecture, not a vibe. Track delegate spend per cycle; a cycle trending toward the ceiling stops early with a written status.

A cycle without all three is not a loop, it's a token furnace with good intentions.

**Loss function (optimization loops).** The hard stops bound a loop; they don't make it converge. Any loop whose goal is "make X better" — acceptance fix cycles, hardening, perf, QA sweeps — gets a written loss function before round one: target metric **with direction**, the exact scorer command that measures it, an eval set the lane can't overfit (large or held-out — a visible ten-case eval WILL be gamed), and anti-gaming constraints naming what must not change to move the number. Diagnosis vs. gaming: visible failures are for root-causing — inspect and fix them freely; what's forbidden is *special-casing* them to move the score. Scoring happens on the large/held-out set. Stall rule: two rounds without measured improvement → this is the no-progress halt above — the lane stops and writes down why the strategy is failing plus what a genuinely different one would be; the coordinator decides whether to relaunch. Agents optimize what you measure, not what you meant. Template: the Loss-function block in [`references/prompt-templates.md`](references/prompt-templates.md).

**Build memory.** Keep `BUILD-STATE.md` in the gitignored scratch dir, updated after every wave and every acceptance round: rejected approaches and why, lane quirks discovered this build, hypotheses that died to measurement, findings rejected in triage. Open the file with a task ledger — one line per remaining unit of work, marked `READY` / `BLOCKED(on <what>)` / `DONE` — so a fresh session picks up the build from the file instead of replaying a transcript; lessons sections are append-only below it. Every subsequent implement/fix prompt cites it (the templates have a slot). Without it, each lane rediscovers the build's lessons from zero; with it, triage decisions compound instead of repeating.

**Unattended mode.** With the hard stops in place, the Phase 3 wave inner loop and Phase 4 fix cycles are safe to run without the user present: lanes in the background, coordinator self-pacing check-ins (ScheduleWakeup / babysit cadence), progress recorded in the task chain and BUILD-STATE.md. The user is surfaced only at real decision points: design approval, contentious triage calls, anything irreversible (remote push, publishing, dependency additions beyond the design doc, spend past the ceiling), and any hard-stop escalation. Coordinator judgment — triage, riskiest-file reads, anomaly diagnosis — is never scripted away or delegated; autonomy bounds the loop, it does not replace the inspector.

## Phase 0 — Frame

- Confirm with the user (one message, not a questionnaire): product name, new repo or existing, license. Repo name and license are the user's call; everything downstream is yours.
- Scaffold: repo, license, `.gitignore`, symlink relevant craft skills into `<repo>/.claude/skills/` (e.g. rust-agent-cli, rust-engineer) — delegate prompts will cite their paths.
- Note the constraints that bound the build: API spend budget, secrets location (never committed, never echoed), what data is read-only, whether remote push is allowed (default: local commits only until the user says otherwise), and **which Fable gates (if any) are pre-approved by name** for this build — Fable is metered; the routing protocol lives in the shared CLAUDE.md. Unapproved gates run on opus and get listed in the wave/close summary.
- Create the task chain now: one task per phase/wave, `blockedBy` in dependency order.
- Seed `BUILD-STATE.md` in the scratch dir (see Loop discipline) with the constraints above and the budget ceiling.

**Done when:** repo exists with license + skill links committed, and the task chain is created.

## Phase 1 — Design

Write the design doc (`docs/plans/YYYY-MM-DD-<name>-design.md`) yourself — the coordinator owns the design. It must contain: thesis and provenance (what prototype or evidence validates it), the external contract (envelope/exit codes/API shapes — inherit from a sibling product when one exists and say so), each command/feature, storage and state decisions, measured cost basis with worst-case constants, dependency list with justification for each new dep, testing strategy including live acceptance, explicit non-goals, and the wave plan (which lane builds what, in what order).

Ground every number in something measured — a prototype run, a documented limit, a console screenshot. A design doc with invented numbers fails the review you're about to buy.

**Done when:** the doc is committed and contains all sections above.

## Phase 2 — Design review

- Fire an adversarial design review at a lane from a different family than wrote the doc (you wrote it → any lane; default Codex `safe`). Template: design-review, in the prompt-templates reference. Give it the doc, the donor/prototype code, ground truths it must not dispute, and named hunt areas.
- **Triage every finding in writing**: accept, or reject with an explicit reason. No silent drops. Rejections with reasons have been ~40% of findings and every one has survived scrutiny; silent rejections rot.
- **Optional Fable read (plan-review gate):** with approval, add a native Fable subagent review of the design doc *alongside* the cross-family lane, not instead of it — Fable is Claude-family and you wrote the doc, so it does not satisfy decorrelation; it buys maximum judgment on the doc's reasoning, which is a different axis.
- Amend the doc with accepted findings (an amendments section keeps provenance), record rejections and waivers there too, commit.

**Done when:** every finding has a written disposition and the amended doc is committed.

## Phase 3 — Waves

Split implementation into 2–4 waves, each a coherent castable unit (foundation → core engine → surface is the proven shape).

**Preferred execution substrate:** the private dynamic workflows at your own private workflows directory (`wave-execute` with per-task `engine:'delegate'` + `delegateModel`, then `wave-review` — both resolve by name from `~/.claude*/workflows/`). They encode the steps below with alias discipline, report-validity checks, agent-fallback, and a capped fix→re-verify loop already baked in; pass BUILD-STATE.md content as `memory`. Drive them per wave and keep the coordinator duties (merge, gate, riskiest-file read, triage) yourself. Fall back to hand-driving the steps below when the shape doesn't fit (e.g. confidential-repo adapted mode, or a single-task wave).

**Lane routing (updated 2026-07-08 from the a large policy project overnight — 7 waves, 4 review rounds, 3 fix rounds; supersedes the 2026-07-03 mining):** the canonical pipeline is **Codex writes → Cursor (Grok 4.5) attacks → Devin (swe-1.7) repairs → Claude decides.** Codex is the best author for big decision-dense waves but has proven author-blindness (its green tests hid 3 ship-blockers once, incl. a parity suite that couldn't fail) — never skip its cross-family review. Cursor/Grok-4.5 is the fleet's elite adversarial reviewer: it probes built artifacts and computes evidence (contrast ratios, real exit codes), catching what tests structurally can't see; the coordinator still ranks its findings' severity. Devin executes findings-lists perfectly with zero scope creep and volunteers adjacent gaps, but never fills ambiguity — findings-shaped fix prompts only. Grok Build CLI = same model as Cursor (one decorrelation slot) and has lost file access mid-run twice — quota fallback only, with the report-validity check (see Lane mechanics). GLM and other droid lanes are benched (operator decision): reach for them only when a roster lane fails; droid lanes NO-OP on review-shaped tasks — never assign them reviews.

**Goal-mode lanes (validated 2026-07-03 on lens).** Codex Goal mode runs headless — `codex exec` with `/goal` as the prompt's first token — and self-iterates for hours toward a verifiable stopping condition on the unmetered subscription. The boundary rule: **mechanical verifier → goal; judgment verifier → never.** Use a goal lane when the per-round check is a command (gate green, metric moved, story tested); never when it's a judgment (is this finding real, should the approach change) — that would be Codex adjudicating its own work, the exact correlated-error mode decorrelation exists to prevent. Concretely: waves with decision-complete specs and a strong gate may launch as `/goal implement <prompt>; stopping condition: gate + 5x sweep green`, eating their own gate failures instead of bouncing them through you — steps 3–9 (your read, review lane, triage, re-review, commit) are unchanged. Mechanics (clone isolation not worktrees, commit fallback, artifact monitoring) live in the `goal-qa-sweep` skill; loss-function constraints go in the goal text since nobody watches round-by-round. Goal claims get *more* scrutiny per merged line, not less — bound each goal's scope to what you are willing to review.

**Subscription economics:** route volume through the flat-rate subscriptions — Codex first (effectively unmetered), then Cursor/Grok Composer (one Composer family, two subscriptions — alternate them). Pay-per-token lanes (GLM, DeepSeek, Kimi, Gemini, MiniMax) are cheap but only earn a slot with a reason; the standing one is GLM as the third-family fix lane, since Cursor and Grok can't decorrelate from each other.

Per wave:

1. **Author the implement prompt** (template: implement). Owned files exhaustively listed, authority docs to read first, the gate block verbatim, "Do NOT commit," report format. Launch on the implement lane (`work` mode), in the background.
2. **Gate it yourself** when it lands: run the project's canonical gate (build + tests + lint + format) and a **5x test sweep** — any intermittent failure is a failure. Scripted fakes plus concurrency have raced in every build; a single green run proves nothing.
3. **Read the riskiest files yourself.** The coordinator read is a full review lane, not a formality — pick the 1–2 files where a bug would be silent (merge logic, id mapping, money paths) and trace them. This read has found blockers the review lane explicitly blessed.
4. **Fire the review lane** (`safe` mode, template: review) on the uncommitted diff, in parallel with your own read. Point it at named hunt areas, not "review this."
5. **Triage** review findings merged with your own: accept/reject each with a written reason. Doc-only findings you fix yourself now (waivers into the design doc).
6. **Author the fix prompt** (template: fix) with exactly the accepted findings, each with file anchors and a required test. Launch on the fix lane (`work` mode).
7. **Verify each fix landed** — grep/read for every finding, don't trust the report — then re-run the gate + 5x sweep yourself.
8. **Re-review until dry.** Post-fix code is new code nobody reviewed. Fire a scoped review round on the fix diff only (same lane rules); triage and route accepted findings back through steps 6–7. Loop until a round yields zero accepted findings, under the loop-discipline caps. Round one is usually the last — but only usually.
9. **Commit** with a message that records what the review caught and what was rejected and why. Delegates never commit; you do.

Foundation waves (ports of already-reviewed code) may skip steps 4–8 — your own gate plus a spot-read of whatever is genuinely new is enough. Never skip for novel logic.

**Done when, per wave:** your own gate + sweep is green, every accepted finding is verified landed, and the wave is committed.

## Phase 3.5 — Goal-mode QA sweep (optional, cheap, recommended for CLI/API products)

After the last wave, before acceptance: launch the `goal-qa-sweep` skill — a headless Codex goal enumerates every user-facing behavior into stories, tests all of them, fixes logged failures, retests. Costs ~an hour of unattended Codex and near-zero coordinator time; run 1 found a real contract-drift defect in a repo this playbook had shipped clean. Its failure log feeds Phase 4 as pre-found anomalies. Triage the `blocked` rows, not just the fails — the first real defect surfaced as blocked. Nothing from the sweep's branch merges without the standard coordinator verification.

## Phase 4 — Live acceptance: the bug hunt

Acceptance runs the real binary against real data and real APIs. It is a **bug hunt, not a demo** — in both builds so far, live data surfaced model-behavior bugs that a hundred green tests could not see. Budget for finding things.

- Order: dry-run projections first (zero network, check the arithmetic), then the **budget kill-test** (tiny cap → partial exit, every unprocessed item named in the report), then resume-to-completion, then the full run, then known-answer queries/tasks.
- **Every anomaly gets a diagnosis, not a shrug.** When failures appear: build a small diagnosis harness (an `examples/` binary or one-off script that exposes the raw upstream response) instead of guessing. Three hypotheses died to measurement before the real cause surfaced last time; measure first.
- Fix small root causes inline yourself; route big ones through a fix-lane loop. Every inline fix still gets: gate + sweep, a pinning test, and a commit whose message records the measured cause.
- Any fix loop chasing a number (pass rate, latency, cost) runs under a written loss function (see Loop discipline) — scorer command in the prompt, before/after measurement required, stall rule enforced.
- Re-run acceptance after fixes until **zero unexplained failures** — explained-and-waived is acceptable, unexplained is not.
- Secrets discipline throughout: load keys from the env file without echoing; never let a key into a log, commit, or report.

**Done when:** the full acceptance checklist is green or waived-with-reason, all fixes are committed, and measured numbers (wall time, cost, counts) are recorded.

## Phase 5 — Close

- Write the LOG entry (experimenting engineer's notebook: what was tried, what broke, measured numbers, what the rubble taught us — not marketing) in whatever journal the project keeps, and commit it.
- Promote lessons up the ladder deliberately: L0 raw traces stay in logs; L1 a lesson worth remembering across sessions → auto-memory; L2 a procedure now done twice → a skill (new or amended); L3 a stable policy → CLAUDE.md/AGENTS.md. One rung per promotion, and never promote a one-off failure into a standing rule.
- Leave the repo clean and local. Remote setup, CI, publishing are user decisions — surface them as options, don't do them.
- The shipped summary leads with acceptance numbers and ends with the decision points that are the user's.

**Done when:** both repos (product + journal) are committed clean and the user has the summary.

## Lane mechanics (reference)

- `delegate <lane> {safe|work} --prompt-file <path>` from the product repo; run in the background; prompt files live in a gitignored scratch dir.
- **Worktree isolation preconditions** (mined 2026-07-03, HC build): `--isolation worktree` in `work` mode refuses a dirty source tree — untracked non-ignored files count as dirty (Godot `.uid`/`.import` sidecars blocked two lane launches; committing them was the fix). `--forbid-commit` also requires `--isolation worktree`; on a shared tree, the prompt's "Do NOT commit" line carries the policy instead.
- **Aliases increment** (`codex`, `codex-2`, `cursor-2`, `droid-3`…): always check `delegate runs` for the current alias before `run-output`, or you will read a stale report.
- `safe` lanes snapshot uncommitted tracked changes and untracked non-ignored files — review the diff before committing, never before.
- Droid lanes answer "Plan is up-to-date" as a sign-off tic even after doing real work — judge them by `git status` and the diff, not the report. For reviews they genuinely no-op without the bluntness lines in the templates.
- **Report-validity check on every lane result**: a completion report that is suspiciously short, preamble-only, or shows raw thought-delta fragments means the lane failed mid-run — Grok Composer has lost file access and fabricated findings from the prompt's own hunt hints. Treat that output as worthless; reroute to a different family, don't retry.
- **Native subagent reviewers (Opus/Fable) can go idle without delivering** — the agent finishes its analysis but never sends the report (seen twice, 2026-07-05). A `SendMessage` nudge ("deliver your findings now") recovers the full report; don't respawn, don't assume no findings.
- A lane that fails twice on the same task: stop retrying — implement/review it yourself (or reroute family) and record the fallback in BUILD-STATE.md.
- A `work` lane's out-of-scope diffs (e.g. "rustfmt touched other files") get a line-by-line read before you trust them as cosmetic.
- **Never pipe a gate through `tail`/`grep`/`head`** — the pipe's exit code replaces the gate's, and a green-looking tail has masked a real gate failure (mined 2026-07-03: fmt+audit failures hidden behind `check.sh | tail -15` exiting 0). Redirect to a file and echo `$?`.
