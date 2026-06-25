# Round 1 Desktop Visual QA — Trey Goff Site Redesign

| Field | Value |
|---|---|
| Date | 2026-06-24 |
| Target | http://localhost:3103 |
| Session | `tg-r1-desktop` |
| Viewport | 924 × 540 |
| Method | Local `agent-browser` CLI against running production server; no app source inspection. |
| Handoff goal | `docs/designs/2026-06-24-personal-website-redesign-concept/handoff/shots/*-desktop.png` |

## Captured evidence

### Actual screenshots

- `/`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/screenshots/home-actual.png`
- `/writing`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/screenshots/writing-actual.png`
- `/projects`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/screenshots/projects-actual.png`
- `/about`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/screenshots/about-actual.png`
- `/library`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/screenshots/library-actual.png`

### Comparison sheets

- `/`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/home-comparison.png`
- `/writing`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/writing-comparison.png`
- `/projects`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/projects-comparison.png`
- `/about`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/about-comparison.png`
- `/library`: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/library-comparison.png`
- Actuals grid: `docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-1/desktop/evidence/actuals-grid.png`

Console/errors were also captured under `desktop/evidence/*-console.txt` and `desktop/evidence/*-errors.txt`. No route had `agent-browser errors`; console only showed local Vercel Speed Insights load logs plus the intentional home console banner.

## Pass/fail matrix

Legend: PASS = matches or exceeds handoff at this viewport. FAIL = visible screenshot-match/polish gap. PARTIAL = acceptable in isolation but weaker than handoff or affected by a cross-route issue.

| Route | Nav fit/order | Hero scale/copy | Typography | Palette/background | Ruled rows / no-card language | Footer visibility | Desktop cropping/fit | Overall polish vs screenshot |
|---|---|---|---|---|---|---|---|---|
| `/` | FAIL — order is correct, but nav is uppercase/letterspaced, search pill is added, header has a full-width rule and much more visual weight than handoff. | FAIL — copy matches, but CTAs expected in first viewport are missing below the fold. | FAIL — handoff is editorial serif display; actual is oversized sans display. | PARTIAL — green atmosphere exists, but actual is brighter/flatter and less black, with less depth than handoff. | N/A | PASS — no footer visible, matching first-viewport expectation. | FAIL — 540px viewport loses the CTA row visible in handoff. | FAIL |
| `/writing` | FAIL — same global header/search mismatch; active state uses dot marker not handoff treatment. | PARTIAL — copy matches, but vertical rhythm is lower/heavier than handoff. | FAIL — heading and article title should use the handoff's serif editorial treatment. | PARTIAL — background is close in mood but less black/deep. | PASS — ruled divider and cardless list language are present. | PASS — no footer visible. | PARTIAL — first article teaser is cut at the bottom more aggressively than handoff. | FAIL |
| `/projects` | FAIL — same global header/search mismatch. | PARTIAL — copy matches, but the headline is sans and sits in a denser, less editorial composition. | FAIL — handoff uses serif headline and project title; actual uses sans. | PARTIAL — green field is close but flatter/brighter. | PASS — ruled divider and no-card project row language are present. | PASS — no footer visible. | PARTIAL — first project content starts correctly but loses more lower copy in the fold. | FAIL |
| `/about` | FAIL — same global header/search mismatch. | FAIL — headline copy matches, but the expected two-column composition with portrait/drop placeholder is absent in the first viewport. | FAIL — handoff uses serif headline/body; actual is all sans. | PARTIAL — atmospheric background present but less close to handoff depth. | N/A | PASS — no footer visible. | FAIL — body text continues/crops at bottom while expected portrait area is missing. | FAIL |
| `/library` | FAIL — same global header/search mismatch. | PARTIAL — copy/stats match, but scale is too large and less editorial. | FAIL — handoff uses serif headline; actual is heavy sans. | PARTIAL — background mood close but brighter/flatter. | PARTIAL — chip/control language is present, but lower module title/ruled area is displaced and right chips are clipped. | PASS — no footer visible. | FAIL — filter rail overflows/clips horizontally at 924px and bottom module content is pushed out of the expected fold. | FAIL |

## Issue packets

### ISSUE-001 — P1 — Global typography does not match the handoff editorial system

| Field | Value |
|---|---|
| Severity | P1 |
| Routes | `/`, `/writing`, `/projects`, `/about`, `/library` |
| Viewport | 924 × 540 |
| Evidence | `desktop/evidence/home-comparison.png`, `desktop/evidence/writing-comparison.png`, `desktop/evidence/projects-comparison.png`, `desktop/evidence/about-comparison.png`, `desktop/evidence/library-comparison.png` |

**Expected from handoff**

The redesign relies on an editorial serif identity: brand wordmark, large page headlines, featured/project titles, and about body copy have high-contrast serif shapes. The italic accent word is green and sits inside that serif composition.

**Actual observed**

The implementation uses a geometric/neutral sans treatment for the brand, hero headings, page headings, article/project titles, and body-heavy areas. This changes the tone from authored/editorial to generic product UI and is the largest visual mismatch across every desktop screenshot.

**Recommended fix**

Restore the handoff typography stack and role mapping: serif for brand/display/article-title/about body where shown in the references, restrained sans only for labels/nav/body support text. Then retune line-height and font sizes against the 924×540 screenshots.

---

### ISSUE-002 — P1 — Global header/nav adds chrome not present in the handoff and consumes first-viewport space

| Field | Value |
|---|---|
| Severity | P1 |
| Routes | `/`, `/writing`, `/projects`, `/about`, `/library` |
| Viewport | 924 × 540 |
| Evidence | All actual screenshots; clearest in `desktop/evidence/home-comparison.png` |

**Expected from handoff**

A quiet, transparent top treatment: `Trey Goff` at top-left, right-aligned nav items in order `Writing`, `Projects`, `Library`, `About`, no search pill, no full-width horizontal header rule, and no uppercase letterspaced nav styling.

**Actual observed**

The current header is taller/heavier, has a full-width bottom border, uppercase letterspaced nav, an added `Search ⌘K` pill, and active-state dots. At 924px this makes the top feel like app chrome instead of the handoff's lightweight editorial masthead.

**Recommended fix**

Match the handoff header exactly for this redesign pass: remove the search pill from the desktop screenshot state, remove the full-width header divider, use the handoff nav case/weight/spacing, and keep the same nav order and active color treatment.

---

### ISSUE-003 — P1 — Home hero CTA row is missing from the 924×540 first viewport

| Field | Value |
|---|---|
| Severity | P1 |
| Route | `/` |
| Viewport | 924 × 540 |
| Screenshot | `desktop/screenshots/home-actual.png` |
| Comparison | `desktop/evidence/home-comparison.png` |

**Expected from handoff**

The first viewport includes the complete home hero composition: label, large headline, support copy, and two CTA buttons (`READ THE WRITING →`, `SEE THE WORK →`) visible near the bottom.

**Actual observed**

The label/headline/support copy are visible, but the CTA row is below the fold at 540px. The screenshot therefore loses the intended action finish and feels less complete than the handoff.

**Recommended fix**

Reduce vertical consumption above the hero and/or retune hero spacing so the CTA row lands inside the 924×540 viewport. The header fixes in ISSUE-002 likely recover part of the needed height; then tighten hero top offset and support-copy margin to match the reference.

---

### ISSUE-004 — P1 — About page is missing the handoff's two-column portrait/drop composition in the first viewport

| Field | Value |
|---|---|
| Severity | P1 |
| Route | `/about` |
| Viewport | 924 × 540 |
| Screenshot | `desktop/screenshots/about-actual.png` |
| Comparison | `desktop/evidence/about-comparison.png` |

**Expected from handoff**

Below the about headline, the first viewport splits into an editorial text column and a right-side striped portrait/drop placeholder. The visual block anchors the page and balances the long headline.

**Actual observed**

The first viewport remains text-only. The right portrait/drop block is absent, and the body copy continues toward the bottom where it is cropped. This breaks the handoff composition and makes the page feel unfinished compared with the reference.

**Recommended fix**

Restore the two-column desktop layout at 924px: text column on the left, portrait/drop placeholder on the right, with the placeholder top aligned around the handoff's y-position. Keep body copy measure closer to the reference so it does not run as a wide single-column block.

---

### ISSUE-005 — P1 — Library controls overflow and displace the expected lower module at 924px

| Field | Value |
|---|---|
| Severity | P1 |
| Route | `/library` |
| Viewport | 924 × 540 |
| Screenshot | `desktop/screenshots/library-actual.png` |
| Comparison | `desktop/evidence/library-comparison.png` |

**Expected from handoff**

At 924px, the library hero, stats, filter chips, centered lens control, and the beginning of the `THE CONSTELLATION` module all fit into the screenshot. The right-side chips may continue, but the composition remains intentionally cropped and anchored.

**Actual observed**

The headline is larger/heavier, pushing controls downward. The chip rail extends off the right edge (`BUSIN...` clipped), and the lower `THE CONSTELLATION` module is not visible in the first viewport where it appears in the handoff.

**Recommended fix**

Retune desktop library scale and horizontal overflow: reduce headline/control vertical footprint to the handoff, constrain or mask the chip row intentionally, and ensure the constellation module top is visible by y≈493 as in the reference.

---

### ISSUE-006 — P2 — Background/color depth is close in palette but flatter and greener than the handoff

| Field | Value |
|---|---|
| Severity | P2 |
| Routes | `/`, `/writing`, `/projects`, `/about`, `/library` |
| Viewport | 924 × 540 |
| Evidence | All comparison sheets under `desktop/evidence/*-comparison.png` |

**Expected from handoff**

The handoff has a deeper black-to-emerald field, strong left-side darkness, subtle star/speck detail, and quieter green arcs that create depth without washing over text.

**Actual observed**

The implementation keeps the general green atmosphere, but the field is brighter and more uniformly green. The left side is less black, depth is softer, and the composition reads more like a broad radial wash than the handoff's moody layered background.

**Recommended fix**

Darken the left/base background, reduce the global green wash opacity, and reintroduce the subtler layered arc/star treatment from the handoff. Verify text contrast remains strong after restoring the darker field.

## Final verdict

**FAIL** for round 1 desktop screenshot match/polish.

No P0 blockers were observed, and the site loads without browser-reported runtime errors. However, multiple P1 gaps remain: global typography, global header/nav chrome, missing home CTAs in the first viewport, missing about two-column visual anchor, and library desktop overflow/fit. Desktop should not be signed off until those P1 gaps are fixed and re-captured at 924×540.
