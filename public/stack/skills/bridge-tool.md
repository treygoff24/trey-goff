<!--
Skill: bridge-tool
Source: one of the always-on agent skills from treygoff.com/stack
De-personalized for public use: machine paths, personal names, and private
infrastructure references have been genericized. Read it before you run it —
some steps assume tools you may not have installed.
Install: save as ~/.claude/skills/bridge-tool/SKILL.md
-->

---
name: bridge-tool
description: Use when conceptual intent resists text — spatial placement, aesthetic tuning, ordering, threshold values, palette choice, layout, anything "I'll know it when I see it." Build a throwaway single-file HTML tool that lets the user express in their native modality (drag, click-toggle, slide, sort) and exports back to an LLM-ingestible format (TS, JSON, CSV, prose). Collapses N rounds of "no, more to the left" into one round-trip. Triggers on phrases like "the X is off / in the wrong spot / not quite right / a little too Y / let me see if I can show you" said about visuals, layouts, weights, sequences, or any modality where verbal description is lossy.
---

# Bridge Tool — Throwaway HCI Surfaces for Modality Mismatch

## Overview

When the user's conceptual intent lives in a modality that resists text — spatial, aesthetic, ordering, threshold, "I'll know it when I see it" — and verbal iteration is wide and lossy, build a throwaway custom tool that lets them express in their native modality and round-trip the result back as text you can ingest.

The leverage is enormous. A 5-minute one-off HTML tool can collapse an hour of "no, a bit more to the left, no, too far now" into a single paste-back.

## Trigger recognition

Reach for this when:

- The user has tried 1–2 rounds of textual iteration on something visual/spatial/aesthetic and it still isn't quite right
- The user says some version of "the X is off / wrong spot / not quite there / a little too Y / let me show you"
- You catch yourself about to take screenshots and tweak coordinates by trial and error
- You're about to ask "is this better?" for the third time about the same parameter
- The right answer is "I'll know it when I see it" — and the user is the one who'll know

Do **not** reach for this when:

- The intent is clearly expressible in text (specs, behavior, logic, copy)
- Iteration loops are narrow (one round of feedback resolves it)
- The cost of building the tool exceeds the cost of one more verbal round-trip

## The five-step signature

Every bridge tool has the same shape. Match it.

1. **Pre-loaded with current state.** Never a blank canvas. The user is *adjusting*, not *creating from scratch*.
2. **Native interaction.** Drag, click-to-toggle, slider, sort handle — whatever maps directly to the conceptual operation. No text fields if you can avoid them.
3. **Live preview.** Feedback under the user's hand. The export number updates as they drag; the highlight changes as they click.
4. **Export to LLM-ingestible format.** A "Copy" button that produces *exactly* the shape the consuming code expects (TS array, JSON object, CSV, prose). Clipboard-write + visible-fallback `<pre>` block in case clipboard permission is flaky.
5. **Throwaway by default.** Single HTML file at `/tmp/<project>-<purpose>.html`. Open with `open` (macOS) / `xdg-open` (Linux). Delete after the round-trip — bridge tools are scaffolding, not infrastructure.

## Architecture

- **One file.** Self-contained HTML with inlined CSS and JS. No build step, no `npm install`, no dev server.
- **Single-file generator.** A small TS/Python/Node script that reads project data (paths, current values, types), inlines it into the HTML, writes to `/tmp/`, and `open`s it. Prefix the script with `.` (e.g. `scripts/.bridge-pin-tuner.ts`) so it skips lint/format.
- **No external dependencies.** Native browser APIs only — `getScreenCTM`, `pointer events`, `clipboard API`, `dataTransfer` for sortable lists. Skip drag libraries.
- **Match the project's design tokens.** Use the same colors and type the consuming code uses. Lowers cognitive friction when comparing to the live result.

## Four template patterns

The `templates/` directory has minimal skeletons for the four most common shapes. Each is a starting point, not a library — the bespoke wiring (data → UI → export shape) is the work.

| Template | Use for |
|----------|---------|
| `templates/drag-on-svg.html` | Spatial coords on a map/image — pin placement, anchor points, focal-box crop |
| `templates/grid-select.html` | Selection from a set — which items to highlight, taxonomy bucketing, multi-select |
| `templates/slider-tune.html` | Numeric thresholds — contrast, weights, animation durations, scoring parameters |
| `templates/sortable-list.html` | Ordering — TOC sections, priority sort, dependency sequencing |

Read the template, copy the relevant pieces, adapt to current task. Don't link to the template file from your generated tool — inline everything you need.

## Workflow

1. **Tell the user.** "Let me build you a quick drag-and-drop tool for this — way faster than me iterating screenshots." Confirm in one sentence what the tool will do and what shape they'll paste back.
2. **Build the generator script.** Reads project data, generates the HTML, writes to `/tmp/<project>-<purpose>.html`, opens it. Prefix filename with `.` to dodge lint.
3. **Sanity-check it yourself.** Take one Playwright screenshot of the rendered tool to verify it loaded, the data is pre-loaded, the interaction is wired. Catch broken layouts before the user opens it.
4. **Hand off.** "Tool's open in your browser. [Concrete instructions for what to do.] When you're done, hit Copy and paste the result back."
5. **Round-trip.** When they paste, drop it straight into the consuming code. Run the gate. Visually verify the new state. Show one screenshot for confirmation.
6. **Clean up.** Delete the generator script. Delete `/tmp/<project>-<purpose>.html`. Bridge tools are throwaway.

## Concrete examples

- **Map pin tuner** (the canonical case): Drag numbered pins on a live SVG to their correct geography. Export `[{ x, y }, ...]` array.
- **Country highlight picker**: Click countries on a live SVG to toggle highlight tones. Export `Record<slug, tone>` object.
- **Pull-quote selector**: Highlight ranges of MDX prose. Export `[{ start, end }, ...]` for `<PullQuote>` annotations.
- **Crop-box tuner**: Drag a focal box on raw artwork. Export `objectPosition: "X% Y%"` or crop coords.
- **TOC reorder**: Drag-sort section list to test alternate orderings. Export array in new order.
- **Palette sliders**: Tune hue/saturation/contrast against a live mock. Export hex values.
- **Threshold ranking**: Slide weights for a multi-factor score with live re-rank. Export weights object.

## Anti-patterns

- **Don't ship to production.** These tools are private scratch surfaces. Never commit them; never expose them on a route. They have no auth, no validation, no a11y — that's fine for `/tmp/` but unacceptable on a deployed site.
- **Don't reuse a tool across tasks.** Generate fresh each time, pre-loaded with the current state. The 5-minute generation cost buys correctness.
- **Don't add fields that don't help.** No login, no save-state, no undo history. The interaction is direct manipulation, the export is the save.
- **Don't make it pretty for its own sake.** Functional polish > aesthetic polish. The user spends ~2 minutes in the tool; styling time is better spent on the consuming code.
- **Don't skip the export-format check.** The whole value collapses if the paste-back doesn't drop cleanly into the consuming code. Round-trip the export through `JSON.parse` or paste it into the actual file before declaring the tool ready.

## Why this is missing from most harnesses

Worth naming: AI-coding tools have historically framed the model as *completer* or *chatter*, not *collaborator who can build sandboxes for the human*. The leap from "I can write code" to "I can write a custom HCI surface, hand it to you, and ingest what comes back" requires noticing that text isn't always the right modality. Most prompts and skills don't train that noticing. This skill exists to make the noticing explicit.
