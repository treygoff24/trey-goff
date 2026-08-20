# Stranger VQA — Wave 2 preview, mobile 390×844, 2026-08-20

Preview: https://trey-goff-a1jcw8zkq-trey-freelance.vercel.app (feature branch at 02ce610, Waves 1–2 merged). Same repo-blind Opus persona; iPhone UA, DPR 3, touch forced over CDP (`pointer: coarse` true, `maxTouchPoints` 5, all taps via `Input.dispatchTouchEvent`). Screenshots: `/tmp/trey-goff-review/stranger3-mobile/` (97, local).

**Wave 2 gate: FAILED on one bead.** Top-10 #1 is the W2-1 phone menu: opened after scrolling, the sheet painted a 32px strip of background with its links printed over live page text (`08-menu-open.png`, `09-menu-settled.png`). Root cause: once scrolled the header gains `backdrop-filter`, which makes it the containing block for its `fixed` child, so the sheet was trapped inside the 64px bar. The worktree reviewer had only opened it at scrollY 0. Fixed at the coordinator by rendering the sheet as a sibling of the header (verified 780px tall with opaque background while the header is blurred); the sheet also gained a Search row (top-10 #7). The chapter pill (#8) behaves as designed — hides 1.6s after the reader stops, returns on any scroll/touch — the persona disliked the disappearing act; left as a Trey call.

## Top 10 by damage

| # | Issue | Page | Evidence | Status |
|---|---|---|---|---|
| 1 | Mobile menu renders with no background; links print over page content | every page | `08-menu-open.png`, `09-menu-settled.png` | fixed (coordinator) |
| 2 | Essay body 595px wide in a 390 viewport (`scrollWidth 611`); one `<pre>` blows out the grid column | `/writing/agent-long-term-memory` | `54-essay-memory-overflow.png` | W3-8 merged |
| 3 | Library Index: Title column 0px wide, titles overlay Shelf values ("TiShelfe") | `/library` Index | `62c-lib-index-settled.png` | W3-1 |
| 4 | Library view switcher untappable once the footer scrolls under it (footer divs win `elementsFromPoint`) | `/library` | `60-lib-shelf.png` | W3-1 r2 (portal) |
| 5 | River view effectively empty — tiny bars over ~800px of black, cut off right, switcher gone | `/library` River | `61b-lib-river.png` | W3-1 r2 |
| 6 | No site navigation on `/stack`, `/jobsite`, `/machine`; exit is a footer 86,000px down | flagship pages | `33-stack.png`, `40-jobsite-top.png` | open — Trey call |
| 7 | Search only in the footer; palette input jumps 102px down after typing | every page | `07-home-f.png`, `11-search-open.png` → `12-search-setup.png` | Search row added to the sheet; input jump open |
| 8 | Chapter pill hides on idle and covers text while visible | `/stack` | `st-4300.png`, `34-stack-pill-idle.png` | by design — Trey call |
| 9 | Sub-44px tap targets: footer links 20.4px, RSS 21×16, chapter-sheet rows 25.8px, library tabs 32.5px, Machine sliders 20px; figure labels at 10.7px | footer, `/stack`, `/library`, `/machine` | measurements | footer fixed by W3-5; machine by W3-7; stack rows/library open |
| 10 | Desktop-only instructions and stale content on phones: graph hover/scroll copy, "⌘K" on the 404, `/now` five months old and unlinked, newest note 2 years old, "5 min read" on 197 screens | `/graph`, 404, `/now`, `/notes`, ledger | `gr-1400.png`, `53-404.png`, `27-now.png` | W3-2, W3-5, coordinator read-time fix; 404 ⌘K open |

## Other findings

- The Setup's "orchestrator" figure has a ~290px hole (`.sfig-stage` 218px tall with one 82px window) (`st-42000.png`).
- Media "🎙 Podcast" badge stamped over the artwork's wordmark; EP 158 art captioned "The Lunar Society" (`25-media.png`). W3-3.
- "Selected work" tags render as two stacked labels ("SOFTWARE" / "ACTIVE" on its own line) at 12.175px — reads as a wrapping accident (`03-home-b.png`). Follow-up to W2-4.
- "Featured essays" heading squeezed to 170px and wraps; "All writing →" wraps at 12.175px in a 99×32 target (`04-home-c.png`).
- ~350px empty panel before the homepage footer (`06-home-e.png`).
- The Setup's terminal boxes are ~1150px black voids until their animation plays; the ASCII "Welcome to Claude Code" box is mangled at phone width (`st-11000.png`).
- Topic pages repeat the same four numbers three times; "1 essays" (`52-topic-ai.png`).
- Constellation labels near-black on black and overlapping (`22-library.png`). W3-1.
- The last search result is sliced by the panel's bottom edge (`13-search-job-site.png`); every "Pages" result gets a house icon.
- Job Site illustrations cropped through the character's head at common scroll positions.
- Bullets on Now and Notes have no markers.
- Jobsite "chapters 6 and 10 , and chapter 10" — floating space before the comma (`js-21000.png`). Sentence fixed at the coordinator; check the space.
- SVG label census on /stack: 67 at 12px, 29 at 10.7px, 6 at 11px, 6 at 11.5px — the 10.7px ones ("stage 1 · extract", "agent — check claim 1") are "squint territory at 74% opacity".
- Automation note: `agent-browser click` on the menu button hung >120s; CDP touch worked immediately.

## Loved

The Job Site (best explanation of AI agents the persona has read; would forward to three people today); The Setup's typography and chapter sheet; the Library constellation and Shelf; the 404; the Resident and Colophon; the writing throughout ("Commits are my undo; pushes are the only thing that leaves the building.").

## Jargon

Nav/chrome: Ways in · Aurora · ● Online · Colophon · RSS · The Resident · Transmissions · The Compound Machine · The Workshop · Constellation / Shelf / River / Index · Threads · appearances. Homepage: CLI · agent tooling · harness · command-palette-first · knowledge graph · institutional designer · ZEDE · charter city · SEZ. The Setup: context window · tokens · system prompt · pretraining data · context engineering · agentic · frontier models · SOTA · YOLO mode · hallucinate · CLAUDE.md / AGENTS.md · repo · git / commit / push / diff / patch · worktree · orchestrator · sub-agent · gate · hooks · sitrep · compaction · grepping · N+1 queries · dead exports · migration · Vitest · Postgres · Next.js · model names · the trough · retrieval accuracy by position. Graph: lenses · quick entry points · nodes. Elsewhere: epistemics · Type A / Type B · wave3/photo-remainder.md · Fable · — F.
