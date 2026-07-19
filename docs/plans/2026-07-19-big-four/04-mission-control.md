# 04 — Mission Control (`/mission-control`)

Read `00-shared-contracts.md` first. It is binding.

## 1. What this is

The operating picture of one high-agency life: a single dense, quiet instrument panel aggregating the real telemetry this repo already half-tracks — strength numbers, reading, writing cadence, shipping activity, current focus, position on the globe. Not a dashboard cosplaying importance: every datum is real, sourced, and timestamped, with staleness worn honestly. The wow is density-with-calm — "this person runs themselves like a mission" — rendered in the observatory's own editorial voice.

## 2. Primary user action

Scan the whole panel in ~20 seconds and come away with a precise, current sense of what Trey is doing, lifting, reading, and building — then click into one thread.

## 3. Design direction

- **Color strategy: Restrained**, normal chrome, aurora present. Instrument-panel *structure* in the site's editorial grammar: ruled rows, mono labels, hairline sparklines — an observatory control room, not a SaaS analytics page.
- **Scene sentence:** the annex room of the observatory where the instruments tick quietly all night whether anyone is watching or not.
- **Anchors:** a ship's bridge log; the site's `/powerlifting` + `/now` pages (which this supersedes in spirit but does not modify); classic Tufte data-ink restraint.
- **Explicit anti-references (these bounce in review):** the hero-metric template (big number + tiny label + delta badge), identical stat-card grids, gauge/donut charts, anything with a green-up/red-down arrow. Numbers sit inside ruled editorial rows with mono labels; charts are hairline, single-accent, unfilled or barely-filled.

## 4. Scope

Production-ready, one route, build-time/ISR data only (no client fetching, no loading spinners — the page arrives complete). Desktop shows the full panel; mobile stacks it with equal care.

## 5. Experience walkthrough

One long instrument panel, six ruled sections. Order: Focus → Strength → Reading → Writing → Shipping → Orbit.

1. **Focus (masthead).** Current mission line + "as of" date, sourced from `data/now.json`. `location`/`tz` are nullable — when present, show location + local time (the only client-side JS on the page: a ticking clock, frozen under reduced motion); when null, the instrument renders its designed absent state. Never fabricate a position.
2. **Strength.** The big three from `data/lifts.json` (read-only — no page consumes it today, but `scripts/generate-interactive-manifests.ts` reads it during prebuild, so its schema is load-bearing; do not reshape it): current 1RMs as editorial rows, a hairline progression line per lift from the history arrays, total as a quiet computed line. No bodyweight data exists — there is NO bodyweight-multiple; leave the aggregator room for it if Trey later adds a field. `lastUpdated` shown.
3. **Reading.** The stacks: library composition from `content/library/books.json` — real aggregates only (counts by status, a topic-distribution strip, top-rated shelf with covers via the existing pipeline), linking to `/library`. The catalog currently has zero `reading`-status books and no read-dates, so there is NO "currently reading" or "books this year" instrument — do not fabricate one; if a `reading` book appears in the data later, the aggregator already handles it, and its empty state is designed copy.
4. **Writing.** Cadence strip: essays+notes per month over trailing 24 months as a hairline column chart (SVG, no lib), latest essay row, total corpus word count. From content-collections.
5. **Shipping.** Public GitHub activity: 30-day activity strip (the public events API's documented horizon — ~300 events / 30 days max; a 26-week contribution calendar is NOT obtainable from this source, don't try), day squares in the green ramp — the one place the site's green gets a sequential ramp — plus latest 3 public repos touched as editorial rows. Server-side fetch with ISR.
6. **Orbit.** Latest appearances/publications from `lib/transmissions` + `content/media/appearances.json` — 3 rows, link to `/transmissions`.

**Every section header carries its provenance** in mono metadata: source + "as of" + refresh cadence. Staleness is a first-class design element: data older than its declared cadence gets a quiet `stale` tag, not hidden. Honesty is the aesthetic.

**Key states:** full data (default); a feed unavailable at build (GitHub down / no token → section renders its designed absent state: "instrument offline — last reading [date]" with cached-at-build values if any; the page never fails to build because one feed hiccuped); reduced motion (clock frozen at render time, no chart draw-in animation); mobile (sections stack, charts compress gracefully, no horizontal scroll).

## 6. Architecture

- `app/mission-control/page.tsx` — server component, `export const revalidate = 3600` (the `/graph` precedent).
- `lib/mission-control/` — one typed aggregator per source (`lifts.ts`, `reading.ts`, `writing.ts`, `shipping.ts`, `focus.ts`, `orbit.ts`) returning a common `Instrument<T> = { data: T | null, asOf: string, source: string, stale: boolean }` shape; every aggregator individually try/caught at this real boundary (a failed feed is expected weather, not an exception path).
- `data/now.json` — NEW small file `{ mission: string, location: string | null, tz: string | null, note: string, updated: string }`; `mission`/`note` seeded from the real `/now` page content, `location`/`tz` seeded null (Trey fills them when he wants the clock live). `/now` page itself is NOT modified.
- GitHub: `https://api.github.com/users/treygoff/events/public` + repos endpoint, unauthenticated (60 req/hr is plenty at ISR 3600); optional `GITHUB_TOKEN` env raises limits; absent/failed → designed absent state. Fetches happen server-side inside the aggregator with `next: { revalidate: 3600 }`.
- Charts: tiny local SVG components (`components/mission-control/Sparkline.tsx`, `ColumnStrip.tsx`, `HeatStrip.tsx`) — ~40 lines each, no chart dependency. Chart rules pinned: single accent color, no gradients-as-decoration, no axis chartjunk — bare min/max mono labels only, `aria-hidden` SVG with an adjacent visually-hidden text summary per chart ("Squat: 365 to 405 over 14 months").
- No new dependencies. No three.js (route joins `PROTECTED_ROUTES`).

## 7. Performance & accessibility

Static-fast: LCP < 1.2s, zero client JS beyond the clock island. All data readable without color perception (the heat strip carries a text summary; staleness is a text tag). Contrast per shared contracts; mono metadata at `text-3` only when ≥ the AA floor for its size — check, don't assume.

## 8. Content requirements

Section headers and provenance lines, absent-state copy per instrument (six variants, each specific: "GitHub isn't answering the observatory tonight"— in voice, not cute-overload), the masthead mission line (seeded from `/now` content), stale-tag microcopy. Aggregate computed lines' phrasing ("405 · 275 · 495 — 1175 total").

## 9. File ownership

Creates: `app/mission-control/page.tsx`, `components/mission-control/**`, `lib/mission-control/**`, `data/now.json` ONLY — ownership is `data/now.json`, not `data/**`: `data/home.ts` feeds the homepage and `data/lifts.json` feeds the interactive manifest generator, both strictly read-only for this lane. Also `e2e/mission-control.e2e.ts` (renders all six sections; absent-state renders when GitHub mocked to fail; mobile stack sane — set viewport in-test), unit tests (`test/mission-control.test.ts`: aggregator staleness logic, lifts total computed correctly from fixtures, GitHub aggregator returns absent-state on fetch failure, empty-reading-shelf state renders designed copy). Route root exports `metadata = { robots: { index: false, follow: false } }`.

Touches shared: none. The coordinator adds `/mission-control` to `PROTECTED_ROUTES` at integration.

## 10. Out of scope (v1)

Any write path; auth'd integrations (Strava/Whoop/Readwise — the aggregator interface is where they'd slot, but do not build adapters); site-vitals/analytics instruments; automating `data/now.json` updates; modifying `/now` or `/powerlifting`.

## 11. Open questions

- `data/lifts.json` currently shows PRs that may be stale — Trey updates the numbers at his leisure; the panel renders whatever's true in the file. No blocker.
