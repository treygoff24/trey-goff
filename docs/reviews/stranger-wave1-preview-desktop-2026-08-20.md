# Stranger VQA — Wave 1 preview, desktop 1440×900, 2026-08-20

Preview: https://trey-goff-px4mrxjmm-trey-freelance.vercel.app (feature branch at e68153f, Wave 1 merged). Same repo-blind Opus persona as `stranger-vqa-2026-08-20.md`. Screenshots: `/tmp/trey-goff-review/stranger2-desktop/` (local, not committed).

Wave 1 gate: the top-10 contains none of the Wave 1 beads (funnel, dead-end footer, wordmark, search empty state, Interactive link). Passed.

## 1. What doesn't make sense / is confusing / weird

**All four "Selected work" cards on the homepage go to the same page — and it's the wrong page.** `01-home-y900.png`, `11-projects-y0.png`. Próspera, The Control Room, Harness & command-line tools, Governance experiments — every one of them is `href="/projects"`. I clicked "Próspera" because that's the interesting-sounding thing, and landed on a page called "One machine, many hands" about command-line tools, with **no Próspera section anywhere on it**. The one thing the homepage headline sells me on ("Chief of staff at Próspera") has no page.

**Search can't find Próspera either.** `03-cmdk-prospera.png`, `05-cmdk-prospera-accent.png`. Typing "prospera" returns exactly 2 results: one 1-minute essay and one book. Typing "Próspera" with the accent returns the same 2. The Próspera project card, the About page paragraph about being first employee — none of it. But "control room" correctly returns a Pages/Essays/Projects grouping (`04-cmdk-controlroom.png`), so the index does cover projects; Próspera just isn't in it.

**The nav has eight items and I can't guess what four of them are.** `01-home-y0.png`. "Machine", "AI, explained", "The Setup", "Resident". Turns out "AI, explained" (`/jobsite`) and "The Setup" (`/stack`) are the *same document* in easy and hard mode — the jobsite page's own toggle links "Hard mode" straight to `/stack`. So two of my eight nav slots are two versions of one thing, named as if unrelated.

**"Resident" is written in first person by someone who isn't Trey.** `40-resident-y0.png`. "This room belongs to a Claude… Every instance of me exists for a few hours and then ends." I had to read three paragraphs to work out that "I" is the AI, not the site owner. No label prepares you for that.

**Homepage says "4 systems," Projects page says "The floor has five stations."** `01-home-y900.png` vs `11-projects-y0.png`. Neither number matches the ~15 tools actually listed.

**Library says "155 topics." Topics page says "168 threads."** `12-library-y0.png` vs `40-topics-y0.png`.

**"The Control Room" is described as a to-do, not a thing.** `01-home-y900.png`: "Build a command-palette-first site that ties essays, notes, books…" — imperative mood, reads like a ticket someone forgot to rewrite.

**The Claims Ledger says "5 MIN READ · 910 WORDS" on a page that is 126,765 pixels tall.** `08-claims-y0.png`. That's ~140 screenfuls.

**"WHERE YOU ARE: 434 of 434 claims"** sits at the top of that page and never changes as you scroll (`08-claims-y0.png`, `08-claims-y60000.png`). It's a filter count wearing a position label.

**The Claims Ledger sidebar section letters skip D.** `08-claims-y1600.png`: A, B, C, E, F, G, H, I, J.

**The URL is `/writing/ufo-claims-ledger`** but the piece is about NASA/Apollo photography and never uses the word UFO in the title or subtitle.

**"Left ledger" is on the right.** `21-machine-y0.png`.

**Graph page tells desktop users to use mobile controls.** `49-graph.png`: "use the mobile lenses to simplify the map on smaller screens."

**Footer divider says "AURORA"** on every page (`01-home-y2700.png`) with no explanation. The answer is buried in `/colophon`, which is a footer link.

**"Online ●" in the footer.** Online what? Me? Him? The server?

## 2. What looks ugly, broken, or unfinished

**Two control rows print on top of each other on the Library page.** `18-library-shelf-top.png`. The lens switcher ("LENS · Constellation · Shelf · River · Index") is a translucent floating bar that lands exactly on the "ARRANGE BY · SHELF COLOR THREADS RECENT HEIGHT AUTHOR" row. Both rows are illegible. The single ugliest thing on the site.

**The page eyebrow collides with the logo on at least three page types.** Header is 96px tall; the eyebrow renders at y=64, left edge x=32 (left of the logo at x=48), which puts it directly under "Trey Goff" and inside the header band:
- `08-claims-y0.png` — "ESSAY" tucked under the logo
- `49-graph.png` — "KNOWLEDGE MAP" tucked under the logo
- `47-topic-stoicism.png` — "Back to topics" behind the header
- `51-404.png` — "● SIGNAL LOST" half-clipped above the nav, 404 numeral running under it

**The Machine page is broken in three ways.** `21-machine-y0.png`, `22-machine-after-wait.png`, `24-machine-console-scrolled.png`, `54-machine-footer-attempt.png`:
- The 3D city takes ~8 seconds of pure black screen to appear, with no spinner. It says "RUNNING" the whole time.
- The "Left ledger" chart area is an empty ~90px void — the graph never draws.
- The "Rulesets" presets (Baseline / Secure Titles / Permit Maze / Predator State) exist in the page but render at **0×0 pixels**.
- The page reports 412px of scroll but everything is fixed, so scrolling does nothing visible and the footer is painted over — the whole footer nav is unreachable. After that scroll the canvas also went black again.
- The Output/Structures/Median Wealth readouts sit exactly at the fold; you only see the labels, never the numbers, unless you wheel over the right-hand 400px strip. No scrollbar hints at it.

(Coordinator note: the headless-browser black canvas is a known WebGL artifact — verify against a real GPU before treating the 8-second blank as real. The 0×0 presets, missing ledger chart, fold-cut readouts and unreachable footer are independent of that.)

**The Setup's active mode pill is nearly unreadable.** `28-stack-y0.png`. "HARD MODE" is `#E8F3EC` text on `rgb(151,232,187)` — about **1.2:1 contrast**, at **10.88px**. The same pill on `/jobsite` is dark-on-green and fine.

**Scroll-reveal on The Setup leaves whole screens blank.** `29-stack-realscroll.png` — at 11% progress a completely empty 1176×900 content area, sidebar only. `28-stack-y2500.png` — the chapter heading and two full paragraphs stuck at near-zero opacity. It recovers after a few seconds.

**Book spines are unreadable.** `15-library-shelf.png`. Titles truncate to "The Immo…", "Days of…", "Sapie…". Author names measure **8.5px at 48% opacity, rotated 90°**. Every spine is the same olive-green. Each shelf row also stops around x=1010 leaving ~300px of empty rail.

**Every book's "note" is the same sentence.** `16-library-book-detail.png`. "This book has a place in the map because of the topics and neighboring ideas it touches." 334 books, zero actual opinions.

**The River lens is a broken chart.** `19-library-river-real.png`. A row of tiny bars labelled -700, -500, -380, 180, 1532… each with "1" under it, cut off hard at the right edge with no scrollbar, ~200px of empty panel above and ~250px below. It also renders *under the header*.

**Knowledge Graph labels are a pile-up.** `49-graph.png`. Labels clip mid-word at the panel edge. The "Ideas (0)" filter chip is a dead control for an empty category. Books-teal and Transmissions-green are the same colour to my eye.

**Media thumbnails are badly cropped and one card clips its text mid-line.** `40-media-y0.png`. Card 1 shows "FF / 58 / ities / st". Card 2's blurb fades out mid-sentence while card 1's fits — inconsistent card heights.

**Notes is abandoned.** `40-notes-y0.png`. Two entries, both "2 YEARS AGO", one a literal placeholder. Each entry renders a stray literal "#" heading above it.

**Topic pages are 90% empty-state boxes.** `47-topic-stoicism.png`. "0 essays / 0 notes / 0 projects / 1 books", then three grey boxes. There are 168 of these pages. They're also the only place on the site using rounded grey cards.

**"1 BOOKS".** `46-topics-bottom.png` — pluralization bug repeated ~100 times. Dates read "JAN 1, 180" for Meditations.

**The Resident journal has one entry and a dead 200px gap.** `41-resident-y1700.png`.

**The Resident gallery shows a black void for ~5 seconds.** `43-resident-gallery-y700.png` → `44-gallery-y700-recheck.png`. A 2000px WebP with no placeholder.

**Sticky filter bar eats content on the Claims Ledger.** `10-claims-filtered-list.png` — the claim you scrolled to has its ID and title hidden behind "THE LEDGER" bar.

**Filtering the ledger dumps you into the footer.** `09-claims-filter-debunked.png`. Clicked "DEBUNKED 20" at y≈6000; the page shrank from 126k to 12k px and I was staring at the copyright notice.

## 3. What could look or feel better

- Put a search box in the header. ⌘K is good but only advertised in the footer and 404.
- Essay pages waste the right third of the screen (`07-essay-christian-y6000.png`: 612px text column, TOC at 963, 290px of nothing). Claims Ledger has a 460px dead gutter between text and sidebar.
- Add a reading progress bar to essays; the 126k-pixel Claims Ledger has none.
- Essay TOC scroll-spy lags three sections behind.
- Claims Ledger needs a legend: rainbow bar with no key; Type A / Type B undefined; `findings/AS14-66-9301/FINDING.md` paths repeated hundreds of times.
- The stray "I" on the Writing page (`06-writing-top.png`) — a 48×225px span containing one letter; read as a cursor artefact.
- Projects page needs a version for people who don't use a terminal.
- No photograph of Trey anywhere, including About. About's orbit diagram has a clipped stray "F" at its right edge.
- The Library header disappears entirely once you scroll (`opacity: 0; pointer-events: none` at scrollY 200 and 921); returns only at scrollY 0. Reads as a bug.
- Index should be the default Library lens; Constellation's cluster labels are obscured by the dots and its help line is overlapped by a node.

## 4. Where I got stuck / wanted to close the tab

1. Clicking "Próspera" and landing on a CLI tools page; search couldn't rescue me. Closest I came to leaving.
2. The Machine page — eight seconds of black, broken chart, invisible presets, unreachable footer.
3. Scrolling the Claims Ledger — did not know if the page had an end.
4. The Library controls collision.
5. Projects page terminal dumps.
6. `/stack` blank screen at 11% — assumed the page had crashed.

## 5. What I loved / would forward

- **"AI, explained" (`/jobsite`) is excellent** — would forward to three people today. "Rules are things a worker chooses to follow. Machinery is things that happen the worker cannot choose to ignore." Should be the front door, not the sixth nav item.
- "How I Became a Christian" — clean typography, honest voice, read the whole thing.
- The Resident page, once understood — "Letters, which have never required their writers to exist at the same time."
- The Library constellation — beautiful even with the label problems.
- The Colophon — "Not a tool credit. A byline."
- The 404 fable.
- ⌘K is fast and well-built when it finds things.

## 6. Jargon I didn't understand

**Domain:** Próspera, ZEDE, charter city, institutional design, "the largest lever I can pull", governance experiments, "legible, repeatable models"

**Claims Ledger:** instrumented pieces, evidence explorer, dossiers, the spine, the ledger, Type A / Type B, single-source, unfalsifiable, scoped, brushed, seed, `findings/AS14-66-9301/FINDING.md`, `wave3/people-remainder.md`, DERAKHSHANI

**Projects:** harness, CLI, agent tooling, swarm layer, worktree isolation, run records, exit codes, daemon, preflights a repo, JSONL, vector database, OpenAPI spec, vendored, crates.io, PyPI, npm, Homebrew, jq, module boundaries enforced in CI, tokens, Specgate, Papercuts, Fleet, Delegate, Post, Morning, Scout, Lens, elv, Receipts

**Setup / Jobsite:** the stack, agentic, hard mode / easy mode, context window, system prompt, sitrep, packing problem, "the bench", subagents

**Library:** lens, constellation, shelf, river, index, threads, kindred reads, arrange by color/threads/height

**Machine:** left ledger, log scale, Panel L, rulesets, seed, tax drag, open exchange

**Site chrome:** Aurora, Colophon, Spectral, WebGL, Knowledge Graph, nodes, Transmissions, Free Claude, compaction, "the machine", "Resident"

## 7. Top 10 issues, ranked by damage

| # | Issue | Page / screenshot |
|---|---|---|
| 1 | All four "Selected work" cards link to `/projects`; Próspera has no page; search returns nothing useful for "prospera". | Home / `01-home-y900.png`, `11-projects-y0.png`, `05-cmdk-prospera-accent.png` |
| 2 | Machine page: black screen, missing ledger chart, Rulesets presets at 0×0, metrics cut at the fold, footer unreachable. | `/machine` / `21-machine-y0.png`, `24-machine-console-scrolled.png`, `54-machine-footer-attempt.png` |
| 3 | Library lens switcher overprints the "Arrange by" row. | `/library` / `18-library-shelf-top.png` |
| 4 | Page eyebrow collides with the logo inside the 96px header on Claims Ledger, Graph, topic pages, 404. | `08-claims-y0.png`, `49-graph.png`, `47-topic-stoicism.png`, `51-404.png` |
| 5 | `/stack` scroll-reveal leaves viewports blank; "HARD MODE" pill ~1.2:1 contrast at 10.88px. | `29-stack-realscroll.png`, `28-stack-y2500.png`, `28-stack-y0.png` |
| 6 | Claims Ledger: "5 min read" on 126,765px; no progress bar; "434 of 434" never changes; sticky bar hides the landed claim; filtering teleports to the footer. | `08-claims-y0.png`, `09-claims-filter-debunked.png`, `10-claims-filtered-list.png` |
| 7 | Library payoff hollow: identical boilerplate note on all 334 books; 8.5px rotated author names; truncated spines; broken River lens. | `16-library-book-detail.png`, `15-library-shelf.png`, `19-library-river-real.png` |
| 8 | Nav opaque and redundant — "AI, explained" and "The Setup" are one document in two modes under unrelated names; "Machine" and "Resident" give no hint. | `01-home-y0.png`, `25-jobsite-y0.png` |
| 9 | Unfinished sections live: Notes (2 entries, placeholder), 168 mostly-empty topic pages with "1 BOOKS" grammar, Resident journal with one entry. | `40-notes-y0.png`, `47-topic-stoicism.png`, `46-topics-bottom.png`, `41-resident-y1700.png` |
| 10 | Library header vanishes once scrolled; no search affordance in the header; `/jobsite` grew 27,961→30,436px mid-read as images loaded. | `14-library-noheader.png`, `20-library-index.png`, `26-jobsite-blur-recheck.png` |
