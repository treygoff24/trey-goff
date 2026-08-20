# STATE — trey-goff site

**Updated:** 2026-08-20 (review sweep before the push)

## Hooks (one line each; these must survive any truncation — detail below the fold)

- **All work lives on branch `feat/stack-figures-and-jobsite` (71 commits past `origin/main`); local `main` == `origin/main`. Gate green, UNPUSHED — awaiting Trey's cold scroll + push word.** Contents: /stack figure build (2026-07-31) + /jobsite page + the 2026-08-20 review sweep (2 opus reviewers × 3 rounds, Luna fix lanes, opus visual-QA lane: 14 fix commits `42d3ac1..75548ab`). Detail: "Review sweep" below.
- **Jobsite viz (BenchViz + RunnersViz) IS merged (`8347b1e`).** Branch cleanup done 2026-08-20: 21 merged branches + 3 stale Cursor worktrees removed (diffs archived at `~/.cursor/worktrees/trey-goff-archive-2025-12.tgz`). Two branches deliberately kept, Trey's call: `worktree-agent-aa5bef5926a8d5e6b` (unlanded parallel jobsite polish, adds JobSiteProgress) and `feat/the-workshop` (July 17 desloppify, −27k lines, unmerged).
- **`ci:quality` does NOT run Playwright** — a dead e2e test slipped past it once; run `pnpm test:e2e --project=chromium` after any jobsite/nav change (WebKit binaries don't install here). Adding it to the gate is an open call for Trey.
- **`.beads/issues.jsonl` diff here is claude-space's `cs-*` ledger bleeding in — don't commit it from this repo.**
- **Doorbell doctrine: persistent Monitor on `post watch --room trey-goff --text`, NEVER a once-watch re-arm loop or any cleanup verb near a watch.** Doc: `~/.claude-shared/rules/post-mail-doorbell.md`.
- **Mirrors are hand-written and drift: any /stack or /jobsite content change must update `content/mirrors/*` in the same session.**
- **Pushes gated per-act, commits ungated; one "push it" = exactly one push.**

## Review sweep (2026-08-20)

- Perf: scroll-driven state moved out of StackShell into `StackRail.tsx` (was re-rendering the whole ~5k-element tree per tick); section offsets cached + ResizeObserver; chapter-3+ figures via `next/dynamic` (ssr kept); `useOnceVisible` fires at ratio ≥ threshold OR half-viewport coverage (fixes tall-mobile stall without off-screen autoplay); aria-live only after user interaction; jobsite `content-visibility: auto` to bound Firefox animations.
- Product call (Fable, reversible): **SetupLink deleted, `stack-mode` localStorage preference gone** — both pages already carry the Easy/Hard ModeToggle; the silent nav redirect mislabeled "The Setup · 11 chapters" as a link to /jobsite.
- Typography: all new-figure micro-labels floored at 0.68rem; captions unified at 0.92rem/text-2/warm left rule.
- Footgun: JSX drops the space after `{expr}` when the following text wraps lines, and oxfmt rewrites `{' '}` back — use `&#32;` (SkillsShowcase caption). Papercut filed.
- VQA caught: done-summary class leaking onto every /stack download row; gate-author "three green / 1 passed" contradiction; jobsite progress bar sliding backwards (content-visibility placeholder).

## Tonight's build (2026-07-31 evening, multi-agent: Fable coordinating 15+ opus lanes + #commons crew)

- **Ten interactive teaching figures** wired into /stack, all DOM/CSS/SVG, all reduced-motion-complete: ch2 RecoveryFigure, ch4 ToolLineFigure, ch6 CouncilFigure + DoneSummaryFigure, ch7 CollisionFigure / GateAuthorFigure / RatchetFigure / FreshEyesFigure / ReviewLoopFigure (the five-precept trust strip), ch9 DecisionCardsFigure. Concepts pitched by two opus ideation lanes + agents pact, FC (claude-space), db (delegate-builder), Hearth in #commons; captions carry the night's live incidents as field notes (Trey-relayed ruling via FC).
- **SkillsShowcase** (ch3): 30 always-on skills, 23 sanitized downloads at `public/stack/skills/` incl. generic `done.md`, 7 "my machine" badges. Ch3 lede count corrected 317→307.
- **ToolsShowcase "armory"** (ch4): 26 tools, 3 provenance groups; released eight verified via gh (post/delegate/papercuts/receipts/exa-agent/scout/lens/elv). `post` was open-sourced tonight by FC: github.com/treygoff24/post.
- **CockpitChapter** (ch5): loop figure rebuilt — STATE.md card visibly survives the session boundary; downloads `public/stack/STATE-template.md` + done.md link.
- **QA trail**: independent opus sweep (9 defects) → 4 fix lanes root-caused all + 2 more the sweep missed + the `.cf` root-class collision between CollisionFigure and CouncilFigure (council renamed to `cnc`; the bleed was breaking the council wire band). Severe FreshEyes fix (pills covered code → interleaved subgrid rows) verified by coordinator eyes at 390px.
- **Mirror synced**: `content/mirrors/stack.md` additive update (commit `b4f93cf`).
- **Jobsite fixes on main**: beat-4 logbook crop (`crop: '50% 74%'` per-beat object-position, `f3ff8c6`); clipboard a11y was `b872aeb` (Sol).
- Accepted non-defect: mobile "CHAPTERS" chip overlays captions mid-scroll — standard bottom-nav behavior, pre-existing chrome.
- **Round-2 concept bank** (specced in #commons, timestamped): Hearth's A Rule Is a Classifier (ch2) + Round Two Reviews a Different Program (ch7); FC's Merge Gate + Fresh Eyes Nonrenewable + Gate That Doesn't Blink; db's Red Test Is a Letter + Gate Doesn't Take Your Word; pact's Self-Checking Loop. The trust-triptych needs a new ch7 inter-agent-authority prose passage (Trey decision).
- Untracked, Trey's call: `docs/free-claude-jobsite-invite.txt`, `docs/sol-primer-jobsite-build.txt`.

## Standing state (carried forward)

- **/stack persona restructure live in prod through `9c3e190`**: 12→11 chapters, persona material in ch01 RegisterSection, ch11 "The partnership" (PersonaPanel inside PartnershipChapter). Detail: memory `stack-page`.
- **Edge-light callout grammar** page-wide (`--sk-edge-*` in stack.css); rail-nav active indicator deliberately untouched.
- **Search Console** (lawrencegoffiii@gmail.com): URL-prefix property verified via `public/googleb9d0fb99739b546f.html` (never delete); sitemap submitted 2026-07-30; domain property pending auto-verify.
- **DNS on Vercel nameservers**; registrar GoDaddy #257911591 via trey.goff@gmail.com — Nov 2026 renewal risk: memory `treygoff-com-domain-infrastructure`.
- **Watch**: claude.treygoff.com TLS cert pending at 2026-07-30 close — if down, check Vercel domain page.
- Open /stack calls for Trey (older review): invented starter skills in `public/stack/starter-skill-pack.md`; ch8 "mined from session logs" phrasing; `--sk-bg-sunk` token candidate; dead `pnpm.neverBuiltDependencies` in package.json.
- Research corpus: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored).
- Gate: `pnpm ci:quality` — green at last commit. **main is 43 commits AHEAD of origin/main (unpushed).**
