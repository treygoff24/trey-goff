# STATE — trey-goff site

**Updated:** 2026-08-20 (stranger-fix waves shipped; session closed with /done)

## Hooks (one line each; these must survive any truncation — detail below the fold)

- **`main` == `origin/main` at the stranger-fix run (08465e8 + closeout commits); production deploy `trey-goff-fx5ql2005` built from it.** Everything from the 2026-07-31 figure build through three stranger-fix waves is live. Run ledger + every ruling: `docs/plans/stranger-fix-waves.md`. Persona reports: `docs/reviews/stranger-wave{1,2}-preview-{desktop,mobile}-2026-08-20.md`.
- **Wave 3 shipped without its own stranger pass** (Trey called the run at that wave). First thing next session: a repo-blind desktop + mobile persona on production, and the code-aware lane re-measuring the Wave 3 beads.
- **Open Trey calls (all listed at the end of the plan ledger):** site nav on /jobsite, /stack, /machine ("walled garden", all four personas); chapter-pill idle-hide; six different page gutters; topic pages' separate type system; 5s rail smooth-scroll; rail ghosting through the 72% footer; palette input jump on mobile; ZEDE / charter-city glosses; /now refresh; About photo; constellation label contrast 1.51:1; ledger alignment on its own page (`app/writing/[slug]/page.tsx`); whether the /stack scroll-reveal (now completes off-screen) stays; Playwright in `ci:quality`.
- **Branches are clean: only `main`.** `worktree-agent-aa5bef5926a8d5e6b` (its content landed via the f3110aa hybrid) and `feat/the-workshop` (July 17 desloppify, 80 conflicts against main) were archived as patches in gitignored `docs/_scratch/archived-branches/` and deleted. `origin/feat/stack-figures-and-jobsite` still exists on GitHub (merged; Trey said leave it).
- **`ci:quality` does NOT run Playwright** — run `pnpm test:e2e --project=chromium` after nav/jobsite/graph/library changes (WebKit binaries don't install here). Ten stale e2e assertions were updated this run; the full chromium suite is 157 passed / 2 skipped.
- **`.beads/issues.jsonl` here gets claude-space's `cs-*` ledger bled into it — never commit that diff from this repo; `git checkout -- .beads/issues.jsonl` is safe once no lanes are writing.** `bd` itself can't open this repo's January db; the plan doc is the work graph.
- **Review-lane footguns learned this run:** `backdrop-filter` on an ancestor becomes the containing block for `position: fixed` children (phone sheet bug); CSS Grid `min-width: auto` lets a wide `<pre>` inflate a `1fr` column; Sigma parses only hex/rgb() colours (oklch → black) and scales its canvas by DPR so clamp against `clientWidth`; `agent-browser set device` does not set `pointer: coarse` (hold `Emulation.setTouchEmulationEnabled` over a persistent CDP client); headless freezes CSS transitions, inject `transition: none` before opacity assertions; concurrent `next build` across worktrees hits a machine-wide lock (reviewers run oxlint + tsgo, coordinator runs the gate after merge); Gemini lanes must redirect gate output to a file (16MB delegate stdout cap).
- **Doorbell doctrine: persistent Monitor on `post watch --room trey-goff --text`, NEVER a once-watch re-arm loop or any cleanup verb near a watch.** Doc: `~/.claude-shared/rules/post-mail-doorbell.md`.
- **Mirrors are hand-written and drift: any /stack or /jobsite content change must update `content/mirrors/*` in the same session.**
- **Pushes gated per-act, commits ungated; one "push it" = exactly one push.**

## Stranger-fix run (2026-08-20) — what it was

- Four repo-blind Opus personas (desktop 1440 / mobile 390, AI-curious professional who has never opened a terminal) plus one code-aware VQA lane per wave, on Vercel previews. Three waves: funnel (search, nav labels, footer on the flagship pages), mobile chrome (phone sheet, titles under the header, chapter pill, homepage tags, chart-label floor, ch7 scoreboard), rough rooms (library, graph, media, projects, freshness, ledger + machine, essay overflow, stack polish).
- Lanes: Luna (`delegate codex work --model luna`) and Gemini (`delegate omp work --model gemini`) in isolated worktrees; Opus refute-lens review per branch, ≤2 rounds, then the coordinator applied each final fix list by hand. Every Luna branch took two rounds; coordinator hand-fix commits are named `W<n>-<m> re-review` in the log.
- Design floors now enforced: 44px tap targets on coarse pointers, 10.5px rendered label floor on /stack (SVG px = attr px × clientWidth / viewBox width), no hardcoded rgba/hex outside canvas literals, `kbd` hints hidden on `pointer: coarse`.

## Standing state (carried forward)

- **/stack persona restructure live** (12→11 chapters, ch01 RegisterSection, ch11 "The partnership"); edge-light callout grammar (`--sk-edge-*`). Detail: memory `project_stack_page.md`.
- **Search Console** (lawrencegoffiii@gmail.com): URL-prefix property verified via `public/googleb9d0fb99739b546f.html` (never delete); sitemap submitted 2026-07-30.
- **DNS on Vercel nameservers**; registrar GoDaddy #257911591 via trey.goff@gmail.com — Nov 2026 renewal risk: memory `domain_infrastructure.md`.
- Older /stack debts: invented starter skills in `public/stack/starter-skill-pack.md`; ch8 "mined from session logs" phrasing; `--sk-bg-sunk` token candidate; dead `pnpm.neverBuiltDependencies` in package.json.
- Research corpus: `docs/_scratch/longctx-research/`, `docs/_scratch/stack2-research/` (gitignored).
