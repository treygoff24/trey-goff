# Round 1 Mobile Visual QA — Trey Goff Site Redesign

Target: `http://localhost:3103`  
Session: `tg-r1-mobile`  
Date: 2026-06-24  
Method: browser-only QA with local `agent-browser` CLI against the running production server. App source code was not inspected.

## Captured screenshot paths

### Route actuals

- Home `/` at 402x540: `screenshots/home-actual.png`
- Writing `/writing` at 402x540: `screenshots/writing-actual.png`
- Projects `/projects` at 402x540: `screenshots/projects-actual.png`
- About `/about` at 402x540: `screenshots/about-actual.png`
- Library `/library` at 441x540: `screenshots/library-actual.png`

### Interaction evidence

- Mobile nav closed: `screenshots/nav-closed.png`
- Mobile nav open: `screenshots/nav-open.png`
- Mobile nav after Escape close: `screenshots/nav-after-escape.png`
- Mobile nav link result: `screenshots/nav-link-writing-result.png`
- Search opened by ref: `screenshots/search-retry-after-click-annotated.png`
- Search after Escape: `screenshots/search-after-escape.png`

Snapshots and logs are in `snapshots/` and `logs/`.

## Pass/fail matrix

Legend: PASS = matches or exceeds handoff for this dimension. FAIL = material mismatch from handoff. WARN = works but has polish/a11y/fit risk.

| Route / state | Viewport | Nav fit/order | Hero scale/copy | Typography | Palette/background | Ruled rows / no-card language | Footer visibility | Mobile wrapping / safe area | Library controls / drawer | Overall polish vs screenshot |
|---|---:|---|---|---|---|---|---|---|---|---|
| `/` home | 402x540 | FAIL — handoff shows inline route links under brand; actual uses sticky icon header with hidden drawer | FAIL — actual hero is lower, smaller, sans, and includes intro paragraph in first viewport; handoff is sparse editorial hero only | FAIL — handoff display serif; actual display is sans | WARN — actual green glow is heavier/brighter than reference | WARN — below-fold rows exist but first viewport language differs | N/A — footer not expected in first viewport | PASS — no horizontal clipping seen | N/A | FAIL |
| `/writing` | 402x540 | FAIL — active inline Writing nav missing; hidden behind hamburger | FAIL — copy matches, but scale/position differs; content starts too high/compact vs reference | FAIL — serif heading missing | WARN — background is greener/less subtle | PASS — rule under hero present, cardless list begins | N/A | PASS | N/A | FAIL |
| `/projects` | 402x540 | FAIL — active inline Projects nav missing | FAIL — copy matches, but heading is one-line sans instead of reference serif two-line composition | FAIL | WARN | PASS — rule and list language are cardless | N/A | PASS | N/A | FAIL |
| `/about` | 402x540 | FAIL — active inline About nav missing | FAIL — reference hero dominates viewport; actual exposes body paragraph and uses different wrap | FAIL | WARN | N/A | N/A | PASS | N/A | FAIL |
| `/library` | 441x540 | FAIL — active inline Library nav missing | FAIL — reference hero is serif and compact with no stats/body before controls; actual adds support text/stats before controls | FAIL | FAIL — reference has strong magenta side field and darker top; actual mostly green, missing reference color depth | N/A | N/A | WARN — lower filter chips are partially clipped at bottom of first viewport | FAIL — segmented controls exist, but extra lower filter row intrudes/clips | FAIL |
| Mobile hamburger | 402x540 | WARN — opens/closes cleanly and links fit, but drawer is not in the handoff target state | N/A | WARN — drawer text is legible but generic sans | PASS — scrim/drawer background coherent | N/A | N/A | PASS — close target large, no safe-area collision | PASS — Writing link navigated to `/writing` | WARN |
| Search / command | 402x540 | PASS — trigger reachable in actual implementation | N/A | WARN — overlay is visually usable | PASS — overlay contrast is acceptable | N/A | N/A | PASS — no horizontal clipping; Escape closes | N/A | WARN — console warns missing dialog description |

## Issue packets

### ISSUE-001 — P1 — Mobile header/nav does not match handoff target

- **Route(s):** `/`, `/writing`, `/projects`, `/about`, `/library`
- **Viewport(s):** 402x540, 441x540 for Library
- **Evidence:** `screenshots/home-actual.png`, `screenshots/writing-actual.png`, `screenshots/projects-actual.png`, `screenshots/about-actual.png`, `screenshots/library-actual.png`, `screenshots/nav-open.png`
- **Expected from handoff:** Mobile header should show `Trey Goff` at top left with route links visible inline beneath it (`Writing`, `Projects`, `Library`, `About`), with the current route highlighted green. The handoff screenshots do not show search or hamburger controls in the primary screenshot state.
- **Actual observed:** Actual mobile header is a sticky 64px-ish bar with `Trey Goff`, search icon, and hamburger. Route links are hidden in a drawer, so the screenshot match loses visible nav order and active route state. The drawer opens/closes and links fit, but it is a different navigation model than the handoff.
- **Recommended fix:** For the screenshot-match mobile breakpoint, render the inline route-link header shown in the handoff. If search/hamburger are required product additions, move them out of the primary hero screenshot composition or make them secondary without displacing the visible route links.

### ISSUE-002 — P1 — Global mobile display typography and hero composition are off target

- **Route(s):** `/`, `/writing`, `/projects`, `/about`, `/library`
- **Viewport(s):** 402x540, 441x540 for Library
- **Evidence:** `screenshots/home-actual.png`, `screenshots/writing-actual.png`, `screenshots/projects-actual.png`, `screenshots/about-actual.png`, `screenshots/library-actual.png`
- **Expected from handoff:** Editorial serif display typography with large, high-contrast, carefully wrapped hero lines. Home/about emphasize the italic green final word. First viewport should feel sparse, authored, and poster-like.
- **Actual observed:** Actual hero headings render in a sans-serif style and wrap differently. Home shows a smaller heading and starts body copy inside the first viewport; About exposes body copy as well. Writing/Projects use much flatter sans headings instead of the handoff's editorial serif scale.
- **Recommended fix:** Restore the handoff's mobile display type stack, heading sizes, line-height, and route-specific wrap constraints. Preserve the sparse first-viewport budget: brand/nav, eyebrow, display heading, and intentional divider/control only where shown in the handoff.

### ISSUE-003 — P2 — Library first viewport has control/background mismatch and clipped lower filters

- **Route:** `/library`
- **Viewport:** 441x540
- **Evidence:** `screenshots/library-actual.png`
- **Expected from handoff:** Library mobile first viewport should show the serif hero ending near the filter area, magenta side fields/background depth, and a single rounded segmented control row (`Lens`, `Constellation`, `Shelf`, `River`, `Index`) fully visible at the bottom.
- **Actual observed:** Actual library first viewport includes support copy and stats before the controls, lacks the strong magenta side fields from the handoff, and shows an additional lower filter-chip row partially clipped at the bottom edge. This makes the first viewport feel crowded and less finished.
- **Recommended fix:** Match the handoff's Library above-the-fold stack: remove or push support/stats below the initial fold for this viewport, restore the magenta/depth treatment around the controls, and prevent the next filter row from peeking/clipping under the viewport edge.

### ISSUE-004 — P2 — Search dialog opens but emits accessibility warning

- **Route:** `/` interaction state
- **Viewport:** 402x540
- **Evidence:** `screenshots/search-retry-after-click-annotated.png`, `logs/search-retry-console.txt`
- **Expected:** Command/search dialog should open with accessible dialog naming and description metadata, with no console warnings during the interaction.
- **Actual observed:** Search opens and is reachable, but console logs: `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {DialogContent}.`
- **Recommended fix:** Add a dialog description or explicitly wire `aria-describedby` for the command/search dialog content. Keep the visible design unchanged if the description is only needed for assistive tech.

## Notes on interactions

- Hamburger opens into a right-side drawer and Escape closes it: `screenshots/nav-open.png`, `screenshots/nav-after-escape.png`.
- Drawer route links fit and the Writing link navigated to `/writing`: `screenshots/nav-link-writing-result.png`, `logs/nav-link-writing-url.txt`.
- Search trigger is reachable and opens command palette when clicked by ref: `screenshots/search-retry-after-click-annotated.png`.
- No `agent-browser errors` entries were captured for the route loads or tested interactions.
- Console repeatedly reports local Vercel Speed Insights script load failures; treated as environment noise unless production should provide this script locally.

## Final verdict

**FAIL.** No P0 issues found, but P1 screenshot-match/polish gaps remain on mobile. The implementation is functional and interactive controls are mostly usable, but it does not match the handoff's mobile visual system: visible inline nav, serif editorial display typography, hero scale/wrapping, and Library first-viewport polish are materially different.
