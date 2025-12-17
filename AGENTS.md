# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and API routes (`app/api/`).
- `components/`: shared UI and feature components (`components/ui/` contains shadcn/Radix primitives).
- `lib/`: domain logic and utilities (notably `lib/search/`, `lib/books/`, `lib/graph/`).
- `content/`: MDX + data (`content/essays/*.mdx`, `content/notes/*.mdx`, `content/library/books.json`).
- `scripts/`: build-time generators (search index, book cover map).
- `public/`: static assets; generated files include `public/search-index.json` and `public/cover-map.json`.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies (repo uses `pnpm@9`).
- `pnpm dev`: run the local dev server (Next.js + Turbopack).
- `pnpm lint`: run ESLint (Next core-web-vitals rules).
- `pnpm typecheck`: run `tsc --noEmit` (strict TypeScript).
- `pnpm build`: production build (runs `prebuild` first).
- `pnpm prebuild`: regenerate `public/search-index.json` and `public/cover-map.json`.
- `pnpm generate-search` / `pnpm covers`: run generators individually.

## Coding Style & Naming Conventions
- TypeScript/React, 2-space indentation, single quotes, and generally no semicolons (match existing files).
- Prefer absolute imports via `@/…` (configured in `tsconfig.json`).
- Components: `PascalCase.tsx`; hooks: `useThing.ts`; utilities: `camelCase`.
- Content naming: essays use kebab-case slugs (e.g. `content/essays/hello-world.mdx`); notes start with a date (e.g. `content/notes/2024-01-first-note.mdx`).
- Keep styling token-driven: reuse classes/tokens defined in `app/globals.css`.

## Testing Guidelines
- There is no dedicated unit/E2E suite in this repo yet. Treat these as the required gates: `pnpm typecheck && pnpm lint && pnpm build`.
- After UI changes, smoke-test key pages locally with `pnpm dev`.
- If you edit `content/` or `content/library/books.json`, run `pnpm prebuild` and commit the updated `public/*.json` outputs.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`. Never commit secrets (e.g. `BUTTONDOWN_API_KEY`).
- Book cover resolution may call external APIs; set `GOOGLE_BOOKS_API_KEY` to avoid stricter rate limits.

## Commit & Pull Request Guidelines
- Follow Conventional Commits where possible (history uses prefixes like `feat:`); keep subjects short and imperative.
- PRs should explain the user-facing impact, link any relevant issues/notes, and include screenshots for visual changes.
- Call out any regenerated artifacts (e.g. updated `public/search-index.json`).
