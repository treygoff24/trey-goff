<!--
Skill: done
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/done/SKILL.md
-->

---
name: done
description: "End-of-session durable-state closeout sweep. Use when the user says \"/done\", \"done\", \"we're done\", \"wrap it up\", \"close out the session\", or a substantive Codex/Claude session is clearly ending. Run UPDATE, CLEANUP, and SKILLIFY passes to keep project context, ledgers, memories, handoffs, repo state, contacts/correspondence, and reusable workflow knowledge current without turning closeout into a new project."
metadata:
  version: 1.3.0
---

# /done — session closeout sweep

The session's work is finished; make durable state catch up with reality. Keep it proportionate: a short Q&A may need only "nothing durable changed"; a multi-hour implementation, research, or operations pass deserves a real sweep.

Do not turn `/done` into a new project. Make small, clearly necessary durable updates. For bigger follow-up work, record the next action and stop.

If you run more than one agent harness, keep every installed copy of this skill byte-identical and verify with `shasum -a 256`.

## Before the passes

- **Debounce repeats.** If `/done` already ran in this session, do an incremental "since last closeout" pass and say so. Do not redo the whole sweep unless new substantive work happened.
- **Separate actions from confirmations.** Track what you change during `/done` separately from things that were already completed earlier and merely verified now.
- **Check authorization before mutating high-impact state.** Commits, pushes, merges, branch/worktree deletion, hard deletes, contact writes, sends, and memory writes must be authorized by the live user request, a clear prior instruction in this session, or the current memory/contact policy. If not authorized, list the candidate instead of doing it.
- **Use exact-file reads before durable edits.** Before patching a durable file, read the relevant file/region directly, then batch edits. Do not rely only on grep output for edit anchors.

## Pass 1 — UPDATE

Walk the session from the top and ask: *will a fresh Codex/Claude session next week have the right state without this being recorded?*

Update only the appropriate durable surfaces.

### Code/config session preflight

If the current work touched a repo, config package, CLI, runtime, or code-like project, first check the live state:

- `pwd`
- `git status --short --branch` when inside git
- last commit and branch/upstream/ahead-behind when applicable
- unpushed commits, open PR/CI status, or merge/push state when that was part of the session
- local ledgers/handoffs beyond `TASKS.md`: `STATE.md`, `TODO.md`, `CHANGELOG`, `README`, `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `docs/plans`, `docs/handoffs`, issue/PR notes, project memory

Do not commit, push, merge, delete branches, or prune worktrees unless the user asked for that in the live task or it was already part of the agreed workflow.

### Knowledge-base routing

For policy, research, writing, ops, meetings, outreach, or project-management work, sweep in this order:

1. **Task ledgers/current state**: `TASKS.md`, project trackers, issue lists, kanban notes, `TODO.md`, or equivalent. Flip statuses, add completion dates, record blockers, and keep "last touched", "current state", and "next action" true.
2. **STATE.md sitrep**: if the workspace has a `STATE.md` (the context-hydrator's session-start sitrep), rewrite it to end-of-session reality. Sitrep-shaped, not history-shaped: where things stand, open loops/worries, next actions — every line carrying pointers to where detail lives (ledger, journal, handoff); update its **Updated:** date. Keep it ≤ ~25 lines and never duplicate detail into it. Every path it names must exist — the hydrator feeds this file to a scout model verbatim, so a wrong pointer becomes a confidently wrong briefing in every future session. If a workspace the user works in regularly has no `STATE.md`, create one in that shape and note it in the report.
3. **Project docs**: `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `README`, glossary, runbook, architecture note, folder map, or equivalent only when the session changed something those files assert: canonical paths, commands, policies, owners, or current implementation state.
4. **Memory**: follow the live memory policy for the current session/profile. If authorized, write the smallest useful note to the authorized memory path and update the local index if that is the local convention. Otherwise list memory candidates in the final report instead of editing memory.
5. **People, contacts, and correspondence**: if the session met, researched, sent, or materially prepared outreach, update approved people/dossier/contact/correspondence systems. If connector/API access is unavailable, record the blockage instead of pretending it was done.
6. **Handoff/resume state**: if work remains mid-flight, create/update the local handoff or a `RESUME HERE` ledger block, following project convention. If the user said "continue tomorrow", "pick this back up", "move offices", or similar, choose one durable resume surface and state which one. If a handoff was completed, mark it resolved or archive it according to project practice.
7. **Automation/thread state**: use available automation/thread tools when the session created, changed, completed, pinned, archived, or handed off automations or threads. Do not emit raw app directives by hand.

### Stale-reference sweep

After updates, run a focused stale-reference search for old names, statuses, paths, branches, dates, and "next action" claims in the surfaces you touched or that route future agents: ledgers, `README`, `CONTEXT.md`, `CLAUDE.md`, `AGENTS.md`, `memory/`, handoffs, and current-state docs. Fix stale claims you are authorized to fix; otherwise flag them.

## Pass 2 — CLEANUP

Clean up what this session made stale, while preserving information.

Rules:

- **Non-destructive by default.** Archive or relocate superseded files; hard-delete only session-created, regenerable debris with no future reader.
- **Never hard-delete anything you did not create this session without explicit approval.** Flag questionable files instead.
- **Scratch deletion requires provenance.** Only delete scratch/temp paths that are clearly namespaced to this session or that you created. For broad `/tmp` globs, verify namespacing/provenance first; otherwise flag.
- **Leave pointers true.** If you move or supersede a file, update the live pointer that referenced it and report `from -> to`.
- **Dropbox/cloud trees:** prefer `cp` then verify the copy, then `rm` the original, instead of `mv`. Create the archive folder, copy, verify, remove, update pointers, and report the move.
- **Respect local conventions.** Use the repo/workspace archive or superseded layout. Do not reorganize a tree during closeout.
- **Keep output hygiene.** In projectless Codex desktop chats, keep scratch work under `work/` and user-facing deliverables under the configured `outputs/` directory; do not scatter artifacts in `$HOME`.

Sweep for:

- Superseded drafts, exports, PDFs, screenshots, transcripts, or generated artifacts left beside their replacements.
- Stale "current state" claims, status boards, runbooks, handoffs, checklist entries, review boards, or version pointers.
- Session-created temp files, raw sidecars, build intermediates, empty scratch dirs, or one-off scripts with no durable value.
- Orphaned worktrees, background agents, local servers, watcher processes, PR/CI watchers, or long-running jobs created by the session.

Background work is not "done" unless verified. Either wait for it to finish and report the result, or list the job/process/log/status under Loose ends.

## Pass 3 — SKILLIFY

Harvest reusable capability. Look for anything done manually that is likely to recur:

- A repeated or obviously reusable multi-step workflow -> skill candidate.
- A one-off script that would be useful again -> promote to a proper script/tool home.
- A prompt, review rubric, research fan-out, review board, or subagent brief that worked unusually well -> template or skill candidate.
- A correction to an existing skill, checklist, runbook, or tool -> patch it now if it is surgical and authorized; otherwise flag it with the exact path and reason.
- A repeated lookup or domain rule -> reference file or memory candidate.

Default: patch tiny corrections to existing durable surfaces; ask before building new skills, new tools, or anything non-trivial unless the user explicitly asked for it in this session.

## Output

End with a compact closeout report:

1. **Changed during `/done`** — durable records changed now, with paths or systems.
2. **Confirmed from session** — important state verified but not changed during `/done`.
3. **Cleaned** — archived/relocated/removed items, with `from -> to` for moves; include items deliberately flagged rather than touched.
4. **Skillify** — tiny fixes made, plus candidates needing the user approval with name, value case, rough build cost, and exact path if known.
5. **Loose ends** — blockers, unverified sends, pending replies/reviews, unresolved CI, open agents/processes, unpushed commits, dirty files, or anything future Codex/Claude should check next.

Avoid printing raw secrets, full contact dumps, or long transcript excerpts in the final report. Use compact identifiers/fingerprints where needed.

If nothing durable changed, say that plainly and do not manufacture work.
