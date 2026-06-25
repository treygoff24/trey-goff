VERDICT: FAIL

# Round 3 Native Visual QA Regression — Desktop

| Field | Value |
|---|---|
| Date | 2026-06-24 |
| Server | http://localhost:3103 |
| Session | tg-r3-desktop |
| Viewport | 924x540 |
| Scope | Desktop visual regression vs handoff screenshots |
| Evidence root | docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-3/desktop/ |

## Summary

The homepage is close enough and reads polished, but the Round 2 inner-page P1 class is **not fully fixed**. `/writing` and `/projects` still push the lower editorial content materially too far down in the first viewport, and `/about` still has a first-viewport crop/vertical rhythm mismatch around the body/portrait block.

Implementation does **not** yet match or exceed the screenshot polish overall. It matches closely on `/`, but the inner pages still miss the intended screenshot geometry and first-viewport rhythm.

## Route matrix

| Route | Expected | Actual screenshot | Comparison | Result | Notes |
|---|---|---|---|---|---|
| `/` | `handoff/shots/home-desktop.png` | `screenshots/home-actual.png` | `comparisons/home-side-by-side.png` | PASS | Overall polish is close. Minor vertical/CTA/background differences are not material at desktop scope. |
| `/writing` | `handoff/shots/writing-desktop.png` | `screenshots/writing-actual.png` | `comparisons/writing-side-by-side.png` | FAIL | Material first-viewport rhythm mismatch: divider/featured article block sit ~30-45px too low; excerpt is clipped at bottom. |
| `/projects` | `handoff/shots/projects-desktop.png` | `screenshots/projects-actual.png` | `comparisons/projects-side-by-side.png` | FAIL | Material first-viewport rhythm mismatch: divider and project card area sit ~30px too low; card content is cropped more aggressively than the handoff. |
| `/about` | `handoff/shots/about-desktop.png` | `screenshots/about-actual.png` | `comparisons/about-side-by-side.png` | FAIL | About hero text/portrait block still sits too low; body bottom and portrait label are crowded/cropped in the 540px viewport. |

## P0 issues

None found.

## P1 issues

### P1-001 — `/writing` divider and featured article block remain too low

- **URL:** http://localhost:3103/writing
- **Viewport:** 924x540
- **Evidence:**
  - Actual: `screenshots/writing-actual.png`
  - Side-by-side/diff: `comparisons/writing-side-by-side.png`
  - All-route sheet: `comparisons/desktop-all-routes-expected-vs-actual.png`
- **Expected:** The rule should land near the handoff position, leaving the featured label/title/excerpt visible with the same first-viewport editorial rhythm.
- **Actual:** The rule and featured block are materially lower than the handoff. The article excerpt starts at the bottom edge and is clipped, reducing the intended first-viewport density and polish.
- **Repro steps:**
  1. Open `http://localhost:3103/writing` in session `tg-r3-desktop`.
  2. Set viewport to `924x540`.
  3. Compare screenshot to `handoff/shots/writing-desktop.png`.

### P1-002 — `/projects` divider and first project block remain too low

- **URL:** http://localhost:3103/projects
- **Viewport:** 924x540
- **Evidence:**
  - Actual: `screenshots/projects-actual.png`
  - Side-by-side/diff: `comparisons/projects-side-by-side.png`
  - All-route sheet: `comparisons/desktop-all-routes-expected-vs-actual.png`
- **Expected:** The project divider and “The Control Room” block should align with the handoff, preserving the first project’s visible title and intro rhythm.
- **Actual:** The divider and project block are materially lower than the handoff; the title is pushed close to the bottom and supporting copy is effectively lost from the first viewport.
- **Repro steps:**
  1. Open `http://localhost:3103/projects` in session `tg-r3-desktop`.
  2. Set viewport to `924x540`.
  3. Compare screenshot to `handoff/shots/projects-desktop.png`.

### P1-003 — `/about` first-viewport crop is still too tight

- **URL:** http://localhost:3103/about
- **Viewport:** 924x540
- **Evidence:**
  - Actual: `screenshots/about-actual.png`
  - Side-by-side/diff: `comparisons/about-side-by-side.png`
  - All-route sheet: `comparisons/desktop-all-routes-expected-vs-actual.png`
- **Expected:** The body text and portrait placeholder should match the handoff’s first-viewport placement, with the portrait label and final body line feeling intentionally cropped but not crowded.
- **Actual:** The lower body/portrait section sits lower than expected. The body’s final line and portrait label are crowded at the bottom edge, preserving the Round 2 about-crop problem in milder form.
- **Repro steps:**
  1. Open `http://localhost:3103/about` in session `tg-r3-desktop`.
  2. Set viewport to `924x540`.
  3. Compare screenshot to `handoff/shots/about-desktop.png`.

## P2 issues / notes

- **Console note, not counted as a visual regression:** each route logs `[Vercel Speed Insights] Failed to load script from /_vercel/speed-insights/script.js...` in local dev. No uncaught JS errors were reported in `*-errors.txt`. Evidence: `logs/*-console.txt`, `logs/*-errors.txt`.
- **Homepage minor deltas:** Homepage CTA/background positions differ slightly from the handoff but the desktop first viewport remains visually coherent and above the P1 threshold.

## Evidence index

- Actual screenshots: `screenshots/home-actual.png`, `screenshots/writing-actual.png`, `screenshots/projects-actual.png`, `screenshots/about-actual.png`
- Per-route comparisons: `comparisons/home-side-by-side.png`, `comparisons/writing-side-by-side.png`, `comparisons/projects-side-by-side.png`, `comparisons/about-side-by-side.png`
- Contact/all-route sheets: `comparisons/actual-contact-sheet.png`, `comparisons/desktop-all-routes-expected-vs-actual.png`
- Snapshots: `snapshots/home.txt`, `snapshots/writing.txt`, `snapshots/projects.txt`, `snapshots/about.txt`
- Console/errors: `logs/home-console.txt`, `logs/writing-console.txt`, `logs/projects-console.txt`, `logs/about-console.txt`, `logs/*-errors.txt`
- Diff metric scratchpad: `metrics.txt`

## Session closeout

Agent Browser session `tg-r3-desktop` was closed after capture.
