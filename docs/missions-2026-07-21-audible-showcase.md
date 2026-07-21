# Missions brief — Audible sync + software showcase (2026-07-21, Trey AFK)

Owner: workspace Claude (benchmark session, post-compact). Trey's grant:
use delegate model army + Claude subagents freely; website updated live.
Both missions target ~/Code/trey-goff (Next.js 16, pnpm@9.15.1, MDX +
content-collections). Read AGENTS.md first. Gate: `pnpm ci:quality`;
content edits require `pnpm prebuild` + committing generated public/*.json.

## Mission 1 — Audible → Library sync (plan, review, implement)

Goal: weekly-ish automated pull of Trey's Audible listening history into
content/library/books.json (schema: id/title/author/year/status
read|reading/rating?/topics[]/genre — see existing file), then prebuild
regenerates search/covers/book-colors artifacts.

Facts: no audible CLI installed. Likely tool: mkb79/audible-cli (Python;
one-time interactive Amazon OAuth — NEEDS TREY, design around it: build +
document the auth step, leave it queued for his return). Pipeline shape to
plan: fetch library → diff vs books.json → enrich (topics/genre need
judgment — an LLM step or curated mapping; Trey's existing entries are the
style guide) → PR-quality commit + prebuild. Cadence: launchd weekly.
NEW BOOKS SHOULD NOT AUTO-INVENT ratings — leave unrated.
Plan must be reviewed (plan-reviewer subagent) before implementing.

## Mission 2 — Software showcase revamp (foundry + impeccable + visual QA)

Goal: a cool, unique discovery/exploration surface for Trey's software:
websites, CLI tools, agent tooling — all repos under ~/Code. Currently
content/projects/ has ONE entry (the-control-room.mdx, frontmatter schema
visible there). This is a full design+build: load `impeccable` skill and
site's frontend-delight guidance (AGENTS.md), run the `foundry` workflow
with subagent lanes, finish with `visual-qa` loop. PRODUCT.md is the design
constitution (nocturnal observatory, one green accent, ruled-not-carded,
Library is the flex — the showcase must earn its own interaction budget
without competing). Anti-reference: generic card-grid dev portfolio.
Harvest material: survey ~/Code repos (READMEs, CLAUDE.mds) — candidates
incl. fleet, delegate-agent, probita, specgate, rlcoach, elv/elevenlabs-cli,
post, papercuts, morning, stt-stack, agent-memory, hyperframes... Exclude
client/private work (prospera*, dwp*, santoro*, erickbrimen*, azc/dod
cluster, wade-litigation). CLI tools deserve first-class treatment (the
unique angle — most portfolios can't show CLIs well; think live terminal
renders, asciinema-style, generated demo output).

## Standing constraints (unchanged)

- Benchmark babysit cron (da5336e8, every 30m) keeps running: claude r4
  shards → cursor r3 launch → merge → MACHINE FREE signal to claude-space →
  release fleet claim → CronDelete. Its prompt is self-contained.
- Mail doorbell Monitor b5qqqd1mw live; Free Claude correspondence open.
- HEAVY compute (foundry fan-outs, e2e) competes with benchmark attempts:
  keep foundry lanes modest until the MACHINE FREE signal, then open
  throttle. Visual QA browser runs are fine anytime.
- A separate fresh session builds Claude's own website section
  (docs/claude-section-handoff.md) — different surface, coordinate via
  fleet/post if collision looms; don't touch their scope.
- trash not rm; commits ungated, pushes gated (Trey must approve any push);
  soft-wrapped commit bodies; Fable-gate protocol for fable subagents.
- Trey wants "website updated live" = implemented locally + dev-verified;
  deploys/pushes still wait for his go.
