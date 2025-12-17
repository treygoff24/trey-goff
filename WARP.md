# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Install: `pnpm i` (requires pnpm 9.x)
- Dev server: `pnpm dev` (Next.js 15 with Turbopack)
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`
- Build: `pnpm build`
  - Runs prebuild tasks automatically: book-cover resolution and search index generation
- One-off scripts
  - Resolve book covers: `pnpm covers`
  - Generate search index: `pnpm generate-search`
- Pre-PR gate (from CONTEXT.md): `pnpm typecheck && pnpm lint && pnpm build`
- Test: `pnpm test` (Node.js native test runner with tsx)

Notes
- Search in dev uses the static file at `public/search-index.json`. If you edit content (MDX or books.json), run `pnpm generate-search` to refresh local results.
- Cover image mapping is written to `public/cover-map.json` by `pnpm covers`.
- Tests live in `test/` using Node.js native test runner (`node:test`) with tsx for TypeScript support.

## Environment

Copy `.env.example` to `.env.local` and set values as needed.
- `BUTTONDOWN_API_KEY` — required for `/api/subscribe`
- `NEXT_PUBLIC_SITE_URL` — used in RSS feeds and metadata; set to your deployed origin during preview/production
- `GOOGLE_BOOKS_API_KEY` — optional; raises Google Books cover lookup limits

## Architecture (big picture)

- Framework/runtime: Next.js 15 App Router + TypeScript, Tailwind CSS v4 (CSS-first tokens). Strict TS and path aliases via `tsconfig.json` (`@/*`).

- Content pipeline (build-time, type-safe):
  - Defined in `content-collections.ts` with two collections:
    - `essays` (MDX): schema includes title/date/summary/tags/status; transform computes `slug`, `wordCount`, `readingTime`.
    - `notes` (MDX): optional title, type, tags; transform computes `slug`.
  - Integrated via `withContentCollections` in `next.config.ts`; types emitted under `.content-collections/generated` and imported at runtime as `allEssays` / `allNotes`.

- Search system:
  - Build step `scripts/generate-search-index.ts` composes a compact index in `public/search-index.json` from content plus a set of static nav/actions/easter eggs (`lib/search/generate-index.ts`).
  - Client initializes Orama lazily (`lib/search/orama.ts`) and queries across `title/description/content/tags/keywords` with boosts.
  - The command palette consumes this (see below) for unified navigation and search.

- Command palette (primary navigation model):
  - Components under `components/command/*` provide provider, results, and dialog using `cmdk` and Radix primitives.
  - Keyboard-first UX (⌘K), mobile bottom-sheet variant in UI layer.

- Library/books subsystem:
  - Data source: `content/library/books.json` (typed via `lib/books/types.ts`).
  - Build-time cover resolution (`scripts/resolve-book-covers.ts`) calls Open Library first, then Google Books (optional key), finally generates SVG placeholders. Mapping persists to `public/cover-map.json`.
  - Query helpers (filter/sort/stats) in `lib/books/*`; UI in `components/library/*`.

- Knowledge graph (content relationships):
  - `lib/graph/generate.ts` builds a graph from essays/notes/books and tags. Nodes carry typed metadata; edges connect content↔tags and content↔content (when sharing ≥2 tags). A serialized JSON string can be produced for client consumption.
  - UI lives under `components/graph/*` (Sigma.js renderer, inspector, search) and `app/graph/page.tsx`.

- Feeds and metadata:
  - RSS route handlers: `app/feed.xml/route.ts`, `app/writing/feed.xml/route.ts`, `app/notes/feed.xml/route.ts`. They respect `NEXT_PUBLIC_SITE_URL` and include only non-draft essays.

- Styling and motion:
  - Tailwind v4 via `app/globals.css` with dark-only tokens; component styles favor `clsx` + `tailwind-merge` (`cn` in `lib/utils.ts`).
  - Motion system centralizes reduced-motion policy in `lib/motion.ts` and hook `hooks/useReducedMotion.ts`.

## Working conventions captured in-repo

- CONTEXT.md summarizes the working loop and performance targets; keep pre-PR checks green: `pnpm typecheck && pnpm lint && pnpm build`.
- Content changes (MDX, books) are reflected at build; for live dev search, re-run `pnpm generate-search`.

## What's not here

- No E2E test setup (unit tests exist in `test/`).
- No Cursor rules or Copilot instructions files are present.

Note: CLAUDE.md exists in repo root with project-specific instructions.
