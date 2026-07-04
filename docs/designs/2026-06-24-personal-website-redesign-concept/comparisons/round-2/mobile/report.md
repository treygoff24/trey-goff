VERDICT: FAIL

Round 2 native visual QA, MOBILE scope, using live Agent Browser against `http://localhost:3103` from the latest production build. Viewport for all captures: `402x540`. Session: `tg-r2-mobile`. Captures were re-run after the server restart; see `logs/recapture-timestamp.txt`.

Does this match or exceed the screenshot polish? **No.** The implementation is close, but it does not yet match the handoff screenshots: the interior route first-viewport composition sits too low, `/writing` loses the intended featured-meta reveal from the first viewport, and the live background has a brighter centralized green glow than the darker, subtler reference atmosphere.

## Evidence index

- Combined contact sheet: `comparisons/all-mobile-contact.png`
- Image metrics: `comparisons/image-metrics.txt`
- Actual screenshots: `actual/*-mobile-actual.png`
- Annotated screenshots: `annotated/*-mobile-annotated.png`
- Snapshots/logs: `logs/*-snapshot.txt`, `logs/*-console.txt`, `logs/*-errors.txt`

## Route matrix

| Route | Viewport | Reference | Actual | Status | Main deltas |
|---|---:|---|---|---|---|
| `/` | 402x540 | `../../../handoff/shots/home-mobile.png` | `actual/home-mobile-actual.png` | PASS with polish deltas | Hero type/line breaks are close. Header is a few px lower than reference and background glow is greener/brighter than the darker goal state. |
| `/writing` | 402x540 | `../../../handoff/shots/writing-mobile.png` | `actual/writing-mobile-actual.png` | FAIL | First-viewport content is too low: divider appears near the bottom and the `FEATURED Sep 15, 2025 · 16 min read` row visible in the reference is not visible in the actual viewport. Background is also brighter/greener. |
| `/projects` | 402x540 | `../../../handoff/shots/projects-mobile.png` | `actual/projects-mobile-actual.png` | FAIL | Page composition is close but hero block is lower/airier than reference, and the divider/content ending position differs. Background green wash is materially brighter than reference. |
| `/about` | 402x540 | `../../../handoff/shots/about-mobile.png` | `actual/about-mobile-actual.png` | FAIL | Headline line breaks match, but the eyebrow/headline block begins lower than reference. Background glow is brighter/greener than the darker handoff. |

## Issues

### P1 — Interior mobile hero stack is too low vs handoff, causing first-viewport reveal mismatch

- **Severity:** P1
- **Routes:** `/writing`, `/projects`, `/about`
- **Viewport:** 402x540
- **Evidence:**
  - `comparisons/all-mobile-contact.png`
  - `actual/writing-mobile-actual.png`
  - `actual/projects-mobile-actual.png`
  - `actual/about-mobile-actual.png`
- **Repro steps:**
  1. Open `http://localhost:3103/writing` at 402x540.
  2. Compare to `handoff/shots/writing-mobile.png`.
  3. Repeat for `/projects` and `/about` against their matching handoff shots.
- **Expected:** Interior route eyebrow/title/body compositions should occupy the same first-viewport geometry as the handoff screenshots. On `/writing`, the divider should sit around the handoff position and the `FEATURED Sep 15, 2025 · 16 min read` row should be visible at the bottom of the first viewport.
- **Actual:** Interior route hero content is pushed downward. `/writing` is the clearest regression: the divider is at the bottom of the viewport and the featured metadata row is completely below the fold, while the reference shows it in-view.
- **Exact fix needed:** Reduce mobile vertical spacing above the interior route hero content by roughly 30-45px and verify at 402x540. Tune per-template if needed so:
  - `/writing`: featured metadata row is visible in the first viewport as in the reference.
  - `/projects`: divider sits at the reference lower-boundary position without excessive bottom air.
  - `/about`: eyebrow/headline block starts at the reference vertical position while preserving the current correct line breaks.

### P1 — Background atmosphere is too bright/green compared with the darker handoff screenshots

- **Severity:** P1
- **Routes:** `/`, `/writing`, `/projects`, `/about`
- **Viewport:** 402x540
- **Evidence:**
  - `comparisons/all-mobile-contact.png`
  - `actual/home-mobile-actual.png`
  - `actual/writing-mobile-actual.png`
  - `actual/projects-mobile-actual.png`
  - `actual/about-mobile-actual.png`
- **Repro steps:**
  1. Open each route at 402x540.
  2. Compare the first viewport background against the corresponding handoff screenshot.
- **Expected:** The handoff background is near-black with restrained emerald/purple undertones. The ambience supports the editorial typography without becoming a visible centered green spotlight.
- **Actual:** The live page shows a brighter green radial wash centered behind the header/hero area. This is especially visible in the contact sheet diff column and makes the first viewport feel less dark and less refined than the references.
- **Exact fix needed:** Lower opacity/intensity of the central emerald radial layer on mobile and/or shift it farther right/down. Preserve the subtle route-specific purple/teal undertones, but bring the overall first viewport closer to the darker handoff values.

### P2 — Header/nav sits slightly lower than the handoff

- **Severity:** P2
- **Routes:** `/`, `/writing`, `/projects`, `/about`
- **Viewport:** 402x540
- **Evidence:** `comparisons/all-mobile-contact.png`
- **Expected:** Header brand and nav align to the handoff top rhythm.
- **Actual:** The live header appears a few pixels lower than the reference across routes. This is minor by itself but contributes to the lower first-viewport composition on interior pages.
- **Exact fix needed:** After resolving the hero-stack spacing, retune mobile header top padding by a few pixels only if the contact sheet still shows a persistent offset.

### P2 — Console noise from Vercel Speed Insights in local production build

- **Severity:** P2
- **Routes:** `/`, `/writing`, `/projects`, `/about`
- **Viewport:** 402x540
- **Evidence:** `logs/*-console.txt`; `logs/*-errors.txt` are empty.
- **Expected:** Production-build QA console should be free of repeated integration warnings when possible.
- **Actual:** Console logs repeatedly report `[Vercel Speed Insights] Failed to load script from /_vercel/speed-insights/script.js`. No page errors were reported.
- **Exact fix needed:** If this is expected for localhost only, no visual blocker. If this appears in deployed environments, gate Speed Insights loading or configure it so the script resolves cleanly.

## Console/error summary

- `agent-browser errors`: no page errors captured for any route.
- `agent-browser console`: custom site banner plus repeated Vercel Speed Insights script-load logs. See `logs/*-console.txt`.

## Required fixes before PASS

1. Retune interior mobile vertical rhythm so `/writing`, `/projects`, and `/about` match the handoff first-viewport geometry at 402x540. `/writing` must reveal the featured metadata row in the first viewport.
2. Darken/subdue the mobile background radial treatment so it no longer reads as a bright centered green glow.
3. Re-capture the same four routes at 402x540 and regenerate the contact sheet.

