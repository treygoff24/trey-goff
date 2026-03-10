# Project Context

**Last Updated**: 2026-03-09

## Current Snapshot

- Repo: Trey Goff's personal site built with Next.js 16 and React 19
- Package manager: `pnpm@9.15.1`
- Styling: Tailwind CSS v4 with shared tokens in `app/globals.css`
- Content pipeline: MDX content plus generated search, cover, manifest, and compressed asset artifacts
- Interactive stack: Three.js with React Three Fiber, Drei, Rapier, graph tooling, and Framer Motion
- State and validation: Zustand and Zod

## Source Of Truth

- App code lives in `app/`, `components/`, and `lib/`
- Content lives in `content/`
- Build and generation scripts live in `scripts/`
- Generated artifacts are committed from `public/`

## Verification Guidance

Use this baseline gate for code changes:

```bash
pnpm ci:quality
```

Additional checks when they apply:

- `pnpm content:sync` builds `.content-collections/generated` and is required for clean-checkout TS7/test/build flows
- `pnpm fmt:check` runs Oxfmt on the repo's scoped code surface
- `pnpm lint:type-aware` is part of the authoritative Oxc gate once generated content and Next route types are prepared
- `pnpm lint:legacy` and `pnpm typecheck:legacy` remain available as comparison lanes, not the definition of success
- `pnpm test` runs the Node.js native test runner via `node --test` with `tsx`
- `pnpm test:e2e` runs the Playwright suite
- `pnpm prebuild` regenerates search, cover, manifest, and compressed asset outputs; run it whenever you edit `content/` or `content/library/books.json`

## Notes

- `pnpm build` triggers `prebuild` first, then runs postbuild checks for asset budgets and bundle isolation
- Keep repo guidance branch-agnostic; do not treat this file as a task tracker or phase log
