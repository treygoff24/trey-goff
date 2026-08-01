# STATE — <project name>

**Updated:** <YYYY-MM-DD> (<one clause on what the last session was>)

<!--
  WHAT THIS FILE IS
  A sitrep, not a history. It answers one question for an agent that has never
  seen this project before: where do things stand right now?

  It is rewritten every time, never appended to. If you find yourself adding a
  line rather than replacing one, the line probably belongs in a ledger
  (TASKS.md, a changelog, an issue) and this file should only point at it.

  HOW IT GETS USED
  A SessionStart hook reads this file and injects it verbatim into a fresh
  session before the first prompt. Two consequences worth internalizing:

    1. Every path, branch, command and ID named here is read as fact. A stale
       pointer becomes a confidently wrong briefing in every session until
       someone notices. Verify each one exists before you close out.
    2. Length is a tax paid at every single session start. Keep it under about
       twenty-five lines. Detail lives elsewhere; this file carries the address.

  HOW IT GETS WRITTEN
  At the end of a working session — by a closeout skill, not by a hook. A
  session that ended badly should not automatically be recorded as the truth,
  so writing is something you invoke deliberately.

  Delete these comments once you have your own shape. Everything below is a
  worked example of the shape, not a schema to fill in.
-->

<!-- STATUS: what is true right now. Lead with what shipped or landed, and say
     where it landed — branch, commit, environment. Bold the claim, then give
     the pointer to detail. -->

- **<The headline state of the work — what is live, merged, or shipped>** (`<commit or branch>`). <One sentence of what changed and the paths a fresh agent would need to open.> Detail: `<path/to/ledger-or-doc>`.

<!-- DECISIONS: choices that are settled, so nobody relitigates them or, worse,
     quietly reverses one. Name the decision and the reason in one line. -->

- **<A decision that is settled>** — <what was chosen and the one-line reason>. <What was deliberately left alone, if that is easy to get wrong.>

<!-- LANDMINES: things that will bite the next session specifically because
     they are invisible. Manual steps with no automation guarding them,
     generated files that must be regenerated, single-writer resources. -->

- **<A trap with no automation guarding it>**: <what breaks and what has to be done by hand>. <Say plainly that nothing enforces this.>

<!-- EXTERNAL STATE: accounts, DNS, deploys, third-party dashboards. Anything
     whose truth lives outside the repo and cannot be discovered by reading it.
     Include the account or identifier — but never a secret, token or key. -->

- **<External system>** (account `<identifier>`): <current status>. <What is still pending and where to check it.>

<!-- WATCH: the thing you are worried about. One line. If nothing worries you,
     delete this section rather than manufacturing a concern. -->

- **Watch**: <the open worry, and the first place to look if it has gone wrong>.

<!-- OPEN LOOPS: work that is mid-flight or waiting on a human. Each one needs
     an owner and the next concrete action — "revisit X" is not an action. -->

- Open for <owner>: <the decision or task, stated concretely enough to act on without asking a follow-up question>.

<!-- HOUSEKEEPING: the state of the tree itself. The last line of this file
     should let an agent know whether it is standing on solid ground. -->

- Branches/worktrees: <what exists, what was cleaned up, what is intentionally still around>.
- Gate: `<the one command that verifies this repo>` — <green or red at last run>. <Local vs remote sync state.>
