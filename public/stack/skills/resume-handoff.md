<!--
Skill: resume-handoff
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/resume-handoff/SKILL.md
-->

---
name: resume-handoff
description: Use when resuming previous work from a handoff, memory note, session summary, branch/worktree, ticket, or a vague “where did we leave off?” request. Verifies live state before acting and separates stale memory from current facts.
---

# Resume Handoff

Resume from prior context without trusting it blindly.

## Workflow

1. **Identify the handoff source.** Use a provided path, ticket, memory pointer, session summary, branch/worktree, or the current workspace. If the source is missing or ambiguous, ask for the smallest missing pointer.
2. **Read bounded context.** Read the handoff and directly referenced plan/research files. Do not dump raw logs. Use subagents only for independent supporting lookups, not for the primary handoff file.
   - **Trace-fuel:** if the resumed work rhymes with prior work (same subsystem, same technique, a past build that solved a similar problem), point the session at those prior session transcripts/JSONLs as approach references — "read the traces from X, learn what worked and what was tried and rejected" — instead of re-explaining the approach from scratch. Old traces carry rejected paths and working tactics that summaries lose. Use a subagent to distill a long trace rather than reading it whole.
3. **Verify live state.** Check the current `cwd`, relevant repo/workspace, branch, dirty tree, recent commits, open PR/CI when applicable, generated artifacts, and any files the handoff claims changed.
4. **Compare memory vs reality.** Mark each important item as current, stale, missing, changed, or unverified. Say when memory-derived facts may be stale.
5. **Return the next move.** Give a compact handoff synthesis: current objective, verified completed work, blockers, risks, and the most useful next action.
6. **Act only after scope is clear.** If the user asked to continue, proceed from the verified state. If the next action involves destructive cleanup, pushes, external sends, or broad rewrites, confirm or use the project’s existing safety rules.

## Output shape

- `Current verified state:` live facts with paths/branch/commit when relevant.
- `What changed since handoff:` stale or diverged claims.
- `Next action:` one recommended move plus alternatives only if meaningful.
- `Risks/blockers:` unresolved uncertainty or missing inputs.

## Invariants

- Never answer from memory alone when live files/commands can cheaply verify the claim.
- Never present old handoff state as current without checking.
- Keep raw private logs, emails, and credentials out of the final answer.
