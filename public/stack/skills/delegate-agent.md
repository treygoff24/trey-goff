<!--
Skill: delegate-agent
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/delegate-agent/SKILL.md
-->

---
name: delegate-agent
description: Use the local `delegate` CLI to hand bounded execution or review tasks to other model harnesses — primarily OpenAI Codex, the Cursor and Grok CLIs (both running xAI Grok 4.5), and native Kimi K3 (preferred reviewer/prose red-teamer, subscription), with GLM, Droid-Kimi, DeepSeek, Gemini, and MiniMax as the backup roster, and OpenCode as the any-model lane (450+ provider/model ids via `delegate opencode --model provider/model`). `muse` is the provisional OpenCode alias for Muse Spark 1.1, a frontier-candidate test. Don't delegate Claude→Claude; use native Claude subagents for that. `safe` = isolated read-only review (code/draft review ONLY — no network, no gitignored files, writes go to a throwaway snapshot); `work` = the default for everything else, edits the real tree; `call` = stateless one-hop model call with no repo (`--read-only` for LLM-as-judge/grader use). Works in Git repos or ordinary directories; worktree isolation keeps edit-capable runs off the source checkout.
---

# Delegate Agent (Claude)

## Mandatory private model performance journal

Journal every actual model invocation made through this skill, but keep the record out of public repositories. Default to `~/.delegate/model-journals/<workspace>.md` (append a short hash of the absolute root when basenames can collide). Reuse a workspace-local journal only when it is already explicitly private and gitignored. Never create or update `model-performance-journal.md` in a public repo, and never commit private model IDs, aliases, run handles, or machine-local routing records. Do this after each completed, failed, or cancelled `delegate <lane> safe|work|call` run and before the handoff. Discovery-only commands such as `delegate models`, `describe`, and `dry-run` do not need a journal entry.

Every dated entry must identify the Delegate command and resolved harness, model ID, alias, variant or reasoning effort, mode, isolation, and run handle when available. Capture the task and expected result without copying secrets or sensitive prompt material; then record the actual result, verification evidence, time or latency observed, quality strengths, mistakes or limitations, failures or retries, and a concrete routing recommendation with confidence. State whether the model should be used again for this kind of task and what comparison would reduce uncertainty. Record evidence, not praise. A safe run remains read-only for the delegated model; the coordinator's required journal entry is separate workspace documentation.

Use this section shape so entries remain comparable:

```markdown
## YYYY-MM-DD - <model ID> via <harness> - <short task label>

Command and run: `<redacted delegate command>`; alias/variant/effort: `<resolved values>`; mode/isolation: `<values>`; run handle: `<handle or n/a>`.

Task and expectation: <bounded task, expected result, and relevant constraints>.

Outcome and verification: <what it delivered, actual checks or reviewer findings, and whether the result passed>.

Performance observations: <latency or duration, tool use, strengths, specific errors or limitations, failures/retries, and verification burden>.

Routing assessment: <use again for what, comparison to another model if available, next test to run, confidence: high|medium|low>.
```

**Muse Spark 1.1 test window.** `muse` resolves to OpenCode model `meta/muse-spark-1.1`. Treat it as an unranked frontier candidate in the **Grok 4.5 / GPT-5.5 class for testing only**. It is not a default and not part of the common roster until accumulated journal evidence supports that decision. Log every Muse use with enough detail to compare quality, speed, reliability, tool use, and verification burden against Grok 4.5 and GPT-5.5.

`delegate` hands a bounded task to another model's CLI harness — for implementation, review, or a decorrelated second opinion. **You are Claude:** never delegate Claude→Claude (the `delegate claude` lane exists but is pointless from here). For Claude-on-Claude work, use **native Claude subagents** (the Task/Agent tool). Reach for `delegate` to put a *different* model on the task.

## Mode: `work` by default (standing order)

**Default to `work` mode for essentially everything.** Reserve `safe` for exactly two jobs: code review and draft/artifact review — read-only judgment on things that already exist. Everything else — research, recon, exploration, writing reports, fetching sources, producing any file — runs `work`. Why: `safe` snapshots repeatedly burn runs — the sandbox blocks network access (Exa/web lookups silently fail), gitignored files (`docs/_scratch`, journals) are absent, `node_modules` is missing so builds/tests can't run, external symlinks become placeholders, and anything the lane writes lands in a throwaway copy instead of the real tree. If a "read-only" task needs the network or must deliver a file, it is a `work` task with a "do NOT edit other files" line in the brief. Want edit isolation without those losses? `work --isolation worktree`, not `safe`.

## Pick a lane (start here)

| Need | Reach for | Mode |
| --- | --- | --- |
| Author a big/coherent build | **Codex Sol** (`--model sol --reasoning-effort high`) | `work` |
| Adversarial review, plan/pre-ship gate | **Sol xhigh + Cursor (grok-4.5) in parallel** — the standing pair | `safe` |
| Bounded fix round from a findings list | **Codex Terra** (`--model terra --reasoning-effort high`); Devin as backup | `work` |
| Recon / mapping / fan-out audits | **Codex Luna** (`low` recon · `medium --fast` audits) | `work` (needs network/file output) |
| ⚡ Max speed, quality flexible | **Codex Luna + Fast** · **Cursor** · droid **kimi** | `work` |
| Second opinion / decorrelated read | **Cursor (grok-4.5)** or **Codex** (whichever didn't author) | `safe` |
| Long context (≳256k tokens) | **Codex** · droid **deepseek v4** (1M) · **glm** (1M) · **minimax** (512k) | either |
| Multimodal / image input | **Codex** · droid **gemini** · droid **minimax** | either |
| Test a frontier candidate | **OpenCode Muse Spark 1.1** (`delegate opencode --model muse`) | any |
| Any model not on this roster (450+ via models.dev) | **OpenCode** (`delegate opencode --model provider/model`) | any |
| Read-only audit (don't touch the tree) | any lane | `safe` |
| Just call a model, no repo / LLM-as-judge | any lane (add `--read-only` for judge/grader) | `call` |
| ❌ Claude → Claude | **native subagents**, not `delegate claude` | — |

**Codex is the primary workhorse; Grok 4.5 is a VERY close second.** For Grok 4.5, reach for the **cursor harness first** (higher subscription limits) and the **grok harness only if cursor fails**. Codex and both Grok 4.5 lanes are subscription-backed — flat-rate, de facto free at the margin. Everything else is the backup roster — reach for it with a reason: model diversity, cost/quota, long context, multimodal, or raw speed.

**Subscription-first routing.** the user runs three flat-rate subscriptions — Claude Code (this session + native subagents), **Codex** (effectively unmetered — the default sink for delegated volume), and **Cursor** — plus the Grok subscription. GLM/Kimi/DeepSeek/Gemini/MiniMax are pay-per-API-token. **Fable (claude-fable-5) is also metered** — it is never a delegation sink; it's a native-subagent oracle reserved for judgment-dense gates under the Fable routing protocol in the shared CLAUDE.md. Route as much work as possible through the subscriptions, Codex especially; reach for an API lane only with a specific reason (the classic one: a third model *family* for a fix lane when Codex authored and a Cursor/Grok lane reviewed — Cursor and Grok both run xAI Grok 4.5, the same model on two harnesses, so they fill one decorrelation slot, not two).

## Field-ranked roster (2026-07-13 — consolidated from ~100 journaled runs across 10 workspaces, 07-09→07-13)

the user-ratified role assignments; treat as the standing answer to "which model for what" until new evidence:

- **Sol (GPT-5.6 via codex) — the AUTHOR and the SEVERITY ANCHOR.** At `high`: best in fleet for big, coherent, trust-critical builds (whole-CLI in one lane, entangled multi-finding fix waves, security hardening that exceeded its brief). At `xhigh`: the premier review lane, period — validated on plans, code, experiment protocols, personas/prompts, and pre-ship *content* diffs (~14 clean runs, zero fabrication). It probes empirically instead of asserting (sandbox probes, numeric reproduction, spelunking artifacts), and its ship/no-ship bar is the fleet's calibration reference — it called DON'T-SHIP correctly on three consecutive security rounds where Grok said SHIP. Validated pattern: **Sol high authors → Sol xhigh closing-judges the final diff** (the judge run has caught ship-blockers whole review pipelines missed). Weaknesses: recommends heavier machinery than the product needs (coordinator owns the judgment layer); treats canonical-sounding text as authoritative on editorial calls; ~1 factual slip per ~20 citations — verify load-bearing claims before folding.
- **Cursor (Grok 4.5) — the ATTACKER.** Fastest reviewer in the fleet (~3× Sol), probes built artifacts and computes evidence rather than reading diffs; reliably catches classes Codex lanes miss (3-for-3 on Unicode/encoding edges; UX/operational texture; scenario-tracing on prompt artifacts). Its verified-clean lists cut triage time. **Hard rule: its severity calibration is not trustworthy alone — never ship on a Grok SHIP verdict for security-relevant work; Sol (or the coordinator) re-ranks.** In safe mode, forbid multi-command shell probes (observed deadlock) — direct read/grep tools only.
- **Terra (GPT-5.6 via codex) — the SURGEON and decision-dense everyday author.** At `high`: the default fix lane (5/5 findings-shaped fix batches near-spec-perfect, zero scope creep) and strong on multi-file modules with coupled touchpoints — the trailing-integration class overnight lanes historically drop. Runs falsification experiments unprompted; blocks honestly on genuine plan defects instead of scope-creeping. `terra high safe` is the right-sized quick reviewer for bounded mechanical diffs (~2min vs Sol's ~15). At `medium` its run windows expire mid-compile — the orchestrator owns build/test gates.
- **Luna (GPT-5.6 via codex) — the WORKHORSE, with an effort ladder** (see GPT-5.6 routing below). At `xhigh` it is a credible *sole* impl+fix lane for pre-reviewed plans — held up across an entire multi-wave security build — and a shockingly strong cheap reviewer. Known failure profile: skips repo-tooling edges (run the repo's lint in its brief), writes presence-only tests that pass semantic bugs, goes stale on patch context in retries, and **its fix rounds introduce regressions at a meaningful rate — always follow a nontrivial Luna fix round with a fresh adversarial review round.** For credential-adjacent work, mandate name-only output (one observed incident of raw values in a run transcript).
- **Devin (swe-1.7) — backup surgeon.** Execution still flawless when it runs, but Terra matches it on the subscription; Devin is metered, has one commit-despite-do-not-commit miss on record, and does not support `safe` mode. Use `work` for edits or `call` for one-hop tasks. Reach for it as a third family when Codex authored AND reviewed, or when Codex quota walls.
- **Grok Build CLI (same Grok 4.5)** — one decorrelation slot with Cursor; has lost file access mid-run twice (fabrication risk). Cursor's quota fallback, not a co-equal. Only accepts `low|medium|high` effort for grok-4.5.
- **Claude (Opus/Fable, native) — the JUDGE.** Triage, severity ranking, taste, "should this exist," final visual/quality round. Not a delegation sink. (From non-Claude coordinators, `delegate claude safe` at **low** effort is a fast narrow re-review lane — ~80s vs ~8min at high; reserve `high` for plan/design review and prohibit test execution when only source inspection is needed.)
- **GLM and other droid lanes: BENCHED** (operator decision) — use only when a roster lane fails.

**Standing review pair: Sol xhigh + Cursor in parallel on one brief.** Repeatedly produced near-disjoint blocker sets (~40% overlap) with convergence on the real killers — convergence = high-confidence triage, uniques = the decorrelation paying. Use for every plan gate and pre-ship review; the two-lane spend has paid for itself every time it's been measured.

**Coordinator's non-delegable duties (field-validated):** (1) run a **live smoke** against every external-protocol or security surface — mocked tests and read-only reviewers are structurally blind to protocol-vs-mock divergence (the biggest bug of one build was caught only this way); (2) re-rank Grok severities; (3) own build/test gates for Terra-medium and all safe-mode lanes (no node_modules in snapshots); (4) verify Sol's load-bearing citations before folding findings.

## Codex GPT-5.6 routing (field-validated through 2026-07-13)

The private Delegate config defines three aliases. Keep effort orthogonal; do
not create an alias for every model/effort combination.

| Alias | Route here | Efforts | Start at |
| --- | --- | --- | --- |
| `sol` | Frontier authoring, trust-critical builds, deepest review | `low|medium|high|xhigh|max|ultra` | `high` authoring; `xhigh` review/judge gates |
| `terra` | Fix lanes, decision-dense multi-file modules, quick reviews | `low|medium|high|xhigh|max|ultra` | `high` (at `medium` its windows die mid-compile — orchestrator owns gates) |
| `luna` | Everything on the ladder below | `low|medium|high|xhigh|max` | see ladder |

**Luna effort ladder (each rung field-validated):**

- `low` — structural recon/mapping fan-outs. Dense, line-cited, ~1–3 min; no reason to spend medium on mapping.
- `medium --fast` — parallel content/sensitivity audits, bounded follow-the-idiom impl. Excellent quote fidelity, zero fabrication observed.
- `high` — bounded implementation waves (cross-cutting Rust/CLI work, plumbing), small proven fixes, tiny propagation probes. Also multimodal: ~99.9% accurate visual transcription of clean 200dpi scans (residual error class: proper names in occluded/stamped regions — spot-check exactly those).
- `xhigh` — sole impl+fix lane for **pre-reviewed** plans (validated across a full multi-wave security build), and a credible cheap adversarial reviewer (once matched/beat native Opus on depth). Don't generalize to open-ended design work.

- Primary author: `delegate codex work --model sol --reasoning-effort high "..."`.
- Fix lane: `delegate codex work --model terra --reasoning-effort high "..."`.
- Fast exploration: `delegate codex work --model luna --reasoning-effort low "..."` (`safe` only for pure code/draft review).
- Luna does **not** support `ultra`. Codex describes Sol/Terra `ultra` as a
  nested multi-agent mode, not merely deeper single-agent reasoning. Use it
  only for decomposable work and only after confirming the active Codex profile
  permits nested agents.
- `--fast` / `--no-fast` are independent per-run service-tier controls (shipped
  in Delegate v0.13.1, codex-only): Fast is ~1.5x speed but uses more plan
  capacity; `--no-fast` is the explicit Standard override when Codex config has
  Fast on globally; omission inherits Codex config. `--fast` self-enables the
  codex fast_mode feature flag, so it works regardless of ambient config. Silent
  caveat: the tier is dropped under API-key auth, and unsupported model/tier
  combos degrade silently to Standard — never assume Fast happened from output.
- All three GPT-5.6 lanes inherit Codex scope-discipline + honest-failure-reporting; none has shown cursor-style scope creep. At `xhigh`, prompt hygiene matters MORE, not less — Sol reproduces the coordinator's brief with high fidelity *including its flaws*. Sol also generalizes beyond code: counsel-/principal-facing synthesis, self-orchestrating its own research children (Mills memo, 07-09).
- Multimodal transcription recipe (Luna high `--fast`): for image-only/scanned PDFs skip OCR — render pages (`pdftoppm -png -r 200`) and have Luna transcribe visually with explicit fidelity rules (verbatim, `[illegible]` over guessing, self-verify by word count). Luna is honest under impossibility but won't lateral-think around a dead toolchain — coordinator owns strategy.
- Evidence base: the private per-workspace journals under `~/.delegate/model-journals/` plus legacy private journals from earlier runs. Mine those before re-litigating a routing call; do not recreate deleted public repo journals.

**Canonical pipeline: Sol high writes → Sol xhigh + Cursor attack in parallel → Terra high repairs → fresh review round → Claude decides.** Validated across five workspaces 07-09→07-13: every review round found real defects the author's gate missed, and the post-fix review round is load-bearing — fix lanes (Luna especially) introduced regressions in consecutive rounds of one security build. Stop condition: findings dry up at your severity floor, or human stop — Codex xhigh review lanes asymptote at ~1 real finding/round without hallucinating, so "dry ×2" never terminates on its own.

## Briefing style & sampling defaults (measured 2026-07-18, burn-weekend experiments)

Gate-graded evidence from your own private workflows directory (writeup) / your own private workflows directory (raw). Hill-climb signals with overlapping CIs, not confirmatory effects — but they set the defaults until better data arrives.

- **Brief style (2×2×2, 144 graded runs, codex lanes): frame the lane with a persona (+5.6pp), encode guidance as rules rather than worked examples (+2.8pp), and don't pad — exhaustive vs terse was a dead 0.0pp.** "Terse" here means instructional style on a bounded task; it does NOT override the task-clustering rule below about rich *context* (findings reports, design decisions). Style ≠ context volume.
- **Best-of-N sampling (5 tasks × 20 attempts, oracle pass@N): no plateau through N=20.** pass@1 0.68 → N=5 0.91 → N=10 0.98. Default for hard bounded tasks where the gate can pick the winner: **N=5**; N=10 when a miss is expensive. Caveat: oracle numbers — with no objective gate to select the winner, extra samples are worth much less (the realistic-selector arm was never run).

## Task clustering (design the split before you spawn)

Fewer, richer workers beat wide fan-outs of siloed tasks — validated repeatedly by trial and error. Modern lanes carry enormous context windows (GLM/DeepSeek 1M, Codex ≳256k), so the scarce resource is *coherence across related tasks*, not tokens. Don't ask "how many workers can I fan out?" — ask **"how do I cluster related tasks so each worker's context window is optimized for its whole cluster?"**

- **Cluster tasks that share files, schema, or design trade-offs into ONE worker.** A single worker holding the whole entangled cluster reasons about the interactions between fixes and makes globally consistent choices. N siloed workers each make locally-fine decisions that collide at the seams — and nobody in the system ever saw the whole problem.
- **Fan out only across genuinely independent units**: disjoint file ownership, no shared design decisions, results that don't need to agree with each other.
- **Give the clustered worker rich context, liberally.** With a 1M-token window there is no prize for a terse brief — include the full findings report, the design decisions already made, and how the tasks relate. Context that lets it reason about trade-offs *between* its tasks is the whole point of clustering.

This applies equally to native Claude subagents — it's a principle of orchestration, not of this CLI.

## ⚡ Speed-first

When speed matters more than a small quality margin: start with **`delegate codex work --model luna --reasoning-effort medium --fast`**; alternatives are **`delegate cursor work`**, **`delegate droid kimi work`**, **`delegate droid glm work`**, or **`delegate droid gemini work`**. Luna is the fast/affordable GPT-5.6 lane; Cursor remains the proven fast broad-implementation lane.

## OpenCode: the any-model lane (added v0.13.0, 2026-07-09 — no field ranking yet)

`delegate opencode {safe|work|call}` drives **any provider/model in the models.dev catalog** (450+, incl. your custom/local providers) through one harness — `delegate --json models opencode --live` lists them. Use it when you need a model *family* the roster doesn't carry (classic case: a genuinely third family for a fix lane when Codex authored and a Grok lane reviewed), or a specific model with no dedicated harness. `--model provider/model` (or config alias, incl. `{"model","variant"}` objects pinning a variant), `--reasoning-effort` maps to OpenCode `--variant`, `--agent NAME` selects an OpenCode agent. Safe mode is config-lockdown-enforced (deny-all-but-read + `--pure`, beats hostile repo config) — trustworthy for untrusted-repo review. Caveats: upstream buffers stdout until completion, so **no live progress events on tracked runs** (not a stall); a typo'd `--reasoning-effort` is silently ignored by OpenCode; sessions accumulate in global OpenCode state. Auth rides your existing OpenCode login (`~/.local/share/opencode`). Routing status: unranked — subscription lanes (Codex/Cursor) stay primary; OpenCode is the reach-any-model escape hatch until field evidence says more.

**Muse Spark 1.1:** use `delegate opencode {safe|work|call} --model muse ...` to select `meta/muse-spark-1.1`. It is a provisional Grok 4.5 / GPT-5.5-level candidate, not an established equivalence or a common-roster recommendation. Use it deliberately for comparative tests and follow the mandatory journal protocol above.

## Cursor/Grok harness order for Grok 4.5

Both harnesses run the same model: **`delegate cursor {safe|work}`** is Grok 4.5 on Cursor's fast serving tier (`grok-4.5-fast-xhigh`); **`delegate grok {safe|work}`** is `grok-4.5` on the Grok subscription at normal speed with default reasoning effort high. **Default to `delegate cursor`** — your Cursor subscription has higher limits — and fall back to `delegate grok` when the cursor harness fails or is quota-limited.

## Lanes

Judgment only — exact model IDs, flags, and profiles live in `delegate --json models` / `describe`. Don't trust this file for specifics; the config moves.

**Primary**

- **`delegate codex {safe|work} --model {sol|terra|luna} --reasoning-effort LEVEL`** — Sol for frontier authoring and xhigh review gates, Terra for fix lanes and decision-dense everyday work, Luna per the effort ladder above. The default model is Sol; specify effort so ambient Codex config does not choose it implicitly.
- **`delegate cursor {safe|work}`** — fastest, cheapest broad-implementation lane (`grok-4.5-fast-xhigh`); best for bulk/mechanical/repo-wide edits and backend/SQL cleanups. Can add defensive noise or touch adjacent files — review diffs. `safe` = isolated read-only review.
- **`delegate grok {safe|work}`** — Grok Build CLI running `grok-4.5` on the Grok subscription; normal speed, default reasoning effort high. Use as the non-speed-critical alternate to `delegate cursor`.
- **`delegate kimi {safe|work}`** — native Kimi Code CLI on `kimi-code/k3` (subscription; separate model family from Droid Kimi Fast). **Preferred reviewer + prose red-teamer** (promoted 2026-07-17 after audition): elite adversarial code review (reproduced an argv secret leak live, measured perf claims instead of asserting them) and designDecision-aware prose red-teaming on par with the best lanes. A genuine third decorrelation family alongside Codex and Grok. Caveats: subscription usage cap is real — a long review died mid-run on `usage_limit` (~28 min in); on cap, bench and reroute rather than retry. argv-transport: prompts ≳100KB fail. `safe` has no runtime sandbox — the isolated copy is the only boundary.

**Backup roster** (reach for with a reason)

- **`delegate droid glm`** — Fireworks GLM 5.2 Fast router, 1M context. High-quality impl/review-fix; supports `--reasoning-effort off|high` with default `high`; historically doc-verbose.
- **`delegate droid kimi`** — Fireworks Kimi K2.7 Code Fast router, 256k context. Good for fast model-diverse fan-outs; supports `--reasoning-effort off|high` with default `high`.
- **`delegate droid "deepseek v4 pro"` / `"deepseek v4 flash"`** — cost-frontier, 1M context. Pro for hard reasoning, Flash for speed.
- **`delegate droid gemini`** — Gemini 3.5 Flash; fast, multimodal. Review for shallow/overconfident fixes.
- **`delegate droid minimax`** — MiniMax M3; low-cost, 512k context, native multimodal.

Also live but **not** in the recommended roster: `delegate droid grok` (xAI 4.3) and `delegate droid qwen` (3.7 Plus). Callable; reach for only on a specific need.

## Mode & safety

- **`<lane> work`** edits the **real** workspace. Always review diffs (Git) or changed files (non-Git) after.
- **`<lane> safe`** is read-only review. **All safe lanes — Cursor, Codex, Droid, Kimi, Claude, Grok — run in an isolated temporary copy** (detached worktree or dir copy); the source tree is never touched. JSON reports `cwd` (source), `executionCwd` (copy), `isolatedWorkspace: true`.
- **Isolation is the real boundary, not the prompt.** Codex `safe` adds `--sandbox read-only`; native Kimi CLI `safe` has no runtime sandbox (prompt mode auto-approves tools), so the isolated copy is the *only* protection — don't treat it like Codex's sandbox. Droid Kimi follows the Droid lane.
- **`--timeout SEC` bounds the total child runtime** for calls and tracked `safe`/`work` runs, including authentication fallback and eligible empty-result retries. Deadline failures use `call_timeout`; pass-through runs reject the option.
- Workspace-backed children receive authoritative `DELEGATE_SOURCE_ROOT`; isolated children also receive `DELEGATE_EXECUTION_ROOT`. Call mode has no source checkout, so its throwaway cwd is the source root and the Registry/config workspace stays hidden.
- **`--isolation worktree`** on a `work` run keeps edits off the source checkout: persistent Git worktree, returns `branch` + `executionCwd`; the child is told to stay in the worktree. Since v0.15.0, tracked edits and untracked non-ignored files auto-sync with a loud `dirty_source_auto_included` warning. Dirty submodules and sync failures still fail preflight. `--include-dirty` remains an explicit no-op on clean sources. In-place `--isolation none` is incompatible with `--forbid-commit` — forbid commits in the prompt instead.
- **`<lane> call`** is a stateless one-hop model call — no repo, worktree, registry, or review framing; runs in a throwaway cwd and just returns the model's text. Work-level (write-capable) by **default** — the "just call a model, get the answer" path. Add `--read-only` to drop to each engine's read-only capability plus a neutralizing preamble (nothing to inspect or mutate): the LLM-as-judge/grader contract. Call mode is **not** a security sandbox — on Cursor/Droid/Kimi the preamble is the only restriction. JSON adds `textChars`/`textTruncated`; pairs with Codex `--output-schema` for structured verdicts.

## Worktree lifecycle (orchestrators)

A `--isolation worktree` work run returns `branch` + `executionCwd`; the worktree and branch persist after the child exits. Add `--forbid-commit` to make the child leave only uncommitted edits — the run fails if it creates commits — so you review the diff before committing yourself. Note: `--forbid-commit` REQUIRES `--isolation worktree` (a plain `<lane> work` run rejects it with `invalid_option_combination`). To get review-before-commit on the *real* tree instead of a worktree, just run plain `<lane> work` — the lane already leaves edits uncommitted — and review the diff before you commit.

- Inspect: `delegate worktree show <alias>` (porcelain status, ahead/behind, plus a work summary — dirty state, changed-file counts, diffstat, child commits).
- Remove: `delegate worktree remove <alias>` — refuses dirty/unmerged; pass `--discard-uncommitted` (data-loss) or `--force-branch` to override.
- Bulk: `delegate worktree prune --merged`.
- Dev servers in parallel worktrees: `portless` (installed globally) gives each worktree a stable branch-prefixed URL (`https://<branch>.<app>.localhost`) instead of colliding ports — set the repo's dev script to `portless run <dev command>` when lanes need live servers side by side.
- Uncommitted tracked edits and untracked non-ignored files now auto-sync into worktree runs (v0.15.0+); **`--include-dirty`** remains an explicit request and is a no-op on a clean source. Sync failures tear the worktree down before any child launches, and dirty submodules fail preflight.
- Gitignored files (`.env.local`, secrets) do NOT follow into worktrees — a worktree dev server boots but API routes 401 until you copy them from the source tree (e.g. `cp .env.local <wt>/ && cp web/.env.local <wt>/web/`). Do this before any browser QA in a worktree.
- **Never** `rm`, `git worktree remove`, or `git branch -D` a Delegate-managed worktree — it orphans the registry and breaks inspection.

## Managing runs (wait / cancel / inspect)

Background launches are tracked per-workspace. Don't hand-roll polling loops — use `wait` (v0.10.0+).

- **Aliases are always numbered** (`codex-1`, `cursor-2`). A **bare harness name resolves to the latest matching run** — `delegate run-output codex` reads the newest codex run, `delegate wait codex:glm` the newest droid-glm run. Envelopes echo `requestedHandle`/`resolvedHandle`/`resolutionKind` so you can confirm which run you hit. `run-output` also takes `--latest HARNESS`.
- **`delegate wait <handle>… [--group NAME] [--timeout SEC] [--completion-report]`** — blocks until terminal, using *effective* status (a dead child is a failure, not a hang). Exit `0` all succeeded, `1` any failed/cancelled, `124` timeout. This replaces sleep/poll loops.
- **`delegate cancel <handle>`** — SIGTERM → 5s grace → SIGKILL on the run's process group; refuses terminal/stale runs and pid-reuse. A cancelled run reports `cancelled` (never a false `succeeded`) and gets a synthesized completion report.
- **`delegate runs [--recent|--running|--active] [--group NAME]`**, `snapshot <handle>`, `run-output <handle>` — inspect. `run-output` defaults to the best parent-facing output (completion report → recovered final message → bounded stdout/stderr); `run-output --tail N` with no selector implies stdout, never stderr. Bare harness handles report the resolved run/alias, workspace, and age, with a stale warning after 24 hours.
- **Kimi tool activity is visible but privacy-bounded:** tracked native Kimi runs normalize correlated `tool.started`/`tool.completed` events, omit tool arguments and results from event metadata, and leave `status` unset because Kimi emits no result-status signal.
- **Honest envelopes:** tracked runs carry `resultQuality` (`ok` / `housekeeping_noop` / `empty` / `suspect_short` / `no_assistant_text`) — a Droid "Plan is up-to-date." no-op now surfaces as `housekeeping_noop`, not a clean success. Empty successful safe and read-only call results retry once only when Delegate may safely extend the prompt; write-capable calls, pure prompts, and slash pass-through prompts are never replayed. Failed/cancelled runs always get a completion report (`completionReportSource`: `child` / `delegate_synthesized` / `stdout_recovery`), so `--completion-report` never dead-ends.
- **`--group NAME`** tags a batch of launches; then `wait`/`runs`/`worktree remove`/`prune` can select the whole group at once. On a LAUNCH it is a GLOBAL option and must come before the subcommand (`delegate --group foo codex work …`); placing it after errors with `misplaced_global_option` (hit live 2026-07-06).

## Rules

- Bounded prompts: task, owned files, verification/review steps, report format. Long prompts → `--prompt-file` or `delegate --json run --input-json`.
- Run from the target workspace, or pass `--cwd` before the subcommand. In Git, Delegate resolves to the repo root; outside Git, the directory itself.
- Always review after `work` — models occasionally add defensive code or touch files outside the owned set.
- No production pushes/deploys unless the user explicitly asks.
- Cursor auth/model/MCP errors → ask the user to re-auth Cursor Agent or run `agent mcp login <name>`.


## Auth profiles

- `delegate profiles` (or `--json profiles`) — inspect the detected active auth/env profile and injected env keys. Read-only; `codex-auth` was removed in v0.7.0 — do not use it.
- Select per-launch: `delegate --auth-profile work codex …` (global flag, before the subcommand). Persistent config lives in the `profiles` block plus `codex.fallbackProfile`; env detection via `DELEGATE_PROFILE`/`AI_PROFILE`.
- Setup: `delegate config sync-profiles` (run with `env -u AI_PROFILE` if your shell pins a profile) materializes any missing `~/.delegate/config.<profile>.json` overlays from the base config without clobbering ones you've edited; `delegate config init` writes them too. If `AI_PROFILE=work|personal` ever errors that its config is missing, this is the fix.

## Discovery

- `delegate --json models` — lanes, models, reasoning effort, profiles (**source of truth** for facts).
- `delegate --json describe` — full config: mode mappings, safe notes, policy.
- `delegate agent-help` — verbose usage.

## Examples

- Bulk mechanical refactor across many files → `delegate cursor work "<scope + owned files>"` or `delegate grok work "<scope + owned files>"` (Cursor if speed matters).
- Fix round from an adjudicated findings list → `delegate codex work --model terra --reasoning-effort high --prompt-file <findings>` — then a fresh adversarial review round.
- Plan / pre-ship gate → `delegate codex safe --model sol --reasoning-effort xhigh --prompt-file <brief>` + `delegate cursor safe --prompt-file <brief>` in parallel (same brief, one group).
- Need it now, quality flexible → `delegate codex work --model luna --reasoning-effort medium --fast …` when supported; otherwise `delegate cursor work …` or `delegate droid kimi work …`.
- Decorrelated second opinion on an architecture call → `delegate codex safe "<embed the diff/plan>"` (+ `delegate droid glm safe` for a third voice).
- Read-only analysis of a huge file/log → `delegate droid "deepseek v4 flash" safe …`.
- Muse Spark 1.1 comparative test → `delegate opencode safe --model muse "<bounded review task>"`, then append the required private journal entry.
- Just call a model with no repo context → `delegate <lane> call "<prompt>"` (work-level by default).
- LLM-as-judge / grader → `delegate codex call --read-only --output-schema verdict.json "<rubric + item>"` (read-only + structured verdict).

## Provenance / known issues

- Primaries set by a 2026-06-10 three-lane head-to-head (Codex: typing/design + failure reporting; Cursor: speed-to-quality). Kimi added as a native lane 2026-06-12. BYOK lanes moved to Fireworks serverless 2026-06-19 (except grok = xAI, gemini = Google); GLM/Kimi Droid aliases moved to Fireworks fast routers 2026-06-29. Manage lanes with `delegate-lane`.
- **Kimi K3 promoted to preferred roster 2026-07-17** (evidence from the codex-burn fleet build + a large policy project red-team): W1 fleet review reproduced an argv secret leak live and measured perf claims; a large policy project statute red-team memo was designDecision-aware and matched the best prose lanes; W2 review died on subscription `usage_limit` mid-run, before writing findings — pair K3 with a second reviewer on must-land rounds, and treat a dead K3 review as *no* review, not a clean one.
- `safe` review runs in an isolated copy synced with your working tree (the safe-workspace snapshot) — uncommitted **tracked** edits and untracked, non-ignored files are mirrored in, so you can review local changes without committing first or embedding a diff. Only **gitignored** paths are excluded; if a review needs one, commit it or paste it into the prompt.
- Codex can 400 at `turn.started` (`spawn_agent … encrypted parameters`) — upstream/intermittent, mitigated by `profile: delegate`. Failed `codex safe` runs leave no trace; rerun with output visible instead of hunting logs.
- **Codex `harness_error` in <10s escalation ladder** (state-database thread-lookup failures, seen 07-10 across 4 consecutive runs): retry once under a fresh handle; if it repeats, fall back to direct `codex exec --ephemeral --ignore-user-config -m <model>` (bypasses persisted-session lookup); if quota then refuses, the coordinator does the work — don't wait hours on a reset for confirmed security/data-loss fixes. Also: a 4s failure with empty stderr is transient — one immediate retry is warranted. The delegate-synthesized report may say only `harness_error`; the real reason (e.g. usage limit with reset time) is in `run-output --stdout`.
- **Codex quota is finite when stacking Sol xhigh lanes**: two separate days hit the subscription wall mid-evening after heavy authoring+review stacking. Budget the day's gate runs; Cursor is the same-day fallback for review/VQA lanes.
- **Safe-mode snapshot gotchas**: no `node_modules` (reviewers can't run npm/cargo gates — coordinator owns them; lanes report this honestly); gitignored paths (`.delegate/`, `docs/plans/`) don't follow into the snapshot — inline shared brief content into lane prompts, never reference a gitignored brief file; absolute paths in prompts point at the real tree, not the re-rooted copy — strong lanes recover, weak ones review nothing.
- **Cursor safe-mode shell probes can deadlock** (multi-command probe hung >6 min, killed the run): for review lanes, forbid shell execution in the prompt — direct read/grep tools only. The no-shell retry finished in 2 min with better output.
- `grok-4.5` on the Grok Build CLI accepts only `low|medium|high` effort (xhigh/max rejected pre-inference; delegate now preflights this). `grok-composer-2.5-fast` still accepts xhigh/max.
- **Droid lanes (`droid glm`/`droid kimi`) no-op on *review* tasks** — they often return a bare "Plan is up-to-date" instead of findings unless the prompt bluntly says "output findings only, do not enter plan mode." Fine for *implementation* (clean GLM impls observed); for a decorrelated review prefer Codex, Cursor, or native Claude subagents. (Seen 2026-06-29: a `droid kimi safe` review returned only "Plan is up-to-date" despite a structured findings-list prompt.)
- **AI_PROFILE=work hard-block fixed (v0.11.0, issue #9, 2026-07-05).** A shell carrying `AI_PROFILE=work|personal` with no matching `~/.delegate/config.<profile>.json` used to hard-block *every* command, including the read-only diagnostics you'd reach for. Now a recognized-but-configless profile blocks only launch/mutation commands (with remediation text); read-only diagnostics (`profiles`, `runs`, `run-output`, `snapshot`, cached `capabilities`, `worktree show`/`list`, `describe`, `models`) pass with a warning; and `delegate config sync-profiles` materializes the missing overlays. If you still hit the block on a launch, run `delegate config sync-profiles` (or `env -u AI_PROFILE delegate …` as a one-off bypass on the base account).
- **Grok Composer can lose file access mid-run and fabricate from the prompt** (seen 2026-07-02: a `grok safe` code review lost its tools partway, said "I have no actual code, so I need to reason based on the provided info," and began drafting findings from the prompt's own hunt-area hints before the run cancelled). Its completion report captured only the opening line. Detection: `run-output --stdout` shows raw `{"type":"thought"}` deltas instead of findings, and the report is suspiciously short. Treat such a run's output as worthless, don't retry the same lane for that task — reroute to a different family (Cursor now runs the same Grok 4.5 model as the grok lane; fine as reviewer only if the author was neither).
- **Multiple `work` waves in one tree forfeit per-feature commits** (seen 2026-07-06, land repo): waves with disjoint *file ownership* still produce line-interleaved diffs inside shared files (cli.py, server.py, index.html) because later waves edit the same functions earlier waves touched. Two logically separate features had to land as one commit — hunk-level splitting was too risky against a pytest commit gate. If features should land as separate commits, commit (with the user's authorization) between waves, or run later waves with `--isolation worktree --include-dirty` and merge back per-feature.
