VERDICT: FAIL

Round 2 native visual QA for `/library` and Library lenses was rerun against the post-restart production server at `http://localhost:3103` after the latest fixes. Evidence was captured with `agent-browser` session `tg-r2-library`.

Correction applied: `handoff/shots/library-mobile.png` is **441x540**, not 402x540. The Library mobile actual screenshot was captured at **441x540**. Desktop and lens states were captured at **924x540**.

## Bottom line

This does **not** yet match or exceed the handoff screenshot polish. The Library hero is close, especially desktop and corrected mobile geometry, but the lens viewport states still have material composition mismatches: the sticky header/intro content occupies the top of the lens shots, the lens bar sits too low/overlaps content relative to the references, Constellation is smaller/sparser/less luminous, River requires a different scroll position to reveal the bars, and Index truncates long titles where the reference wraps them. These are P1 screenshot-match issues for the requested Library/Lenses scope.

## Matrix

| State | Viewport | Reference | Actual | Status | Main deltas |
|---|---:|---|---|---|---|
| Library desktop | 924x540 | `handoff/shots/library-desktop.png` | `screenshots/postrestart-library-desktop-924x540.png` | PASS with P2 polish | Strong match in headline, nav, stats, chips, and lens bar. Actual lower panel begins slightly higher/more visible; chip strip clips at right edge similarly to reference. |
| Library mobile | 441x540 | `handoff/shots/library-mobile.png` | `screenshots/postrestart-library-mobile-441x540.png` | PASS with P2 polish | Corrected 441px geometry is materially fixed. Hero/nav/headline match is close. Actual shows the lens panel title and constellation content sooner than reference; reference lens bar reads more separated from content. |
| Constellation lens | 924x540 | `handoff/shots/lens-constellation.png` | `screenshots/postrestart-lens-constellation-924x540.png` | FAIL / P1 | Actual includes sticky nav/title/stats/intro remnant at top, pushing the constellation down. Graph is smaller and less dense/luminous than reference, with less color contrast and less “constellation cloud” polish. Lens bar overlaps lower graph area. |
| Shelf lens | 924x540 | `handoff/shots/lens-shelf.png` | `screenshots/postrestart-lens-shelf-924x540.png` | FAIL / P1 | Actual has sticky nav/title/stats/chips occupying top region; reference begins with `ARRANGE BY` near top and books dominate the first viewport. Actual shelf starts lower and has bottom lens bar overlapping book bottoms. |
| River lens | 924x540 | `handoff/shots/lens-river.png` | `screenshots/postrestart-lens-river-924x540.png`; supplemental `screenshots/postrestart-lens-river-bars-924x540.png` | FAIL / P1 | At the same lens scroll framing, actual first capture is mostly empty and bars are below the fold. Supplemental capture reveals bars, but only after a different scroll position, with sticky nav still consuming top space and less purple/green atmospheric background than reference. |
| Index lens | 924x540 | `handoff/shots/lens-index.png` | `screenshots/postrestart-lens-index-924x540.png` | FAIL / P1 | Actual includes sticky header/stats/chips above table, compressing rows. Long title truncates (`Breakneck... Fu...`) where reference wraps cleanly to two lines. Lens bar overlays row 4 area. |
| Category strip interaction | 924x540 | N/A | `screenshots/postrestart-interaction-category-fantasy-ref.png` | PASS | Chip works via fresh snapshot ref; Fantasy becomes selected and visual state updates. Role/text locator was flaky, but direct accessible ref interaction worked. |
| Lens switcher interaction | 924x540 | N/A | Lens screenshots above | PASS with P2 polish | Switcher is visible and usable. It remains fixed/available, but its placement overlaps content in the lens screenshots. |
| Drawer open/close | 924x540 | N/A | `screenshots/postrestart-interaction-drawer-open-ref.png`, `screenshots/postrestart-interaction-drawer-close-ref.png` | PASS with P2/P1 context | Drawer opens from an Index row and Escape closes it. First text-locator attempts were blocked by sticky nav at some scroll positions; fresh row refs worked. Drawer visual itself is polished. |
| Console/errors | all tested | N/A | `logs/postrestart-error-summary.txt`, `logs/postrestart-console-summary.txt` | PASS with note | No `agent-browser errors` output. Console contains only the intentional console banner and repeated Vercel Speed Insights script-load logs for local/prod preview. |

## Issues

### P0

None found.

### P1-001: Lens captures do not match reference composition because sticky header/hero/chips consume the lens viewport

- URL: `http://localhost:3103/library`
- Viewport: 924x540
- Evidence:
  - `screenshots/postrestart-lens-constellation-924x540.png`
  - `screenshots/postrestart-lens-shelf-924x540.png`
  - `screenshots/postrestart-lens-river-924x540.png`
  - `screenshots/postrestart-lens-index-924x540.png`
  - Contact sheet: `contact/postrestart-reference-vs-actual-contact-sheet.png`
- Expected: Lens reference screenshots start with the lens content region framed as the primary viewport object: chips/panel/lens content, without the persistent site header/title/stats taking over the top of the frame.
- Actual: Sticky nav/title/stats/chips remain visible at the top of all lens states, reducing the usable content viewport and causing the lens switcher to overlap/cover the content lower in frame.
- Fix needed: For the library lens section, align the sticky/header behavior and scroll anchoring to the handoff: when lens states are in-view, the lens content should occupy the viewport similarly to the references. Either suppress/collapse the site nav/stats in this section, increase section offset/anchor behavior, or make the lens control bar reserve layout space instead of overlaying rows/graphs.

### P1-002: Constellation lens lacks reference density, scale, and glow polish

- URL: `http://localhost:3103/library`
- Viewport: 924x540
- Evidence: `screenshots/postrestart-lens-constellation-924x540.png`
- Expected: Large, vivid constellation graph filling most of the panel, with dense topic clusters, strong cyan/green glow, and layered thread lines like `handoff/shots/lens-constellation.png`.
- Actual: Graph is smaller, lower, visually thinner, and less luminous. The panel reads more like a sparse network diagram than the denser handoff constellation.
- Fix needed: Increase graph scale/available panel height, boost node/thread density and glow, restore stronger cyan/green cluster contrast, and ensure the switcher does not sit on top of the graph.

### P1-003: River lens bars are not visible in the primary lens framing

- URL: `http://localhost:3103/library`
- Viewport: 924x540
- Evidence:
  - Primary: `screenshots/postrestart-lens-river-924x540.png`
  - Supplemental showing bars after additional scroll: `screenshots/postrestart-lens-river-bars-924x540.png`
- Expected: Reference `handoff/shots/lens-river.png` shows the atmospheric background and timeline bars along the bottom of the same viewport.
- Actual: The primary lens framing is mostly empty; the bars are below the fold until additional scroll. When visible, the sticky nav still occupies top space and the background is less close to the purple/green atmospheric reference.
- Fix needed: Move the River visualization upward / reserve less empty vertical space, match the reference background treatment, and keep the bars visible in the first 924x540 lens viewport.

### P1-004: Index lens truncates titles and lens bar overlaps row content

- URL: `http://localhost:3103/library`
- Viewport: 924x540
- Evidence: `screenshots/postrestart-lens-index-924x540.png`
- Expected: Reference `handoff/shots/lens-index.png` wraps long titles cleanly in the title column and shows the first rows without a floating control overlay covering row content.
- Actual: `Breakneck: China's Quest to Engineer the Fu...` truncates in a single line, and the lens switcher overlays the fourth row area.
- Fix needed: Allow title column wrapping at desktop like the handoff; reserve bottom space for the lens switcher or place it outside the table’s readable row area.

### P2-001: Accessible heading text concatenates “to” and “wander”

- URL: `http://localhost:3103/library`
- Viewport: 924x540 and 441x540
- Evidence: `logs/postrestart-snapshot-library-desktop-924x540.txt`, `logs/postrestart-snapshot-library-mobile-441x540.txt`
- Expected: Assistive/accessibility text should read “Everything I've read, and four ways to wander it.”
- Actual: Snapshot exposes heading as `Everything I've read, and four ways towander it.`
- Fix needed: Preserve visual italic styling while ensuring the text node/spacing between “to” and `wander` is accessible as a normal space.

### P2-002: Text/role locator reliability for visible controls was inconsistent

- URL: `http://localhost:3103/library`
- Viewport: 924x540
- Evidence:
  - Successful ref-based chip click: `screenshots/postrestart-interaction-category-fantasy-ref.png`
  - Logs: `logs/postrestart-snapshot-category-fantasy-ref.txt`
- Expected: Visible buttons such as category chips should be easy to target by accessible name as well as by snapshot refs.
- Actual: Fresh snapshot refs worked, but `find text`/`find role button --name` attempts for the Fantasy chip were flaky in this agent-browser run. This is lower severity because real click interaction works, but it suggests accessible naming/locator normalization should be checked.
- Fix needed: Confirm category buttons have stable, simple accessible names and no hidden duplicate/animated layer interfering with locator matching.

## Interaction checks

- Lens switcher visible and usable: PASS.
- Category strip usable: PASS via snapshot ref; Fantasy selected state captured.
- Drawer opens/closes: PASS via Index row ref and Escape. The drawer presentation is visually strong.
- Console/errors clean: PASS for runtime errors; only local Vercel Speed Insights script-load console logs observed.

## Evidence index

Key screenshots:

- `screenshots/postrestart-library-desktop-924x540.png`
- `screenshots/postrestart-library-mobile-441x540.png`
- `screenshots/postrestart-lens-constellation-924x540.png`
- `screenshots/postrestart-lens-shelf-924x540.png`
- `screenshots/postrestart-lens-river-924x540.png`
- `screenshots/postrestart-lens-river-bars-924x540.png`
- `screenshots/postrestart-lens-index-924x540.png`
- `screenshots/postrestart-interaction-category-fantasy-ref.png`
- `screenshots/postrestart-interaction-drawer-open-ref.png`
- `screenshots/postrestart-interaction-drawer-close-ref.png`

Comparison sheet:

- `contact/postrestart-reference-vs-actual-contact-sheet.png`

Logs:

- `logs/postrestart-error-summary.txt`
- `logs/postrestart-console-summary.txt`
- per-state snapshots and logs under `logs/`
