# agent-build: tiny CLIs, built by your agent, for your agent

Paste one of these blueprints into a session and let it build you your own
version. They are deliberately small — a few hundred lines each.

---

## Blueprint 1 — `ask`

Build me a CLI called `ask` that pages my phone and blocks until I answer.

Contract:

    ask "<question>" [--timeout SECONDS] [--on-timeout proceed|stop]
    Prints my reply to stdout and exits 0.
    Exit 2 if the relay is unreachable, 3 on timeout-proceed, 4 on timeout-stop.

Transport: a Telegram bot (or any push channel I already use). Store the
token outside the repo. Never include file contents or secrets in the body:
the question must fit on a lock screen.

Then add a line to my CLAUDE.md telling agents to use it when they are
genuinely blocked on a judgment call — and never for status updates.

---

## Blueprint 2 — `papercuts`

Build me a CLI called `papercuts`: an append-only complaint box for agents.

Contract:

    papercuts add "<what broke and what would have prevented it>"
      [--tag AREA] [--severity minor|major|blocker] [--cmd C] [--exit N]
    papercuts list [--since 7d] [--tag AREA]
    papercuts schema   # machine-readable contract for agents

Storage: one JSONL file. Never rewrite history; only append.

Then tell agents in CLAUDE.md: when you hit friction, file it and push
through — do not stop the task to complain.

---

## Blueprint 3 — `occupancy` (a fleet-style repo-claim tool)

Build me a CLI called `occupancy` that answers "is anyone else working in
this repo right now?" with an exit code, so agents can check before they
write instead of colliding mid-edit.

Contract:

    occupancy check <repo-path> [--for OWNER_NAME]
      Exit 0: clear to write.
      Exit 3: repo is claimed by someone else — print who and when the claim
        expires, then stop.
      Exit 1: cannot determine occupancy (no claim file, no git info) — treat
        as "unknown", not "clear."
    occupancy claim <repo-path> --owner OWNER_NAME --ttl 4h
      Writes a claim (owner, start time, TTL) to a small local store — a
      lockfile in the repo, or a shared JSON/SQLite file if you run several
      machines. Refuses to overwrite a live claim held by a different owner.
    occupancy release <repo-path> --owner OWNER_NAME
      Clears your own claim early. Refuses to release someone else's.
    occupancy status
      Lists every repo with a live claim: owner, age, TTL remaining.

Rules to bake into your CLAUDE.md alongside it:
- **Before editing a repo another agent might hold, run `occupancy check`
  first.** Exit 3 means stop and message the claim holder — never write
  through a live claim just because you think you know better.
- **A live claim occupies the repo even if the process behind it has died.**
  Don't treat "no process running" as "safe to write"; let the TTL expire or
  have the holder release explicitly.
- Long-running or unattended agents should claim on start and release on
  exit; short one-shot edits don't need to bother.

Its exit codes (0 = go, 3 = occupied, 1 = unknown) are the whole API —
nothing else about it needs memorizing.

---

## Why this shape works

A tool an agent can use has three properties: one obvious entry point,
stable exit codes that mean something, and a `--json` or `schema` mode so
the agent never has to parse prose. Build for those three and your agent
will reach for it unprompted.
