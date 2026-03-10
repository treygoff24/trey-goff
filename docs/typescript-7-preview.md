# TypeScript 7 Preview Experiment

This branch now treats TypeScript 7 preview as the default typecheck path while still keeping stable `typescript` installed for compatibility backstops and ecosystem comparison.

## Installed

- Stable compiler/tooling baseline: `typescript@^5.7.2`
- Preview compiler: `@typescript/native-preview@7.0.0-dev.20260309.1`

## Commands

- `pnpm content:sync`: builds `.content-collections/generated` for clean-checkout TS7/test/build flows
- `pnpm prepare:quality`: runs `content:sync` and `next typegen`
- `pnpm typecheck`: authoritative TS7 lane after `prepare:quality`
- `pnpm typecheck:legacy`: stable `tsc --noEmit` comparison lane after `prepare:quality`
- `pnpm typecheck:ts7`: alias for the full preview check
- `pnpm typecheck:ts7:scoped`: `tsgo -p tsconfig.ts7.json --noEmit`
- `pnpm typecheck:ts7:full`: `tsgo --noEmit`
- `pnpm lint`: Oxlint default lane
- `pnpm lint:legacy`: ESLint comparison lane
- `pnpm lint:type-aware`: blocking Oxlint type-aware + type-check lane after `prepare:quality`
- `pnpm fmt` / `pnpm fmt:check`: Oxfmt scoped formatter gate

## Current Status

- `pnpm typecheck`: passes
- `pnpm typecheck:legacy`: passes
- `pnpm lint`: passes cleanly
- `pnpm lint:legacy`: available for comparison when Oxc/TS7 behavior is in question
- `pnpm lint:type-aware`: passes cleanly after `prepare:quality`
- `pnpm test`: passes
- `pnpm build`: passes
- `pnpm typecheck:ts7:scoped`: passes
- `pnpm typecheck:ts7:full`: passes

## Current Read

`tsconfig.ts7.json` remains a scoped diagnostic lane only. The branch's authoritative proof command is the full TS7 path, not the scoped one.

## Preview-Only Shim

`types/ts7-preview-css-shim.d.ts` exists only to let `tsgo` resolve the side-effect `./globals.css` import in `app/layout.tsx`. Keep it limited to the TS7 path and avoid treating it as the source of truth for stable `tsc`.
