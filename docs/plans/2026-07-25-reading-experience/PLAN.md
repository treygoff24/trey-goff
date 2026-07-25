# Reading Experience — Phase 2 build plan

**Date:** 2026-07-25 · **Status:** r2 — patched after Sol xhigh review (codex-29, FIX-THEN-SHIP, all 12 findings folded)
**Basis:** reading-bakeoff Phase 1 verdict — opus-5's publication structure + unchained's epistemic instruments — plus three moves adopted from ai-2040.com (reviewed live 2026-07-25).

## Objective

Replace "markdown in a nice column" with a publication system where each piece ships as an *edition*: designed reading surface, persistent epistemic instruments, and evidence one interaction away. This is the reason the bakeoff existed.

## The thesis (unchanged from the bakeoff)

Every page makes its own bets visible and shows what would prove it wrong. The instruments carry the argument:

- **Time spine + claims ledger** (UFO piece): terrain, rug, brush; verdict chips; disclosed-construct method note.
- **True margin notes** (policy paper): pinned footnotes with interval-packing collision resolution; authorities table; scope marks.
- **Self-audit control** (essay): marked passages in four kinds (killed / his-read / counter-evidence / refused), one switch lights them all; dated two-sided forecast card with resolution date + status enum.

## Adopted from ai-2040.com

1. **Scroll-synced state rail** — `InstrumentRail`, state keyed to reading position; desktop rail, sticky strip below 1024px.
2. **Sourced stat dialogs** — `<Stat>` with a "sources and details" dialog.
3. **URL-addressable state** — filter/brush/audit state in the query string, shareable.

**Not building:** branching narrative, audio narration, view transitions / scroll-linked animation / lightboxes. Instruments over decoration (bakeoff verdict).

## Naming (Sol F4)

The Archivist product already owns `edition` (`/edition`, `/api/edition`, `lib/edition/*`, `EditionCatalogItem`). The reading layer is named **instruments**: `lib/instruments/`, `components/instruments/`, `content/instruments/<slug>/`. A piece with an instrument manifest is an "instrumented piece" everywhere in code and docs.

## The renderer seam (Sol F1 — the load-bearing decision)

Today `/writing/[slug]` renders `markdownToHtml()` → one sanitized HTML string (`app/writing/[slug]/page.tsx:52,129`; `lib/markdown.ts`). The `components/mdx` map has no runtime consumer. Inline React instruments cannot hydrate through that pipeline.

Decision: **instrumented pieces get a separate render path; ordinary essays keep `markdownToHtml` untouched.**

- `lib/instruments/render.ts` processes the piece's markdown to a final HAST (same remark/rehype chain as `lib/markdown.ts` — wikilinks, sanitize, slug), then compiles it to React via `hast-util-to-jsx-runtime` with a component map for instrument nodes. No flag day: the branch is taken only when a manifest exists for the slug.
- **Mark anchoring runs against this final HAST, not source text** (Sol F6): each mark is located by (section anchor, exact substring, occurrence index) and must resolve to a *unique* span of text nodes in the final tree — spans crossing element boundaries are split into multiple wraps at compile time. The build fails unless every mark maps uniquely to emitted markup. This keeps unchained's fail-loudly invariant but aims it at the tree the reader actually gets.

## Architecture

```
lib/instruments/
  types.ts          Claim, Verdict, Mark, Scope, Stat, ForecastCard — typed + zod-validated at build
  manifest.ts       per-piece instrument manifest (accent, instruments, data refs)
  render.ts         the HAST→React seam above
  url-state.ts      client-only URL codec (see below)
content/instruments/<slug>/
  claims.json       (ledger pieces)
  marks.json        (audited pieces) — authoring data, lives with content
components/instruments/
  InstrumentRail.tsx   scroll-synced rail; rendered only inside the instrument branch (Sol F5).
                       On instrumented pieces it REPLACES the existing TableOfContents in the
                       right column (it subsumes scrollspy); ordinary essays keep their TOC.
                       Accent provider wraps the instrument branch only — no app/writing/layout.tsx
                       is created (none exists today; adding one would wrap the index + every essay).
  TimeSpine.tsx        terrain + rug + brush; terrain memoized
  ClaimLedger.tsx      server-rendered rows — ALL of them (no virtualization; Sol F9: 434 claims
                       are fine, and offscreen rows break Find/print/a11y/deep links. Revisit only
                       on measured evidence at real scale). Slide-over dossier <dialog>.
  MarginNotes.tsx      pinned footnotes w/ interval-packing stack
  AuditLayer.tsx       mark rendering + one-switch control (anchoring per renderer-seam rules)
  Stat.tsx, ForecastCard.tsx
  charts: Slope.tsx, Series.tsx, Bars.tsx, Timeline.tsx
```

**URL state (Sol F11):** client-only codec in `url-state.ts` — `useSearchParams` under Suspense + `history.replaceState`, same pattern as `lib/interactive/store.ts`. The page **never reads the server `searchParams` prop** (would deopt SSG). Codec validates every param, drops unknown-invalid values silently, preserves the hash and unrecognized params, and restores state on back/forward via `popstate`.

**House rules:** aurora token system stays authoritative; per-piece accent via the instrument-branch provider; no hardcoded rgba.

## Launch content (Sol F2)

The UFO claims ledger is the only public piece of the three — it launches the system.

- **Canonical article:** `content/essays/ufo-claims-ledger.mdx` (real frontmatter, so it enters `allEssays`, `generateStaticParams`, feeds, and the Archivist catalog like any essay). Slug: `ufo-claims-ledger`.
- **Data:** `content/instruments/ufo-claims-ledger/claims.json`, copied from the bakeoff repo's `content/ufo` with a recorded SHA-256 of the source files in the manifest (provenance without referencing the never-pushed repo at build time).
- **Schema validation at build:** zod-parse claims.json; assert the registry invariants as fixtures — 435 canonical IDs covering 434 claims, `C145` unassigned, per-claim verdict totals used over the coverage note's stated totals (the bakeoff's own documented discrepancies become the test cases).
- Gate: only `content/instruments/ufo-claims-ledger/` is created in Wave 1. The AZC paper and immigration essay stay out of the tree entirely until Wave 2, and there they exist **only behind the existing authenticated preview route** (Sol F10): `/preview/writing/[slug]` with its production cookie auth + secret bootstrap, unchanged. Noindex is not access control; we don't add any new preview surface.

## Bundle isolation (Sol F3)

`scripts/check-bundle-isolation.ts` today protects route *prefixes* against a heavy-package list; it would pass even if every essay shipped instrument code. Extend it:

- Add an **instrument sentinel** (a marker string compiled into `components/instruments/*` chunks).
- After build, assert the sentinel appears in the client chunks of the instrumented slug's page and in **no** non-instrumented essay slug's chunks (compare two concrete built slugs).
- Runs where it already runs: `postbuild` (so `pnpm build` and `ci:quality` cover it automatically).

## Waves (dependency-ordered — Sol F7)

**Wave 1 — data contracts & seam (no routes yet)**
1. `lib/instruments/types.ts` + zod schemas + manifest loader; claims.json + invariant fixtures.
2. `render.ts` HAST→React seam + mark-anchoring compiler with unique-resolution build check (proved on a test fixture, not live content).
3. `url-state.ts` codec + unit tests (validation, restoration, hash/unknown-param preservation).

**Wave 2 — the ledger ships**
4. Bundle-isolation sentinel extension (before any instrument reaches a route).
5. `InstrumentRail` shell (replacing TOC in-branch), `TimeSpine`, `ClaimLedger`, dossier slide-over.
6. `ufo-claims-ledger.mdx` + manifest; instrument branch wired in `app/writing/[slug]/page.tsx`.
7. Full gate + visual QA loop (below). **Ships.**

**Wave 3 — audit grammar, behind auth**
8. `AuditLayer` + `MarginNotes` + `Stat` + `ForecastCard` + chart kit, built against the mark-anchoring compiler.
9. The two unshipped pieces wired via the authenticated preview route only. Publishing later = content commit.

**Wave 4 — integration**
10. Publication cover section on `/writing`; cross-nav between instrumented pieces.
11. Archivist awareness (Sol F12): join an `instrumented` flag into the **client catalog mapping only** (`app/edition/page.tsx`), never into `lib/edition/prompt.ts` serialization; add a fixture test asserting byte-identical prompt output for a fixed catalog before/after. The cached 28k prompt must not move.
12. `/edition` → `/` swap: separate decision, out of scope.

## Verification (Sol F8 — the repo's real gates)

- **`pnpm ci:quality`** — the canonical gate (fmt:check, type-aware lint, full typecheck, unit tests, build + postbuild incl. bundle isolation). Never bare `pnpm fmt` (mutating) as a gate.
- **e2e:** `pnpm test:e2e --project=chromium --project=mobile-chrome` explicitly (default config includes both WebKit projects, unavailable on this machine). Cover: filter/brush → URL → reload restore; dossier open/close focus return; back/forward state.
- **Contrast:** automated sweep asserting ≥4.5:1 on every text/verdict color pair in the instrument components (script, not eyeball) — unchained's measured-contrast discipline, made executable.
- **Reduced motion:** Playwright with `reducedMotion: 'reduce'` emulation asserting no non-trivial transition/animation durations on the instrumented page and that all content renders without motion gating.
- Visual QA loop on the shipped ledger at 390/768/1024/1440/1920.

## Risks (remaining after r2)

- **Mark anchoring across element boundaries** is the hardest code in the plan; it's isolated in Wave 1 step 2 with fixtures, before any UI depends on it.
- **Rail vs. site header:** the rail lives under the existing global chrome; prototype scroll-sync inside the current two-column grid before styling.
- **Claims data drift:** the source repo is offline-only; the manifest's recorded hashes are the provenance record. Any regeneration re-records hashes.
