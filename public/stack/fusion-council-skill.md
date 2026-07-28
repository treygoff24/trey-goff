<!-- From treygoff.com/stack — adapt freely. -->
<!-- Requires a way to call multiple model vendors from your harness — my delegate CLI (github.com/treygoff24/delegate-agent) or an equivalent. Or hand this file to your agent and ask it to implement an equivalent for your setup. -->
---
name: fusion
description: Convene a cross-vendor council of frontier models to pressure-test a high-stakes, open-ended artifact via an adversarial propose → critique → defend → synthesize → judge loop, then return a verdict plus a map of where the models disagreed. The gain comes from decorrelated errors across different model *families* (OpenAI, Google, xAI, Moonshot, DeepSeek, Qwen, GLM, Anthropic, etc.) — so it beats asking one model, but only for work worth real time and tokens. Use when someone says "convene the council," "run this through fusion," "fuse the models," "throw maximum intelligence at this," "get a multi-model second opinion," or "red-team this with other models." Also worth proactively offering whenever someone is about to commit to an important open-ended artifact — a strategy memo, investment thesis, policy or legal argument, architecture decision, research claim, contract, or a plan they're about to bet on. Do NOT fire for routine or closed-ended tasks (lookups, simple edits, code that just needs to run) where one strong model plus self-consistency is cheaper and just as good.
---

# Fusion

Fusion throws several **decorrelated frontier models** at one important problem and makes them
argue under structured rules, so the answer is better than any single model would give. The
whole reason it works is that different pretrained models are wrong in *different places* — their
errors are decorrelated *across model families* — and an adversarial loop surfaces where they
split. That single fact drives every rule below.

This is a **break-glass tool, not a default.** A multi-model loop usually *loses* to one good
model on ordinary tasks, at many times the cost. Fusion earns its keep only on high-stakes,
open-ended work where being right is worth minutes and real tokens.

## Step 0 — Triage: should fusion even fire?

Before convening anything, decide honestly:

- **Is it high-stakes?** A decision/argument/plan someone is about to *bet on* — money, reputation,
  legal exposure, an architecture they'll live with, a claim that needs to be true. If it's
  reversible and cheap to get wrong, skip fusion.
- **Is it open-ended?** Reasoning, judgment, strategy, synthesis, design — the jagged-frontier
  cases where models genuinely differ. Closed-ended tasks (a lookup, a transform, code that just
  needs to compile) don't benefit; one strong model + self-consistency is cheaper and as good.

If it fails either test, **say so and recommend a single-model pass instead.** Refusing-with-a-
reason is a feature: it keeps the cross-vendor bench for the work that deserves it.

If it passes, **state the cost up front** before running: "This convenes N cross-vendor agent
runs — roughly a few minutes and real tokens. Proceed?" Then compose the council.

## Composing the council — diversity over horsepower

The members must come from **different vendors/families**. Do not assemble the N strongest
variants of one model family, or three models from the same vendor — within-family errors are
correlated and you'll get a null result where nobody actually disagrees. Cross-family
decorrelation is the entire source of the gain.

**Rough role priors** (recalibrate against your own bench — models and rankings move fast): a
strong "adversarial critic" model that probes artifacts and computes evidence rather than opining
is worth favoring for the critique pass; a strong technical/structured-reasoning model is often
the best proposer for code or architecture artifacts; keep a pure executor model off councils —
councils need debaters, not just implementers. These are priors, not law: the family-diversity
rule below still dominates role preference.

1. Check what's actually available and authenticated in your harness before assembling a roster —
   don't hard-code a lineup that might not actually be reachable.
2. Pick from **distinct vendor families**. A reasonable default council is **3–4 cross-family
   proposers** — for example, one strong reasoning model from each of OpenAI, Google, and
   Anthropic — plus a **different-family judge held in reserve** (e.g. an xAI model). Rotate in
   other strong-but-different-family models (Moonshot/Kimi, DeepSeek, Qwen, GLM, etc.) for more
   spread. The judge's family must not appear among the proposers (step 4).
3. **Go to 5 models / 5 vendors** for the highest-stakes calls. More diversity, roughly double the
   cost.
4. **The judge must be a different family from every proposer — and by default that judge is a
   clean external model, not whichever model is orchestrating the run.** This is the load-bearing
   rule, and it's empirically grounded: on a *subjective* prose brief, the two strongest models in
   one test each ranked their own anonymized draft #1 as blind critics — anonymization alone did
   not neutralize self-preference. (On an *objective* code-plan task, self-preference nearly
   vanished — each model ranked its own submission honestly against the others — so weight this
   rule hardest on taste-laden genres; it's cheaper insurance on verifiable ones.) **Default for
   high-stakes runs:** your orchestrating model proposes and synthesizes, but a **different-family
   model renders the final verdict** — e.g., with a bench drawn from OpenAI/Moonshot/Google/your
   own model family, judge with an xAI model, a family no candidate uses. This keeps your strongest
   model on the proposer bench while removing self-preference from the score. **Cheaper fallback**
   (lower stakes, or no spare family available): the orchestrator judges and therefore does *not*
   propose. Either way, **never let any model render the final score on a pool containing its own
   output, even anonymized.**

A weaker-but-diverse model is welcome as a **proposer** (it can raise the ceiling), but never as
the synthesizer or judge.

5. **Derive the genre's signature moves from the rubric and bake them into the proposer prompt.**
   This is the single highest-leverage knob: proposers tend to share *correlated blind spots* —
   they independently miss the same craft moves — and that, not the synthesis stage, is usually
   what caps council quality. Before launching proposers, look at what separates a 10 from a 7 in
   this genre (e.g. disarm the opposing read, ground in a concrete example, concede-then-
   differentiate) and instruct every proposer to do those things *as general craft, in their own
   voice* — never by quoting a reference answer (that overfits to one example). Adding a handful of
   such moves has been shown to lift every model in a council and push the best output past a
   known-excellent human baseline. Fixing the blind spot upstream beats trying to graft it back at
   synthesis, because if all proposers miss it, it isn't in the pool to graft.

## The pipeline

However you dispatch each council member (a CLI that can call multiple model providers, separate
API calls, or separate agent sessions), run each pass in **isolation** — a disposable scratch
context containing only the inputs it needs, so nothing from one model's run leaks into another's
until the stage explicitly calls for it.

### 1 — Propose (isolated)

Send the problem to each council model **independently**. They must not see each other's work yet.
Isolation is the point: it keeps their errors decorrelated, which is what the later steps mine.
Launch the proposers in parallel, collect all responses before moving on.

Prompt shape per proposer: *the artifact + the question + "Give your best independent answer with
your reasoning. You are not seeing other models' answers."* Return a complete position, not a
hedge. Fold in the genre's signature moves (Composing step 5) so the whole pool clears the bar,
not just its strongest member.

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
misreads my proposal." In one live test, a spine author rebutted two critiques as misreads (one
would have caused a regression if "fixed"), while an independent judge separately penalized exactly
the defects the author *conceded* — the critique→defend→fix→judge loop closed on itself.

**Defend the spine, not the whole pool.** Defend's value concentrates on the proposal(s) the
synthesis will be built from. In testing, the spine author's defense reshaped the result, while the
weaker members merely capitulated (one even proposed a fix *worse* than the synthesis already had).
So defend the **top-1 or top-2** briefs from the critique ranking and skip the rest — cheaper and
strictly better than defending everyone. Gains are bigger on **subjective** genres (contestable
taste calls the author can legitimately rebut) than on **objective** ones — in one test, on a
persuasive-prose brief the strong authors **defended roughly a third of objections**, versus **0%**
on an objective code plan where every critique was a true positive the author simply conceded. The
defend rate also scales with **artifact quality**: the *weakest* brief's author conceded nearly
every objection — a weak candidate rightly folds, so the round earns its keep on the **strong**
candidate. Both facts point the same way as the judge≠family genre-dependence, and both reinforce
defending only the spine.

Keep it bounded. **Default is one defense round.** Run a *second* critique→defend round only when a
genuine crux is still live (the models still materially disagree on something that changes the
answer), and **cap it there** — longer debate tends to degrade and drift toward false consensus.
Convergence is not the goal; isolating the real crux is — and a crux that turns on a fact the
models can't settle should be **handed to a human**, not re-litigated.

### 4 — Synthesize (select-and-graft, not blind-average)

Whoever is orchestrating (a lead model, or you) now builds the answer by **selecting a spine and
grafting**: pick the single strongest proposal as the backbone, then graft in specific superior
elements from the others, noting provenance ("structure from B, the edge-case handling from C").
**Do not blandly average all proposals into mush** — blind synthesis reliably underperforms even a
single model. Selection is where the value is; the graft only adds what's demonstrably better.

**Use the defend triage asymmetrically — and don't regress below the spine.** A **DEFEND is a
high-confidence keep**: in one live test, a defend-informed synthesis that *kept* the author's
defended rhetoric beat a critique-only one that cut it, with the judge crediting exactly the kept
slogan and concrete specifics. But a **CONCEDE is only a candidate fix, not a guaranteed
improvement** — it means the author agrees the critique is a true positive, yet a reader-facing
judge is the final arbiter. In the same test the **raw spine outscored both syntheses** because a
*conceded* edit (dropping a framing the author agreed was weak) removed something the judge
actually rewarded. So apply concedes **with judgment, not mechanically**, keep the winner's
strengths, and when the spine is already excellent treat the synthesis bar as high — "spine + only
the highest-confidence concede fixes," judged against the raw spine, is on the table and sometimes
wins outright.

### 5 — Judge (verdict + calibrated confidence)

As a distinct pass, a **clean different-family judge** (a model sharing no family with any
proposer or with the synthesis spine) renders the **verdict**: ratify the synthesis or override it,
assign a **calibrated confidence**, and — crucially — **flag any unresolved split as low-confidence
rather than faking agreement**. If the council was genuinely split on a load-bearing point, say so.
A judged split is more honest and more useful than a manufactured consensus.

(Why external-by-default: testing has shown even a *blind* orchestrator over-scores its own
family's output on subjective work, so handing the final score to a non-family model removes the
confound while still letting your lead model propose and synthesize. Keep judge ≠ synthesizer too
— give the judge a different family from the spine's author — whenever a spare family is
available. Orchestrator-judges is the cheaper fallback, valid only when the orchestrator did not
also propose.)

### 6 — Report

Return:

- **The verdict** — the answer/recommendation, stated plainly, with confidence.
- **The disagreement map** — where the models split, on what, and why. For high-stakes calls this
  is often worth more than the verdict itself.
- **Preserved dissent** — minority positions kept and labeled, not deleted.
- **Provenance** — which model contributed what, so the reader can trace any piece.

## Presets

- **`council`** *(default)* — full propose → critique → defend → synthesize → judge. For plans,
  theses, strategy, important reports, decisions.
- **`redteam`** — skip propose; take an *existing* artifact (a draft plan, memo, proof, contract,
  diff) and throw several adversarial different-family critics at it, then synthesize the strongest
  surviving objections into a punch list.
- **`verdict`** — a decision with explicit options on the table; each model argues a side, a judge
  decides and explains. Best for tie-breaks.
- **`consult`** — cheap mode: 2–3 models, one critique round, light synthesis. For medium-stakes
  calls that still want more than one brain.

## Guardrails (don't skip these)

- **State the cost before running.** Never silently burn the bench.
- **Never fabricate consensus.** Report splits as splits with confidence.
- **Preserve dissent.** Minority views are labeled, not erased.
- **Never let a run mutate the real workspace.** If your dispatch mechanism can write files or run
  commands, give each council member a disposable scratch copy of the inputs, not the source
  artifact itself, and read its output back rather than trusting it to report faithfully on what it
  did.
- **Always state which models actually answered.** If a lane errored or was unauthenticated, say so
  — a 3-model council that silently ran 2 is a correlated, weaker council pretending to be diverse.

## Implementing this without a dedicated CLI

The mechanics above assume some way to fire off independent, parallel calls to several different
model vendors and collect their text back. If you don't have a tool like that already, the
pipeline still works with:

- Direct API calls to each vendor's chat/completion endpoint, run in parallel and collected before
  moving to the next stage.
- Separate agent sessions/tabs, one per council member, if you're working inside an agent harness
  that supports spawning sub-agents pointed at different backing models.
- A simple orchestration script that shells out to each vendor's CLI tool if they have one.

The one property that matters most, whatever you build: proposers must not see each other's output
until the critique stage, anonymization must survive into critique, and the judge must never share
a vendor family with anything it's judging.
