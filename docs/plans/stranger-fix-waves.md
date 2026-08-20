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
