# Oxc Rollout Implementation Plan

**Goal:** Adopt `oxfmt` and `oxlint` for this repo without breaking the existing Next.js 16 quality gate, while intentionally keeping `typecheck` on `tsc --noEmit`.

**Architecture:** Roll this out in phases. Add `oxfmt` first because formatting is the lowest-risk part of the migration, then add `oxlint` in parallel with ESLint so rule parity can be measured before cutover. Keep the current `tsc`-based typecheck in place until Oxlint's type-aware mode is stable enough for this repo's TypeScript and Next.js stack.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.7, pnpm 9, ESLint 9, `eslint-config-next`, Oxc (`oxfmt`, `oxlint`)

---

## Preconditions

- Current lint config lives in [eslint.config.mjs](/Users/treygoff/Code/trey-goff/eslint.config.mjs).
- Current typecheck command lives in [package.json](/Users/treygoff/Code/trey-goff/package.json).
- Current TypeScript config lives in [tsconfig.json](/Users/treygoff/Code/trey-goff/tsconfig.json).
- Current documented gate is `pnpm typecheck && pnpm lint && pnpm build` in [AGENTS.md](/Users/treygoff/Code/trey-goff/AGENTS.md), [docs/AGENTS.md](/Users/treygoff/Code/trey-goff/docs/AGENTS.md), `/Users/treygoff/Code/trey-goff/CONTEXT.md`, and [docs/WARP.md](/Users/treygoff/Code/trey-goff/docs/WARP.md).

## Non-Goals

- Do not replace `tsc --noEmit` in this rollout.
- Do not remove ESLint until Oxlint parity has been verified against the current Next.js ruleset.
- Do not mix formatter adoption with unrelated refactors.

### Task 1: Capture Baseline Gate Behavior

**Parallel:** no
**Blocked by:** none
**Owned files:** `package.json`, `eslint.config.mjs`, `tsconfig.json`

**Files:**
- Inspect: `package.json`
- Inspect: `eslint.config.mjs`
- Inspect: `tsconfig.json`

**Step 1: Record the current scripts and configs**

Run:

```sh
sed -n '1,220p' package.json
sed -n '1,220p' eslint.config.mjs
sed -n '1,220p' tsconfig.json
```

Expected:
- `lint` is `eslint .`
- `typecheck` is `tsc --noEmit`
- ESLint ignores include `.next/**`, `.content-collections/**`, and related generated paths

**Step 2: Run the current gate before any Oxc changes**

Run:

```sh
pnpm typecheck
pnpm lint
pnpm build
```

Expected:
- Failures, if any, are treated as baseline conditions and documented before migration work starts
- `pnpm build` still runs `prebuild` and `postbuild` lifecycle steps successfully

**Step 3: Inventory ESLint-specific behavior that must survive the migration**

Inspect:
- inline `eslint-disable` comments across `app/`, `components/`, `lib/`, `scripts/`, and `test/`
- custom override for `react-hooks/set-state-in-effect` in `eslint.config.mjs`

Run:

```sh
rg -n "eslint-disable|eslint-disable-next-line" app components lib scripts test e2e
```

Expected:
- A concrete list of source files that may need comment migration, suppression updates, or rule remapping when Oxlint is introduced

### Task 2: Add Oxfmt Scripts and Config

**Parallel:** no
**Blocked by:** Task 1
**Owned files:** `package.json`, `.oxlintrc.json`, `.oxfmt.json`

**Files:**
- Modify: `package.json`
- Create: `.oxfmt.json`
- Reserve for later task: `.oxlintrc.json`

**Step 1: Install Oxc formatter support**

Run:

```sh
pnpm add -D oxfmt
```

Expected:
- `package.json` and lockfile include `oxfmt`

**Step 2: Add formatter scripts to `package.json`**

Add:

```json
{
  "scripts": {
    "format": "oxfmt .",
    "format:check": "oxfmt --check ."
  }
}
```

Expected:
- Formatting becomes explicit and separately runnable from linting

**Step 3: Create `.oxfmt.json` with conservative repo-aligned settings**

Start with:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2
}
```

Expected:
- Oxfmt output stays close to the repo's current dominant style
- Avoid enabling extra churn features in the first pass unless the repo explicitly wants them

**Step 4: Dry-run the formatter**

Run:

```sh
pnpm format:check
```

Expected:
- A clear list of files that would be reformatted
- No repo logic changes yet

### Task 3: Land the First Formatter Pass as an Isolated Change

**Parallel:** no
**Blocked by:** Task 2
**Owned files:** `.oxfmt.json`, `package.json`, `app/**/*`, `components/**/*`, `lib/**/*`, `scripts/**/*`, `test/**/*`, `e2e/**/*`

**Files:**
- Modify: `.oxfmt.json` if dry-run output shows undesirable churn
- Modify: `package.json` only if script flags need adjustment
- Modify: all files touched by the formatter pass

**Step 1: Run Oxfmt and inspect the diff**

Run:

```sh
pnpm format
git diff --stat
git diff -- app components lib scripts test e2e package.json .oxfmt.json
```

Expected:
- A pure formatting diff with no behavior changes
- Any surprising churn is identified immediately

**Step 2: Tune formatter settings if the first pass is too noisy**

Likely decision points:
- whether import sorting should stay disabled for initial adoption
- whether generated files should be excluded
- whether any content or MDX paths need explicit ignores

Expected:
- The final formatter pass is acceptable as a dedicated formatting commit

**Step 3: Re-run the baseline gate after formatting**

Run:

```sh
pnpm typecheck
pnpm lint
pnpm build
```

Expected:
- Formatting changes alone do not break the current gate

### Task 4: Add Oxlint in Parallel With ESLint

**Parallel:** no
**Blocked by:** Task 3
**Owned files:** `package.json`, `.oxlintrc.json`

**Files:**
- Modify: `package.json`
- Create: `.oxlintrc.json`

**Step 1: Install Oxlint and migration helper**

Run:

```sh
pnpm add -D oxlint @oxlint/migrate
```

Expected:
- The repo can execute Oxlint locally

**Step 2: Add parallel lint scripts without changing the primary gate yet**

Add:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "lint:ox": "oxlint .",
    "lint:ox:fix": "oxlint . --fix"
  }
}
```

Expected:
- Existing automation remains stable because `pnpm lint` still uses ESLint
- Oxlint becomes runnable for comparison

**Step 3: Seed `.oxlintrc.json` from the existing ESLint contract**

Minimum parity targets:
- port ignore globs from `eslint.config.mjs`
- enable relevant Oxc plugin families for React, TypeScript, accessibility, and Next.js
- explicitly preserve the custom `react-hooks/set-state-in-effect` decision if Oxc exposes an equivalent rule

Starter command:

```sh
pnpm exec @oxlint/migrate eslint.config.mjs
```

Expected:
- A draft config exists
- The generated config is reviewed manually before use

**Step 4: Run Oxlint without replacing ESLint**

Run:

```sh
pnpm lint:ox
```

Expected:
- The repo gets its first Oxlint result set
- Findings are triaged before any gate cutover

### Task 5: Measure Rule Parity and Decide the Cutover Shape

**Parallel:** no
**Blocked by:** Task 4
**Owned files:** `package.json`, `.oxlintrc.json`, `eslint.config.mjs`

**Files:**
- Modify: `.oxlintrc.json`
- Modify: `package.json`
- Optionally modify or retain: `eslint.config.mjs`

**Step 1: Compare ESLint and Oxlint on the real repo**

Run:

```sh
pnpm lint
pnpm lint:ox
```

Expected:
- Differences fall into three explicit buckets:
  1. Real issues Oxlint found and ESLint missed
  2. Acceptable rule deltas that should be configured away
  3. Next.js-specific checks still better covered by ESLint

**Step 2: Tune `.oxlintrc.json` until the mismatch is understood**

Adjust:
- enabled plugin families
- ignores
- severity levels
- suppressions or file-level exceptions where needed

Expected:
- Oxlint output is predictable and explainable

**Step 3: Choose one of two supported cutover paths**

Preferred path if parity is good:

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix"
  }
}
```

Fallback path if Next-specific gaps remain:

```json
{
  "scripts": {
    "lint": "oxlint .",
    "lint:fix": "oxlint . --fix",
    "lint:next": "eslint ."
  }
}
```

Expected:
- `pnpm lint` moves to Oxlint only when the risk profile is understood
- ESLint remains available as a temporary backstop if needed

**Step 4: Keep `typecheck` unchanged**

Ensure `package.json` continues to contain:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Expected:
- No accidental attempt is made to replace type-checking during this rollout

### Task 6: Update Repo Docs and the Published Quality Gate

**Parallel:** yes
**Blocked by:** Task 5
**Owned files:** `AGENTS.md`, `docs/AGENTS.md`, `CONTEXT.md`, `docs/WARP.md`

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/AGENTS.md`
- Modify: `CONTEXT.md`
- Modify: `docs/WARP.md`

**Step 1: Update command references**

Replace stale language such as:
- `pnpm lint` meaning ESLint specifically
- baseline gate references that omit formatter checks

Target documented gate:

```sh
pnpm typecheck && pnpm lint && pnpm format:check && pnpm build
```

Expected:
- Repo docs match the live scripts

**Step 2: Note the intentional non-migration of typecheck**

Add a brief explanation where helpful:
- `typecheck` remains `tsc --noEmit`
- Oxlint is lint-only in the current rollout

Expected:
- Future contributors do not infer that Oxc replaced TypeScript validation

### Task 7: Final Verification and Cleanup

**Parallel:** no
**Blocked by:** Task 6
**Owned files:** `package.json`, `.oxfmt.json`, `.oxlintrc.json`, `AGENTS.md`, `docs/AGENTS.md`, `CONTEXT.md`, `docs/WARP.md`

**Files:**
- Verify: `package.json`
- Verify: `.oxfmt.json`
- Verify: `.oxlintrc.json`
- Verify: `AGENTS.md`
- Verify: `docs/AGENTS.md`
- Verify: `CONTEXT.md`
- Verify: `docs/WARP.md`

**Step 1: Run the final required gate**

Run:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

Expected:
- The migrated gate passes end to end

**Step 2: Run additional confidence checks where warranted**

Run:

```sh
pnpm test
```

Optional if source edits went beyond formatting or lint suppressions:

```sh
pnpm test:e2e
```

Expected:
- Supporting tests confirm the migration did not introduce behavior regressions

**Step 3: Remove dead migration scaffolding only when no longer needed**

Candidates:
- `eslint.config.mjs` if ESLint is fully retired
- `eslint` and `eslint-config-next` devDependencies if no script still depends on them

Expected:
- No unused lint tooling remains in the repo after the final cutover

## Decision Gates

- Gate A: Oxfmt is accepted only after a dedicated formatting diff is reviewed.
- Gate B: Oxlint becomes the primary `lint` command only after rule parity is understood against the current Next.js ESLint contract.
- Gate C: `typecheck` stays on `tsc --noEmit` for this rollout.
- Gate D: Repo docs are updated in the same change set that finalizes script names.

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7

## Verification Commands Summary

```sh
pnpm typecheck
pnpm lint
pnpm lint:ox
pnpm format:check
pnpm format
pnpm build
pnpm test
pnpm test:e2e
```

## Handoff Notes

- Treat the formatter adoption as a dedicated commit or tightly scoped PR-sized diff.
- Do not attempt an Oxlint type-aware migration in the same rollout.
- If Oxlint cannot fully replace `eslint-config-next` coverage yet, keep ESLint as a temporary backstop rather than forcing a full removal.
