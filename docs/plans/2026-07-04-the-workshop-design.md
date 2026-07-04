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

## Amendments

(from design review — pending)
