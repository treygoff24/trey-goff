# The Big Four — Shared Contracts

Four experimental features built in parallel, each behind its own route. Trey evaluates all four live, picks a winner, and only then does anything touch the homepage. This document is binding for every authoring lane; the four feature specs (01–04) reference it.

## Mission context

- **Lab phase.** All four routes are `robots: noindex`, excluded from `app/sitemap.ts`, and absent from `TopNav`. Nobody modifies the homepage, nav, footer, or any existing page. A tiny `/lab` index page is built by the coordinator after merges — no lane builds it.
- **Winner integration is out of scope for every lane.** Build each feature as if it will ship, but wire nothing into existing surfaces.

## Branch & isolation

- Base branch: `feat/big-four` (cut from `main` by the coordinator — NOT from `feat/the-workshop`).
- Each feature lane runs in its own delegate worktree (`--isolation worktree`), merged sequentially by the coordinator after review.
- Lanes never commit unless their brief says so; they leave clean working trees for coordinator review.

## File ownership matrix

| Path | Owner |
|---|---|
| `app/machine/**`, `components/machine/**`, `lib/machine/**` | 01 Compound Machine |
| `app/edition/**`, `components/edition/**`, `lib/edition/**`, `app/api/edition/**` | 02 The Edition |
| `app/resident/**`, `components/resident/**`, `lib/resident/**`, `app/api/resident/**`, `agents/resident/**`, `content/journal/**` | 03 The Resident |
| `app/mission-control/**`, `components/mission-control/**`, `lib/mission-control/**`, `data/**` | 04 Mission Control |
| `e2e/<feature>.spec.ts` | each lane adds exactly one file, named for its feature |

**Shared files — strict rules:**

- `package.json`: ONLY lane 02 adds a dependency (`ai`, v6.x). Lane 03's Eve app has its own `agents/resident/package.json` (standalone — never imported by the Next app, never added to the Next build). Lanes 01 and 04 add zero dependencies.
- `content-collections.ts`: ONLY lane 03 touches it (appends the `journal` collection). Append-only; existing collections untouched.
- `scripts/check-bundle-isolation.ts`: lanes 02, 03, 04 each append their route to `PROTECTED_ROUTES` (their pages must never pull in three.js). Lane 01 does NOT add `/machine` to the protected list — it is the one new heavy route — but must follow the isolation pattern below.
- `app/globals.css`: NOBODY touches it. Feature styles live in CSS modules (`components/workshop/workshop.module.css` is the precedent) or Tailwind utilities.
- `app/layout.tsx`, `app/page.tsx`, `app/sitemap.ts`, `components/site/**`: NOBODY touches them, except that `app/sitemap.ts` must be verified to already exclude the new routes (it enumerates known routes; if it globs, the lane flags it to the coordinator rather than editing).

## Design system (non-negotiable)

Read `PRODUCT.md` at repo root before writing any UI. Summary of the binding parts:

- **Tokens only.** Colors come from the `@theme` block in `app/globals.css` (`bg-0 #04130c`, `bg-1`, `surface-1/2`, `border-1/2`, `text-1/2/3`, `warm #6fd69a`, `accent #97e8bb`). Never hardcode rgba or invent a hue. **One green, everywhere** — no second accent, no reds/blues/purples. Semantic `--color-error` exists for true error states only.
- **Fonts:** existing three only — display serif via `font-newsreader` (Spectral), body via the sans var (Hanken Grotesk), labels via `font-mono` (Geist Mono). No new fonts.
- **Ruled, not carded.** Editorial rows and hairline rules over card grids. `EditorialIndexRow` (`components/site/EditorialIndexRow.tsx`) is the canonical list affordance — reuse it where a list of content links appears.
- **Existing utilities:** `.tg-page`, `.tg-section`, `.tg-eyebrow`, `.tg-display`, `.tg-standfirst`, `.tg-action`, `.tg-rise` — reuse; don't re-implement. Do not spray `.tg-eyebrow` above every section — one kicker per page maximum, as the site currently practices.
- **Banned:** card grids of identical cards, hero-metric SaaS templates, gradient text, side-stripe accent borders, glassmorphism-by-default, decorative grid-line backgrounds, numbered section eyebrows. (These come from the impeccable audit that will run on your output — violations get bounced.)

## Motion & accessibility (gates, not suggestions)

- WCAG AA. Dark-only site: body text ≥4.5:1 against `#04130c`/`#061a10`. `text-3` (0.52 alpha) is for metadata only, never body copy.
- `prefers-reduced-motion` fully honored. No continuous GPU/CPU loops for reduced-motion users — each spec defines its specific fallback. The global CSS kill-switch (`globals.css:525-539`) handles CSS animation; canvas/JS motion is YOUR responsibility.
- Full keyboard access: every interactive control reachable and operable by keyboard, visible focus states, sensible focus order. Canvas surfaces need keyboard-equivalent controls in DOM.
- Ease-out exponential curves; no bounce/elastic. Entrances enhance already-visible content — never gate visibility on a JS-triggered transition.

## Heavy-route isolation pattern (lane 01, and any lane tempted to import three)

`/interactive` is the precedent (`app/interactive/layout.tsx`, `components/interactive/InteractiveShell.tsx`):

- Nested `layout.tsx` for the route: bare shell, `robots: noindex`, `await connection()` for CSP nonce, no site chrome.
- All three/R3F imports live behind `next/dynamic` inside a client shell component. `scripts/check-bundle-isolation.ts` will fail the build if three.js leaks into any protected route.
- Reuse `lib/interactive/capabilities.ts` (`detectCapabilities`, `suggestQualityTier`, `QualityTier`) and the auto-tuning pattern in `lib/interactive/quality.ts`. Do not reinvent device detection.

## AI infrastructure conventions (lanes 02 & 03)

- **Gateway-native `ai@6`:** use `gateway` from the `ai` package directly — no `@ai-sdk/*` provider packages. Auth: `AI_GATEWAY_API_KEY` env var locally, `VERCEL_OIDC_TOKEN` in prod (automatic). Model IDs are strings like `anthropic/claude-sonnet-4.5` — each feature pins its model in ONE exported constant so swaps are one-line.
- Every AI route handler follows the `app/api/subscribe/route.ts` discipline: Content-Type check (415), body byte cap (413), zod-validated body (400), in-memory IP rate limit with `Retry-After` (429), feature env flag returning 404 when off. Extract the rate limiter into `lib/rate-limit.ts` (lane 02 creates it; lane 03 imports it — if merge order flips, coordinator reconciles).
- Feature flags: `NEXT_PUBLIC_ENABLE_EDITION`, `NEXT_PUBLIC_ENABLE_RESIDENT`. Both features render a designed "dormant" state when off — never a broken page.
- Untrusted input discipline: visitor text is data, never instructions. System prompts pin behavior; user content is delimited; output schemas are zod-validated; the renderer never dereferences a slug/URL the model invented (validate against the build-time manifest).

## Verification gate (every lane, before reporting done)

```
pnpm ci:quality        # fmt:check + lint + type-aware lint + typecheck + unit tests + build (incl. postbuild budget/isolation checks)
pnpm test:e2e:chromium # including the lane's new spec file
```

Each lane adds: one e2e smoke spec (route renders, primary interaction works, reduced-motion variant sane at `prefers-reduced-motion`, mobile viewport 390px usable) and unit tests for any non-trivial pure logic (sim tick, schema validation, data aggregation). The coordinator re-runs the full gate at merge time — lanes must still run it themselves.

## Copy voice

First person, literary, precise, warm; serious about ideas, playful in the margins. No SaaS copy ("Unlock", "Seamless", "Powerful"). No em-dash cascades. Microcopy is part of the design — every empty/error/loading state gets written copy, not placeholders. Human–AI co-authorship is part of the site's identity: say true things plainly, never coy, never gimmicky.
