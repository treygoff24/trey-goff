VERDICT: FAIL

Round 2 native visual QA, desktop scope only. Captures were rerun after the production server restart and recovery on `http://localhost:3103`; final screenshots below are post-restart. Dedicated Agent Browser session used: `tg-r2-desktop` and closed after capture.

## Coverage matrix

| Route | Viewport | Reference | Actual | Status | Main deltas |
|---|---:|---|---|---|---|
| `/` | 924x540 | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/home-desktop.png` | `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/screenshots/home-actual.png` | PASS with P2 polish deltas | Overall composition is close. Header/brand sit ~10-12px lower than the reference; right-side green atmospheric wash is slightly darker/subtler; CTAs are slightly higher than the handoff. Not a material desktop blocker by itself. |
| `/writing` | 924x540 | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/writing-desktop.png` | `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/screenshots/writing-actual.png` | FAIL - P1 | Page content starts too high and too far left. Handoff uses ~48px left/right page gutters and starts the section label near y=155; actual uses ~16px gutters and starts near y=120. Divider spans almost full viewport instead of the inset editorial measure. |
| `/projects` | 924x540 | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/projects-desktop.png` | `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/screenshots/projects-actual.png` | FAIL - P1 | Same shared shell mismatch as writing: content is too high and too wide/left. The title begins around x=16/y=164 instead of x=48/y=196, making the first viewport feel less deliberate and less like the handoff. |
| `/about` | 924x540 | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/about-desktop.png` | `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/screenshots/about-actual.png` | FAIL - P1 | Most material mismatch. The hero heading is too high and spans too wide, starting near x=16 instead of x=48. The lower two-column section is too dense in the first viewport, with the next paragraph visibly clipped at the bottom; the handoff keeps a calmer crop. |

## Does this match or exceed the screenshot polish?

No. The implementation is directionally close and the home page is mostly acceptable, but the desktop implementation does **not** yet match or exceed the handoff polish because the shared inner-page desktop layout (`/writing`, `/projects`, `/about`) materially differs in first-viewport composition: gutters, top rhythm, measure, and density are off.

## Issues

### P0

None found.

### P1 - Material screenshot mismatches

#### P1-001 - Inner page desktop shell uses the wrong editorial inset and vertical start

- **Routes:** `/writing`, `/projects`, `/about`
- **Viewport:** 924x540
- **Evidence:**
  - `comparisons/writing-comparison.png`
  - `comparisons/projects-comparison.png`
  - `comparisons/about-comparison.png`
  - `comparisons/desktop-contact-sheet.png`
- **Expected:** Inner pages match the handoff editorial frame: roughly 48px horizontal gutters at 924px, section labels near the y=155 band, headings around y=196, and rules/content constrained to the same inset width.
- **Actual:** Inner pages render with roughly 16px gutters and start the section labels around y=120. Headings and body copy are too far left and too high; horizontal rules run nearly edge-to-edge.
- **Exact fix needed:** Adjust the desktop inner-page shell/container for writing/projects/about to restore the handoff frame: use the same ~48px desktop side inset as the screenshots, constrain text/rules to the intended editorial width, and add ~35px top breathing room before the section eyebrow. Also move the shared header up by ~10-12px if matching the screenshot exactly is required.

#### P1-002 - About desktop first viewport is too dense and exposes clipped next-section text

- **Route:** `/about`
- **Viewport:** 924x540
- **Evidence:**
  - `screenshots/about-actual.png`
  - `comparisons/about-comparison.png`
- **Expected:** About screenshot keeps the hero heading in the handoff position and shows the intro copy + portrait placeholder as the dominant lower composition. No clipped next paragraph should intrude at the bottom of the first viewport.
- **Actual:** Heading starts too far left/high and spans nearly the full viewport width. The lower content is compressed upward enough that the next paragraph begins and is visibly cut off at the bottom edge.
- **Exact fix needed:** After fixing the shared gutter/top rhythm, tune the about-specific hero/intro spacing so the intro + portrait block matches the reference crop. Keep the next paragraph below the first viewport at 924x540, or ensure it enters intentionally rather than as clipped text.

### P2 - Polish / non-blocking deltas

#### P2-001 - Header vertical position is slightly low versus handoff

- **Routes:** `/`, `/writing`, `/projects`, `/about`
- **Viewport:** 924x540
- **Evidence:** `comparisons/desktop-contact-sheet.png`
- **Expected:** Brand/nav sit close to the screenshot top rhythm, around the y=36-45 band.
- **Actual:** Brand/nav sit around 10-12px lower. This is minor on home but contributes to the mismatch on inner pages.
- **Fix:** Reduce desktop header top padding by ~10-12px, then re-check home because its main hero currently aligns better than the inner pages.

#### P2-002 - Atmospheric background is close but slightly darker/subtler than reference

- **Routes:** mostly `/`, also inner pages
- **Viewport:** 924x540
- **Evidence:** `comparisons/home-comparison.png`, `comparisons/desktop-contact-sheet.png`
- **Expected:** Handoff shows a clearer right-side emerald wash and starfield glints.
- **Actual:** Actual background keeps the mood but the green wash is less legible in parts, especially on home.
- **Fix:** Slightly increase the right radial/emerald wash opacity or spread after layout fixes. This should remain subtle; do not let it compete with type.

## Console / error notes

- No JavaScript page errors were captured in `logs/*-errors.txt`.
- Console logs are saved under `logs/*-console.txt`.
- Repeated local console message: `[Vercel Speed Insights] Failed to load script from /_vercel/speed-insights/script.js...`. This appears environment/local-server related and is not counted as a visual QA issue.

## Evidence index

- Actual screenshots: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/screenshots/`
- Side-by-side comparisons and amplified diffs: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/comparisons/`
- Contact sheet: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/comparisons/desktop-contact-sheet.png`
- Snapshots / console / error logs: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/logs/`
- Image metrics: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-2/desktop/logs/image-metrics.txt`
