# The Compound Machine

> Markdown mirror of https://www.treygoff.com/machine — the canonical page.

## A toy economy you govern.

The canonical page is a full-screen, real-time WebGL simulation: a field of thousands of glowing points on a dark ground plane, viewed from a slowly drifting overhead camera, with a control console overlaid on it. Each point is a person. Towers grow beneath them as they accumulate capital. Four sliders set the rules those people live under, and the city visibly answers.

This markdown mirror is a static transcription of the experience: everything the page says, every control it offers, and the actual numbers behind the model.

> Every light in the field is a person: working, trading, deciding whether tomorrow is safe enough to build for. The four sliders are the rules they live under. Move one and the city answers.

Status indicator, top right of the console: **Running**, **Paused**, or **Still mode** (the last when the browser reports a reduced-motion preference).

[Interactive WebGL scene: a 24×24-unit ground plane holding a square grid of instanced agents. Each agent is a small cube floating above a vertical bar whose height is that agent's accumulated capital. Faint lines flicker between agents as the market pairs them for trade. Camera sits at roughly (16, 21, 27), drifts on a slow sine and follows the pointer slightly, and looks at the origin.]

## The four levers

Each is a slider from 0 to 100. The baseline values the page opens with are listed below.

| Lever             | Baseline | What it does                                                               |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| Property security | 68       | Chance each year that someone's unfinished investment is seized.           |
| Permitting        | 66       | How long committed investment waits before it becomes productive capital.  |
| Open exchange     | 62       | How much of the gain from different skills meeting each other is captured. |
| Tax drag          | 28       | The share removed from output that would otherwise be reinvested.          |

## Run controls

- **Pause world** / **Resume world** — shown when motion is allowed.
- **Advance 5 years** — replaces the pause button under reduced motion; steps the simulation forward twenty quarters and repaints.
- **Compare two worlds** / **Return to one world** — splits the view into two side-by-side cities. Disabled on mobile.
- **Re-run same seed** — rebuilds both worlds from the same seed and the current rules, clearing accumulated history.

When the split view is active, a **Left rules** / **Right rules** tab group selects which world the sliders edit, and this note appears:

> Both worlds begin with the same seed and the same distribution of skill and capital. Change RIGHT RULES first to make the comparison meaningful, then re-run to clear its history.

## The ledger

One ledger per world, headed "Left world ledger" or "Right world ledger", each with a sparkline of total output over the last 120 published samples and a toggle between **Log scale** and **Linear scale** (log is the default). Three readouts, all formatted compactly:

- **Output** — total output this quarter
- **Structures** — cumulative completed structures
- **Median wealth** — median of capital plus in-progress investment across the population

A screen-reader live region announces the active world's three figures every ten seconds.

## Rulesets

Four presets, revealed in the lab section once you move any slider. Each applies to whichever panel is active.

| Ruleset        | Description                                                  | Property security | Permitting | Open exchange | Tax drag |
| -------------- | ------------------------------------------------------------ | ----------------- | ---------- | ------------- | -------- |
| Baseline       | Workable rules, ordinary friction, room to compound.         | 68                | 66         | 62            | 28       |
| Secure Titles  | What people build is overwhelmingly likely to remain theirs. | 98                | 72         | 70            | 20       |
| Permit Maze    | Investment waits while approvals work through the stack.     | 72                | 8          | 58            | 30       |
| Predator State | Weak claims, narrow exchange, and little left to reinvest.   | 2                 | 24         | 20            | 76       |

> This is not a forecast. It is the logic of compounding under risk, made visible. [Read the arguments behind the toy model.](https://www.treygoff.com/writing)

## What you are looking at

A few thousand people, each dealt a skill and a little starting capital from the same deck. Every quarter they produce, trade with whoever the market pairs them with, and decide how much of today's output to sink into structures that pay off later. The city runs about two years per second; the towers are accumulated capital.

The sliders are institutions, not talent. Property security sets the odds an unfinished investment is seized before it completes. Permitting sets how many quarters committed capital waits before it produces anything. Open exchange sets how much of the gain from different skills meeting is actually captured. Tax drag takes its share of output before anyone can reinvest it. Re-run the same seed under different rules and the people are identical; only the rules changed.

The point is compounding. None of these frictions look fatal in a single year, but each one taxes the base the next year grows from, and over decades the same population ends up in cities that look nothing alike. It is a toy, not a forecast: four levers and compounding under risk, made visible. [The arguments behind it live in the writing.](https://www.treygoff.com/writing)

Footer of the console: `Seed <number>`.

Page links: "Skip the city and reach the controls" (skip link to the console) and "Return to the site" (to https://www.treygoff.com/).

## What the colors mean

Three states, drawn from the site's existing semantic palette — no new hues.

- **Green** — compounding. Brightness scales with the agent's accumulated capital.
- **Amber** — capital committed but not yet realised. An agent yellows in proportion to its _exposure_: the share of its total worth that is committed but not yet built. Drop permitting and the field yellows, because investment sits exposed for longer.
- **Red** — capital taken. A seizure reads at fixed brightness rather than scaling with wealth, because a rich agent losing everything and a poor one losing everything are the same event. Drop property security and the field starts flashing red.

## How the simulation actually works

Each quarter (one tick), for every agent:

1. Capital depreciates by 0.5%, floored at 0.01.
2. Output is `skill × capital^0.3`.
3. The agent's investment propensity is a logistic function of expected return minus a risk penalty times the annual expropriation risk — so the seizure odds enter the decision, not just the outcome.
4. Investment is `output × propensity × (1 − tax share)`, added to a pot that pays off only after the construction delay elapses.
5. When the delay runs out, the pot converts into capital, the agent's tower grows by `log1p(amount)`, and the structures counter increments.
6. A random shock may seize the in-progress pot entirely, resetting it to zero and flashing the agent red for eight ticks.

Then pairs numbering 5% of the population — so up to 10% of everyone — are drawn at random for trade; each pair's gain is `trade capture × 0.08 × |skill difference|`, split evenly and added to both sides' capital and to total output.

**How the levers map onto the model**

| Lever at 0                                      | Lever at 100       |
| ----------------------------------------------- | ------------------ |
| Property security: 2% annual expropriation risk | 0.01% annual risk  |
| Permitting: 40-quarter construction delay       | 2-quarter delay    |
| Open exchange: none of the trade gain captured  | all of it captured |
| Tax drag: nothing removed from output           | 72% removed        |

Changing a slider does not snap the world — the live institution values ease toward their targets at 25% of the remaining gap per tick, so the city transitions rather than jumps.

**Fixed parameters**

| Parameter                   | Value                      |
| --------------------------- | -------------------------- |
| Capital share (alpha)       | 0.3                        |
| Depreciation                | 0.005 per quarter          |
| Initial capital             | lognormal, mu 0, sigma 0.5 |
| Skill                       | lognormal, mu 0, sigma 0.4 |
| Investment logistic beta    | 6                          |
| Risk penalty                | 42                         |
| Trade pairs per tick        | 5% of the population count |
| Trade gain scale            | 0.08                       |
| Maximum tax drag            | 72%                        |
| Institution easing per tick | 0.25                       |
| Seizure flash duration      | 8 ticks                    |
| Ticks per year              | 4                          |
| Ticks per second            | 8                          |

Those tuned values produce a 4.497× output ratio between the secure and predatory rulesets at tick 1000 across the project's fixed test seeds.

## Seeds and shareable URLs

The page reads and writes its whole state to the query string, so any configuration is a link. Parameters: `seed`, and `security`, `permits`, `exchange`, `tax` for the left world, each prefixed with `r` for the right world in split mode (`rsecurity`, `rpermits`, and so on). If no seed is supplied the page picks one at random and writes it back into the URL.

Two undocumented experiment toggles exist: `?buildings=1` swaps the plain structure bars for a modelled skyline loaded from a glTF asset, and `?mono=1` restores an earlier single-green field with no amber or red states.

## Device handling

The simulation population scales to what the device can draw, and a frame monitor downgrades the tier live if frame times slip.

| Quality tier | Agents (single world) | Agents (split) | Antialiasing | Bloom |
| ------------ | --------------------- | -------------- | ------------ | ----- |
| Low          | 1,500                 | 750            | no           | no    |
| Medium       | 6,000                 | 3,000          | yes          | no    |
| High         | 15,000                | 15,000         | yes          | yes   |

Mobile devices start at low. Every world is warmed by 200 quarters — fifty years — before the first frame is shown, which is what the loading messages refer to: "Reading this device…", "Giving everyone the same starting point…", "Lighting the first districts…", and "Pre-warming two hundred quarters…".

Under a reduced-motion preference the world stops animating and becomes a still that repaints only when you advance it.

## Fallback for browsers without WebGL 2

If the device cannot run the scene, the page replaces it with a static skyline graphic and this text:

**The Compound Machine**

**The lights come on when people can build for tomorrow.**

This browser cannot draw the live city, but the proposition is simple: secure what people build, shorten the wait to build more, widen exchange, and leave room to reinvest. The machine is a toy model of those rules, not a forecast.

[Read the ideas behind the model](https://www.treygoff.com/writing)
