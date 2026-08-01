<!--
Skill: fusion
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/fusion/SKILL.md
-->

---
name: fusion
description: Convene a cross-vendor council of frontier models through the `delegate` CLI to pressure-test a high-stakes, open-ended artifact via an adversarial propose → critique → defend → synthesize → judge loop, then return a verdict plus a map of where the models disagreed. The gain comes from decorrelated errors across different model *families* (Codex/OpenAI, Gemini/Google, Grok/xAI, Kimi/Moonshot, DeepSeek, Qwen, GLM) — so it beats asking one model, but only for work worth real time and tokens. Use when the user says /fusion, "convene the council", "run this through fusion", "fuse the models", "throw maximum intelligence at this", "get a multi-model second opinion", or "red-team this with other models". ALSO proactively offer fusion whenever the user is about to commit to an important open-ended artifact — a strategy memo, investment thesis, policy or legal argument, architecture decision, research claim, contract, or a plan they are about to bet on — by asking "want me to run this through fusion first?" Do NOT fire for routine or closed-ended tasks (lookups, simple edits, code that just needs to run) where one strong model plus self-consistency is cheaper and just as good. Requires the `delegate` CLI.
compatibility: Requires the `delegate` CLI authenticated and on PATH (OpenAI Codex, Kimi, Claude, and Droid BYOK lanes). Council passes run in `work` mode inside a disposable per-model scratch git repo — the real workspace is never touched. `delegate ... safe` is deliberately NOT used: it is ephemeral and does not return the agent's text (see the cookbook).
---

# Fusion

Fusion throws several **decorrelated frontier models** at one important problem and makes them
argue under structured rules, so the answer is better than any single model would give. The
whole reason it works is that different pretrained models are wrong in *different places* — their
errors are decorrelated *across model families* — and an adversarial loop surfaces where they
split. That single fact drives every rule below. The design rationale (with citations to the
research it's built on) lives in `references/design-rationale.md`; read it if you're tempted to
change a rule, because most of the rules exist to prevent a specific, documented failure mode.

This is a **break-glass tool, not a default.** A multi-model loop usually *loses* to one good
model on ordinary tasks, at many times the cost. Fusion earns its keep only on high-stakes,
open-ended work where being right is worth minutes and real tokens.

## Step 0 — Triage: should fusion even fire?

Before convening anything, decide honestly:

- **Is it high-stakes?** A decision/argument/plan the user is about to *bet on* — money, reputation,
  legal exposure, an architecture you'll live with, a claim that needs to be true. If it's
  reversible and cheap to get wrong, skip fusion.
- **Is it open-ended?** Reasoning, judgment, strategy, synthesis, design — the jagged-frontier
  cases where models genuinely differ. Closed-ended tasks (a lookup, a transform, code that just
  needs to compile) don't benefit; one strong model + self-consistency is cheaper and as good.

If it fails either test, **say so and recommend a single-model pass instead.** Refusing-with-a-
reason is a feature: it keeps the cross-vendor bench for the work that deserves it.

If it passes, **state the cost up front** before running: "This convenes N cross-vendor agent
runs through delegate — roughly a few minutes and real tokens. Proceed?" Then compose the council.

## Composing the council — diversity over horsepower

The members must come from **different vendors/families**. Do not assemble the N strongest Claude
variants or three OpenAI models — within-family errors are correlated and you'll get the
0.5-win-rate null result. Cross-family decorrelation is the entire source of the gain.

**Role priors from the 2026-07-08 field ranking** (delegate-agent skill, "Field-ranked roster"):
when assigning council roles, Grok 4.5 (via the `cursor` lane) is the fleet's strongest *critic* —
it probes artifacts and computes evidence rather than opining — so prefer it in critique passes;
Codex is the strongest *proposer* for structured/technical artifacts; Devin (`devin`, swe-1.7) is an
executor, not a debater — leave it off councils. These are priors, not law: the family-diversity
rules below still dominate role preference.

1. Check what's actually available and authenticated: `delegate --json models`. Don't hard-code a
   roster that might be unauthenticated.
2. Pick from **distinct families**. Default council = **3–4 cross-family proposers** (verify
   availability first): `codex` (OpenAI), `droid gemini` (Google), and **Opus on the `claude` lane**
   (the strongest proposer — see step 4), plus a **different-family judge held in reserve**, e.g.
   `droid grok` (xAI). Strong proposer alternates for more spread: `kimi` (Moonshot),
   `droid "deepseek v4 pro"`, `droid qwen` (Alibaba), `droid glm` (Zhipu). The judge's family must
   not appear among the proposers (step 4).
3. **`--deep` → 5 models / 5 vendors** for the highest-stakes calls (e.g. add DeepSeek + Kimi or
   Qwen). More diversity, ~2× the cost.
4. **The judge must be a different family from every proposer — and by default that judge is a clean
   external model, not the host.** This is the load-bearing rule, empirically grounded across two
   live runs (2026-06-18). On a *subjective* prose brief the two strongest models (Opus, Codex) each
   ranked their own anonymized draft #1 as blind critics; anonymization alone did not neutralize it.
   (On an *objective* code plan self-preference nearly vanished — Codex ranked its own 3rd, Gemini
   its own last — so weight this rule most on taste-laden genres; it's cheaper insurance on verifiable
   ones.) **Default for `council` / high-stakes:** the host (Claude/Opus) proposes and synthesizes,
   but a **different-family `delegate` model renders the final verdict** — e.g. with a
   Codex/Kimi/Gemini/Opus bench, judge with `droid grok` (xAI), a family no candidate uses. This
   keeps Opus on the proposer bench (it is the strongest proposer) while removing self-preference
   from the score. **Cheaper fallback** (lower stakes, or no spare family available): the host judges
   and therefore does *not* propose. Either way, **never let any model render the final score on a
   pool containing its own output, even anonymized.**

A weaker-but-diverse model is welcome as a **proposer** (it can raise the ceiling), but never as
the synthesizer or judge.

**Fable option (metered).** For the highest-stakes runs, a native Fable subagent can join the
bench as the premium proposer or write the spine — but only under the Fable routing protocol in
the shared CLAUDE.md (approved, spawned `model: fable` + `[[FABLE-OK]]` + source cited). Fable is
Claude-family: it fills the same decorrelation slot as Opus (bench one or the other, not both),
and every judge≠family rule above still excludes any Claude-family judge. The default bench stays
flat-rate; a fusion run is already expensive without a metered lane.

5. **Derive the genre's signature moves from the rubric and bake them into the proposer prompt.**
   This is the single highest-leverage knob (validated 2026-06-18): proposers share *correlated
   blind spots* — they independently miss the same craft moves — and that, not the synthesis
   stage, is what caps council quality. Before launching proposers, look at what separates a 10
   from a 7 in this genre (e.g. disarm the opposing read, ground in a concrete household example,
   concede-then-differentiate) and instruct every proposer to do those things *as general craft, in
   their own voice* — never by quoting a reference answer (that overfits to one example). In the
   live test, adding three such moves lifted every model and pushed the council's best output past
   a known-excellent human gold. Fixing the blind spot upstream beats trying to graft it back at
   synthesis, because if all proposers miss it, it isn't in the pool to graft.

## The pipeline

Run every council pass as **`delegate <model> work` inside a disposable per-model scratch git
repo** — copy just the inputs into the scratch dir, `git init` it, point `delegate --cwd` there,
and have the agent write its output to a file (e.g. `OUTPUT.md`) you read directly. The real
workspace is never touched (the scratch dir is a throwaway copy), so this is effectively
read-only — but it uses `work` mode because **`delegate ... safe` is ephemeral and does not
return the agent's text** (it prints only a run summary and leaves no fetchable handle). Exact
command recipes, the scratch-repo setup, the launch-then-read pattern, long-prompt handling, and
the parallel-droid gotcha are in `references/delegate-cookbook.md`.

### 1 — Propose (isolated)

Send the problem to each council model **independently**. They must not see each other's work yet.
Isolation is the point: it keeps their errors decorrelated, which is what the later steps mine.
Launch the proposers in parallel, collect all responses before moving on.

Prompt shape per proposer: *the artifact + the question + "Give your best independent answer with
your reasoning. You are not seeing other models' answers."* Return a complete position, not a hedge.
Fold in the genre's signature moves (Composing step 5) so the whole pool clears the bar, not just
its strongest member.

### 2 — Critique (adversarial, anonymized)

Now expose the proposals to critics — but **anonymize them** ("Proposal A / B / C", strip model
names) so no model favors its own or another's house style, and assign each proposal to a critic
**from a different family than its author** (round-robin). The critic's job is explicitly to
**refute**: find the errors, the weakest link, the unstated assumption, the failure case. Reward
disagreement; do not let a critic lapse into "looks good." Reflexive agreement is the documented
way these loops rot.

Prompt shape per critic: *"Here is Proposal X (author hidden). Your job is to refute it — surface
every error, gap, risky assumption, and failure mode. Steelman your objection. Do not be
agreeable."*

### 3 — Defend (bounded)

Give each proposal's author its critiques (de-anonymized back to it) and let it **answer — steelman
or concede, explicitly**, point by point. This is the "defender" half of the loop, and its real job
is **triage**: separating objections that survive scrutiny (true defects the synthesizer must fix)
from ones that don't (misreads the synthesizer must *not* "fix"). That triage is the thing a
critique-only pass cannot do — only the original author has the context to say "that objection
misreads my code." Validated live 2026-06-18: a spine author rebutted two critiques as misreads (one
would have caused a regression if "fixed"), while an independent judge separately penalized exactly
the defects the author *conceded* — the critique→defend→fix→judge loop closed on itself.

**Defend the spine, not the whole pool.** Defend's value concentrates on the proposal(s) the
synthesis will be built from. In testing the spine author's defense reshaped the result, while the
weaker members merely capitulated (one even proposed a fix *worse* than the synthesis already had). So
defend the **top-1 or top-2** briefs from the critique ranking and skip the rest — cheaper and
strictly better than defending everyone. Gains are bigger on **subjective** genres (contestable taste
calls the author can legitimately rebut) than on **objective** ones — quantified live 2026-06-18: on a
persuasive prose brief the strong authors **defended ~⅓ of objections** (36–38%), versus **0%** on an
objective code plan where every critique was a true positive the author simply conceded. The defend
rate also scales with **artifact quality**: the *weakest* brief's author conceded 16 of 17 objections
(6% defend) — a weak candidate rightly folds, so the round earns its keep on the **strong** candidate.
Both facts point the same way as the judge≠family genre-dependence, and both reinforce defending only
the spine.

Keep it bounded. **Default is one defense round.** Run a *second* critique→defend round only when a
genuine crux is still live (the models still materially disagree on something that changes the
answer), and **cap it there** — the research is clear that longer debate degrades and drifts toward
false consensus. Convergence is not the goal; isolating the real crux is — and a crux that turns on a
fact the models can't settle should be **handed to the human gate**, not re-litigated. (`--no-defend`
skips this step for cheaper runs; `--deep` permits the one extra round on live cruxes.)

### 4 — Synthesize (select-and-graft, not blind-average) — host

The host Claude now builds the answer by **selecting a spine and grafting**: pick the single
strongest proposal as the backbone, then graft in specific superior elements from the others,
noting provenance ("structure from B, the edge-case handling from C"). **Do not blandly average
all proposals into mush** — blind synthesis has been shown to underperform even a single model.
Selection is where the value is; the graft only adds what's demonstrably better.

**Use the defend triage asymmetrically — and don't regress below the spine.** A **DEFEND is a
high-confidence keep**: live-tested, a defend-informed synthesis that *kept* the author's defended
rhetoric beat a critique-only one that cut it (87.6 vs 85.6, judge crediting exactly the kept slogan
and concrete specifics). But a **CONCEDE is only a candidate fix, not a guaranteed improvement** —
it means the author agrees the critique is a true positive, yet the reader-facing judge is the final
arbiter. In the same test the **raw spine outscored both syntheses** (90.4) because a *conceded* edit
(dropping a "performed-candor" framing the author agreed was a slop tell) removed something the judge
actually rewarded. So apply concedes **with judgment, not mechanically**, keep the winner's strengths,
and when the spine is already excellent treat the synthesis bar as high — the conservative option
"spine + only the highest-confidence concede fixes," **judged against the raw spine**, is on the
table and sometimes wins.

### 5 — Judge (verdict + calibrated confidence) — clean external judge (default)

As a distinct pass, a **clean different-family judge** (a `delegate` model sharing no family with any
proposer or with the synthesis spine) renders the **verdict**: ratify the synthesis or override it, assign a
**calibrated confidence**, and — crucially — **flag any unresolved split as low-confidence rather
than faking agreement**. If the council was genuinely 2-against-1 on a load-bearing point, say so.
A judged split is more honest and more useful than a manufactured consensus.

(Why external-by-default: live testing showed even a *blind* host over-scores its own family's
output on subjective work, so handing the final score to a non-family model removes the confound
while still letting Opus propose and synthesize. Keep judge ≠ synthesizer too — give the judge a
different family from the spine's author — whenever a spare family is available. Host-judges is the
cheaper fallback, valid only when the host did not propose.)

### 6 — Report — host

Return to the user:

- **The verdict** — the answer/recommendation, stated plainly, with confidence.
- **The disagreement map** — where the models split, on what, and why. For high-stakes calls this
  is often worth more than the verdict itself.
- **Preserved dissent** — minority positions kept and labeled, not deleted.
- **Provenance** — which model contributed what, so the user can trace any piece.

## Presets

- **`council`** *(default)* — full propose → critique → defend → synthesize → judge. For plans,
  theses, strategy, important reports, decisions.
- **`redteam`** — skip propose; take an *existing* artifact (a draft plan, memo, proof, contract,
  diff) and throw N adversarial different-family critics at it, then synthesize the strongest
  surviving objections into a punch list. A cross-model `plan-reviewer`.
- **`verdict`** — a decision with explicit options on the table; each model argues a side, the host
  judges and explains. Best for tie-breaks.
- **`consult`** — cheap mode: 2–3 models, one critique round, light synthesis. For medium-stakes
  calls that still want more than one brain.

## Guardrails (don't skip these)

- **State the cost before running.** Never silently burn the bench.
- **Never fabricate consensus.** Report splits as splits with confidence.
- **Preserve dissent.** Minority views are labeled, not erased.
- **The real workspace is never mutated.** Council passes run in `work` mode but inside disposable
  per-model scratch repos containing only the inputs, so nothing writes to the source artifact.
  (`delegate ... safe` is avoided — it's ephemeral and doesn't return text; see the cookbook.) A
  future `--apply` mode could land an agreed change in the real tree, but that's out of scope now.
- **Always state which models actually answered.** If a lane errored or was unauthenticated, say so
  — a 3-model council that silently ran 2 is a correlated, weaker council pretending to be diverse.

## Reference files

- `references/delegate-cookbook.md` — exact `delegate` commands per stage, parallel launch/collect,
  long-prompt handling via `--prompt-file` / `--input-json`, and known gotchas.
- `references/design-rationale.md` — every rule above traced to the research finding or failure
  mode it defends against, with citations. Read before changing a rule.
