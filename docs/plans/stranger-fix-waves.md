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
| W3-1 library phone | Luna | `components/library/*` | Index and River lenses hidden below `md` (or Index becomes a stacked list); lens pill no longer overlaps "Arrange by"; lens pill stays reachable when scrolled; Shelf spines fill the row. |
| W3-2 graph | Luna | `components/graph/*` | Labels hidden until hover/selection or decluttered; H1 clears the header; "Ideas (0)" chip hidden when empty; touch instructions on coarse pointers. |
| W3-3 media | Gemini | `app/media/*`, media CSS, `content/media*` | Cards use site tokens; thumbnails object-fit without chopping titles; caption matches artwork (EP 158 Free Cities Podcast); no clipped descriptions. |
| W3-4 projects | Luna | `app/projects/*`, `content/projects/projects.json` | Tool rows with a public repo link to it; `/stack` "eight open-sourced" sentence links to `/projects`; one name for the page across nav/homepage/title; homepage count matches. |
| W3-5 freshness | Gemini | `app/now/*`, `app/notes/*`, nav arrays | `/now` either updated by Trey (blocker) or relabeled "Last updated …" without the "right now" claim; `/notes` hidden from footer if still stale; `/now` linked from footer. |
| W3-6 glossary | Gemini | `app/page.tsx`, `app/about/*`, `components/layout/Footer.tsx` ("Aurora"), ledger essay | ZEDE / charter city / Próspera get a one-line gloss on first use; "Aurora" gets a tooltip or is removed; Type A/B/C defined at the top of the ledger. |
| W3-7 ledger + machine layout | Luna | `components/instruments/ledger/*`, `components/machine/*` panel | Ledger text column aligned with other essays; read-time honest; section letters contiguous; machine data panel scrolls with a visible cue and compare mode fits 900px. |

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
