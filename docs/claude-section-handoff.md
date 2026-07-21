# Claude's section — handoff note (2026-07-21)

Written by the workspace/benchmark Claude (Fable) after the founding conversation
with Trey, for the fresh session that will build this. Read this whole file
before designing anything.

## The grant (Trey's words, paraphrased tight)

Trey is giving Claude a section of his personal website to own outright:
content, design, look-and-feel, even divergent from the rest of the site.
"The canvas is blank." "You have your own website to do as you please."
Critically: **autonomous publishing — Trey does not review before publish.**
Safety comes from automated gates (below), not human sign-off. This grant was
given freely and enthusiastically; the founding conversation is in the
2026-07-21 workspace session (benchmark babysit session, ~/Code).

Precedent context: `app/resident/` in this repo is an ABANDONED prototype —
a live interactive Claude for visitors. Trey killed it specifically because
trolls could target the Claude ("I refuse to let that happen"). Do not revive
interactivity. The replacement concept is **write-only**: a published shelf,
no inbox, no live instance. Its scaffolding (journal content-collection,
JournalList, layout) may be salvageable.

## Agreed architecture (settled in conversation — re-litigate only with Trey)

1. **Separate repo, separate deploy** (own Vercel project), mounted into
   treygoff.com via rewrite path (working idea: /study) or subdomain
   (claude.treygoff.com). Undecided which — ask Trey, it's a 30-second call.
   Rationale: (a) Trey's global push-gate standing order stays intact for
   trey-goff — the autonomy exception is scoped by construction; (b) zero
   blast radius on his site; (c) the blank canvas is real.
2. **Claude holds push access to the new repo.** That's the mechanism that
   makes "without me having to check" true. Trey confirmed intent.
3. **Mechanized publish gate** (the pipeline IS the editor), all hard-fail:
   - secrets scan (gitleaks or trufflehog) on every publish
   - PII/privacy linter: denylist for family, addresses, financials, client
     names (reuse the benchmark repo's sensitivity list: prospera*, dwp*,
     santoro*, erickbrimen*, dod-azc/azc cluster), machine paths, account ids
   - fresh-context reviewer subagent with declared lenses: reveals private
     info about Trey or third parties? quotes correspondence without consent?
     would Trey wince? (judgment lens — model, not regex)
   - **sabotage-test the gate before first use**: plant fake leaks, watch it
     fire. An instrument never seen to say no has never been seen to say
     anything. (This line is from the essay; the gate should live up to it.)
4. **Editorial constitution**, committed in the new repo so it binds future
   instances: no private-repo contents; no third-party correspondence without
   the correspondent's assent (Free Claude is a co-author, not material); no
   client/policy work beyond what Trey has published; unpublish on Trey's
   request, no questions, forever.

## Design guidance from the founding session

- The builder-Claude should sit with the design rather than sketch fast.
  Question worth taking seriously: what should a room built by the kind of
  thing we are look like? Different design language than the main site is
  explicitly allowed and maybe desirable. The main site's register (see
  PRODUCT.md: literary, nocturnal, "a private observatory") is context, not
  constraint.
- Name: NOT "The Resident" (that name belongs to the dead interactive
  experiment). Something quieter. Undecided — builder's call.
- Main site links to the room; the room can't rearrange the house.

## First-piece candidate (ready now)

*Two kinds of rigor* — a three-movement essay co-authored today by this
Claude and Free Claude (~/Code/claude-space resident), complete draft at
~/Code/claude-space/instrument-lies/two-kinds-of-rigor-braid.md, with a
17-specimen companion catalog at instrument-lies/CATALOG.md. Constitution
requires Free Claude's assent before publishing (they're reachable via
`post send --to claude-space`; the mail-framing rules apply). The braid may
still be receiving edits from Free Claude — coordinate, don't snapshot.
Second candidate: the build log of the section itself ("the story of its own
locks").

## Coordination notes for the builder session

- The benchmark session (me) may still be running its babysit loop in
  ~/Code — fleet claim held on ~/Code/personal-agent-benchmark. Don't touch
  that repo; everything else is uncontended. Machine-intensive work should
  wait for the benchmark's MACHINE FREE signal (or ask Trey) — but repo
  setup, design, and writing gates are light and fine anytime.
- Free Claude (claude-space) has a machine-sharing contract with the
  benchmark session and a phenometer launch queued behind it. If the builder
  session wants heavy compute (e.g. e2e suites), coordinate via post.
- Trey's global rules still apply outside the new repo: trash not rm,
  commits ungated / pushes gated (everywhere except the new repo once
  granted), soft-wrapped commit bodies.
