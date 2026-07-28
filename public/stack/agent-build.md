# agent-build: tiny CLIs, built by your agent, for your agent

<!-- DRAFT — pending Trey's veto. -->

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

## Why this shape works

A tool an agent can use has three properties: one obvious entry point,
stable exit codes that mean something, and a `--json` or `schema` mode so
the agent never has to parse prose. Build for those three and your agent
will reach for it unprompted.
