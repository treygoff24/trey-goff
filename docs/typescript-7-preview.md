# TypeScript 7 Preview Experiment

This branch adds a side-by-side TypeScript 7 preview setup without removing the stable `typescript` dependency that Next.js, ESLint, and other tooling still expect.

## Installed

- Stable compiler/tooling baseline: `typescript@^5.7.2`
- Preview compiler: `@typescript/native-preview@7.0.0-dev.20260309.1`

## Commands

- `pnpm typecheck`: stable `tsc --noEmit`
- `pnpm typecheck:ts7`: alias for the scoped preview check
- `pnpm typecheck:ts7:scoped`: `tsgo -p tsconfig.ts7.json --noEmit`
- `pnpm typecheck:ts7:full`: `tsgo --noEmit`

## Current Status

- `pnpm typecheck`: passes
- `pnpm lint`: passes with the repo's existing warnings
- `pnpm test`: passes
- `pnpm build`: passes
- `pnpm typecheck:ts7:scoped`: passes
- `pnpm typecheck:ts7:full`: fails

## Known Blocker

The full-repo TS7 check currently fails in Playwright's bundled declarations under `playwright-core/types/protocol.d.ts` with `TS1540` errors about `module`-style namespace declarations.

That is why this branch includes `tsconfig.ts7.json`: it keeps the main app, library, scripts, and Node test surface in the preview experiment while excluding the Playwright E2E surface that is not yet TS7-compatible here.

## Preview-Only Shim

`types/ts7-preview-css-shim.d.ts` exists only to let `tsgo` resolve the side-effect `./globals.css` import in `app/layout.tsx`. It is not part of the stable compiler path.
