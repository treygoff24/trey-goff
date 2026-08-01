<!--
Skill: delegate-workflows
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/delegate-workflows/SKILL.md
-->

---
name: delegate-workflows
description: Orchestrate multi-agent pipelines with the `delegate workflow` subsystem — Python scripts run by a detached supervisor where every agent() is a real delegate child run (codex/cursor/grok/claude/droid/kimi lanes). Use for deterministic fan-out/verify/synthesize pipelines that survive crashes (structural-key resume), need human checkpoints (gates), or run unattended. Prefer plain `delegate <engine> <mode>` for single bounded tasks; reach for a workflow when the orchestration itself (loops, barriers, judges, budgets, kill/resume) is the point.
---

# Delegate Workflows

Full reference: `delegate --json describe` (workflows section) and
`docs/delegate-workflows.md` in the delegate-agent repo. This skill is the
judgment layer; don't trust it for exact flags — the config moves.

## When to reach for a workflow

- Fan-out over a work-list with per-item stages (`pipeline`) or a barrier (`parallel`)
- Adversarial verify: findings from one lane judged by other families (`judges`)
- Unattended/overnight runs that must survive crashes: kill/resume replays
  finished agents from the journal and adopts still-running children
- Human checkpoint mid-pipeline: nested `workflow(..., gate=True)` pauses the
  whole run until `workflow approve`
- Run-count budgets (`--budget N`) as a hard spend ceiling

Skip it for one-shot tasks — a plain `delegate codex work` is cheaper and simpler.

When assigning engines to pipeline stages, follow the field-ranked roster in the delegate-agent
skill (2026-07-08): Codex authors, Cursor/Grok-4.5 reviews, Devin fixes findings-lists, Claude
judges; GLM/droid lanes only on roster failure.

## Script contract (Python, stdlib-free of imports you don't need)

```python
meta = {"name": "my-flow", "description": "...", "defaults": {"engine": "codex", "mode": "safe"}}

phase("Find")
findings = parallel([
    (lambda lane=lane: agent(PROMPT, engine=lane, mode="safe", schema=FINDINGS_SCHEMA, label=f"find:{lane}"))
    for lane in ["codex", "cursor", "grok"]
])
votes = judges(BALLOT, VOTE_SCHEMA, engines=["codex", "grok"])
result = workflow("tally", args={"votes": votes}, gate=True)  # pauses for approval
return {"result": result}
```

- `meta` must be a pure dict literal. Top-level `return` becomes the result.
- Injected globals: `agent, pipeline, parallel, phase, log, workflow, judges, args, budget`.
- `agent(prompt, engine=, mode=, model=, effort=, schema=, label=, phase=, isolation=, passthrough=, timeout=, retries=)`.
  `engine` may be a fallback list. `schema=` uses the stdlib mini-JSON-Schema
  subset (type/required/properties/items/enum/additionalProperties) — validation
  failures retry with correction context (cap: retries= / config).
  Structured Codex workflow output is fail-closed: a valid preamble without the
  child-authored completion report is rejected. Use `minLength` / `minItems`
  when empty strings or arrays are semantically invalid; structural validation
  alone cannot infer that policy. Safe-mode lanes re-root into a snapshot copy —
  absolute workspace paths in prompts point at the real tree; say so in the
  prompt or use relative paths.
- `passthrough=True` sends the prompt verbatim (slash commands like `/goal`);
  mutually exclusive with `schema=` and `mode="call"`, rejected on
  prompt-enforced-safe lanes at check time.
- Failures become `None` slots in pipeline/parallel — always filter.
- Determinism: no `time.*`/`random.*`/`uuid.*` (lint warns) — resume replays by
  structural key (scope + prompt + options), so nondeterministic prompts break caching.
- cursor/kimi are argv-transport: prompts ≳100KB fail — route big stages to codex/claude.

## CLI verbs

`workflow run <script.py> [--budget N] [--args JSON] [--dry-run]` (pre-flights `check`),
`check`, `status`, `watch [--json]`, `events --since <seq>`, `result`, `wait`,
`approve <wfId>` (THE way to continue a gate — it IS a resume; don't also run
`run --resume`), `kill` (cancels in-flight children too), `list`,
`save <script>` (installs into `~/.delegate/workflows/`; `run --name` and nested
`workflow("name")` resolve through it).

## Operational judgment

- Children are ordinary runs tagged `--group <wfId>` — `runs --group`, `snapshot`,
  `run-output`, `cancel` all work on them mid-flight.
- Kill → resume is safe and cheap: finished agents replay from the journal
  (no respawn, no double budget-claim), still-running children are adopted,
  cancelled ones respawn. Verified live 2026-07-08.
- A gate checkpoints the WHOLE workflow (stops admitting tree-wide, drains
  in-flight, supervisor exits `paused`) — not just the gated branch.
- Dry-run stubs every agent/judge/nested call and prints the run tree; use it
  before any expensive launch.
- Journal (`journal.jsonl`) is the debugging source of truth — read it before
  assuming a cached result is non-empty.
- Lane routing follows the delegate-agent skill: codex primary, Grok 4.5
  (cursor harness first) a very close second; decorrelate judges across
  families (cursor+grok = one family).
