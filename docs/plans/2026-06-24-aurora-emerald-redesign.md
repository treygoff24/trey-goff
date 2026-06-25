# Aurora-Emerald Redesign Implementation Plan

**Branch:** `feat/full-ui-redesign`  
**Handoff source:** `docs/designs/2026-06-24-personal-website-redesign-concept/`  
**Status:** implementation complete on `feat/full-ui-redesign`; post-implementation native `agent-browser` visual QA rounds and final automated gates completed.

## Source references

- `Design Handoff.dc.html` — visual system, Library integration, production notes.
- `Trey Goff - Home.dc.html`, `Writing.dc.html`, `Projects.dc.html`, `About.dc.html` — page-specific layout, copy, and motion references.
- `Trey Goff - Home (concepts).dc.html`, `Structure options.dc.html` — exploratory context only; do not implement conflicting variants unless they match final shots.
- `handoff/shots/*.png` — golden reference captures. Expected: 14 files.
- `handoff/assets/aurora-emerald.png` — static aurora fallback/reference asset.
- `Library.dc.html` — prototype behavior for constellation, shelf, river, index, drawer.
- `library-data.js` — test/dev-only golden oracle for 334 book category assignments; expected exports are `LIBRARY` and `CATEGORIES`.
- `static/aurora-veil.html` — WebGL aurora reference only; do not port blindly.

## Direction

**Visual thesis:** Near-black emerald editorial site with a single living aurora field, Spectral-led literary hierarchy, Hanken body text, Geist Mono labels, and one restrained green accent carrying every interaction.

**Content plan:** Home establishes the thesis and routes into Writing, Projects, Library, and About; Writing/Projects/About become quiet ruled indexes; Library becomes the signature interactive surface with four lenses over one derived book graph.

**Interaction thesis:** One global aurora layer, one soft entrance rise/fade, and one high-value Library interaction system: pan/zoom constellation, bottom lens switcher, category dimming, and a unified detail drawer.

## Non-negotiables from the handoff

- Palette: `#04130C` ground, `#061A10` surface, `#6FD69A` accent, `#97E8BB` hover, `#E8F3EC` text; secondary text via opacity.
- Fonts: Spectral for logo/H1-H3/pull quotes, Hanken Grotesk for body/UI copy, Geist Mono for labels/data/buttons.
- Primary nav: `Writing`, `Projects`, `Library`, `About` in that order. Demoted routes remain reachable through command/search/footer/sitemap.
- Cards are replaced by ruled editorial rows except where a drawer/modal is the actual interaction.
- Library visible lenses: `Constellation`, `Shelf`, `River`, `Index`. Marginalia is out of scope until blurbs are dense enough; Stats is optional/future.
- Library categories are the 12 green-cyan shelves from the handoff.
- Constellation encodes centrality from topic threads, not rating. Ratings exist for only 8/334 books; no read dates exist.
- `/graph` remains the all-content Sigma/Graphology page. `/library` uses the books slice of the same source data with a custom canvas/layout.
- Covers appear in detail surfaces, not as constellation nodes.
- Respect `prefers-reduced-motion`: no continuous GPU/CPU loops for users requesting reduced motion.

## Architecture boundaries

- `content/library/books.json` accessed through `getAllBooks()` remains the only production source of book data.
- Production code must not import from `docs/designs/**`; handoff files are references and test/dev oracles only.
- Server Components own data loading and JSON-LD. Client islands own interaction only.
- `lib/library/aurora.ts` owns derived Aurora book metadata, category mapping, deterministic graph data, sort helpers, and layout inputs. Split it later only if the file becomes a proven maintenance problem.
- `lib/graph/generate.ts` remains the all-content graph owner. Only narrow pure adapters/helpers may be shared.
- `/library` Constellation does **not** use Sigma, Graphology, Three, R3F, or postprocessing.
- `/graph` continues to use its existing dynamically loaded Sigma graph island and may display Aurora book metadata without depending on Library lens layout/pan/zoom state.
- This plan intentionally supersedes the handoff's "shared graph engine / adapt GraphCanvas" implementation note: `/library` gets a pure Aurora book graph plus custom 2D canvas; `/graph` stays the Sigma/Graphology all-content surface.

## Aurora category source of truth

| Code | Label | Hue | Ring order |
| --- | --- | ---: | ---: |
| `scifi` | Sci-Fi | 230 | 1 |
| `science` | Science | 196 | 2 |
| `growth` | Self & Growth | 186 | 3 |
| `business` | Business | 178 | 4 |
| `econ` | Economics | 168 | 5 |
| `politics` | Politics | 158 | 6 |
| `phil` | Philosophy | 148 | 7 |
| `religion` | Religion | 138 | 8 |
| `history` | History | 128 | 9 |
| `lives` | Lives | 118 | 10 |
| `fiction` | Fiction | 205 | 11 |
| `fantasy` | Fantasy | 218 | 12 |

Implementation must document the 33 current genre-to-category mappings plus topic-routing rules for generic genres such as `non-fiction`. Any remaining handoff parity gap may use a tiny `AURORA_CATEGORY_OVERRIDES` map keyed by book id, with a comment that it exists to match the design oracle.

## Verification gates by phase

Use focused gates first, then broader gates at the end.

- Static gate: `pnpm content:sync && pnpm fmt:check && pnpm lint && pnpm typecheck`
- Focused single test command, when needed: `pnpm content:sync && node --import tsx --test test/<file>.test.ts`
- Build/bundle gate: `pnpm build` (runs postbuild asset budgets and bundle isolation) plus `pnpm check-bundle-isolation` when bundle-sensitive files change.
- Final gate: `pnpm ci:quality`.

## Phase 0 — Handoff, asset, and baseline inventory

**Parallel:** no  
**Blocked by:** none  
**Owned files:**

- `.oxlintrc.json`
- `docs/designs/2026-06-24-personal-website-redesign-concept/**`
- `docs/plans/2026-06-24-aurora-emerald-redesign.md`
- optional committed baseline path only if useful: `docs/designs/2026-06-24-personal-website-redesign-concept/baseline-current/**`

**Tasks:**

1. Keep the moved design package under `docs/designs/2026-06-24-personal-website-redesign-concept/`.
2. Verify assets are present:
   - exact 14-shot manifest:
     - `home-desktop.png` 924x540
     - `home-mobile.png` 402x540
     - `writing-desktop.png` 924x540
     - `writing-mobile.png` 402x540
     - `projects-desktop.png` 924x540
     - `projects-mobile.png` 402x540
     - `about-desktop.png` 924x540
     - `about-mobile.png` 402x540
     - `library-desktop.png` 924x540
     - `library-mobile.png` 441x540
     - `lens-constellation.png` 924x540
     - `lens-shelf.png` 924x540
     - `lens-river.png` 924x540
     - `lens-index.png` 924x540
   - `library-desktop.png` and `library-mobile.png` are full Library page chrome; `lens-*` shots are lens-specific states.
   - `handoff/assets/aurora-emerald.png` exists.
   - `library-data.js` exports `LIBRARY` and `CATEGORIES`; `LIBRARY` parses to exactly 334 records.
   - `content/library/books.json` count = 334.
3. Do not ship the `.dc` runtime (`support.js`) as app code.
4. Keep the raw design handoff out of app lint/build surfaces. `docs/designs/**` is reference material and should be ignored by Oxlint; otherwise `support.js` from the handoff runtime fails the static gate despite not being app code.
5. Use `library-data.js` only in tests/dev verification as a golden oracle. Production code derives from `getAllBooks()`.
6. Capture a pre-change baseline before visual implementation:
   - current screenshots for `/`, `/writing`, `/projects`, `/about`, `/library`, `/graph` at desktop and mobile
   - current `pnpm build` status if feasible
   - current first-load/bundle isolation output for `/`, `/library`, `/graph`
   - current reduced-motion and Library keyboard path notes

**Gate:** read-only checks, `pnpm lint`, and optional screenshot capture; no app code modified.

**Acceptance:** Handoff package is in repo, golden assets/counts are verified, and any committed baseline screenshots live only under the explicit baseline path.

## Phase 1 — Global visual system and aurora layer

**Parallel:** no  
**Blocked by:** Phase 0  
**Owned files:**

- `lib/fonts.ts`
- `app/layout.tsx`
- `app/globals.css`
- `components/layout/TopNav.tsx`
- deleted/retired: `components/layout/MobileNav.tsx`
- `components/layout/Footer.tsx`
- new: `components/layout/AuroraBackground.tsx`
- `components/command/CommandProvider.tsx`
- `scripts/check-bundle-isolation.ts`
- if static fallback is copied for production: `public/aurora-emerald.png`

**Tasks:**

1. Swap font loaders to the handoff stack while preserving legacy aliases:
   - Spectral -> `--font-display` and existing `--font-newsreader-font`
   - Hanken Grotesk -> `--font-body` and existing `--font-satoshi-font`
   - Geist Mono -> `--font-label` and existing `--font-mono-font`
   - Keep Tailwind classes like `font-satoshi`, `font-newsreader`, and `font-mono` working until later cleanup.
2. Replace warm/cyan theme tokens with Aurora-Emerald tokens and focus/selection states. Disable the old body radial/starfield background once the aurora layer exists.
3. Add only the shared utilities used by several pages:
   - `.tg-page`, `.tg-section`, `.tg-eyebrow`, `.tg-display`, `.tg-standfirst`, `.tg-rule-row`, `.tg-action`, `.tg-action-secondary`, `.tg-rise`
4. Build `AuroraBackground` as a progressive enhancement:
   - static CSS or static image fallback first, zero-JS readable page before WebGL initializes
   - WebGL client island only; no Three/R3F/postprocessing/framer-motion/Sigma/graphology imports
   - cap DPR, e.g. `Math.min(devicePixelRatio, 2)`
   - implement emerald palette in shader math or precolored uniforms; do not rely on a full-viewport CSS filter as the production color transform
   - reduce or replace the prototype's expensive per-pixel 120-star loop
   - pause on `document.visibilityState === 'hidden'`
   - under `prefers-reduced-motion`, render once or use static fallback; do not keep rAF running
   - listen for reduced-motion changes
   - handle shader compile/link failure and `webglcontextlost` / `webglcontextrestored`
   - `aria-hidden`, `pointer-events: none`, visually below nav/dialog content
5. Remove `StarfieldClient` from the home route; one global background only.
6. Simplify primary nav to `Writing`, `Projects`, `Library`, `About`. Match the handoff masthead on desktop and mobile: no visible hamburger or search button in the primary chrome. Demoted routes remain reachable through footer/sitemap and the keyboard command palette (`Cmd/Ctrl-K`).
7. Simplify footer to handoff language while preserving demoted-route discoverability.
8. Repair bundle isolation before trusting it:
   - parse App Router client manifests/trace data; do not rely only on `.next/build-manifest.json` `pages`.
   - include `/` plus `/writing`, `/projects`, `/about`, `/library`, `/notes`, `/media`, and other protected app routes.
   - fail closed when a protected route mapping cannot be resolved. A "Found mappings for 1 routes" pass is a script failure, not success.
   - keep protected routes free of Three/R3F/postprocessing; add forbidden patterns for Sigma/Graphology/`@react-sigma` on `/library`.
   - `/graph` may keep Sigma/Graphology through its dynamic island.
   - record the expected protected-route list in the script or a nearby constant, not only in prose.

**Gate:** static gate + `pnpm build && pnpm check-bundle-isolation` after the bundle-isolation script or global shell changes.

**Acceptance:** every route has the Aurora-Emerald shell without old warm/starfield visual stacking; nav does not wrap at 402px; reduced-motion users get no continuous background rAF; focus remains visible.

## Phase 2 — Shared editorial page primitives

**Parallel:** no  
**Blocked by:** Phase 1  
**Owned files:**

- new: `components/site/EditorialHeader.tsx`
- new: `components/site/EditorialIndexRow.tsx`
- create `components/site/EditorialShell.tsx` only if at least two pages duplicate the same shell markup

**Tasks:**

1. Add dumb shared primitives only where they remove repeated markup across Home/Writing/Projects/About.
2. No data fetching, no global state, no over-configured variant system.
3. Rows support number, eyebrow/meta, title, description, tags/status, and trailing arrow/link affordance.

**Gate:** static gate.

**Acceptance:** primitives are small and page-agnostic; no page files are modified in this phase except imports in a scratch-free implementation pass if unavoidable.

## Phase 3 — Home page rebuild

**Parallel:** no  
**Blocked by:** Phase 2  
**Owned files:**

- `app/page.tsx`
- deleted/retired after import sweep: `components/home/**`
- `data/home.ts` only if retained as a tiny copy constant; do not introduce a parallel content dataset
- e2e: `e2e/home.e2e.ts`

**Tasks:**

1. Replace current hero with handoff hero:
   - eyebrow: `Próspera · Public Policy · Software`
   - headline: `Designing the systems that let human progress compound.` with italic green `compound`
   - standfirst from `Trey Goff - Home.dc.html`
   - CTAs: `Read the writing ->`, `See the work ->`
2. Replace the card/grid path section with ruled rows:
   - 01 Writing
   - 02 Projects
   - 03 Library
   - 04 About
   - No Graph as a primary path.
3. Replace selected work cards with the handoff ledger rows, using live `allProjects` where possible and a small curated id/order map only if needed.
4. Replace featured essays cards with quiet chronological rows using `content-collections`.
5. Apply `.tg-rise` entrance motion; respect reduced motion.
6. Delete obsolete decorative home components only after imports are gone.

**Gate:** static gate + `pnpm test:e2e -- e2e/home.e2e.ts` after the route is rebuilt.

**Acceptance:** `home-desktop.png` and `home-mobile.png` match layout, copy, nav, type scale, palette, and no-card ruled-row language.

## Phase 4 — Writing, Projects, and About page rebuild

**Parallel:** sequential within phase unless file ownership is split explicitly  
**Blocked by:** Phase 2  
**Owned files:**

- `app/writing/page.tsx`
- `components/writing/EssayCard.tsx` if retained, otherwise exact replacement file
- `app/projects/page.tsx`
- `components/projects/ProjectCard.tsx` if retained, otherwise exact replacement file
- `app/about/page.tsx`
- e2e: `e2e/writing.e2e.ts`, `e2e/static-pages.e2e.ts`

**Tasks:**

1. Writing:
   - Handoff header/copy/hierarchy
   - Featured/newest essay as ruled hero row
   - More essays as chronological ruled rows with date/read-time/tags
   - Keep tag filtering only if visually quiet and accessible; otherwise document demotion.
2. Projects:
   - Handoff header and first featured project treatment
   - Project ledger rows with type/status/problem/approach/tags
3. About:
   - Handoff bio prose and sticky/sidebar facts
   - Hatched portrait placeholder until a real portrait is provided
4. Preserve JSON-LD and metadata.

**Gate:** static gate + `pnpm test:e2e -- e2e/writing.e2e.ts e2e/static-pages.e2e.ts` after the routes are rebuilt.

**Acceptance:** `writing-*`, `projects-*`, and `about-*` shots match page-specific copy, hierarchy, ruled rows, and mobile nav behavior.

## Phase 5 — Library data core: Aurora book graph

**Parallel:** can start after Phase 0; does not need Phase 1  
**Blocked by:** Phase 0  
**Owned files:**

- new: `lib/library/aurora.ts`
- deleted/retired after import sweep: old library helpers used only by the retired 3D/stack Library (`lib/library/topics.ts`, `lib/library/constellation.ts`, color/texture/noise/sorting/store helper modules, and obsolete generated-type wrappers)
- tests: new `test/library-aurora.test.ts`, existing `test/books.test.ts` if needed
- `lib/graph/generate.ts`, `lib/graph/types.ts`, `test/graph.test.ts` only for narrow adapter/helper changes; otherwise untouched

**API contract:**

- `buildAuroraLibrary(books: readonly Book[]): AuroraBook[]`
- `buildAuroraGraph(books: readonly AuroraBook[]): AuroraGraph`
- `categorizeAuroraBook(book: Book): AuroraCategoryCode`
- `AuroraGraph` includes serializable `books`, `nodes`, `edges`, `topicCounts`, and `maxDegree`; no React/canvas refs.

**Tasks:**

1. Define Aurora categories from the table above.
2. Generate `AuroraBook` from `Book`:
   - `id`, `title`, `author`, `year`, `category`, `topics`, `rating?`, `whyILoveIt?`, cover/link metadata.
3. Document genre->category and generic-genre topic-routing rules. Generic `non-fiction` must route by specific topics before fallback.
4. Add safe fallback category and a clean warning path for newly unmapped future books; no `NaN` can reach canvas layout.
5. Add a build/content validator or test that fails when any book cannot map to one of the 12 shelves.
6. Test-only oracle parser reads `docs/designs/.../library-data.js` exports `LIBRARY` and `CATEGORIES`, then compares `{ id, c }` to generated `{ id, category }`. Production code must not import docs.
7. Build pure topic graph:
   - topic map from book topics
   - skip generic topics with >24 books
   - centrality = degree from specific topic threads, not rating
   - strong thread edges are chained around layout, not full cliques
   - deterministic 2D constellation inputs live in `lib/library/aurora.ts`, not `lib/library/constellation.ts`
8. Preserve `/graph` unless a narrow adapter is explicitly needed. `/graph` may reuse Aurora category/color metadata for book nodes, but not Library layout/canvas state.
9. Add deterministic FNV-1a utility for stable shelf/river dimensions if not already present:
   - height = `152 + (fnv1a(title) % 9) * 15`
   - width = `33 + (fnv1a(author + title) % 5) * 7`

**Gate:** `pnpm content:sync && node --import tsx --test test/library-aurora.test.ts`; run `pnpm content:sync && node --import tsx --test test/graph.test.ts` if graph files changed.

**Acceptance:** 334 books transform deterministically; all current categories match the handoff oracle; no unmapped/new genre can silently crash layout; rating/read dates are not required.

## Phase 5b — Graph boundary integration

**Parallel:** no  
**Blocked by:** Phase 5  
**Owned files if changed:**

- `app/graph/page.tsx`
- `components/graph/GraphClient.tsx`
- `components/graph/GraphCanvas.tsx`
- `components/graph/NodeInspector.tsx`
- `components/graph/index.ts`
- `lib/graph/generate.ts`
- `lib/graph/types.ts`
- `test/graph.test.ts`
- `test/graph-codesplit.test.ts`
- `e2e/graph.e2e.ts`

**Tasks:**

1. Keep `/graph` as the all-content Sigma/Graphology route.
2. If useful, enrich book nodes with Aurora category/color/centrality metadata through a pure adapter.
3. Do not import Library lens layout, pan/zoom state, or custom canvas code into `/graph`.
4. If `NodeInspector` renders book metadata, share display helpers with `BookDetail` only if it reduces duplication; do not force one component into both layouts if wrappers differ.

**Gate:** `pnpm content:sync && node --import tsx --test test/graph.test.ts test/graph-codesplit.test.ts` + `pnpm test:e2e -- e2e/graph.e2e.ts` if graph UI changed.

**Acceptance:** `/graph` remains all-content; book nodes can show Aurora metadata; `/library` remains custom canvas and has no Sigma/Graphology dependency.

## Phase 6 — Library lens UI

**Parallel:** no  
**Blocked by:** Phase 1 and Phase 5  
**Owned files:**

- `app/library/page.tsx`
- new: `components/library/AuroraLibrary.tsx`
- optional extraction only if the single client island becomes unwieldy: `components/library/ConstellationCanvas.tsx`, `components/library/ShelfLens.tsx`, `components/library/RiverLens.tsx`, `components/library/IndexLens.tsx`
- deleted/retired after route switch and import sweep: old stack/floating Library components (`StackLibrary`, `LibraryClient`, `FloatingLibraryWrapper`, `BookDetail`, `BookStripe`, `StackBottomSheet`, `StackSortControls`, `StackDetailPanel`, and `components/library/floating/**`)
- tests: `test/library-a11y.test.ts`, `test/a11y-nav-filters.test.ts` if filters change, `test/library-aurora.test.ts`
- e2e: `e2e/library.e2e.ts`, `e2e/pages/library.page.ts`

**Server/client boundary:**

- `app/library/page.tsx` stays a Server Component.
- It loads `books`, emits JSON-LD, builds `auroraGraph`, and passes serializable props to `AuroraLibrary`.
- `AuroraLibrary` is the only client state owner for `activeLens`, `activeCategory`, `selectedBookId`, and `sortMode`.
- The constellation view owns only ephemeral viewport state: pan, zoom, pointer hover, resize refs.
- Shelf, River, and Index are controlled views, whether they stay inside `AuroraLibrary.tsx` or later move to tiny files.
- Refreshing `/library` reconstructs all lens data from `Book[]`; no client-only derived data is required for correctness.

**Tasks:**

1. Replace `/library` entry with `AuroraLibrary`; preserve `generateLibraryBooksGraph` JSON-LD.
2. Header/stats/category filter match `library-desktop.png` and `library-mobile.png`.
3. Bottom lens switcher is safe-area aware and keyboard accessible.
4. Constellation lens:
   - one 2D `<canvas>`
   - 12 category centers on kinship ring, radius about 560 design units
   - phyllotaxis packing by centrality
   - node size/brightness from centrality
   - faint intra-category edges plus bright chained topic threads
   - OKLCH/hue colors converted to RGB/rgba for canvas
   - fit-to-screen on load and resize
   - wheel zoom to cursor, drag pan, hover label, click/tap opens drawer
   - pointer un-projection uses bounding rect and camera scale/offset
   - one-finger drag pan; two-finger pinch zoom or visible zoom controls as accepted mobile alternative
   - `touch-action: none` only on canvas surface
   - invalidation-driven render loop: continuous rAF only during active interaction/tween; no permanent watchdog interval while hidden/inactive
   - under reduced motion, use static layout, disable twinkle and interaction tweens, and avoid continuous rAF except unavoidable active pan/zoom frames
   - cap DPR; cleanup ResizeObserver/listeners; use pointer capture
   - category filter dims off-category nodes/edges
5. Shelf lens:
   - CSS spine wall using deterministic dimensions
   - sort modes: Shelf, Color, Threads, Publication Year, Height, Author
   - hover/tap opens detail; active category dims others
6. River lens:
   - publication-year timeline
   - tick height from centrality/thread count, not rating
   - click/tap opens detail
7. Index lens:
   - visible semantic list/table equivalent: number, title/author, shelf, topic, year
   - sortable and fully keyboard operable
8. Unified detail drawer:
   - shelf hue chip, title, author, year
   - rating if present, otherwise kindred/thread count
   - up to 8 topic chips
   - `whyILoveIt`/blurb when available
   - cover image or existing placeholder/generative fallback only when available
   - hide empty links/sections; never render dead rows
   - existing Amazon/Goodreads/Bookshop links if present
   - `See the shelf ->` sets active category and switches to Shelf
9. Accessibility contract:
   - lens switcher is a real tablist or segmented button group with announced state
   - category chips are buttons with `aria-pressed` and visible focus
   - canvas is not the only way to browse/select books; Index is the complete keyboard/screen-reader path
   - canvas has `role="img"`/`aria-label`/instructions or is `aria-hidden` with adjacent semantic equivalent; no fake interactive canvas role unless nodes are keyboard reachable
   - drawer uses Radix/dialog-like focus trap, Escape close, and focus return
   - all book selection, filtering, lens switching, drawer actions, and `See the shelf` work without pointer input through Index/Shelf controls
10. Document intentional removals/demotions:
   - old status/read-state filters are out of scope for the redesign unless reintroduced quietly
   - old 3D FloatingLibrary and stack Library are retired from primary `/library`; no orphan mode switch or easter-egg UI remains.

**Gate:**

- `pnpm content:sync && node --import tsx --test test/library-aurora.test.ts test/library-a11y.test.ts`
- `pnpm test:e2e -- e2e/library.e2e.ts`
- `pnpm build` after the lens UI stabilizes

**Acceptance:** all six Library reference shots match (`library-desktop`, `library-mobile`, `lens-constellation`, `lens-shelf`, `lens-river`, `lens-index`); mouse, touch, reduced-motion, keyboard, and sparse-data paths work.

## Phase 6b — Library CSP and dynamic-route policy

**Parallel:** no  
**Blocked by:** Phase 6 dependency decisions  
**Owned files:**

- deleted/retired: `app/library/layout.tsx`
- `lib/security/csp.ts`
- `proxy.ts`
- `test/security-headers.test.ts`
- `test/csp-nonce-dynamic-routes.test.ts`

**Tasks:**

1. Re-evaluate whether `/library` still needs nonce-based CSP or `unsafe-eval` after the old 3D/Sigma-free Library replacement lands.
2. Prefer an explicit split policy such as `isNonceRoute('/interactive')` and `allowsUnsafeEvalRoute('/interactive')`; keep `/library` out of `unsafe-eval` unless a measured production dependency requires it.
3. Delete `app/library/layout.tsx` once `/library` no longer needs nonce/eval behavior; do not leave it as accidental legacy.
4. Update security tests for the chosen route policy, including negative assertions that `/library` is not eval-enabled when no dependency requires it.
5. Smoke `/library` and `/interactive` in production build so the policy does not break either route.

**Gate:** `pnpm content:sync && node --import tsx --test test/security-headers.test.ts test/csp-nonce-dynamic-routes.test.ts` + `pnpm build` if CSP/proxy behavior changes.

**Acceptance:** `/library` has the narrowest CSP compatible with the redesigned lens UI; `/interactive` keeps any special allowances it still needs; tests encode the split.

## Phase 7 — Cleanup, route rationalization, and stale assertion sweep

**Parallel:** no  
**Blocked by:** Phases 3-6b  
**Owned files determined by sweep, not wildcard deletion:**

- exact deletion list generated with `rg` before removal
- `app/sitemap.ts`
- `components/command/CommandPalette.tsx` if demoted route discovery changes
- `lib/search/generate-index.ts` and generated `public/search-index.json` if search entries change
- route OG image files with old palette if changed: `app/opengraph-image.tsx`, `app/library/opengraph-image.tsx`, `app/graph/opengraph-image.tsx`, `app/projects/opengraph-image.tsx`, `app/media/opengraph-image.tsx`, `app/transmissions/opengraph-image.tsx`, `app/writing/[slug]/opengraph-image.tsx`, `app/topics/[tag]/opengraph-image.tsx`
- focus/a11y tests if stale assertions remain: `test/a11y-critical-focus.test.ts`, `test/a11y-focus-visible.test.ts`
- tests/e2e touched by stale assertions

**Tasks:**

1. Stale assertion sweep:
   - `rg "StackLibrary|LibraryClient|FloatingLibrary|FloatingLibraryWrapper|BookDetailPanel|BookStripe|StackBottomSheet|font-satoshi|font-newsreader|warm|StarfieldClient" test e2e components app lib`
   - update/delete assertions only after deciding which old paths survive.
2. Delete dead home/library components only after `rg` proves no imports remain.
3. Retire only old Library 3D/stack implementation after import sweep: `FloatingLibraryWrapper`, `components/library/floating/**`, `StackLibrary`, `LibraryClient`, `BookStripe`, stack drawer/filter/sort components, `lib/library/constellation.ts`, and texture/color/noise/sorting/store helpers used only by that path. Do **not** remove `three`, `@react-three/*`, or interactive shared dependencies while `/interactive` stays live.
4. Route inventory and fate table:

   | Route | Fate | Required discovery surface | Files/tests to check |
   | --- | --- | --- | --- |
   | `/notes` | Keep demoted | command/search/sitemap | notes route + search index |
   | `/media` | Keep demoted | command/search/footer or sitemap | media route + `app/media/opengraph-image.tsx` |
   | `/topics` | Keep demoted | command/search/sitemap | topics route + tag OG tests |
   | `/transmissions` | Keep demoted if content exists | command/search/sitemap | transmissions route + OG image |
   | `/powerlifting` | Keep demoted | command/search/sitemap | route/e2e smoke if present |
   | `/subscribe` | Keep reachable | footer or command + sitemap | subscribe route/form tests |
   | `/interactive` | Keep live | command/search/sitemap; not primary nav | interactive e2e/build and CSP policy |
   | `/graph` | Keep live | command/search/sitemap; not primary nav | `e2e/graph.e2e.ts`, bundle/CSP gates |

5. Keep `/media`, `/topics`, `/notes`, `/now`, `/colophon`, `/interactive`, `/graph`, `/transmissions`, `/powerlifting`, and `/subscribe` functional unless explicitly removed later.
6. Ensure each demoted route is reachable through at least one of command palette, search index, footer, or sitemap.
7. Update OG images only where old palette leaks into user-visible previews.
8. Document fate of Stats/Marginalia/FloatingLibrary easter egg so no orphan UI remains.

**Gate:** static gate + `pnpm test:e2e -- e2e/navigation.e2e.ts e2e/command-palette.e2e.ts e2e/graph.e2e.ts` if touched + `pnpm prebuild` if generated public artifacts changed.

**Acceptance:** no stale old-library/home assertions remain; no broken hidden-route discovery; sitemap/search/OG outputs are truthful.

## Phase 8 — Visual QA and final verification loop

**Parallel:** no  
**Blocked by:** Phases 1-7  
**Owned files:**

- temporary screenshot/contact-sheet scripts should stay uncommitted unless promoted deliberately
- if committed, use exact path: `scripts/compare-redesign-shots.ts`
- screenshot artifacts, if committed: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/**`

**Tasks:**

1. Capture production screenshots at handoff sizes:
   - desktop: 924x540 for home/writing/projects/about/library/lenses
   - mobile: 402x540 for home/writing/projects/about, 441x540 for Library mobile
2. Produce side-by-side contact sheets against `handoff/shots/*.png`.
   - Durable QA evidence belongs under `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/<round>/`.
   - Each round should include actual captures, optional contact sheets, console/error notes, and a pass/fail matrix keyed by screenshot name and viewport.
   - Earlier plan-review rounds do **not** count as these visual QA rounds; these are post-implementation browser rounds against the production build.
3. Run at least two native-subagent visual QA/fix loops using `agent-browser`:
   - The handoff screenshots are the visual quality bar, not loose inspiration. QA agents must push the implementation to match or exceed the screenshots' polish: composition, spacing, typography, color depth, motion restraint, interaction finish, and mobile ergonomics.
   - Round 1: spawn native `ui_qa_driver` subagents for desktop, mobile, and Library-lens journeys. They use `agent-browser` against the local production build, compare against the handoff shots as the goal state, and return concrete issue packets with route, viewport, screenshot/state, expected vs actual, polish gap, and severity.
   - Fix pass: main agent or scoped `ui_fix_worker` subagents fix only the reported issues, with disjoint file scopes when parallelized.
   - Round 2: rerun native `ui_qa_driver` subagents with `agent-browser` on the same routes/viewports plus regression checks for all Round 1 fixes.
   - Continue additional rounds until no P0/P1 visual, interaction, keyboard, reduced-motion, mobile-safe-area, or polish-regression issues remain relative to the screenshots.
4. Mark each shot pass/fail on named dimensions:
   - nav fit/order
   - hero scale/copy
   - typography family/weight
   - palette/background
   - ruled rows/no-card language
   - footer visibility
   - mobile wrapping/safe area
   - Library lens controls/drawer states
5. Run interaction QA:
   - `/`, `/writing`, `/projects`, `/about`, `/library`, `/graph`
   - Library lens switcher/category/filter/drawer/`See the shelf`
   - keyboard path: nav -> Library -> lens switcher -> category -> Index row -> drawer -> close -> focus return
   - reduced-motion path: no long-running aurora rAF; minimized constellation animation
   - mobile/touch at 375px, 402px, and 768px; WebKit if feasible
   - CSP smoke for `/library`
   - WebGL failure fallback smoke
6. Run final gates:
   - `pnpm test`
   - `pnpm test:e2e`
   - `pnpm build`
   - `pnpm check-bundle-isolation`
   - `pnpm ci:quality`

**Acceptance:** at least two `agent-browser` native-subagent visual QA/fix rounds are complete; final implementation matches or exceeds the screenshot quality/polish; screenshots pass manual review or documented diff review; all gates pass; no old warm/card/starfield/StackLibrary primary surface remains.

## Risks and mitigations

- **Canvas accessibility:** Index lens is a complete visible semantic equivalent; drawer and controls stay keyboard/screen-reader operable.
- **WebGL aurora failures:** CSS/static fallback first; shader/context failure does not affect content readability.
- **Background performance:** no Three/R3F; capped DPR; paused hidden/reduced motion; no full-viewport CSS filter in production path.
- **Library category drift:** oracle parity tests plus future-content validator and safe fallback.
- **Graph coupling:** Library owns Aurora graph; `/graph` remains separate all-content route.
- **Old route discoverability:** demoted routes stay in command/search/footer/sitemap.
- **Sparse book metadata:** hide unavailable rating/link/blurb sections; never imply missing read dates/ratings.

## Review log

Round 1 completed:

- Native `plan_reviewer`: required graph integration phase, exact ownership, library test/e2e migration, executable a11y contract, phase gates.
- Native `frontend_arch`: required clearer Library graph boundary, server/client state ownership, test-only oracle, one-background rule, avoid `data/home.ts` as parallel dataset.
- Native `performance_engineer`: required reduced-motion no-rAF, route bundle isolation, old 3D scope, event-driven canvas, touch/pinch, a11y fallback, perf gates.
- Delegate Codex: required explicit Aurora graph APIs, stale tests/e2e ownership, canvas a11y, visual checklist, font migration detail, sparse drawer fallbacks.
- Delegate Cursor Composer: useful notes on test migration, graph scope, genre/category oracle, font loader, handoff copy; one stale finding about missing PNGs was rejected after local verification.
- Delegate Gemini: required shader/perf optimization, robust category fallback, deterministic FNV hashing, legacy font aliases, pointer un-projection.

Round 2 completed:

- Native `plan_reviewer`: approved after clarifying `components/library/StackLibrary.tsx` replacement/retirement ownership.
- Native `frontend_arch`: required `/library` CSP/dynamic-route ownership and a complete demoted-route inventory including `/transmissions`, `/powerlifting`, and `/subscribe`.
- Native `performance_engineer`: required mandatory App Router-aware bundle-isolation repair and explicit `/library` CSP removal from eval allowances unless measured dependency requires it.
- Delegate Codex: required page-specific source references, oracle export names, and an explicit supersession of the handoff shared-graph-engine note.
- Delegate Cursor Composer: required exact 14-shot manifest, home/writing/static e2e ownership, reduced-motion constellation specifics, focus-test sweep, and `lib/library/constellation.ts` retirement clarity.
- Delegate Gemini: no remaining issues.

Final narrow pass:

- Native `plan_reviewer`: found the committed handoff runtime would break Oxlint unless `docs/designs/**` is ignored or the runtime is excluded. Resolved by assigning `.oxlintrc.json` to Phase 0 and adding the lint-ignore requirement.

Implementation review/fix pass:

- Native `plan_reviewer`: approved the two-round native `agent-browser` visual-QA plan but required durable QA artifacts and a clear distinction between plan-review rounds and post-implementation visual-QA rounds. Resolved in Phase 8.
- Native `frontend_arch`: found `/library` CSP/eval legacy, drawer focus-trap gaps, continuous constellation rAF, drag-start drift, non-cursor-centered zoom, and old Library OpenGraph palette leakage. Resolved with CSP split, deleted library layout, drawer focus management, event-driven canvas rendering, corrected drag/zoom math, and Aurora Library OG.
- Native `test_hardener`: required drawer keyboard/focus-return E2E, reduced-motion rAF-count coverage, mobile Library lens/drawer coverage, category fallback tests, generic-topic cap tests, and less brittle E2E selectors. Resolved in `e2e/library.e2e.ts`, `e2e/pages/library.page.ts`, and `test/library-aurora.test.ts`.
- Delegate Codex/Cursor/Gemini safe lanes: useful findings were folded into the same fixes; Cursor's missing-screenshot finding was rejected after local manifest verification.

Post-implementation visual QA closeout:

- `comparisons/round-3/library/report.md`: native `agent-browser` Library QA found a P1 Constellation polish gap.
- `comparisons/round-4/library/report.md`: native `agent-browser` Library regression QA passed with no P0/P1 issues across Constellation, Shelf, River, and Index at 924x540.
- `comparisons/round-4/mobile/report.md`: native `agent-browser` mobile QA passed with no P0/P1 issues across Home, Writing, Projects, and About at 402x540.
- `comparisons/round-5/desktop/report.md`: native `agent-browser` desktop QA passed with no P0/P1 issues across Home, Writing, Projects, and About at 924x540.
- Final automated gates: focused graph E2E passed, focused Library E2E passed, full Playwright suite passed, and `pnpm ci:quality` is the final branch gate.
