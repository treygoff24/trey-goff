# Trey Goff Site Agent Guide

This repo is Trey Goff's Next.js 16 personal site with MDX content, generated search/manifest artifacts, and interactive 3D work. Keep the content pipeline and build-time generation steps intact.

## Quick Start

- Canonical package manager: `pnpm@9.15.1`
- Main commands: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm prebuild`
- Additional generators: `pnpm generate-search`, `pnpm covers`, `pnpm generate-manifests`, `pnpm compress-assets`

## Working Rules

- Prefer `@/` imports and existing token-driven styling from `app/globals.css`.
- Treat `pnpm typecheck && pnpm lint && pnpm build` as the baseline verification gate.
- If you edit `content/` or `content/library/books.json`, run `pnpm prebuild` and commit the generated `public/*.json` artifacts.
- Preserve postbuild checks such as asset budgets and bundle isolation when touching interactive or heavy frontend code.
- Keep visual changes aligned with the established App Router, MDX, and content-generation structure instead of scattering one-off scripts or assets.

## Repo Notes

- Key paths: `app/`, `components/`, `content/`, `lib/`, `scripts/`, `test/`, `e2e/`, `public/`.
- `docs/AGENTS.md` contains additional repo guidance; keep the root file authoritative and update both only when the guidance truly diverges.
