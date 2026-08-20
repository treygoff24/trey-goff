# Stranger-fix waves — plan of record

Source: `docs/reviews/stranger-vqa-2026-08-20.md`. Approved by Trey 2026-08-20 ("full plan approved, do it").

Workflow: Luna (`delegate codex work --model luna --reasoning-effort medium`) and Gemini 3.7 Flash (`delegate omp work --model gemini`) build in isolated worktrees, one bead per lane, no two lanes sharing a file. Native Opus reviews every branch (perf/correctness + layout/UX, told to refute), loops ≤3 rounds, then the coordinator merges in dependency order and runs the canonical gate. Visual verification is two repo-blind Opus stranger personas on a preview deploy, plus one code-aware Opus VQA lane. Beads is non-functional in this repo (`bd` 1.1.2 vs the January db), so this file is the graph.

Lane rule: Luna gets React state / routing / logic; Gemini gets CSS, typography, copy, mechanical sweeps. First Gemini bead is a calibration run.

## Wave 1 — the funnel

| Bead | Lane | Files owned | Acceptance |
|---|---|---|---|
| W1-1 funnel reroute | Luna | `app/page.tsx`, `components/layout/TopNav.tsx`, `components/layout/Footer.tsx` (nav arrays + CTA only) | Homepage "How I work with AI →" goes to `/jobsite`; TopNav and Footer carry "AI, explained" → `/jobsite` next to "The Setup" → `/stack`; `/jobsite` appears in the footer's page list; hidden-chrome logic still treats `/jobsite` like `/stack`. |
| W1-2 dead ends | Luna | `components/stack/stack.css` (footer rule only), `components/jobsite/jobsite.css` (footer rule only), `components/stack/StackRail.tsx`, `components/stack/StackShell.tsx` (closing block only), `components/jobsite/JobSiteShell.tsx` (head/closing only), mirrors | Site footer renders with real, clickable links at the bottom of `/stack` and `/jobsite` (not 0×0); stack's closing "Return to the top" block keeps working above it; the stack rail wordmark links to `/`; jobsite's `.js-head` carries a home link to `/`; jobsite closing offers "Back to treygoff.com" alongside "Hard mode, chapter 1". |
| W1-3 search | Luna | `scripts/generate-search-index.ts`, `public/search-index.json` (regenerated), `components/command/CommandPalette.tsx` | Searching "job site", "jobsite", "setup", "stack" returns `/jobsite` / `/stack` entries with descriptive titles; a query with zero hits visibly renders "No results found" (diagnose why `CommandEmpty` doesn't show — likely cmdk's built-in filter hiding it or the list having no items to anchor on); palette footer hints hide on touch/coarse-pointer devices and a visible close button exists on narrow viewports. |
| W1-4 footer hygiene (Gemini calibration) | Gemini | `components/layout/Footer.tsx` (Quick-access block + links list only — coordinate: W1-1 edits the nav arrays in the same file; Gemini's diff must be confined to the "Interactive" entry and the Quick-access block) | "Interactive" link removed; "Quick access ⌘K" becomes a real button that opens the palette via `useCommandPalette()`, shows "Search" text on coarse-pointer devices and the ⌘K kbd only on fine-pointer ones. |

Merge order: W1-4 → W1-1 (both touch Footer.tsx; resolve by hand if needed) → W1-2 → W1-3.

## Wave 2 — mobile chrome

| Bead | Lane | Files | Acceptance |
|---|---|---|---|
| W2-1 phone nav | Luna | `components/layout/TopNav.tsx`, `app/globals.css` (nav rules) | Below `md`: a single-row bar with wordmark + a 44×44 menu button opening a full-width sheet of 44px-tall links; bar height ≤64px; page content not ghosting through. |
| W2-2 titles under header | Gemini | `components/site/EditorialHeader.tsx`, `app/graph/*` header, `app/not-found.tsx`, `app/globals.css` | First heading on essay pages, `/graph`, and 404 starts below the fixed header at 390px and 1440px (scroll-padding / top offset). |
| W2-3 CHAPTERS pill | Gemini | `components/stack/stack.css` (rail-toggle rules), `components/stack/StackShell.tsx` (toggle markup only if needed) | Pill no longer overlaps body text at 390px: bottom-right corner placement with safe-area inset, ≤48px wide collapsed (icon + pct), expands on tap. |
| W2-4 homepage tags | Gemini | `app/page.tsx` (selected-work grid classes only), `app/globals.css` | Category tags never overflow their column at 360–430px; grid collapses to stacked tag-above-title. |
| W2-5 chart labels | Gemini | `components/stack/*.css` label rules below 0.68rem, `components/stack/widgets.tsx` SVG text sizes | No text-bearing label under 0.68rem / 10.5px rendered at 390px on `/stack`; figure axis labels ≥ 60% opacity. |
| W2-6 ch7 scoreboard | Luna | the ch7 figure that renders "0 COMMANDS · 0 DEAD ENDS · 0:00 ELAPSED" | Counters track the timeline as it plays; final state shows the real totals. |

## Wave 3 — the rough rooms

| Bead | Lane | Files | Acceptance |
|---|---|---|---|
| W3-1 library phone | Luna | `components/library/*` | Index and River lenses hidden below `md` (or Index becomes a stacked list); lens pill no longer overlaps "Arrange by" at 1440; lens pill stays reachable and visible when scrolled (not a smudge over the footer); the 13 category filters render at real size on phones (currently 0×0); the Library header no longer sets `opacity:0; pointer-events:none` once scrolled; Shelf spines fill the row. |
| W3-2 graph | Luna | `components/graph/*` | Labels hidden until hover/selection or decluttered; H1 clears the header; "Ideas (0)" chip hidden when empty; touch instructions on coarse pointers. |
| W3-3 media | Gemini | `app/media/*`, media CSS, `content/media*` | Cards use site tokens; thumbnails object-fit without chopping titles; caption matches artwork (EP 158 Free Cities Podcast); no clipped descriptions. |
| W3-4 projects | Luna | `app/projects/*`, `content/projects/projects.json`, `app/page.tsx` selected-work hrefs, `lib/search/generate-index.ts` | Tool rows with a public repo link to it; `/stack` "eight open-sourced" sentence links to `/projects`; one name for the page across nav/homepage/title; homepage count matches; the four "Selected work" cards link to distinct destinations (Próspera → About's Próspera section or an anchor, not `/projects`); "prospera"/"Próspera" in search returns the About page and the Próspera card. |
| W3-5 freshness | Gemini | `app/now/*`, `app/notes/*`, nav arrays | `/now` either updated by Trey (blocker) or relabeled "Last updated …" without the "right now" claim; `/notes` hidden from footer if still stale; `/now` linked from footer. |
| W3-6 glossary | Gemini | `app/page.tsx`, `app/about/*`, `components/layout/Footer.tsx` ("Aurora"), ledger essay | ZEDE / charter city / Próspera get a one-line gloss on first use; "Aurora" gets a tooltip or is removed; Type A/B/C defined at the top of the ledger. |
| W3-7 ledger + machine layout | Luna | `components/instruments/ledger/*`, `components/machine/*` panel | Ledger text column aligned with other essays; read-time honest; section letters contiguous; machine data panel scrolls with a visible cue and compare mode fits 900px; at 390px all four sliders and the Rulesets presets are reachable (no `overflow:hidden` lock, presets not 0×0) and the footer is reachable at 1440. |
| W3-8 essay overflow | Gemini | `app/globals.css` prose rules, `components/mdx/*` code block | `/writing/agent-long-term-memory` has `scrollWidth === 390` at 390px: `pre`/`code` blocks scroll inside their own `overflow-x:auto` container and never widen `.prose`. |
| W3-9 stack polish | Gemini | `components/stack/stack.css` (mode pill, reveal), `components/stack/*.css` wide figures | "HARD MODE" active pill ≥4.5:1; scroll-reveal never leaves a viewport blank (reveal on intersection with a generous rootMargin, no opacity hold); every figure wider than 390px pans inside `overflow-x:auto` with the swipe hint; the `/writing` lone "I" typewriter fragment resolved. |

Wave 1 preview stranger reports (`docs/reviews/stranger-wave1-preview-{desktop,mobile}-2026-08-20.md`) added W3-8, W3-9 and widened W3-1, W3-4, W3-7. Their remaining findings are content or out of scope for this run: boilerplate book notes, empty topic pages and "1 BOOKS" grammar, no photo on About, essay-list grid on phones, Resident journal, Hillbilly Elegy cover, keyboard hints on touch outside the palette.

## Gates per wave

1. Lane: `pnpm install --prefer-offline` in its worktree, then `pnpm ci:quality` green, commits on its branch.
2. Opus review pair per branch → fixes → re-review, ≤3 rounds.
3. Coordinator: merge in order onto `feat/stack-figures-and-jobsite`, `pnpm ci:quality` + `pnpm test:e2e --project=chromium`.
4. Preview deploy → two stranger personas + one code-aware VQA lane. Their top-10 must not contain this wave's beads.
5. Cold scroll → one push.

## Run ledger

Wave 1 merged at b64b786 (W1-4 f0b2633 → W1-1 22ab342 → W1-2 3e445a1 → W1-3 eff662b). Perf + layout Opus pairs gave MERGE on every branch; W1-2 and W1-3 each took two fix rounds plus coordinator hand commits.

Rulings:
- Ruling: beads is broken in this repo, this file is the work graph — `bd` 1.1.2 can't open the January db — cost if wrong: no ledger for `bd ready`, tracked here instead.
- Ruling: nav label for /jobsite is "AI, explained" — plain-language name per the stranger report — cost if wrong: a rename across nav, footer, palette, and the search index.
- Ruling: restore the real site footer on /stack and /jobsite rather than a custom one — one footer to maintain — cost if wrong: the footer's token system differs from the page roots (a visual seam, flagged for VQA).
- Ruling: removed the /interactive footer link instead of flipping the feature flag — the route is gated off on purpose — cost if wrong: the link comes back with the flag.
- Ruling: W2-1 and W2-2 merged into one Luna bead — both are the phone header — cost if wrong: a larger diff to review.
- Ruling: committed Gemini's uncommitted W1-4 diff on its behalf after the OMP output cap killed the lane — diff was complete and intact in the worktree — cost if wrong: none beyond authorship.
- Ruling: hand-fixed W1-4 (SearchButton extraction), W1-2 closing-link hierarchy/tap target, and W1-3 round 3 (`shouldFilter={false}`, icons, live region) at the coordinator instead of another lane round — the fixes were fully specified by the reviewers — cost if wrong: coordinator edits carry less review; the browser verifier and the gate cover them.
- Ruling: W1-3 round 3 skipped a second perf re-read — the diff was exactly the reviewer's prescription and the browser lane measured the behavior — cost if wrong: a regression in cmdk keyboard selection (spot-checked manually).
- Ruling: /jobsite search-index title changed to "AI, explained" to match nav — one name per page — cost if wrong: searches for "The Job Site" still hit via keywords.
- Ruling: Wave 2 lanes launched off b64b786 before the coordinator gate finished — each lane runs the gate itself — cost if wrong: rebase churn if the merged gate fails.
- Ruling: Gemini lanes must redirect gate output to a file — the 16MB delegate stdout cap killed W1-4 — cost if wrong: none.
- Ruling: jargon glosses and the /now freshness copy are Trey's calls (Wave 3 blockers), not lane work.

Wave 2 merged at 402694d (W2-6 413a301 → W2-4 c687e3e → W2-3 7703c52 → W2-1 cef57f8 → W2-5 402694d), then coordinator commits 2ff6188 (W2-1 nits), 6fa32e2 (palette focus regression from the Wave 1 mobile stranger), 87590ff (W2-5 review fixes + idle-fading pill replacing the W2-3 gutter). Wave 1 preview stranger gate passed on both breakpoints; reports in `docs/reviews/stranger-wave1-preview-{desktop,mobile}-2026-08-20.md`.

Wave 2 rulings:
- Ruling: W2-4 changed the desktop meta track to `minmax(8.5rem, 0.18fr)` as well as the phone stack — the overflow root cause was the fixed column — cost if wrong: a slightly wider tag column on desktop.
- Ruling: W2-3 reserves a ~67px right gutter on /stack ≤1080px so the pill never sits on text — the stranger called the overlap the single most constant irritation — cost if wrong: 17% narrower text column at 390 and a shoved-left read at 1024; alternative (fade the pill on scroll-idle) flagged for Trey.
- Ruling: W2-6 dims un-played steps to opacity 0.06 instead of hiding them — the timeline shape stays visible while the counters play — cost if wrong: a faint ghost row on high-brightness phones.
- Ruling: accepted W2-6's lane gate without its build step — the concurrent `next build` lock across worktrees blocked it — the merged coordinator gate covers it — cost if wrong: none once the merged gate is green.
- Ruling: hand-fixed three preview-VQA nits (colophon flex row, CommandShortcut hidden on coarse pointers, SearchButton magnifier) at the coordinator (e68153f) instead of a lane round — cost if wrong: less review on small CSS.
- Ruling: the W2-5 round-1 brief wrongly listed recovery-figure, fresh-eyes, tool-line, done-summary, collision-figure as already floored; round 2 expands the lane's ownership to those files — the reviewer found 28 of the 30 remaining offenders there — cost if wrong: a bigger diff to merge against W2-6's recovery-figure.css change.
- Ruling: W2-5's base-rule (desktop) size bumps are accepted rather than scoped to ≤1080px; only the named desktop regressions (rail-mark wrap, `.why-axtitle` overflow, FanOut OUT node, `.wf-note` clip) and the SVG mis-measurements get fixed — slightly larger desktop labels are fine, 106 media-query wraps are not — cost if wrong: desktop figures read a touch looser than designed.
- Ruling: hand-fixed W2-1's review nits (duplicate "Close menu" name, 404 top padding, label-flip e2e) at the coordinator — fully specified, nav e2e 21/21 — cost if wrong: none beyond less review on three lines.
- Ruling: parked W2-1 N3 (⌘K while the phone sheet is open stacks the palette over it) — one Escape clears both with no state leak and it is a keyboard path on a touch sheet — cost if wrong: a rare double-modal on tablets with keyboards.
- Ruling: hand-fixed the W2-5 FIX-FIRST list at the coordinator instead of a third Gemini round — every item had a file, a number, and a one-line fix; measured in-browser at 390 and 1440 afterwards — cost if wrong: less independent review; the Wave 2 code-aware VQA lane re-measures.
- Ruling: replaced the W2-3 right gutter with an idle-fading pill — the 67px gutter shrank every narrow /stack figure to 270px (vs 321) and put all their SVG labels back under the 10.5px floor, so W2-3 and W2-5 were fighting; the pill now hides 1.6s after the last scroll/touch/key and returns on any of them — cost if wrong: a reader who wants chapters has to nudge the page first; the pill is unreachable to a static hit-test while hidden (`pointer-events: none`), which the personas will notice if it matters.
- Ruling: accepted a 7.3-unit right margin for the collision figure's "one working tree, one copy" caption against the brief's ≥8 — the 8 was my own stretch for `.wf-note`, the text is fully inside the viewBox — cost if wrong: none visible.
- Ruling: `.wt-narrow`, `.why-*`, `.psn-region-s` SVG labels, pre-existing under the floor on base, were raised at the coordinator as part of the W2-5 close-out rather than a new bead — same acceptance criterion, five lines — cost if wrong: none.
- Ruling: the Wave 1 mobile stranger's "search is a bare word in the footer" is treated as addressed by e68153f (bordered pill + magnifier) which shipped after that preview — cost if wrong: the Wave 2 personas say so.
