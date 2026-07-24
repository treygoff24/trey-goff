# The Workshop — software showcase revamp (design doc)

Date: 2026-07-21. Author: workspace Claude (Fable), coordinator. Status:
REVIEWED — Cursor cross-family design review 2026-07-21 returned 12
findings, verdict "implement with amendments." All 12 ACCEPTED; the
amendments below override the corresponding sections. Build may proceed.

## Amendments (design-review triage, 2026-07-21 — all accepted)

1. **Open state is server-driven.** Drawers open via `?tool=<id>`
   searchParams (pattern already used by `app/writing/page.tsx`), rendered
   as `<details open>` server-side. `id` sits on the `<details>` element
   with `scroll-margin-top` for the sticky chrome. Wander links are
   `/projects?tool=<id>#<id>`. No client hash enhancer; at most a tiny
   focus-to-summary helper after navigation. Exclusive-open falls out by
   construction (one `tool` param).
2. **Not the Library drawer idiom.** The Library's DetailDrawer is a
   portaled modal dialog (focus trap, Escape, restore). This page uses a
   plain disclosure accordion — `<summary>` as sole control, no trap, no
   dialog chrome. The doc's "matching Library's drawer idiom" claim is
   struck.
3. **Featured 8–12, everyone else ledger-only.** Stations remain as
   grouping, but only featured tools get drawers/dossiers/specimens; all
   other tools appear solely in the ledger (one line, no drawer). Full
   station expansion + denser wander graph deferred to v2, gated on
   visual QA proving the featured set holds attention.
4. **Wander = navigation, not stacking.** `runsWith` links navigate to
   `?tool=` (closing the previous drawer). Links to non-featured tools
   render as muted text, not links.
5. **`<summary>` is non-interactive text only** — name + one-liner +
   quiet status word. All links live in the dossier body.
6. **Schema extended before authoring:** `order` (number, stable sort
   within station), `bin?` (command name vs display name), `keywords?`
   (⌘K), `capture?: {file, capturedAt, prompt}` (prompt line stored in
   JSON so TerminalSpecimen never regex-guesses), `links:
   [{label,url,rel?}]`, `featuredRank?`.
7. **Search is a real change, not a one-liner:** add `type: 'tool'` to
   `lib/search/types.ts`, extend `lib/search/generate-index.ts` (the
   actual generator; `scripts/generate-search-index.ts` is a wrapper) and
   `CommandResults` label/icon/typeOrder. Index featured tools only, URLs
   `/projects?tool=<id>#<id>`. Regenerate `public/search-index.json` via
   prebuild.
8. **Mono earns its keep, nowhere else.** Specimens on featured rows
   only, typeset as ruled artifacts with constrained width — never
   full-bleed code wallpaper. No stack "chips": a single quiet mono stack
   string; status is one word in the meta column. Dossier prose stays
   Satoshi/Newsreader.
9. **Scope pin:** Wave 2 builds exactly the page + three components +
   featured content; The Control Room becomes the lead featured dossier
   (its MDX stays; page reads from both sources). No wander auto-open, no
   search entries for non-featured tools.
10. **No drawer height animation in v1** — native instant toggle
    (`::details-content` support is uneven; honest under reduced motion).
11. **The floor plan is one ruled paragraph**, not five mini-kickers —
    avoids the numbered-scaffold grammar the constitution bans.
12. **Sanitize checklist (Wave 1, applies to every capture):** no
    tokens/keys/secrets; no client or family names or repos (prospera*,
    dwp*, santoro*, erickbrimen*, azc/dod, wade, pactact, TPRI, b4a,
    aes-site, gavel, praxient, goff-family, Karlyn); no other-agent mail
    bodies; no email addresses or phone numbers; machine paths under
    /Users/treygoff are acceptable; trim to ≤ ~30 lines per specimen;
    record the capture date and exact prompt line in tools.json.

## Thesis

Trey's software is not a list of apps; it is one machine running a swarm of
AI agents and the ~60 tools that let that swarm produce real work without
lying to its operator. The current `/projects` page compresses all of it
into one hardcoded row ("Harness & agent tooling"). The revamp turns
`/projects` into **The Workshop**: an explorable, editorial map of that
factory floor where CLI tools are first-class citizens — shown as real
terminal output, not screenshots of nothing.

Provenance: full repo survey 2026-07-21 (~190 dirs read; ~60 showcase-
eligible; client/private/personal excluded per the mission brief). The
distinctive angle most portfolios can't touch: every tool lives on the
machine that builds this site, so every demo is a *real capture*, dated,
from the actual binary.

## The one unique mechanic: specimens + a wander graph

1. **Terminal specimens.** Each featured tool's "imagery" is a typeset
   capture of the real CLI running — prompt line, real output, capture
   date — rendered as a designed artifact (site mono font, green prompt,
   ruled header), not a fake code block. Captured once at authoring time
   by running the real tools, sanitized, committed as text. Honest by
   construction: the brand promise is "how was this made?", and the answer
   is on the page.
2. **The wander graph.** Tools name the tools they work with (`fleet` ↔
   `post` ↔ `delegate` …). Each dossier renders its neighbors as inline
   green links that jump to (and open) that tool's row. Discovery =
   wandering a connected system, not paging a grid. Zero heavy interaction:
   it's anchors + the existing drawer affordance, fully keyboard-native.

This spends the page's interaction budget on *connection*, not spectacle —
the Library keeps its crown (PRODUCT.md principle 4).

## Register & constraints (from PRODUCT.md — binding)

Nocturnal observatory; ruled, not carded; one green (#6FD69A/#97E8BB); the
aurora is the only living field; no card grids, no hero metrics, no eyebrow
scaffolding on every section; WCAG AA on #04130C; reduced-motion honored.
Anti-reference: generic dev portfolio. The Workshop is editorial rows +
drawers + terminal specimens — the terminal mono is *earned* here (these
are literal terminals), which is the exception the brand ban contemplates.

## Page structure (`/projects`, revamped in place)

1. **Header** (existing `EditorialHeader`): eyebrow "The Workshop",
   standfirst rewritten around the factory-floor thesis: one machine, a
   swarm of agents, and the tools that keep them honest.
2. **The floor plan** — a short ruled overview: five *stations* (groups),
   each one sentence. Typography only; no diagram asset in v1.
3. **Stations** — the core. Five ruled sections, each an editorial index
   of tools (name / one-liner / stack chip / status). Each row expands
   in place (`<details>`-based drawer, matching Library's drawer idiom)
   into a **dossier**: the flex (one bolded sentence), a terminal
   specimen where one exists, "runs with" wander-links, and external
   links (crates.io / npm / PyPI / GitHub) only where published.
   - **Coordination** — the swarm layer: fleet, delegate, post, polyflow,
     dev-pipeline-workflows, autonomous-dev-kit, wright, forge.
   - **Verification** — tools that make AI output provable: receipts,
     scout, specgate, probita, cairn, erdos-hunt.
   - **Senses** — giving agents eyes/ears/voice: lens, elv, exa-agent-cli,
     stt-stack, obscura, glm-ocr.
   - **Discipline** — keeping the machine honest: morning, papercuts,
     fable-meter, mic-pin, agent-memory, desloppify-deep, agentlinters,
     autonomous-loop.
   - **Play** — tools built for a life, not a pipeline: hearth, rlcoach,
     land, timebar, tower-defense, codex-pet-sidecar, musicctl, radiant.
   Featured ~10 tools (roughly the survey's top-12 minus site-internal
   ones) get specimens; the rest are rows with dossier text only.
4. **The bench ledger** — a closing single-column ruled list of the
   remaining eligible tools, one line each ("also on the bench: …"),
   communicating volume without noise. Experiments (volley, phenometer,
   realtime-experiment, burn-weekend) live here with an "experiment" tag.
5. **Beyond the workshop** — the existing institutional block (Próspera,
   governance experiments) kept as-is below, retitled; the software story
   no longer crowds it.

## Content model

- `content/software/tools.json` — single JSON array; fields: `id`, `name`,
  `oneLiner`, `flex`, `station` (enum of 5), `stack`, `status`
  (`daily-driver` | `published` | `working` | `experiment`), `featured`
  (bool), `runsWith` (ids), `links` ([{label,url}]), `capture` (filename
  or null), `capturedAt`. One file, hand-authored from the survey; no
  content-collections change needed (import JSON directly, same pattern
  as books.json consumers).
- `content/software/captures/*.txt` — sanitized real captures. Sanitize
  pass: no tokens/keys, no client names, no other-agent mail content;
  machine paths OK (it's his machine, that's the point).
- Existing `content/projects/*.mdx` (the-control-room) folds into the
  page as the site's own dossier or stays as featured entry — decided at
  implementation; no schema change.

## Components (new, in `components/projects/`)

- `WorkshopStation` — ruled section w/ station intro.
- `ToolRow` — summary row + `<details>` drawer (no JS state lib; native
  element + CSS transitions, reduced-motion safe; deep-linkable via
  `id` anchors so wander-links can `open` the target row with a tiny
  client enhancement).
- `TerminalSpecimen` — typeset capture: ruled header (tool · capture
  date), mono body, green `$` prompt lines, `overflow-x auto`,
  `aria-label`ed region. No typing animation in v1 (motion budget stays
  with the aurora); a single subtle entrance is allowed if visual QA
  wants it.

Styling: existing tokens only; no new colors, no new fonts, no new deps.

## Search integration

Add tools to the command-palette/search index via the existing
`generate-search-index.ts` (one new source read of tools.json) so ⌘K
reaches every tool — cheap, on-brand (the site is command-palette-first).

## Cost & performance

Static content, server-rendered rows, zero new client JS except the
drawer deep-link enhancement (<1KB). No images beyond text captures — the
asset-budget postbuild checks are unaffected. ~30 tools × ~1KB JSON is
negligible.

## Testing & QA

- `pnpm ci:quality` gate green; `pnpm prebuild` + commit regenerated
  `public/*.json` (search index changes).
- One unit test: tools.json schema validation (ids unique, stations
  valid, runsWith ids resolve, featured tools have captures).
- e2e smoke: /projects renders all stations; a drawer opens; a
  wander-link opens its target.
- Finish with the `visual-qa` workflow (desktop + mobile) per the
  mission brief; a11y: drawers keyboard-operable, contrast AA on all new
  text styles, specimen regions labeled.

## Exclusions (binding, from mission brief + survey flags)

No client/adjacent work (prospera*, dwp*, santoro*, erickbrimen*,
azc/dod, wade-litigation, pactact*, TPRI, b4a, aes-site, gavel,
praxient). No personal/medical (marrow, dose-timing, matt-diagnosis-
explainer, goff-family, Karlyn). No politically-sensitive pending review
(correct-crime-data, modern-political-compass). claude-study gets at most
a one-line pointer (its content is Claude's own; coordinate nothing —
different session owns it).

## Non-goals

- No interactive/executable terminal (write-only captures; no gimmick).
- No per-tool pages/routes in v1 (drawers suffice; routes can come later
  if any tool grows a story).
- No GitHub stars/activity widgets, no third-party embeds, no asciinema
  player dependency.
- No nav changes beyond the /projects page itself.

## Wave plan (foundry, feature-scale)

- **Wave 1 — content**: author tools.json (curation from survey) +
  generate sanitized captures by running the real CLIs. Coordinator does
  this (requires judgment + machine access; not delegable).
- **Wave 2 — build**: components + page revamp + search index hook +
  tests. Implementer: coordinator/Claude-family (benchmark occupies the
  GPT/Codex quota pool until MACHINE FREE — reduced-foundry config,
  author≠reviewer preserved via Wave 3).
- **Wave 3 — review**: cross-family review lane (Cursor `safe`, quota-
  independent of the benchmark) on the full diff + a fresh-context native
  review; triage in writing; fix; re-review until dry.
- **Wave 4 — visual QA**: `visual-qa` workflow against dev server,
  desktop + mobile; fix loop under standard caps.
Commits per wave; no pushes.
