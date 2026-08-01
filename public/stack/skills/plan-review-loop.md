<!--
Skill: plan-review-loop
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/plan-review-loop/SKILL.md
-->

---
name: plan-review-loop
description: >-
  Run a plan or spec through a decorrelated three-model adversarial review and fold the
  findings into an r2 revision. Use when a substantive plan/spec/design doc is drafted and
  needs review before execution — "review this plan", "run the review loop", "multi-model
  review", or after any full planning session. Pattern: commit draft → one shared
  code-grounded review brief → parallel launch (delegate codex safe + one Composer lane +
  native plan-reviewer subagent) → triage convergence → patch r2 → commit.
metadata:
  version: 1.0.0
---

# Plan Review Loop

Validated twice on 2026-07-08 (a memory system CLI-first plan, ambient-recall v4 spec+plan). Both runs surfaced convergent blockers that were real, code-grounded, and would have broken the build (wrong seams, impossible timing budgets, false claims about shipped behavior). The loop's value is **decorrelation**: three model families independently grounding in the same code; findings that converge are almost always real.

## Preconditions

- The draft (plan, spec, or both) is written and **committed** (call it r1). Reviews target a fixed ref; safe lanes snapshot the tree, but a committed draft keeps provenance clean.
- You know the real code seams the document touches. If you haven't verified them (`ls`/grep the actual modules), do it before writing the brief — reviewers grounded on wrong seam names waste their pass.

## Step 1 — Write ONE shared review brief (a file, never inline)

Write to a scratch path (`$CLAUDE_JOB_DIR/tmp/<name>-review.md` or equivalent). A file, because prompts containing literal `--flags` or XML break inline shell quoting.

The brief must contain:

1. **What to review** — exact repo-relative paths of the document(s).
2. **The real code seams** — enumerate the modules/files/tests the design touches, with any constants that matter (timeouts, schema versions, policy strings). This is the highest-leverage section: it converts a doc review into a code-grounded review.
3. **The design in one paragraph** — what's new, so reviewers don't burn tokens reconstructing it.
4. **Numbered focus areas** — contract conflicts with shipped invariants; seam errors (work assigned to files that don't exist, files that MUST change but aren't owned); feasibility of any hot-path/timing/budget claims against actual constants; whether every predicate the spec asserts is computable from shipped data; phasing/dependency ordering; what breaks silently for existing consumers (tests, parsers, scripts that grep/parse current output).
5. **Hard rules**: "Ground EVERY finding in actual code with file:line evidence. DO NOT run build/test/lint — read code only. Output findings only: BLOCKERS / RISKS / NITS, each with file:line evidence and a one-line concrete fix. No summary, no praise."

## Step 2 — Launch three reviewers in parallel

**Lane A — Codex:** `delegate --json --group <group> codex safe --prompt-file <brief>`
**Lane B — one Composer lane:** same command with `cursor` or `grok` (alternate between them to balance subscriptions). Grok failure signature to watch: raw `{"type":"thought"}` deltas in stdout or a suspiciously short report = it lost file access and is fabricating — discard and rerun that slot on cursor.
**Lane C — native plan-reviewer subagent** (opus, fresh context), run in background. Its brief = the same content as the file, PLUS: repo conventions it must not flag as errors (e.g. superseded spec versions staying on disk, deliberate CPU-discipline gate scoping, target-runtime idioms like Codex subagent names), and whether prior reviews already ran (so it doesn't re-find fixed issues). If it goes idle without delivering, ping it via SendMessage — this happens.

Delegate gotchas (both hit live): global flags (`--json`, `--group`) go BEFORE the subcommand or you get `misplaced_global_option`; use `delegate wait --group <group>` rather than polling.

## Step 3 — Triage

- **Convergent findings (2–3 lanes) are near-certainly real.** Adopt unless you can refute them against the code directly.
- **Unique findings**: verify each against the actual file:line before adopting — reviewers are sometimes wrong, and you are the judge, not a stenographer.
- Classify every finding: adopt / reject-with-reason / already-covered. Rejections need a stated reason; they go in your report to the user.
- Watch for the meta-finding: if a reviewer catches your document asserting something false about shipped code ("nobody consumes this output", "this field exists"), treat it as a class — grep for siblings of the same error.

## Step 4 — Patch to r2 and commit

- Fold adopted findings into the document(s). Add a revision-history entry (spec convention: dated r2 block naming what changed and why; plans get a "Plan revision history" entry).
- Commit as r2 with a body summarizing the review's headline catches and dispositions.
- Report to the user: headline findings, what was adopted vs rejected and why, and any DECISIONs the revision asks them to ratify.

## Scaling notes

- Quick sanity check on a small plan: drop to two lanes (codex safe + plan-reviewer).
- Spec + plan together review fine as one brief; don't split into separate review rounds.
- Cost: a full three-lane round runs a few dollars and ~5–10 minutes wall clock, fully parallel.
