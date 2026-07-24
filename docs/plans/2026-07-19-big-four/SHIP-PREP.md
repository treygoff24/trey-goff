# Big Four + Annex — review & ship-prep

**Status 2026-07-24: shipped.** `feat/machine-city` merged to `main` via PR #5 and is live. The Classified annex went live the same day (see the Annex entry below). Historical branch state, kept for context:

- **`feat/big-four`** (12 commits) — the five surfaces plus `/lab`. The reference state.
- **`feat/machine-city`** (branched off it, +2 commits) — the 3D asset pipeline and the machine colour work.

Open branch: **`fix/annex-archive-resilience`** — one commit, unpushed, awaiting review (see the Annex entry).

## Decisions made 2026-07-20

- **Machine keeps the bars.** The modelled-skyline probe is committed behind `/machine?buildings=1` but lost: at the default tier each structure is ~9px wide on screen (6px at high), so per-building detail is sub-pixel and it is indistinguishable from bars. Reading as a city needs hundreds of large structures, not thousands of small ones — a simulation design change, not a modelling one.
- **Machine colour shipped and is a keeper.** Green compounds, amber is exposure, red is seizure. Makes the levers legible without reading the ledger. `?mono=1` restores the original single-green.
- **DECIDED (evening): the machine is a public page and the Edition is the pick.** `/machine` graduated (94202e3): indexable, top nav + footer, sitemap, aurora-palette OG card. `/lab` trimmed to an archive of The Resident + Mission Control, still noindex. The Edition stays at `/edition` (still noindex) while it's refined toward taking the landing page — that swap is its own future step.
- **Edition refinement round 1 landed (e305969)**: library sections render as a cover shelf with per-book colour glows; cross-kind title dedup; type-settling motion (`tg-set`) with reduced-motion fallback; progress-rule and footer-grammar fixes. Cover data rides the client catalog only — the cached 28k prompt is byte-identical.
- **Machine perf pass landed (3af1f73)**, authored by a Sol max delegate lane, coordinator-reviewed: scene payload -44% Brotli, time-to-canvas -53%, warmup -40%, hidden-tab RAF stopped, determinism byte-identical, stills pixel-identical. Journal entry in `~/.delegate/model-journals/trey-goff.md`.

## How to review

```bash
pnpm dev            # http://localhost:3000
```

- **/lab** — the hub. Lists the four experiments to evaluate.
- **/machine** — drag the four levers; try "Compare two worlds" (same seed, change one world's rules, watch it diverge); "Re-run same seed"; check reduced-motion "Still mode". To see colour carry the argument, compare `?seed=3892608233&security=68&permits=66&exchange=62&tax=28` against the same URL with `security=8`.
- **/edition** — pick an intent or type your own, Compose. NOTE: full compose needs a gateway key (see below); without it you'll see the honest "the type slipped" fallback, which is correct.
- **/resident** — ships dormant ("inhabitant has not moved in yet"). To see it live you'd run the Eve agent in `agents/resident` and flip `NEXT_PUBLIC_ENABLE_RESIDENT`.
- **/mission-control** — the telemetry board. The four "STALE" badges are correct: `data/now.json` and friends are dated March 16; refresh them to clear.
- **/classified** — kept OFF /lab on purpose (it ships independently and putting it on a URL-reachable page blew its existence-hiding cover). Visit `/classified` with no cookie to see the gag page. To see the reading room, set `ANNEX_SECRET` (≥32 chars) in `.env.local` and visit `/classified?key=<that secret>`.

## Verification

Green on `feat/machine-city` as of 2026-07-20: fmt, lint, typecheck, 410/410 unit tests, production build with bundle isolation (17 protected routes, 0 violations). e2e was last run on `feat/big-four` (below) and has **not** been re-run since the machine colour work.

Full sweep as of 2026-07-19:

- fmt, lint, type-aware lint (0 errors), typecheck, 410/410 unit tests.
- Production build, bundle isolation (17 protected routes, 0 three.js leaks), asset budgets.
- e2e: 147 passed, 2 skipped, 2 failed. The two failures (`interactive`, `media`) are **pre-existing** baseline debt — the branch touches neither file, and `interactive`'s test asserts a "Return to Base" link that doesn't exist anywhere in the tree.
- Sol xhigh closing judge: FIX-THEN-SHIP → the one real finding (/lab annex disclosure) is fixed with a regression guard; the rest were future/rejected (see notes below).

## Ship-prep TODO (your machine / prod — do the ones for the feature you pick)

- [x] **Edition** — `AI_GATEWAY_API_KEY` set on Vercel Production (sensitive, $5/day-capped key), 2026-07-20. A separate uncapped dev key is in `.env.local` alongside `NEXT_PUBLIC_ENABLE_EDITION=true`; verified live — `/api/edition` returns a real streamed compose. Recovery copies of both keys: `prod-gateway-key-setup.secret.txt` (gitignored). Prod key takes effect on the next deployment.
- [x] **Annex** — **live in production 2026-07-24.** Fine-grained PAT `annex-content read (treygoff.com prod)` minted: Contents + Metadata read-only, scoped to `treygoff24/annex-content` alone, **expires 2027-07-24**. Verified by probe — reads the repo (200), 404s on other private repos, 403s on write. All three vars set **Production-scope only** (Preview and Development confirmed empty, so previews and forks still degrade to the gag); `ANNEX_SECRET` and `ANNEX_GITHUB_TOKEN` are marked sensitive. Recovery copies: `annex-secret.secret.txt`, `annex-token.secret.txt`; the shareable link is `annex-friend-link.secret.txt` (all gitignored). Live smoke test passed all six checks: stranger gets the gag, key link opens the reading room, entry body renders, wrong key gets the gag, uncookied entry URL redirects without leaking, privacy headers present on both faces.
  - **`ANNEX_SECRET` must stay hex or another URL-safe alphabet.** The first generated secret was `openssl rand -base64`, which contains `+` — a query string decodes `+` as a space, so the friend link silently landed on the gag page. Confirmed against prod, then regenerated as `openssl rand -hex 32`. Any future rotation must avoid `+` and `/`.
  - **Renewal:** the PAT expires 2027-07-24 and failure is silent — the reading room just starts saying "the archive is temporarily sealed". Worth a calendar reminder.
- [ ] **Resident** (only if you pick it) — deploy the standalone Eve app in `agents/resident`, and address the deployed-journal gap Sol flagged: the agent's `read_own_journal` reads the repo-root `content/journal`, which won't exist in a standalone deploy, so sync a read-only journal snapshot into `agents/resident/data/journal` before it goes live. Not an issue while dormant.
- [ ] Re-auth the Cursor CLI (`cursor login`) if you want the Cursor review lane back.
- [x] Re-run e2e on `feat/machine-city` — 2026-07-20 evening: 290/294 on chromium+mobile-chrome, the 4 failures are exactly the pre-existing interactive/media baseline pair. WebKit/mobile-safari lanes remain unavailable: `playwright install webkit` (build 2248) deterministically hangs mid-extraction on this machine (3 attempts, papercut filed). Never part of any prior baseline.
- [x] `/machine` moved to its permanent home (public page, 94202e3). **Reviewed and signed off live 2026-07-21** along with the Edition: machine got a final copy pass (5d9fb30), the Edition voice was recast as the Archivist with anti-throat-clearing and hostile-visitor-transparency rules (7bb499a, 8c23eff, 90ca4a7). Both surfaces declared FINAL by Trey. Remaining: merge `feat/big-four` + `feat/machine-city`, decide when the Edition takes `/`.
- [x] Sol perf worktree removed at 2026-07-21 closeout (diff was committed as 3af1f73).

## Asset pipeline (new 2026-07-20)

Ported from `claude-space/walk/threejs-agent-kit`. `.mcp.json` adds the Blender and Sketchfab MCP servers (needs a Claude Code restart to load).

```bash
blender -b -P scripts/blender/machine_structure.py          # authors assets-src/*.glb
node scripts/assets/optimize-glb.mjs in.glb out.glb raw     # safe | aggressive | raw
pnpm assets:validate                                        # gltf-validator over public/machine
```

Use `raw` for small meshes: the `safe`/`aggressive` presets compress with meshopt, and GLTFLoader throws without a registered MeshoptDecoder — it fails by silently falling back, not by erroring visibly.

## Known residuals (documented, not bugs)

- **Annex query-string bootstrap** — `?key=` transits the request line (visible only in your own server/CDN logs, not to visitors). Conscious v1 tradeoff for usability + no-JS; fragment+POST is the planned v2. Documented at the bootstrap.
- **`rehypeSlug` after `rehypeSanitize`** in `lib/markdown.ts` — pre-existing, site-wide, flagged-not-fixed (fixing needs anchor-behavior care beyond this scope).
- **`check-bundle-isolation.ts`** — the `/machine` dynamic-import check is warn-level (consistent with the existing `/interactive` one); real cross-route isolation is enforced by the forbidden-package scan, which passed.
- **`Vary: Cookie` never reaches the client on `/classified`.** `proxy.ts:58` appends it, but Next.js overwrites `Vary` on the RSC response path — prod returns only the `rsc, next-router-*` values. Not a leak: both faces send `Cache-Control: private, no-store`, so no shared cache may store a response to mis-serve. Left in place (it costs nothing and starts working if the framework stops clobbering it), recorded here so nobody re-derives it as a finding.
