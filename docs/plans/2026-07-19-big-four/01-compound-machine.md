# 01 — The Compound Machine (`/machine`)

Read `00-shared-contracts.md` first. It is binding.

## 1. What this is

The site's headline — "Designing the systems that let human progress compound" — turned from a sentence into a running world. A WebGL simulation of a few thousand economic agents building a city under a visible ruleset. The visitor holds the institutional levers: flip them and watch the same people, same talents, same starting point, flourish or stagnate. Two-panel mode runs identical populations under different rules from the same random seed — the SEZ argument as a toy you can't stop poking.

This is a demonstration, not a decoration: the sim must be economically honest at its level of abstraction. Nothing here asserts a conclusion the model doesn't actually produce.

## 2. Primary user action

Drag an institutional lever and *see* the divergence — within seconds, without instructions.

## 3. Design direction

- **Color strategy: Drenched** — the surface IS the aurora-emerald world. This route replaces the global aurora with its own living field (the city's light), satisfying the "wouldn't survive with the aurora removed" principle by *being* the aurora.
- **Scene sentence:** a visitor alone at night leans over a glowing terrarium of a civilization, turning brass dials to see what makes the lights come on.
- **Anchors:** the site's own `/interactive` nebula work; "SimCity at night" distant-city glow; Bret Victor's explorable explanations (for the lever-to-consequence immediacy).
- **The one-green rule is the physics:** prosperity is rendered as *light* (warm `#6fd69a` emission, structure height, shimmer), poverty as *darkness* (desaturation, dimness, stillness). No red for failure — when institutions rot, the lights go out. That's the whole visual metaphor and it's more honest than alarm colors.

## 4. Scope

Production-ready quality, one route, full interactivity. Desktop is the primary stage; mobile gets a fully working single-panel experience.

## 5. Experience walkthrough

**Layout.** Full-bleed immersive route following the `/interactive` precedent exactly: nested `layout.tsx` plus a shell component in the `InteractiveShell` mold (full-viewport surface; the root chrome remains mounted underneath — match `/interactive`'s existing overlay and focus handling, and do not attempt a root-layout or route-group refactor). Route root exports `metadata = { robots: { index: false, follow: false } }`. Three regions:

1. **The world** (dominant): isometric-ish perspective camera over a district grid where agents live and structures accrete. Slow ambient camera drift; pointer parallax (subtle, disabled on reduced-motion).
2. **The console** (bottom or right edge, DOM not canvas): the levers, run controls, and readouts. Mono labels, hairline rules, editorial voice. This is real DOM — keyboard accessible, screen-reader legible.
3. **The ledger** (compact, within console): live time-series of aggregate output per panel (SVG sparkline-class chart, no chart library), plus three number readouts: output, structures standing, median wealth.

**Modes.**

- **Ambient (default on load):** one panel, a balanced baseline ruleset, city quietly growing. A single line of copy invites: "These are the rules. Change them."
- **Lab (the point):** visitor touches any lever → console expands. **Split mode** button: two panels, same seed, same population; the visitor sets rules per side. A "re-run from same seed" control restarts both worlds identically — determinism is a *feature the UI advertises*, because it's the scientific claim: same people, different rules.
- **Presets:** 3–4 named rulesets loadable per panel: "Baseline", "Secure Titles", "Permit Maze", "Predator State". Abstract names, no country cosplay.

**The levers (four, each 0–100):**

| Lever | Maps to | Visible consequence |
|---|---|---|
| Property security | expropriation risk ρ: 2% → 0.01% per agent-year | seizures stop; agents invest instead of hoarding |
| Permitting | construction delay d: 40 → 2 ticks | structures actually finish; skylines vs slabs |
| Open exchange | trade gain capture τ | trade links light up between districts |
| Tax drag | reinvestment share retained | growth curve bends |

**Key states:** first load (world already alive — no blank canvas; sim pre-warmed ~200 ticks during the loading beat); reduced-motion (see §8); WebGL unavailable (designed static fallback: a pre-rendered still of the flourishing city + the thesis in text + link to `/writing` — never a broken canvas); tab-hidden (sim pauses, resumes cleanly); mobile (single panel, levers as a bottom sheet, agent count per quality tier).

**Interaction model:** levers are real `<input type="range">` styled to the design system (keyboard-native for free). Lever change eases institution values over ~1s sim-time rather than stepping discontinuously. Hovering/focusing a lever shows a one-line plain-language explanation of what it does mechanically — honest tooltips, e.g. "Chance each year that someone's investment is seized."

## 6. Simulation design (pinned — do not invent macro theory)

Fixed-timestep discrete sim, decoupled from render. One tick = one quarter-year; 8 ticks/sec of wall time at 1× speed. Deterministic PRNG (mulberry32) seeded per run; seed displayed subtly in the console and shareable via `?seed=`.

Per agent: capital `k`, skill `s` (lognormal, fixed at seed), and an investment-in-progress slot. Per tick:

1. **Produce:** `y = s * k^0.3`.
2. **Allocate:** agent splits `y` between consumption and investment. Investment propensity is increasing in expected return and *decreasing in expropriation risk ρ* (risk-adjusted return; use a simple logistic on `(r - ρ·penalty)`). Tax drag removes a share of investable output.
3. **Build:** investment enters the in-progress slot; completes after `d` ticks (permitting), then adds to `k` and to the agent's *visible structure height*.
4. **Expropriate:** with probability ρ, in-progress investment is seized: slot zeroed, structure growth halts, brief dimming on that parcel.
5. **Trade:** random pairing within/across districts; each pair realizes a gain proportional to skill difference × τ; renders as a brief light-link at high quality tier.

Aggregates per tick: total output, structures completed, median wealth. This is Solow-flavored micro with institutional wedges — legible, defensible, and it genuinely produces the divergence (investment collapse under insecurity is the mechanism, not a scripted outcome). **No scripted outcomes:** the levers change parameters; the world does the rest.

**Pinned parameters** (all constants in one exported `PARAMS` object in `lib/machine/sim.ts`; tune once during build until behavior is stable, then freeze): α = 0.3; depreciation δ = 0.5%/tick on `k`; initial `k` ~ LogNormal(μ=0, σ=0.5); skill `s` ~ LogNormal(μ=0, σ=0.4), fixed at seed; expected return r̂ = α·s·k^(α−1) − δ; invest propensity p = logistic(β·(r̂ − λ·ρ)), starting β = 4, λ = 8; tax drag removes share `t` of investable output; trade: 10% of agents pair randomly per tick, pair gain = τ·|s_i − s_j| split evenly; consumption is the residual (no debt, `k` never negative). The divergence test is a **characterization, not a theorem**: at frozen params, assert secure-vs-predatory ordering with ≥1.5× total output at tick 1000, plus monotonicity (output weakly increases as ρ falls, same seed). If tuning can't produce that honestly, report the actual behavior rather than forcing the threshold.

Sim runs in the main thread inside a fixed-step accumulator (target: full tick loop for 15k agents < 4ms; it's arithmetic over typed arrays — use `Float32Array`/`Uint32Array` SoA layout, zero per-tick allocation). If profiling shows it can't hold 4ms, move to a Web Worker with transferable state — but measure first.

## 7. Rendering

- R3F + drei. Device tiering: consume `detectCapabilities().suggestedTier` from `lib/interactive/capabilities.ts` (`suggestQualityTier` is unexported — the `suggestedTier` field on the returned object is the API; do not export the helper). For live tier adjustment reuse `createAutoTuneState`/`recordFrameSample` from `lib/interactive/quality.ts`; map tier → agent counts in your own `lib/machine/quality.ts` (the interactive `QUALITY_PRESETS` are `/interactive`-shaped — don't reuse them wholesale). `three` and rapier are already deps; **do not use rapier** (no physics here).
- Agents: single `InstancedMesh` (small emissive quads/sprites). Structures: single `InstancedMesh` of unit boxes, height-scaled per parcel; emissive intensity ∝ parcel wealth. District ground: one plane with a subtle shader gradient. Target draw calls: **< 20 per panel**.
- Agent counts by tier: low 1,500 / medium 6,000 / high 15,000 per panel (halve in split mode on medium and low).
- Split mode: one canvas, two scenes via drei `<View>` (scissored viewports) — not two `<Canvas>` mounts.
- Postprocessing: bloom only, high tier only, reuse existing `postprocessing` dep. DPR capped per quality preset.
- No GLB assets, no manifest entries needed — everything is generated geometry. (Asset budget script only validates listed chunks; nothing to list.)

## 8. Performance & accessibility budgets

- 60fps on high tier desktop, 30fps floor on low tier; hook into the existing frame-time auto-tuner pattern (`lib/interactive/quality.ts`) to downgrade tier live.
- Route JS budget: the R3F payload stays out of every protected route (bundle-isolation gate); `/machine` itself lazy-loads the scene behind `next/dynamic` with the same loading treatment pattern as `/interactive`.
- **Reduced motion:** no continuously animating canvas. The sim becomes *turn-based*: world renders as a static frame; an "Advance 5 years" button steps the sim and crossfades to the new still. Levers, readouts, and charts all work identically. This is a designed mode, not a degraded one — name it in the UI ("still mode").
- All console controls: native inputs, labeled, focus-visible, operable without pointer. The canvas is `aria-hidden`; the ledger numbers are live regions (throttled to one announcement per ~10s).

## 9. Content requirements

- Invitation line, lever explanations (4 × one line), preset names + one-line descriptions, "same seed, different rules" explainer (~2 sentences), WebGL-fallback thesis paragraph, still-mode label. All in the site's voice; coordinator reviews copy at merge.
- A short "what this is / what it isn't" footnote: honest about being a toy model — "This is not a forecast. It is the logic of compounding under risk, made visible." Links to `/writing`.

## 10. File ownership

Creates: `app/machine/{layout.tsx,page.tsx}`, `components/machine/**` (shell, console, panels), `lib/machine/**` (sim core, presets, seed utils), `e2e/machine.e2e.ts`, unit tests for the sim core (`test/machine-sim.test.ts`: determinism — same seed twice = identical aggregates at tick 500; the characterization divergence + monotonicity tests from §6; a loose tick-cost sanity bound generous enough for CI variance; and a source-grep assertion that the machine page reaches R3F only through `next/dynamic` — the bundle-isolation script's dynamic-import guard only watches `InteractiveShell`, so this lane guards its own). The coordinator extends `scripts/check-bundle-isolation.ts` at integration; this lane never edits it.

## 11. Out of scope (v1)

Sharing/permalinks beyond `?seed=` + lever values in query params; sound; narrative onboarding tour; mobile split mode; historical scenario skins.

## 12. Open questions

- Whether the ledger chart needs a log scale toggle (compounding makes linear charts collapse the early game). Lane may implement log-by-default with a linear toggle if it reads better — judgment call at build time, flag in report.
