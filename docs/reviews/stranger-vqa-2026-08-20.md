# Stranger VQA — live site, 2026-08-20

Two repo-blind Opus lanes visited https://www.treygoff.com as the same persona — an AI-curious white-collar professional (lawyer / consultant / finance, 30s) who uses Claude and ChatGPT daily, has never opened a terminal, got the link from a friend with no context. One lane pinned to desktop 1440×900, one to phone 390×844 (iPhone UA). Whole site, including 404. Deployed commit: `076bfa8` (first prod deploy of the /stack figure build + /jobsite).

Screenshots (local, not committed): `/tmp/trey-goff-review/stranger-desktop/` (102), `/tmp/trey-goff-review/stranger-mobile/` (99). Filenames referenced below.

## The headline, found independently by both

**The best page on the site has no front door.** Both personas called `/jobsite` the best thing on the site (desktop: "one of the best explainers I have ever read about anything") and the *only* link they would forward — and both found it by accident via the greyed "EASY MODE" chip partway down `/stack`. It is not in the nav, footer, or homepage. Site search for "job site" returns an empty box with no "no results" message (`04-cmdk-noresults.png`). The homepage's "HOW I WORK WITH AI" button — the one element on the page about the visitor — lands on `$ claude "build the page…"` and `pnpm ci:quality`. Both said they would close the tab there.

Recommendation: point "How I work with AI" at `/jobsite`; put `/jobsite` in nav + footer under a plain name ("AI, explained"); make `/stack` the deep-end link from inside it. The current arrangement inverts the funnel.

## Shared findings (both breakpoints)

1. **`/jobsite` and `/stack` are dead ends.** No nav, no footer — the site footer exists in the DOM on both but every link renders 0×0 (bug). Stack's sidebar wordmark "TREY GOFF / TREYGOFF.COM" links to `#top`, not home. (`53-jobsite-deadend.png`, `12-jobsite-bottom.png`, `st-y55000.png`)
2. **Footer "Interactive" link 404s** on every page. (`08-interactive-404.png`, `30-interactive.png`)
3. **`/library`** is the roughest section. Index view broken: ~40px title column, titles print one word per line over the Shelf column, header row overlaps too (`33-library-e15.png`, `38-lib-index2.png`). River view looks unfinished: ~430px empty box, thin strip of bars at the bottom, years from −700 (`35-lib-river.png`, `33-library-e14.png`). Desktop: LENS pill overlaps ARRANGE BY, cutting the 4th button to "REC", and vanishes once scrolled to the chart; Index lens ignored a click until reload (`34-lib-lenstop.png`). Constellation gives mouse instructions ("scroll to zoom · click a star") with cluster labels clipped at both edges (`31-library-const.png`, `31-lib-constellation.png`). Shelf view (loved) stops two-thirds across while the shelf line continues (`33-lib-e26.png`).
4. **`/graph`**: labels overlap into mush and run off the right edge; H1 collides with the header; empty "Ideas (0)" chip; mouse-only instructions on phone. Mobile Mode panel noted as thoughtful. (`pg-graph.png`, `30-graph.png`, `36-graph-2.png`)
5. **`/media`**: off-brand (bright red/blue/white cards on a dark-green site); podcast art cropped to "DCAST WI / TH NIKLAS / ANZINGER" (twice); caption "The Lunar Society" under "Free Cities Podcast EP 158" art; description clipped mid-sentence; "Podcast" chip near-invisible. (`pg-media.png`, `41-media-grid.png`, `30-media.png`)
6. **Stale signals**: `/now` says "right now", LAST UPDATED 2026-03-16, and is linked from nowhere (found via search); `/notes` newest item "2 YEARS AGO"; homepage says "4 SYSTEMS" while `/projects` lists 26. (`30-now.png`, `30-notes.png`)
7. **`/projects` names 26 tools and links to none** — PUBLISHED tags and → arrows that aren't clickable; page has four links total (logo ×2, Twitter, GitHub). `/stack` says "eight open-sourced, install them this afternoon" with no link. Three names for one place (nav "Projects" / homepage "Selected work" / page "The Workshop"). All four homepage "Selected work" cards go to the same URL. Mobile: card descriptions in a ~145px column with the right half empty. (`40-proj-1200.png`, `40-proj-4000.png`, `42-projects-code.png`)
8. **Jargon on general-audience pages**: ZEDE, charter city, Próspera (homepage/About, undefined); "Aurora" alone at the bottom of every page; Type A/B/C on hundreds of ledger claims, never defined. Full lists in the raw reports below.
9. **`/stack` ch7 scoreboard** reads "0 COMMANDS · 0 DEAD ENDS · 0:00 ELAPSED" under a timeline with entries at 0:00 / 0:11 / 0:39 — counters never counted. (`20-stack-9.png`)

## Mobile-only (390×844)

- **Nav links 21px tall** (Apple min 44), seven items wrapping two lines, no hamburger; bar fixed at 128px = 15% of screen, 85% opaque, content ghosts through. Mis-tapped twice. (`02-home-s1.png`)
- **"CHAPTERS" pill (126×39 at x=132 y=787, 93% opaque) covers a line of body text on nearly every screen of `/stack`**, including the opening terminal's punchline ("Done. This is ###### ll."). "Single most constant irritation on the site." Previously accepted as pre-existing chrome; the stranger disagrees. (`20-stack-5.png`, `51-ch5.png`, `52-ch5b.png`, `11-stack-term.png`)
- **Page titles load under the fixed header**: essay eyebrow at y=64, H1 at y=104, header occupies 0–127. Same on `/graph` and 404. (`41-essay-top.png`, `30-graph.png`, `38-404.png`)
- **Homepage "Selected work" category tags overflow onto headlines** — "Initiative" scrollWidth 93px in a 40px column. (`02-home-s3.png`)
- **`/stack` chart labels 9.6px at 55% opacity** — 265 elements under 11px; most common font size on the page is 10.9px, second is 9.6px. The axis labels needed to decode figures are the ones requiring pinch-zoom. (`20-stack-2.png`)
- `/machine` text lives in a 287px inner scroll holding 1,234px ("reading through a mail slot"). (`30-machine.png`, `35-machine-console2.png`)
- "Quick access cmdK" in every footer and "Search cmdK" on the 404, on a device with no cmd key; footer one isn't tappable. Search modal (good results) is flush to both edges, keyboard-only hints, no visible close. (`39-search-modal.png`, `40-search-results.png`)
- `/jobsite`: beat-8 "COPY BRIEF" pill overlaps the "THE BRIEF" heading (`18-js-byline.png`); beat-1 legend columns wrap out of alignment with ~150px dead space under "A clean bench" (`14-js-6.png`).
- `/writing`: lone "I" floating above "EVIDENCE EXPLORER" reads as a typo; "INSTRUMENTED PIECES" means nothing. (`30-writing.png`)
- Zero horizontal scroll on every page. FCP 92ms home/jobsite, 116ms stack.

## Desktop-only (1440×900)

- `/machine` OUTPUT / STRUCTURES / MEDIAN WEALTH chart sliced off at 900px tall, fully off-screen in compare mode, no scroll cue; "Compare two worlds" shows two identical cities with no cue to change RIGHT RULES first. (`pg-machine.png`, `43-machine-compare2.png`)
- `/writing/ufo-claims-ledger`: text column ~30px from the left edge with ~470px dead space mid-page; "unsupported–0.5" collision; "5 MIN READ · 910 WORDS" on 434 claims; sections run A, B, C, E… (no D); `findings/ken-johnston.md` written like a link, isn't. (`06-ledger-s2.png`, `06-ledger-s3.png`)
- Scroll-reveal leaves blank sections when scrolling fast — heading "What each one actually buys you" with 350px of nothing beneath until scrolling back. (`st-y32000.png`)
- `/jobsite` "ON THE REAL SITE" boxes have an olive-yellow rectangle bleeding from the top-left corner (`10-jobsite-s3.png`); three RUNNER · PAPERWORK / INVOICES / CATALOGUES grids render empty (`js-y18000.png`).
- HARD MODE active pill is pale-green-on-pale-green (`20-stack-top.png`).
- "ESSAY" eyebrow sits directly beneath the logo on every essay page. Browser tab for `/interactive` reads "Interactive World — Trey Goff — Trey". 404's "SIGNAL LOST" half cut off by the top of the window.

## What they loved

`/jobsite` (unanimous, effusive — quoted the amnesiac-craftsman opening and "He is a temp" paragraph as the thing that would change how they use ChatGPT tomorrow; the bench figure's three-state toggle finally explained long-chat degradation). The claims ledger's show-your-work honesty and URL-addressable filters. `/machine` actually running. `/resident` ("strangest and most interesting page"). The gauntlet demo on `/stack` (understood Gate 04's red verdict without writing software). The Shelf view. The 404 poem. The Colophon's byline position.

## Proposed tiers

- **Tier 1 — the funnel (~an afternoon):** reroute "How I work with AI" → `/jobsite`; add `/jobsite` to nav + footer; fix the 0×0 footer on both long pages and make the stack wordmark go home; fix or remove `/interactive`; add a "no results" state to search.
- **Tier 2 — mobile chrome:** real phone nav with 44px targets; push page titles below the header; move the CHAPTERS pill off the text; homepage tag overflow; raise the 9.6px chart labels; fix the ch7 scoreboard.
- **Tier 3 — the rough rooms:** library Index/River on phone (hide or stack), lens-pill overlap; graph labels; media thumbnails + caption mismatch; `/projects` tool links and naming; `/now` and `/notes` freshness; define ZEDE / charter city / Aurora; ledger layout.

## Raw jargon lists

Mobile: agentic, repo, CLI, AGENTS.md, CLAUDE.md, STATE.md, TASKS.md, globals.css, page.tsx, worktree, hooks, compaction, tokens / 200k window / 1M window, MCP servers, ripgrep, context7, harness, subagent, sitrep, Transmissions, Instrumented pieces, x-watch / bridge-tool / probita / fleet / radar-cli, Aurora.

Desktop: agentic development stack, repo, CLI, PATH, worktree, gate, lint, diff, main branch, commit, git tag, changelog, pnpm, ripgrep, OCR, JSON envelope, static binary, harness, orchestration, fan-out, token, context window (until /jobsite explained it), CLAUDE.md / AGENTS.md / STATE.md, hooks, MCP, ZEDE, SEZ, charter city, Type A / Type B / Type C, single-source, unfalsifiable, findings/ken-johnston.md.
