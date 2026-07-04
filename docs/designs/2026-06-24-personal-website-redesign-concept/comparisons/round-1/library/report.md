# Round 1 Library Lens Visual + Interaction QA

| Field | Value |
|---|---|
| Date | 2026-06-24 |
| Route | `http://localhost:3103/library` |
| Session | `tg-r1-library` |
| Method | Local `agent-browser` CLI against running production server; no app source inspected |
| Reference shots | `handoff/shots/library-desktop.png`, `library-mobile.png`, `lens-constellation.png`, `lens-shelf.png`, `lens-river.png`, `lens-index.png` |

## Captured evidence

Screenshots:

- Default desktop, 924x540: `screenshots/default-constellation-actual.png`
- Pointer lens states at top viewport: `screenshots/shelf-actual.png`, `screenshots/river-actual.png`, `screenshots/index-actual.png`, `screenshots/constellation-after-pointer-actual.png`
- Scrolled lens states, 924x540: `screenshots/constellation-lens-actual.png`, `screenshots/shelf-lens-actual.png`, `screenshots/river-lens-actual.png`, `screenshots/river-bars-actual.png`, `screenshots/index-lens-actual.png`
- Category filter: `screenshots/category-sci-fi-index-actual.png`, `screenshots/category-sci-fi-shelf-actual.png`
- Drawer: `screenshots/drawer-open-index-actual.png`, `screenshots/drawer-after-escape-actual.png`, `screenshots/see-shelf-activated-actual.png`
- Mobile, 441x540: `screenshots/mobile-default-actual.png`, `screenshots/mobile-shelf-actual.png`
- Reduced motion: `screenshots/reduced-motion-idle-a.png`, `screenshots/reduced-motion-idle-b.png`

Supporting logs/snapshots:

- Desktop viewport verification: `logs/viewport-desktop.json`
- Mobile viewport verification: `logs/viewport-mobile.json`
- Keyboard lens activation: `logs/keyboard-lens-switch.txt`
- Drawer focus return: `logs/drawer-open-focus.json`, `logs/drawer-escape-focus-return.json`
- See-the-shelf activation: `logs/see-shelf-activated.json`
- Reduced motion media/diff: `logs/reduced-motion-media.json`, `logs/reduced-motion-diff.txt`
- Console/errors: `logs/console-final.txt`, `logs/errors-final.txt`
- Raw Agent Browser snapshots are in `snapshots/`.

## Pass/fail matrix

| Dimension | Verdict | Evidence | Notes |
|---|---:|---|---|
| Lens controls | FAIL | `default-constellation-actual.png`, `keyboard-lens-switch.txt` | Buttons activate by pointer and keyboard, but the sticky pill sits over the category strip/content at the reference viewport and creates ambiguous `Shelf` controls in the accessibility tree. |
| Category strip | PARTIAL | `category-sci-fi-index-actual.png`, `category-sci-fi-shelf-actual.png` | Chips toggle and dim non-matching items. However, scoped states still show non-matching rows/books heavily dimmed rather than presenting a clean scoped lens; this is visually muddy at 540px. |
| Constellation composition | FAIL | `default-constellation-actual.png`, `constellation-lens-actual.png` | The default 924x540 viewport does not show the constellation panel like the handoff. Scrolled view is flatter/thinner and less luminous than the reference. |
| Shelf visual density | FAIL | `shelf-lens-actual.png`, `category-sci-fi-shelf-actual.png` | Book bars are present, but typography/material finish is flatter and the sticky lens control overlays the books. Filtered shelf remains muddy because dimmed non-matching books stay visible. |
| River visual density | FAIL | `river-lens-actual.png`, `river-bars-actual.png` | At the comparable lens scroll, the River is mostly empty; bars require additional scroll and then sit low/flat compared with the handoff's stronger timeline composition. |
| Index visual density | FAIL | `index-lens-actual.png`, `index-lower-actual.png` | Index works functionally, but uses a sans-heavy table with truncated titles and the sticky control obscures rows; it does not match the editorial serif/polished handoff. |
| Drawer polish/a11y | PASS with polish note | `drawer-open-index-actual.png`, `drawer-after-escape-actual.png`, `see-shelf-activated-actual.png` | Drawer opens from Index, Escape closes it, focus returns to the triggering row, and `See the shelf ->` switches to Shelf with the active category. First drawer viewport hides the CTA below the fold at 540px. |
| Mobile safe area/ergonomics | FAIL | `mobile-default-actual.png`, `mobile-shelf-actual.png` | Mobile route is functional, but screenshot match is off: hamburger/search replace reference nav links, category chips and sticky lens control collide at the bottom, and the lens itself is not visible in the first viewport. |
| Reduced motion | PASS | `reduced-motion-idle-a.png`, `reduced-motion-idle-b.png`, `reduced-motion-diff.txt` | `prefers-reduced-motion: reduce` was true; two idle screenshots 2.2s apart had 0 changed pixels. No obvious continuous/janky animation while idle. |
| Console/errors | PASS with note | `console-final.txt`, `errors-final.txt` | `agent-browser errors` was empty. Console logs include local Vercel Speed Insights load messages, but no route-breaking JS errors observed. |
| Overall polish vs screenshot | FAIL | All screenshots above | The route is functional and visually coherent, but it does not yet match or exceed the handoff quality/composition at the required viewports. |

## Issue packets

### LIB-R1-001 — Desktop first viewport does not match handoff composition

| Field | Value |
|---|---|
| Severity | P1 |
| Route/state | `/library`, default Constellation |
| Viewport | 924x540 |
| Evidence | `screenshots/default-constellation-actual.png` |

**Repro steps**

1. `agent-browser set viewport 924 540 --session tg-r1-library`
2. Open `http://localhost:3103/library` and wait for network idle.
3. Capture `screenshots/default-constellation-actual.png`.
4. Compare with `handoff/shots/library-desktop.png` and `handoff/shots/lens-constellation.png`.

**Expected from handoff**

- Editorial hero with serif display type, restrained scale, emerald depth, category strip, lens control, and the beginning of the constellation panel all composed within the 924x540 frame.
- Lens control should feel anchored between category strip and lens content, not covering adjacent controls.

**Actual observed**

- Hero uses a much larger sans display treatment and consumes the viewport.
- The constellation panel is below the fold at 924x540.
- Sticky lens control overlays the category chips at the bottom of the viewport.

**Recommended fix**

Tighten the desktop hero vertical budget for the 924x540 breakpoint: reduce display scale/leading, restore the editorial serif treatment from the handoff, and reserve non-overlapping space for category strip + lens controls + first lens panel.

---

### LIB-R1-002 — Lens surfaces are functionally present but below handoff polish/depth

| Field | Value |
|---|---|
| Severity | P1 |
| Route/state | `/library`, Constellation/Shelf/River/Index lenses |
| Viewport | 924x540 |
| Evidence | `screenshots/constellation-lens-actual.png`, `screenshots/shelf-lens-actual.png`, `screenshots/river-lens-actual.png`, `screenshots/river-bars-actual.png`, `screenshots/index-lens-actual.png` |

**Repro steps**

1. Open `/library` at 924x540.
2. Scroll to the lens region.
3. Switch through Constellation, Shelf, River, and Index using the lens buttons.
4. Compare captures with `handoff/shots/lens-constellation.png`, `lens-shelf.png`, `lens-river.png`, and `lens-index.png`.

**Expected from handoff**

- Constellation: luminous cyan/emerald clusters with stronger glow, depth, and a composed ring.
- Shelf: dense vertical book bars with crisp editorial serif book titles and premium emerald material.
- River: visible timeline bars in the same 540px lens frame, with atmospheric depth and labels.
- Index: editorial table with serif titles and clean row hierarchy.

**Actual observed**

- Constellation is thinner/flatter, with less glow and less palette depth.
- Shelf bars exist, but the sticky lens control overlays book content and the finish is flatter.
- River appears mostly empty at the comparable lens position; bars require additional scrolling.
- Index is functional but sans-heavy, title text truncates aggressively, and sticky controls obscure lower rows.

**Recommended fix**

Bring the lens region back to the handoff layout contract: fixed/known lens stage height inside the 540px viewport, non-overlapping sticky controls, restored editorial typography, and stronger emerald/cyan glow/material treatment for data marks.

---

### LIB-R1-003 — Mobile first viewport diverges from reference and crowds controls

| Field | Value |
|---|---|
| Severity | P1 |
| Route/state | `/library`, mobile default and Shelf |
| Viewport | 441x540 |
| Evidence | `screenshots/mobile-default-actual.png`, `screenshots/mobile-shelf-actual.png` |

**Repro steps**

1. `agent-browser set viewport 441 540 --session tg-r1-library`
2. Open `http://localhost:3103/library`.
3. Capture default and Shelf states.
4. Compare with `handoff/shots/library-mobile.png`.

**Expected from handoff**

- Mobile header/nav, hero, and lens switcher should match the handoff's balanced editorial composition.
- Lens switcher should be easy to touch and should not collide with category chips or safe-area edges.

**Actual observed**

- Header uses compact search/menu icons instead of the handoff's visible nav links.
- Hero remains large enough that no lens content is visible in the first viewport.
- Sticky lens switcher sits at the bottom over horizontally scrolling category chips, creating a crowded touch target zone.

**Recommended fix**

Rework the 441px composition to match the handoff: decide whether the reference nav links or current hamburger is canonical, reduce vertical crowding, and stack/position category chips and lens controls so they do not overlap at the bottom of the viewport.

---

### LIB-R1-004 — Filtered states are visually muddy because non-matching items remain as dimmed clutter

| Field | Value |
|---|---|
| Severity | P2 |
| Route/state | `/library`, category filter active on Index/Shelf |
| Viewport | 924x540 |
| Evidence | `screenshots/category-sci-fi-index-actual.png`, `screenshots/category-sci-fi-shelf-actual.png` |

**Repro steps**

1. Open `/library` at 924x540.
2. Switch to Index.
3. Activate `SCI-FI · 60`.
4. Switch to Shelf.

**Expected from handoff/request**

- Category toggles should dim/scope correctly while preserving a polished, legible lens.
- The active category should make the selected collection feel intentionally scoped, not disabled or hazy.

**Actual observed**

- Non-matching rows/books remain visible but heavily dimmed.
- The result is legible as a filter state, but visually muddy; selected items do not become the clear focus, especially in Shelf.

**Recommended fix**

Either fully scope the lens to matching items, or keep context but increase contrast/structure for matched items and reduce non-matching clutter. For the screenshot-match path, prefer the treatment shown in the handoff: active chip plus a clean, intentional lens composition.

---

### LIB-R1-005 — Drawer CTA is functional but hidden below the first 540px drawer viewport

| Field | Value |
|---|---|
| Severity | P3 |
| Route/state | `/library`, Index drawer |
| Viewport | 924x540 |
| Evidence | `screenshots/drawer-open-index-actual.png`, `snapshots/drawer-open-index-interactive.txt`, `screenshots/see-shelf-activated-actual.png` |

**Repro steps**

1. Open `/library` at 924x540.
2. Switch to Index.
3. Open the first visible book row.
4. Inspect the first drawer viewport and accessibility tree.

**Expected from handoff/request**

- Drawer should feel finished and should make the `See the shelf ->` path discoverable.

**Actual observed**

- Drawer opens cleanly, focuses the close button, Escape closes it, and focus returns to the row.
- The `See the Business/Fantasy shelf ->` CTA exists and works, but is below the visible area in the captured 540px drawer viewport.

**Recommended fix**

If the CTA is a primary cross-lens path, keep it visible without requiring drawer scrolling at 540px, or add a sticky footer/compact metadata layout for shorter viewports.

## Interaction notes

- Pointer lens switching: works for all four lens buttons when the pill is directly clicked.
- Keyboard lens switching: works by focusing each lens button and pressing Enter; see `logs/keyboard-lens-switch.txt`.
- Drawer: opens from Index; Escape closes; focus returns to the triggering row; see `logs/drawer-escape-focus-return.json`.
- `See the shelf ->`: activating the drawer CTA closes the drawer, switches to Shelf, and selects the matching category; see `logs/see-shelf-activated.json` and `screenshots/see-shelf-activated-actual.png`.
- Reduced motion: `matchMedia('(prefers-reduced-motion: reduce)').matches === true`; idle screenshots were identical after 2.2s.

## Final verdict

**FAIL.** Library does not yet pass Round 1 screenshot-match/polish QA. No P0 blockers were found, and core interactions are mostly functional, but multiple P1 gaps remain for desktop composition, lens polish/density, and mobile ergonomics versus the handoff screenshots.
