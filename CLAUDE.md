# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build (runs prebuild scripts automatically)
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
```

**Verification loop:** `pnpm typecheck && pnpm lint && pnpm build`

### Utility Scripts

```bash
pnpm covers           # Resolve book covers from Open Library/Google Books
pnpm generate-search  # Regenerate search index (runs automatically in prebuild)
```

## Architecture

**Personal website for Trey Goff** - dark mode only, command palette-first navigation.

### Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 with CSS-first tokens (`@theme` in `globals.css`)
- **Content:** Content Collections + MDX (essays and notes)
- **Search:** Orama (client-side fuzzy search, lazy-loaded)
- **UI:** shadcn/ui (Radix-based) + cmdk for command palette
- **Graph:** Sigma.js + Graphology for knowledge graph visualization

### Directory Structure

```
app/              # Next.js App Router pages
  api/subscribe/  # Newsletter subscription endpoint
  feed.xml/       # RSS feeds (main, writing, notes)
  writing/[slug]/ # Essay pages with OG image generation
  graph/          # Knowledge graph visualization
components/
  command/        # Command palette (Cmd+K)
  graph/          # Sigma.js graph canvas and inspector
  layout/         # TopNav, Footer, MobileNav
  library/        # Book cards, filters, detail modal
  mdx/            # Callout, CodeBlock for MDX content
  newsletter/     # SubscribeForm
  notes/          # NoteCard
  ui/             # TagPill, dialog, command (shadcn)
  writing/        # EssayCard, TableOfContents
content/
  essays/         # MDX essays
  notes/          # MDX notes
  library/books.json  # Book data
hooks/            # useReducedMotion, useSearch
lib/
  books/          # Book types, cover resolution APIs
  graph/          # Graph data types and generation
  search/         # Orama integration, types
  fonts.ts        # Font configuration (Satoshi, Newsreader, Monaspace)
  motion.ts       # Animation utilities
  utils.ts        # cn(), formatDate(), etc.
scripts/          # Build-time scripts for covers and search index
```

### Content Collections

Configured in `content-collections.ts`. Two collections:
- **essays:** MDX files in `content/essays/`, with title, date, summary, tags, status
- **notes:** MDX files in `content/notes/`, with optional title, date, type (thought/dispatch/link)

Import content with `import { allEssays, allNotes } from 'content-collections'`

### Design Tokens

All tokens defined in `app/globals.css` under `@theme`:
- **Colors:** `bg-0/bg-1`, `surface-1/surface-2`, `text-1/text-2/text-3`, `warm` (#FFB86B), `accent` (#7C5CFF)
- **Typography:** Fluid scale using `clamp()` (text-xs through text-5xl)
- **Fonts:** Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

### Key Patterns

- **Path aliases:** `@/*` maps to project root, `content-collections` maps to generated types
- **Command palette:** Global state via `CommandPaletteProvider`, triggered with Cmd+K
- **Search:** Lazy-loaded Orama DB, initialized on first command palette open
- **Reduced motion:** `useReducedMotion` hook respects system preference
- **RSS feeds:** Auto-generated at `/feed.xml`, `/writing/feed.xml`, `/notes/feed.xml`

### Environment Variables

See `.env.example`:
- `BUTTONDOWN_API_KEY` - Newsletter integration
- `NEXT_PUBLIC_SITE_URL` - For RSS and OG images (default: https://trey.world)
- `GOOGLE_BOOKS_API_KEY` - Optional, for higher cover resolution limits

## Important Utilities

```typescript
// lib/utils.ts
cn(...inputs)                    // Merge Tailwind classes (clsx + tailwind-merge)
formatDate(date)                 // "January 15, 2024"
formatDateShort(date)            // "Jan 15, 2024"
formatDateRelative(date)         // "2 days ago"
```

## Design Decisions

- **Dark mode only** - no light mode support needed
- **Command palette is primary navigation** - all pages accessible via Cmd+K
- **Mobile drawer** slides from right
- **Reduced motion** animations disabled via CSS media query
- **Book covers** resolved at build time via Open Library and Google Books APIs, cached in `.cover-cache.json`
