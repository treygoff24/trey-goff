# Trey Goff Site Agent Guide

This repo is Trey Goff's Next.js 16 personal site with MDX content, generated search/manifest artifacts, and interactive 3D work. Keep the content pipeline and build-time generation steps intact.

## Quick Start

- Canonical package manager: `pnpm@9.15.1`
- Main commands: `pnpm dev`, `pnpm build`, `pnpm fmt`, `pnpm fmt:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm prebuild`, `pnpm content:sync`
- Additional generators: `pnpm generate-search`, `pnpm covers`, `pnpm generate-manifests`, `pnpm compress-assets`

## Working Rules

- Prefer `@/` imports and existing token-driven styling from `app/globals.css`.
- Treat `pnpm ci:quality` as the baseline verification gate.
- `pnpm content:sync` is the authoritative generated-content bootstrap for clean-checkout typecheck, test, and build flows.
- `pnpm lint` and `pnpm typecheck` are the authoritative Oxc/TS7 gates; `pnpm lint:legacy` and `pnpm typecheck:legacy` are comparison lanes only.
- If you edit `content/` or `content/library/books.json`, run `pnpm prebuild` and commit the generated `public/*.json` artifacts.
- Preserve postbuild checks such as asset budgets and bundle isolation when touching interactive or heavy frontend code.
- Keep visual changes aligned with the established App Router, MDX, and content-generation structure instead of scattering one-off scripts or assets.

## Draft preview (production)

- Set `ALLOW_DRAFT_PREVIEW=true`, `DRAFT_PREVIEW_SECRET`, then open a preview URL **once** with `?secret=…`. `proxy.ts` strips the query, sets an HttpOnly session cookie, and redirects so the secret is not left in the address bar.
- Local / non-`production` builds stay open without the flag (authoring convenience).

## Repo Notes

- Key paths: `app/`, `components/`, `content/`, `lib/`, `scripts/`, `test/`, `e2e/`, `public/`.
- `docs/AGENTS.md` contains additional repo guidance; keep the root file authoritative and update both only when the guidance truly diverges.
