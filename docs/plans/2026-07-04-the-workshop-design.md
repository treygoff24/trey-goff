# The Workshop — design doc

2026-07-04 · coordinator-authored (Claude/Fable) · branch `feat/the-workshop`

## Thesis

The Library is "everything I've read, and four ways to wander it." The Workshop is its sibling: **everything I've built, and four ways to walk the floor.** The site's weakest page (`/projects`: one MDX entry plus a hardcoded three-row array duplicated across two files) becomes its second signature surface. The flex is density plus coherence: ~45 real projects, measured receipts instead of adjectives, a true ancestry graph of tools that built tools, and sealed rows for work that exists but can't be shown.

Provenance: inventory from a three-scout sweep of `~/Code` (2026-07-04); copy and measured numbers inherit from `fieldcraft-site/src/data/catalog.ts` + `receipts.ts`, which were themselves taken from live acceptance runs 2026-07-01.

## External contract

- Route stays `/projects` (nav unchanged). Page title/voice: **The Workshop**.
- Data spine: `content/projects/projects.json` (mirrors the `content/library/books.json` pattern), loaded via `lib/projects.ts`. The existing `projects` MDX content collection remains for optional per-project deep dives; `the-control-room.mdx` keeps working. JSON entry `id` ↔ MDX slug when both exist.
- Schema (validated by a Zod parser in `lib/projects.ts`, throw on bad data at build time):

```ts
type Project = {
  id: string
  name: string | null            // null when sealed
  oneLiner: string
  discipline: 'agent-cli' | 'agent-infra' | 'mcp' | 'app' | 'policy' | 'legal' | 'site' | 'creative' | 'research'
  tier: 'flagship' | 'solid' | 'minor'
  status: 'active' | 'shipped' | 'archived' | 'experimental' | 'ongoing'
  year: number
  shippedAt: string              // YYYY-MM, ledger sort key
  sealed?: boolean
  sealedNote?: string
  links?: { github?: string; site?: string; install?: string }
  receipts?: { label: string; value: string }[]   // measured only, never projected
  lineage?: { descends?: string[]; builtWith?: string[] }
  tags?: string[]
  note?: string
  annotation?: string            // ledger marginalia (rare)
}
```

- Home `Selected work` section reads from the spine (`tier === 'flagship'`, capped), killing both hardcoded arrays (`app/page.tsx` `fallbackWork`, `app/projects/page.tsx` `otherWork`).

## The four lenses

Shell mirrors the Library's lens-tab grammar (keyboard accessible tabs, hash-addressable `#bench` `#lineage` `#ledger` `#receipts`, crossfade transitions). One shared drawer for project detail across all lenses.

### 1. Bench (default)
The floor of the shop, by discipline. Ruled editorial sections (never cards): each bench is a discipline group ordered by intent (agent CLIs → agent infra → MCP → apps → policy → sites → creative/research → legal), rows within ordered by tier then year. Row anatomy: serif name, one-liner, right-aligned mono meta (`year · status`), and at most one receipt chip in mono. Hover: green underline sweep. Click: drawer.

### 2. Lineage
The claim no one else can make, drawn. Hand-rolled **canvas 2D** graph (bundle-isolation forbids three/sigma/graphology on this route; the Library constellation proves the pattern). Layout computed deterministically at build/module scope: x = time (shippedAt), y = discipline band with collision nudging — a workbench timeline, not a hairball. Ancestry edges (`descends`, `builtWith` in a fainter stroke). Hover a node: its full ancestor/descendant chain lights; everything else dims. Click: drawer. Pan/scroll behavior copies the constellation's wheel-capture fix (see MEMORY: canvas/wheel gotchas).

**The Fable thread.** One additional curve, fainter than every edge, slightly warmer in luminance, drawn through every unsealed node in chronological order. No label, no legend entry, no copy. Traced to its end it terminates at the site itself (the-control-room node). Reduced motion: present but static. This is the About-page line-intersection Easter egg restated as fact: nothing here was built alone.

### 3. Ledger
The shipping record. Dense chronological rows, newest first: `YYYY.MM · name · discipline · one-liner (truncated) · status`. Density is deliberate — it should feel like a printout of a life. Sealed rows render name as a redaction bar (CSS block, not █ characters) with `sealedNote` in mono; `aria-label="sealed project — {sealedNote}, {year}"` so screen readers get words, not glyph soup. Annotations render as marginalia pinned between rows — first use: January 2025, autonomous-loop: "The /goal architecture — stop-hook-enforced completion. Months before native agent loops shipped anywhere." Factual voice; the date does the bragging.

### 4. Receipts
Instrument readings. Only entries with measured `receipts` appear. Large mono values, small labels, grouped by project, ruled rows — explicitly NOT the hero-metric SaaS template: no gradient, no icon, one column of readings like a lab notebook. Provenance line at the bottom: "All figures measured from live runs. Nothing projected." 

### Drawer
Shared across lenses, parity with the Library drawer: name, one-liner, note, receipts, links (github/site/install in mono), lineage as clickable chips (jump to that project), and when an MDX deep-dive exists, problem/approach + link. Sealed projects open a minimal drawer: sealedNote, year, discipline, one dry line ("Some work is real and cannot be shown."). Focus-trapped, `Esc` closes, scroll-locked — reuse the Library drawer mechanics.

## Motion

framer-motion (already a dep) + canvas-native animation. Choreography:

- **Ledger entrance**: rows cascade in a fast tight stagger (~12ms) — a printout, not a parade.
- **Bench**: per-section reveal on scroll via existing `components/motion/Reveal.tsx` variants.
- **Lineage entrance**: nodes settle first, edges draw (progressive canvas stroke), the Fable thread draws last and slowest.
- **Lens transitions**: crossfade + 8px y-drift, exponential ease-out, matching Library behavior.
- **Reduced motion**: every one of the above becomes instant/static; canvas draws final frame once; no loops. Content never gated on animation (reveals enhance a visible default).

## Performance & cost basis

- ~45 nodes, ≤~60 edges: trivial for canvas 2D (constellation already renders 334 books + threads on this design system). Draw only on interaction/animation frames; no continuous rAF loop when idle — matches aurora discipline and reduced-motion policy.
- `projects.json` ≲ 30KB — server-rendered rows for Bench/Ledger (SEO + no-JS readable), client lens shell hydrates on top. Constraint: postbuild `validate-asset-budgets` + `check-bundle-isolation` must stay green on `/projects`.

## Storage & state

- Single JSON spine, no runtime fetch, no DB. Lens selection in URL hash; drawer selection in component state (+ `?p=<id>` deep link, matching Library book deep-linking if present — verify during Wave 1; if the Library lacks it, hash-only).

## Dependencies

None new. framer-motion 12 (present), canvas 2D (native), Zod (present via content-collections).

## Testing

- Unit (node --test, existing pattern): spine parser validation (bad entry throws; sealed entries require sealedNote; lineage ids resolve — no dangling edges), lineage layout function (deterministic, no NaN, bands correct), ledger sort.
- e2e (Playwright, existing pattern): lens tabs switch + hash routing; drawer opens/closes/focus-traps; sealed row aria-label; reduced-motion mode renders all four lenses with content visible; keyboard-only walk of tabs → row → drawer.
- Visual QA loop (Phase 4): opus critics walk desktop + mobile + reduced-motion.

## Non-goals

- No per-project imagery/screenshots (none exist; design must not want them).
- No CMS/admin; editing the JSON is the workflow.
- No public "portfolio PDF" export, no filtering/search UI in v1 (the command palette already exists site-wide; wiring projects into it is a fast follow, not v1).
- No changes to Library, graph, or aurora layers.

## Wave plan

- **Wave 1 (Codex implements):** spine (`projects.json` from curated draft + `lib/projects.ts` + tests), `/projects` rebuild: lens shell, Ledger + Bench lenses (server-rendered rows), drawer (basic), home-page dedupe. Riskiest files for coordinator read: `lib/projects.ts` (validation), drawer focus management.
- **Wave 2 (Codex implements):** Lineage canvas lens (layout module + renderer + interactions + Fable thread), entrance choreography, lens transitions. Riskiest: layout determinism, wheel/pointer handling, reduced-motion paths.
- **Wave 3 (Codex or Cursor implements):** Receipts lens, drawer completion (MDX deep-dive wiring, lineage chips), copy pass, e2e suite.
- Review lane: Cursor `safe` per wave; fix lane: GLM `droid glm`. Gate per wave: `pnpm ci:quality` to file + `echo $?`, plus 5x unit-test sweep.

## Amendments (design review round 1 — Codex safe, 2026-07-04; all 11 findings triaged)

1. **ACCEPT (blocker) — Lineage keyboard access.** The canvas draws; it does not own interaction. A DOM hit-target overlay provides both mouse and keyboard: one absolutely-positioned real `<button>` per node (min 32px hit box) with `aria-label="{name} — {year}, {discipline}"`, chronological DOM order, arrow-key roving within the graph, Enter opens the drawer. Focus ring is drawn on canvas AND via visible CSS outline on the overlay button. The canvas element itself is `aria-hidden`.
2. **ACCEPT — sealed invariants, enforced in Zod.** `sealed: true` ⇒ `name: null`, `oneLiner: null`, `sealedNote` required, `links`/`receipts`/`lineage` forbidden, and no other project's lineage may reference a sealed id. Sealed projects render in **Ledger and Bench only** (redaction bar + sealedNote); they have no Lineage node and no Receipts entry. Drawer: sealedNote, year, discipline, the one dry line.
3. **ACCEPT — deep links.** `?p=<id>` is mandatory v1 for drawer deep-linking; `#hash` is reserved for lens selection only; Zod fails the build if any id equals a lens name.
4. **ACCEPT — App Router split, exact composition.** The server page renders all four panels' static HTML (Bench rows, Ledger rows, Lineage's DOM node index, Receipts readings) as children/slots of a small client shell. Pre-mount and no-JS: Bench visible, others hidden via CSS only after hydration — concretely, the shell renders all panels and applies visibility after mount; first paint always shows Bench (matching SSR), and hash/query are read only in an effect. No lens content is client-only.
5. **ACCEPT — deterministic lane layout.** Sort nodes by `(shippedAt, id)`. x = linear time scale; y = discipline band center + greedy lane offset guaranteeing ≥28px node spacing; ties broken lexicographically by id. Hit boxes ≥32px (the overlay buttons). Unknown dates: `dateApprox: true` field; approx nodes render with a distinct (dashed ring) treatment and sort by estimated date.
6. **ACCEPT — real ARIA tabs.** `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, arrow-key roving, `tabindex` management. Not aria-pressed buttons.
7. **ACCEPT-REDUCED — product contract.** PRODUCT.md amended (same commit): the Workshop is the site's deliberate second signature surface; the Library keeps the largest single interaction budget. Scope not cut — direction explicitly user-approved.
8. **ACCEPT — fail/warn boundaries.** Build hard-fails on: duplicate ids, dangling lineage ids, invalid/missing dates without `dateApprox`, sealed-invariant violations, id/lens-name collision, id/MDX-slug mismatch when both exist. Duplicate `shippedAt` is normal; all sorts tie-break by id.
9. **ACCEPT-REDUCED — generators.** Search-index and manifest generators keep reading MDX only; wiring the JSON spine into site search is declared out of v1 (added to non-goals as fast-follow).
10. **ACCEPT-REDUCED — Fable thread semantics.** No filters exist in v1 and sealed nodes are absent from the graph (amendment 2), which removes the ambiguity cases. The thread is decorative by design (`aria-hidden` canvas; the DOM index is the semantic layer) and deliberately un-labeled — it is an Easter egg, with the colophon as its only textual echo. Not cut.
11. **ACCEPT — no second hue.** The Fable thread stays in the site green family, differentiated by opacity, stroke width, dash rhythm, and draw timing only.

### Wave 1 re-review waivers (2026-07-04)
- **Deep-link lens flash waived:** `/projects#ledger` shows one frame of Bench before the mount effect switches lens. Reading the hash synchronously pre-paint would reintroduce the hydration-mismatch class the wave-1 blocker fix just eliminated; one frame is the cheaper cost.
- **A→B drawer focus flicker waived for v1:** no UI path opens a drawer from inside another (modal focus trap; lineage chips non-interactive until Wave 3). Revisit when chips become clickable.

### Wave 2 review triage (2026-07-04)
- **Rejected (reviewer findings 1–2, hidden-panel rAF):** the `measured` size-gate already prevents entrance animation on hidden panels — `hidden` ⇒ `display:none` ⇒ ResizeObserver reports 0×0 ⇒ `measured` false ⇒ no entrance; switching away mid-entrance flips `measured` false and the effect cleanup cancels the frame. Mechanism documented in-code; verified empirically in Phase 4 browser QA.
- **Waived (single-node thread skip):** cosmetic degenerate case; the live spine has 68 unsealed nodes and tests pin no-NaN behavior.
- Accepted: viewport-scaled lane collision, degenerate-input tests, reduced-motion synchronous redraw, unified size source, single reduced-motion source, canvas fonts from tokens (coordinator finding — no Georgia).

### Wave 2 re-review triage (2026-07-04, round 2 — dry)
- **Rejected (canvas font var() chains):** empirically disproven in headless Chromium — `getComputedStyle().getPropertyValue('--font-newsreader')` returns the fully var()-substituted stack and `context.font` accepts it (`accepted: true` in the repro).
- **Rejected (reduced-motion first-frame race):** the hook's state settles during commit-1 effects; `measured` cannot flip true until a post-paint ResizeObserver callback, so the entrance effect always re-evaluates with the settled value.
- **Waived (pre-measure overlay position jump):** overlay buttons are invisible and the canvas doesn't draw until measured; gating the `<ol>` on `measured` would strip the semantic index from SSR HTML and break no-JS access.
- **Waived (lane-candidate exhaustion fallback):** requires >200 colliding candidates in one band; max band population is 21.
- Accepted (test hygiene, coordinator-applied): distance assertion now uses the same VIEWPORT object as the layout call.

### Spine amendments (curation round 1)
- `devslave` added as a first-class row (minor / archived / agent-infra) — the arc's origin point.
- `cairn`'s descends edge to code-briefcase moved to `note` (code-briefcase has no row).
- The five no-git projects get mtime-estimated dates with `dateApprox: true`.
- autonomous-loop keeps FieldCraft's asserted January 2025 date (git repo re-init shows 2026-03) — **flagged to Trey for confirmation**, since it anchors the ledger's marquee annotation.
