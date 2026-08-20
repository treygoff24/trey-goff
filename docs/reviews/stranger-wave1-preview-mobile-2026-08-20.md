# Stranger VQA — Wave 1 preview, mobile 390×844, 2026-08-20

Preview: https://trey-goff-px4mrxjmm-trey-freelance.vercel.app (feature branch at e68153f, Wave 1 merged). Same repo-blind Opus persona as `stranger-vqa-2026-08-20.md`, iPhone UA, DPR 3, touch forced on over CDP (`agent-browser set device` alone leaves `pointer: coarse` false). Screenshots: `/tmp/trey-goff-review/stranger2-mobile/` (71 files, local). Note: `15b-library-River-top.png` is actually the Index view.

Wave 1 gate: the top-10 contains none of the Wave 1 beads. One Wave 1 regression caught: the search palette opens with focus on the new mobile close button instead of the input (fixed at the coordinator by moving the close button after the input in DOM order).

## 1. What doesn't make sense / is confusing

- **Nav labels don't match the pages they open.** "Projects" → "The Workshop" (`10-projects-top.png`). "Machine" → "The Compound Machine". "AI, explained" → URL `/jobsite`, page titled "The Job Site". "The Setup" → `/stack`. Four of eight nav items rename themselves on arrival.
- **"Machine" and "Resident" mean nothing from the nav.** "Resident" is written in first person *by the AI* — took three paragraphs to work out (`10-resident-top.png`).
- **Search is a bare word in the footer.** A 44×44 borderless text button reading "Search" at y=4150 on the homepage with a huge blank gap under it; reads as a search box that failed to render (`01-home-y3500.png`). No search in the header. (Coordinator note: the bordered pill + magnifier shipped in e68153f, after this preview.)
- **Keyboard hints everywhere on a touch device.** "⌘K" on the 404, "G H / G W / G L" in the palette (`02-search-open.png`), "scroll to zoom · drag to pan · click a star" on the Library constellation (`12-library-graph.png`), "Drag across the strip — or tab into it and use the arrow keys" in the UFO essay (`25-ufo-y1200.png`), "Click on nodes... hover to see connections" on /graph (`17-graph-top.png`).
- **"● Online" in the footer.** Online what?
- **"AURORA" divider** at 10px, 60% opacity, unexplained.
- **/machine, /jobsite and /stack strip the site nav.** From a shared `/jobsite` link you are in a walled garden with one small "← treygoff.com" link and 41 screens between you and the footer.
- **Library "River" view** (`15-library-River.png`): unlabeled numbers `-700, -500, -380, 180, 1532` with "1" under each, no title or legend.
- **Every book gets the same description** (`30-book-detail.png`).
- **Search palette opens with focus on the CLOSE button**, not the input (`document.activeElement` = the × button). No keyboard pops up.

## 2. Ugly / broken / unfinished (worst first)

1. **`/writing/agent-long-term-memory` — every line runs off the right edge and you cannot scroll to it.** `document.scrollWidth = 611px` on 390; `.prose` is 595px wide from x=16; `scrollX` locked at 0. Cause: a `<code class="language-yaml">` block laid out at **671px**. A 6,819-word flagship essay is unreadable on an iPhone (`23-essay-memory-top.png`, `24-essay-memory-hscroll.png`). Only this essay of seven is affected.
2. **`/machine` — half the controls are unreachable.** `body { overflow: hidden }`, layout locked to viewport height. "Open exchange" and "Tax drag" sliders at `top: 862px` on an 844px viewport; scrolling does nothing (`10-machine-top.png`, `16-machine-y900.png`).
3. **Article titles render under the fixed header.** H1 top = 104px, header bottom = 127px. "ESSAY" eyebrow at y64–80 collides with the "Writing" nav link (`22-essay-christian-y0.png`). (W2-1/W2-2 territory — already merged post-preview.)
4. **`/graph` — H1 covers all eight nav links** (`17-graph-top.png`).
5. **Library Index view — columns print on top of each other.** Header reads "Ti**Sh**el**f**"; "Onyx" overprinted with "Fantasy" (`15b-library-River-top.png`).
6. **Homepage "Selected work" meta labels overflow into the titles** — "INSTITUTIONS" prints through "Próspera" (`01-home-y1400.png`). (W2-4 — merged post-preview.)
7. **A stray cyan "I" on `/writing`** — a `span.font-mono` reserved 286px wide containing exactly "I", still "I" after 8 seconds. Looks like a typewriter animation that died on character one (`07-writing-stuck-I.png`).
8. **Library category filters render at 0×0.** Thirteen buttons exist in the DOM, `display: block`, `opacity: 1`, inside a flex parent with height 0. The filtering UI is invisible on mobile.
9. **`/stack` — wide diagrams clipped with no horizontal scroll.** An SVG at y≈44532 is 768px wide inside `overflow: visible`; another set at y≈86400+ starts at x=434, entirely off-screen (`20-stack-svg-y44450.png`).
10. **Floating pills cover content.** "CHAPTERS 06" over the terminal punchline and over "fusion-council-skill.md" (`19-stack-y0.png`). (W2-3 — merged post-preview.) The Library's view-switcher bar over the dark footer is a barely-visible smudge (`13-library-tabbar-check.png`).
11. **A blank white book cover.** `/covers/hillbilly-elegy.jpg` loads (300×451) but is pure white (`30-book-detail.png`). Isolated.
12. **Constellation is half off-screen.** Top half cut above the container, bottom half of the box empty; cluster labels sliced (`10-library-top.png`, `12-library-graph.png`).
13. **Dead vertical space.** ~330px of black between the last featured essay and the footer on the homepage; ~350px on `/library` after the graph.
14. **Media card mismatch.** "Free Cities Podcast EP 158" art captioned "The Lunar Society"; the "🎙 Podcast" chip sits over the title in the artwork (`17-media-top.png`).
15. **`/notes` has one item, two years old**, under a plural heading.
16. **The 404's giant glitch "404" renders through the nav links**; header `background-color` is `rgba(0,0,0,0)` with `backdrop-filter: none`, so content bleeds through it on every page (`01-home-y2100.png`). (W2-1 made the mobile bar opaque — merged post-preview.)

## 3. What could look or feel better

- **The three-column essay list is a desktop grid crushed into a phone.** On `/writing` the title column is **141px on 390** — one or two words per line, 9 lines for the memory essay title (`08-writing-y1300.png`). Same on the homepage's featured essays and `/projects` (descriptions wrap at ~219px, right 44% empty). Stack these on mobile.
- **Header is a permanent two-row block eating 127px.** (W2-1.)
- **Tap targets under 44px:** nav links 21px; footer links 20px; footer Colophon-RSS-Graph 16px tall; Library view tabs 33px; `/machine` sliders 20px tall; book spines minimum 33px wide, packed edge to edge.
- **Type under 11px:** homepage first line "PRÓSPERA · PUBLIC POLICY · SOFTWARE" is 10.88px; footer "AURORA" 10px at 60%; hero CTA buttons 11.52px.
- **Dot separators drop when text wraps** — "21 sections3 dossiers" in raw text; the "·" is CSS-generated and vanishes at line breaks (`07-writing-stuck-I.png`).
- **Search results panel clips a section header with nothing under it** — "Books" heading at the clipped bottom edge, no scroll affordance (`04-search-governance.png`). A book icon is used for a "Notes" result.
- **No photo of Trey on `/about`.** No email or mailto anywhere — only X and GitHub.
- **Shelf view truncates titles**, rotated 90°.
- **Page lengths are absurd on a phone.** UFO ledger 166,214px ≈ 197 screens; `/stack` 86,563 ≈ 102; `/jobsite` 34,758 ≈ 41; Library Index 61,423; Topics 14,975 (168 items, flat, no search). No reachable mid-page jump or back-to-top on most.
- **`/topics` prints the count twice** — "63" and "63 BOOKS".
- **A canvas animates at 61fps continuously** on the homepage — battery.
- Performance is genuinely good: TTFB 26ms, FCP/LCP 120ms, CLS 0.

## 4. Where I got stuck / mis-tapped / wanted to close the tab

- **The 4px nav dead zone.** Rows at y66–87 and y91–112; `(30, 89)` hits nothing; `(30, 95)` opens "AI, explained" when aiming for "Writing". (W2-1.)
- **`/machine`** — dragged, nothing scrolled, two sliders cut off, no nav. Assumed broken.
- **The Library constellation.** Instructions are mouse-only; `touch-action: auto` so dragging scrolls the page; half the graph off-screen; the view-switcher went invisible over the footer.
- **The agent-long-term-memory essay** — words disappear off the right edge with no way to pan. Immediate close.
- **Getting from a deep page back out.** No header on `/jobsite`/`/stack`; none at all on `/machine`.
- Credit: essay ends have a "Follow the thread from here" block that works (`28-essay-end-above-footer.png`), though the three buttons wrap 2+1 and there is no next/previous essay.

## 5. What I loved / would forward

- **`/jobsite` ("AI, explained") is the best thing here and it's not close.** The amnesiac-craftsman opening reframed AI agents in one paragraph. Full-width text, comfortable measure. The Easy/Hard mode toggle is a great idea. **This is the link I'd forward.**
- **The Library Shelf view** — the one thing that felt like a place rather than a page.
- **The Constellation** on first load, before you try to touch it.
- **The 404 fable.**
- **The Compound Machine's voxel city** — wanted to play with it and couldn't reach the controls.
- **The Colophon.**
- **The Time Spine chart** in the UFO essay.
- The serif headlines, when they aren't fighting a grid.

## 6. Jargon I didn't understand

`Machine` · `Resident` · `The Setup` · `CLI & agent tooling` · `Harness` · `agent infrastructure` · `command-palette-first` · `ZEDE` · `charter city` · `INSTRUMENTED PIECES` · `EVIDENCE EXPLORER` · `DOSSIERS` · `The Constellation` · `Shelf` / `River` / `Index` · `THREADS` (sort) · `HEIGHT` (sort) · `kindred reads` · `ROUTES` (footer heading) · `Colophon` · `Graph` · `RSS` · `AURORA` · `● Online` · `⌘K` · `G H` / `G W` / `G L` · `The Workshop` · `Coordination / verification / senses / discipline / play` · `Scout` · `Receipts` · `Sol` / `Luna` / `Terra` · `~/.claude/skills.globals` · `META / HARNESS` · `MY MACHINE` · `MD ↓` · `delegate-agent` · `delegate-workflows` · `resume-handoff` · `find-skills` · `weekly-maintenance` · `fusion-council-skill.md` · `Synthesis inherits every objection still standing` · `no backpressure on the queue` · `PARSE IS MEMO…` · `structured-markdown memory` · `context-engine` · `RAG` · `embedding-based search` · `YAML frontmatter` · `voyage-4-large` · `agentic development stack` · `AGENTS.md` · `globals.css` · `page.tsx` · `hydration`

## 7. Top 10 issues, ranked by damage

| # | Issue | Page | Screenshot |
|---|---|---|---|
| 1 | Body text overflows the right edge with no horizontal scroll; `scrollWidth 611px` on 390, caused by a 671px YAML `<code>` block. | `/writing/agent-long-term-memory` | `24-essay-memory-hscroll.png` |
| 2 | Page can't scroll (`body{overflow:hidden}`); sliders 3 & 4 at `top:862px` permanently off an 844px screen. | `/machine` | `16-machine-y900.png` |
| 3 | H1 under the fixed header (104 vs 127px); "ESSAY" eyebrow collides with the "Writing" nav link. | all `/writing/*` | `22-essay-christian-y0.png` |
| 4 | H1 "Knowledge Graph" overlaps all 8 nav links. | `/graph` | `17-graph-top.png` |
| 5 | 21px nav targets with a 4px gutter; constant mis-taps. | sitewide | `01-home-top.png` |
| 6 | Index table columns overprint ("Ti**Sh**el**f**", "Onyx"+"Fantasy"). | `/library` Index | `15b-library-River-top.png` |
| 7 | Desktop 3-column grid crushed into 390px: 141px title column, one word per line. | `/writing`, homepage, `/projects` | `08-writing-y1300.png` |
| 8 | Constellation half-clipped and non-interactive on touch; 13 category filters at 0×0; view-switcher invisible over the footer. | `/library` | `12-library-graph.png`, `13-library-tabbar-check.png` |
| 9 | Search exists only as a bare word in the footer; opening it focuses the close button, not the input. | sitewide | `01-home-y3500.png`, `02-search-open.png` |
| 10 | "Selected work" meta labels overflow a 40px column through the H2. | `/` | `01-home-y1400.png` |

Honorable mentions: the stray cyan "I" on `/writing`; the 768px SVG clipped with `overflow:visible` on `/stack`; floating "CHAPTERS" pills; the blank white Hillbilly Elegy cover; the 404 digits through the nav; nav labels that rename themselves on arrival.
