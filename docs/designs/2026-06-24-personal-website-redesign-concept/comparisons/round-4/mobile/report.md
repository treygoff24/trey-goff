# Round 4 Mobile Visual QA — Final Read-only Pass

| Field | Value |
|---|---|
| Date | 2026-06-24 |
| Target | `http://localhost:3103` |
| Viewport | `402x540` |
| Scope | `/`, `/writing`, `/projects`, `/about` |
| Reference root | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/` |
| Artifact root | `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-4/mobile/` |
| Browser tool | `agent-browser` direct CLI |
| Session | `round4-mobile-qa` — closed |
| Verdict | **PASS** |

## Coverage Matrix

| Route | Reference | Actual screenshot | Snapshot | Console/errors | Result |
|---|---|---|---|---|---|
| `/` | `handoff/shots/home-mobile.png` | `screenshots/home-actual.png` | `snapshots/home.snapshot.txt` | `console/home.console.txt`, `errors/home.errors.txt` | PASS |
| `/writing` | `handoff/shots/writing-mobile.png` | `screenshots/writing-actual.png` | `snapshots/writing.snapshot.txt` | `console/writing.console.txt`, `errors/writing.errors.txt` | PASS |
| `/projects` | `handoff/shots/projects-mobile.png` | `screenshots/projects-actual.png` | `snapshots/projects.snapshot.txt` | `console/projects.console.txt`, `errors/projects.errors.txt` | PASS |
| `/about` | `handoff/shots/about-mobile.png` | `screenshots/about-actual.png` | `snapshots/about.snapshot.txt` | `console/about.console.txt`, `errors/about.errors.txt` | PASS |

## Comparison Artifacts

| Route | Side-by-side | Pixel diff | Mean diff | RMS diff |
|---|---|---|---:|---:|
| `/` | `diffs/home-side-by-side.png` | `diffs/home-diff.png` | 17.09 | 51.18 |
| `/writing` | `diffs/writing-side-by-side.png` | `diffs/writing-diff.png` | 15.04 | 42.90 |
| `/projects` | `diffs/projects-side-by-side.png` | `diffs/projects-diff.png` | 15.47 | 45.83 |
| `/about` | `diffs/about-side-by-side.png` | `diffs/about-diff.png` | 17.19 | 51.57 |

All reference and actual screenshots are `402x540`.

## Findings

No P0/P1 issues found.

### P2-001 — Minor first-viewport offset/background variance vs handoff

| Field | Value |
|---|---|
| Severity | P2 |
| Category | visual polish |
| URLs | `/`, `/writing`, `/projects`, `/about` |
| Evidence | `diffs/*-side-by-side.png`, `screenshots/*-actual.png` |

The implementation is consistently a few pixels lower/right than the handoff and has a slightly stronger green atmospheric glow, especially on the right side of each viewport. This does not break geometry, wrapping, or hierarchy and in places reads as equal or slightly richer than the reference. Not a blocker.

### P2-002 — About heading accessible text loses the visual space before italic word

| Field | Value |
|---|---|
| Severity | P2 |
| Category | accessibility/content |
| URL | `/about` |
| Evidence | `snapshots/about.snapshot.txt`, `screenshots/about-actual.png` |

The visual rendering correctly wraps `progress` and `compound.`, but the accessibility snapshot reports the heading as `progresscompound.` with no space. This is not visible in the screenshot and does not affect the mobile visual pass, but it is worth fixing in a follow-up accessibility pass.

### P2-003 — Local Vercel Speed Insights script load messages

| Field | Value |
|---|---|
| Severity | P2 |
| Category | console/local telemetry |
| URLs | `/`, `/writing`, `/projects`, `/about` |
| Evidence | `console/*.console.txt`, `errors/*.errors.txt` |

Console output includes `[Vercel Speed Insights] Failed to load script from /_vercel/speed-insights/script.js` log messages on the local production start. `agent-browser errors` is empty for all four routes; no JS exceptions or runtime crashes were observed. Treat as non-blocking unless expected to be silent locally.

## Visual QA Notes

- Navigation fits in one row on all four routes at `402x540`; no wrapping or clipping observed.
- First-viewport hero typography, italic accent styling, divider rules, and active nav states match the handoff closely enough for final mobile signoff.
- No fixed/sticky overlay collision observed in the first viewport.
- No content crops in a way that obscures required hero/nav content. `/about` exposes the top of body copy at the bottom edge compared with the reference, but the hero remains polished and legible.
- Background atmosphere is cohesive across pages and does not reduce readability.

## Evidence Inventory

- Actual screenshots: `screenshots/*-actual.png`
- Annotated screenshots: `screenshots/*-annotated.png`
- Side-by-side comparisons: `diffs/*-side-by-side.png`
- Pixel diffs: `diffs/*-diff.png`
- Full snapshots: `snapshots/*.snapshot.txt`
- Interactive snapshots: `snapshots/*.interactive.snapshot.txt`
- URL captures: `snapshots/*.url.txt`
- Console logs: `console/*.console.txt`
- Runtime errors: `errors/*.errors.txt` — all empty

## Verdict

**PASS** — no P0/P1 issues remain in the requested mobile first-viewport visual QA scope.
