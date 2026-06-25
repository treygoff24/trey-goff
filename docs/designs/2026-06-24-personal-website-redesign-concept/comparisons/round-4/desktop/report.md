VERDICT: FAIL

Round 4 desktop visual QA found one blocking regression: the `/` home route renders as a blank dark viewport at 924x540. The follow-on content blocks on `/writing`, `/projects`, and `/about` are no longer materially too low/cropped; those three routes are acceptable with only minor P2 deltas.

## Scope

- Server: `http://localhost:3103`
- Agent Browser session: `tg-r4-desktop` (closed after capture and recheck)
- Viewport: `924x540`
- Baselines:
  - `handoff/shots/home-desktop.png`
  - `handoff/shots/writing-desktop.png`
  - `handoff/shots/projects-desktop.png`
  - `handoff/shots/about-desktop.png`

## Evidence index

- Contact sheet: `desktop-contact-sheet.png`
- Diff metrics: `diff-metrics.json`
- Actual screenshots: `screenshots/*.png`
- Per-route diffs: `diffs/*-diff.png`
- Snapshots: `snapshots/*.snapshot.txt`
- Console/errors/network/text logs: `logs/*.txt`

## Route matrix

| Route | Result | Screenshot match | Console/errors | Notes |
|---|---:|---|---|---|
| `/` | FAIL | P0 mismatch: actual screenshot is blank dark viewport, not the supplied hero composition | No page error captured; network document 200; body text exists in accessibility/DOM | Reproduced twice. `wait --text "Designing the systems"` timed out after 25s because text never became visibly rendered. |
| `/writing` | PASS with P2 | Close enough for desktop polish; featured block is visible and no longer materially cropped | No errors captured | Featured title/body sit slightly lower than baseline; bottom body line clips more than goal screenshot, but not launch-blocking. |
| `/projects` | PASS | Matches/exceeds screenshot polish for the Round 3 concern | No errors captured | Project block is pulled up and readable in the viewport. |
| `/about` | PASS | Matches/exceeds screenshot polish for the Round 3 concern | No errors captured | Body and portrait placeholder align closely with the handoff shot. |

## P0 findings

### R4-DESKTOP-P0-001 — Home route visually renders blank at 924x540

- Severity: P0
- URL: `http://localhost:3103/`
- Viewport: `924x540`
- Evidence:
  - Initial screenshot: `screenshots/home-desktop.png`
  - Recheck screenshot: `screenshots/home-desktop-recheck.png`
  - Initial snapshot: `snapshots/home.snapshot.txt` shows `(empty page)`
  - Recheck snapshot: `snapshots/home.recheck.snapshot.txt` shows `(empty page)`
  - Body text evidence: `logs/home.body-text.txt` contains the expected hero/nav/page copy
  - Network evidence: `logs/home.network.txt` shows the document and core assets returning 200
- Repro steps:
  1. Open `http://localhost:3103/` in Agent Browser session `tg-r4-desktop`.
  2. Set viewport to `924x540`.
  3. Wait for `networkidle`.
  4. Capture screenshot and snapshot.
  5. Recheck with `wait --text "Designing the systems"`; it times out after 25s.
- Expected: Home matches `handoff/shots/home-desktop.png`: visible brand/nav, hero kicker/headline/body, and CTAs.
- Actual: The viewport is a blank near-black canvas. The browser title and DOM/body text exist, but no visible content appears in the screenshot/accessibility snapshot.
- Fix direction: Check whatever home-only visibility/animation/overlay/staging logic controls the rendered hero. Because body text exists while the visual viewport is blank, suspect a home-specific hidden/opacity/animation/compositing layer rather than a failed HTTP response.

## P1 findings

None separate from the P0 home blanking issue.

## P2 findings

### R4-DESKTOP-P2-001 — `/writing` featured block remains slightly lower than handoff

- Severity: P2
- URL: `http://localhost:3103/writing`
- Viewport: `924x540`
- Evidence: `screenshots/writing-desktop.png`, `diffs/writing-diff.png`, `desktop-contact-sheet.png`
- Expected: Featured metadata/title/body align with the handoff shot and preserve the same amount of visible body text at bottom of viewport.
- Actual: The block is now visible and usable, but sits roughly a small spacing step lower than the baseline; the second body line is more clipped at the bottom than the goal screenshot.
- Impact: Minor visual delta only. Not a P1 because the Round 3 material cropping issue is substantially resolved.

## Implementation polish assessment

Overall: does **not** match/exceed screenshot polish because `/` is blank.

For the specific Round 3 follow-on-content concern: `/writing`, `/projects`, and `/about` now match or exceed the intended desktop polish closely enough for this round. `/writing` has a small remaining vertical-position P2; `/projects` and `/about` are acceptable.

## Commands/evidence notes

Primary capture used:

```bash
agent-browser --session tg-r4-desktop open http://localhost:3103/
agent-browser --session tg-r4-desktop set viewport 924 540
agent-browser --session tg-r4-desktop wait --load networkidle
agent-browser --session tg-r4-desktop screenshot docs/designs/2026-06-24-personal-website-redesign-concept/comparisons/round-4/desktop/screenshots/home-desktop.png
```

Home recheck used the same session name and viewport, then waited for visible hero text; the wait timed out and the recheck screenshot remained blank.
