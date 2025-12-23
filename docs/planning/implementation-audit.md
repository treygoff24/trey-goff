# Implementation Audit: The Control Room

**Date:** December 2025
**Spec Version:** 1.0
**Auditor:** Claude Code

---

## Executive Summary

The personal website is **~80% complete** against the v1.0 spec. Core infrastructure (Next.js 15, Tailwind v4, Content Collections, command palette, library, graph, newsletter) is fully functional. The remaining work falls into three categories:

1. **SEO/Infrastructure gaps** - 404 page, sitemap, structured data
2. **Content placeholder pages** - About, Now, Projects, Colophon, Powerlifting need real content
3. **Nice-to-haves** - Easter eggs, wikilinks, reading stats charts

---

## Current State by Phase

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation + Design System | ✅ Complete | 100% |
| Phase 2: Content Pipeline + Writing | ✅ Complete | 100% |
| Phase 3: Command Palette + Search | ✅ Complete | 100% |
| Phase 4: Library | ⚠️ Mostly Complete | 90% |
| Phase 5: Newsletter + Polish | ⚠️ Partially Complete | 60% |
| Phase 6: Knowledge Graph | ✅ Complete | 100% |

---

## Verified Complete Features

These features are implemented and working. No action needed.

### Infrastructure
- [x] Next.js 15 with App Router + TypeScript
- [x] Tailwind CSS v4 with CSS-first tokens in `globals.css`
- [x] Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)
- [x] Color tokens: bg-0/bg-1, surface-1/2, text-1/2/3, warm, accent
- [x] Skip link for accessibility (`app/layout.tsx:45-50`)
- [x] Reduced motion hook (`hooks/useReducedMotion.ts`)

### Routes (All Exist)
- [x] `/` - Control Room landing with CommandHero, HolographicTile, AtmosphericBackground
- [x] `/writing` - Essays list with EssayCard components
- [x] `/writing/[slug]` - Essay detail with TableOfContents, Prose
- [x] `/notes` - Notes feed with NoteCard, type filtering
- [x] `/library` - Book grid with filters, stats cards, BookDetail modal
- [x] `/graph` - Sigma.js GraphCanvas with NodeInspector
- [x] `/projects` - Placeholder page
- [x] `/about` - Placeholder page
- [x] `/now` - Placeholder page
- [x] `/subscribe` - Newsletter form with SubscribeForm component
- [x] `/colophon` - Basic content
- [x] `/powerlifting` - Hidden page with noindex

### Content Pipeline
- [x] Content Collections configured (`content-collections.ts`)
- [x] Essays collection with frontmatter: title, date, summary, tags, status
- [x] Notes collection with type field (thought/dispatch/link)
- [x] MDX components: Callout, CodeBlock
- [x] Reading time computed at build
- [x] Search index generation (`lib/search/generate-index.ts`)

### Command Palette
- [x] `⌘K` / `Ctrl+K` trigger
- [x] Search across essays, notes, books, graph nodes
- [x] Navigation actions (Go to Writing, Library, etc.)
- [x] Jump to specific content
- [x] Mobile support via CommandProvider

### Library
- [x] Books data in `content/library/books.json`
- [x] Book cover resolution pipeline (`scripts/resolve-covers.ts`)
- [x] Cover caching in `.cover-cache.json`
- [x] BookCard, BookDetail components
- [x] Filters: status, topic, sort
- [x] Basic stats: total, read, 5-star, avg rating

### Knowledge Graph
- [x] Graph generation (`lib/graph/generate.ts`)
- [x] Sigma.js WebGL rendering (`components/graph/GraphCanvas.tsx`)
- [x] NodeInspector panel
- [x] Graph search integration

### Newsletter
- [x] Custom SubscribeForm component
- [x] `/api/subscribe` route with Buttondown integration
- [x] Error handling: invalid email, already subscribed

### RSS Feeds
- [x] `/feed.xml` - All content
- [x] `/writing/feed.xml` - Essays only
- [x] `/notes/feed.xml` - Notes only

### Testing
- [x] Unit tests: `test/books.test.ts`, `test/search.test.ts`, `test/graph.test.ts`, `test/utils.test.ts`
- [x] E2E tests: `e2e/command-palette.e2e.ts`, `e2e/library.e2e.ts`, `e2e/writing.e2e.ts`, `e2e/navigation.e2e.ts`

---

## Missing: Must-Have (High Priority)

### 1. Custom 404 Page

**Spec reference:** Phase 5 deliverables - "404 page design"

**Current state:** No custom 404 exists. Next.js shows default.

**Files to create:**
- `app/not-found.tsx`

**Implementation:**

```tsx
// app/not-found.tsx
import Link from 'next/link'
import { Prose } from '@/components/content/Prose'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-satoshi text-6xl font-bold text-text-1">404</h1>
      <p className="mt-4 text-xl text-text-2">
        This page doesn't exist—yet.
      </p>
      <p className="mt-2 text-text-3">
        Try the command palette (⌘K) to find what you're looking for.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-warm px-6 py-3 font-medium text-bg-1 transition-colors hover:bg-warm/90"
      >
        Return home
      </Link>
    </div>
  )
}
```

**Design notes:**
- Keep it minimal, on-brand
- Suggest command palette as navigation
- Clear CTA to return home

**Acceptance criteria:**
- [ ] Custom 404 renders for unknown routes
- [ ] Matches site design system
- [ ] Has clear navigation back

---

### 2. Sitemap Generation

**Spec reference:** SEO section - "Auto-generated, excludes hidden routes, submitted to Google Search Console"

**Current state:** No sitemap exists.

**Files to create:**
- `app/sitemap.ts`

**Implementation:**

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { allEssays, allNotes } from 'content-collections'

const BASE_URL = 'https://trey.world'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/writing',
    '/notes',
    '/library',
    '/graph',
    '/projects',
    '/about',
    '/now',
    '/subscribe',
    '/colophon',
  ]

  const staticEntries = staticPages.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  const essayEntries = allEssays
    .filter((essay) => essay.status === 'published' || essay.status === 'evergreen')
    .map((essay) => ({
      url: `${BASE_URL}/writing/${essay._meta.path}`,
      lastModified: new Date(essay.date),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }))

  const noteEntries = allNotes.map((note) => ({
    url: `${BASE_URL}/notes/${note._meta.path}`,
    lastModified: new Date(note.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticEntries, ...essayEntries, ...noteEntries]
}
```

**Notes:**
- Excludes `/powerlifting` (hidden page per spec)
- Excludes `/preview/*` routes
- Excludes draft essays

**Acceptance criteria:**
- [ ] `/sitemap.xml` returns valid XML
- [ ] Hidden routes excluded
- [ ] Draft content excluded
- [ ] All public pages included

---

### 3. Structured Data (JSON-LD)

**Spec reference:** SEO section - "Person schema on /about, Article schema on essays, Book schema on library items"

**Current state:** No structured data exists.

**Files to create/modify:**
- `lib/structured-data.ts` (utilities)
- Modify `app/about/page.tsx`
- Modify `app/writing/[slug]/page.tsx`
- Modify `app/library/page.tsx` or `components/library/BookDetail.tsx`

**Implementation:**

```typescript
// lib/structured-data.ts
export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Trey Goff',
    url: 'https://trey.world',
    sameAs: [
      'https://twitter.com/treygoff',
      // Add other social profiles
    ],
    jobTitle: 'Governance Innovation',
    description: 'Building better governance through acceleration zones and institutional innovation.',
  }
}

export function generateArticleSchema(essay: {
  title: string
  summary: string
  date: string
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: essay.title,
    description: essay.summary,
    datePublished: essay.date,
    author: {
      '@type': 'Person',
      name: 'Trey Goff',
      url: 'https://trey.world',
    },
    publisher: {
      '@type': 'Person',
      name: 'Trey Goff',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://trey.world/writing/${essay.slug}`,
    },
  }
}

export function generateBookSchema(book: {
  title: string
  author: string
  isbn13?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: {
      '@type': 'Person',
      name: book.author,
    },
    isbn: book.isbn13,
  }
}
```

**Usage in pages:**

```tsx
// In app/about/page.tsx
import { generatePersonSchema } from '@/lib/structured-data'

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePersonSchema()),
        }}
      />
      {/* Rest of page */}
    </>
  )
}
```

**Acceptance criteria:**
- [ ] Person schema on `/about`
- [ ] Article schema on each essay page
- [ ] Book schema in BookDetail modal or library page
- [ ] Valid JSON-LD (test with Google Rich Results Test)

---

## Missing: Content Pages (Medium Priority)

These pages exist but need real content per the spec.

### 4. About Page - Full Content

**Spec reference:** `/about` page specification

**Current state:** 2 placeholder sentences

**Required structure (from spec):**

**Section 1: The Thesis** (manifesto-style, larger type, distinct design)
1. **The Problem**: Why governance failures cause unnecessary suffering
2. **The Lever**: Why governance reform is highest-leverage
3. **The Mechanism**: How acceleration zones / SEZs work
4. **The Vision**: What success looks like
5. **The Work**: What you're specifically doing
6. **The Philosophy**: Classical liberalism, human agency, etc.

**Section 2: Bio**
- Narrative about who you are
- Background and journey
- Professional affiliations
- How to connect (links)

**Design notes:**
- Thesis section should feel like a manifesto, not a blog post
- Larger type, more breathing room
- Possibly different layout than standard Prose

**Action required:** Content must be written by Trey. Implementation can add structure/styling once content exists.

---

### 5. Now Page - Full Content

**Spec reference:** `/now` page specification

**Current state:** "Coming soon" placeholder

**Required content:**
- Current focus areas
- What you're working on
- What you're reading
- Recent/upcoming travel
- "Last updated: [date]" prominent

**Design notes:**
- Keep it simple
- Update weekly or bi-weekly
- Consider making it MDX for easy updates

**Action required:** Content must be written by Trey.

---

### 6. Projects Page - Full Content

**Spec reference:** `/projects` page specification

**Current state:** "Coming soon" placeholder

**Required structure:**
- Case study style layout
- For each project:
  - Name
  - One-liner
  - Problem
  - Approach
  - Status badge (active/shipped/on-hold/archived/idea)
  - Type badge (software/policy/professional/experiment)
  - Artifacts (screenshots, links)
  - Connected to graph

**Implementation options:**
1. Create `content/projects/*.mdx` collection (matches spec)
2. Use `content/projects/projects.json` similar to books

**Files to create (if using MDX collection):**
- Add projects collection to `content-collections.ts`
- Create `content/projects/` directory
- Create project MDX files
- Update `app/projects/page.tsx` to render projects

**Action required:**
- Decide on data structure (MDX vs JSON)
- Trey to provide project content

---

### 7. Colophon Page - Enhanced Content

**Spec reference:** `/colophon` page specification

**Current state:** Basic bullet list of tech stack

**Required content:**
- Tech stack with brief rationale (current)
- Design influences and inspiration
- Typography choices explanation
- Performance philosophy
- Accessibility approach
- Link to GitHub repo (if open-sourced)
- Credits and thanks

**Action required:** Expand content.

---

### 8. Powerlifting Page - Full Content

**Spec reference:** `/powerlifting` (hidden Easter egg)

**Current state:** "More to come" placeholder

**Required content:**
- Lifting history
- PRs you've hit
- What the sport taught you about discipline, systematic progression, adversity
- Maybe some photos

**Config verified:** Already has `noindex` in metadata.

**Action required:** Content must be written by Trey.

---

## Missing: Nice-to-Have (Low Priority)

### 9. Easter Egg: Konami Code

**Spec reference:** Easter Eggs section

**Trigger:** ↑↑↓↓←→←→BA

**Effect options from spec:**
- Retro mode (8-bit styling)
- Secret message
- Confetti
- Unlocks hidden content

**Implementation:**

```typescript
// hooks/useKonamiCode.ts
import { useEffect, useState } from 'react'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
]

export function useKonamiCode(callback: () => void) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === KONAMI_CODE[index]) {
        const nextIndex = index + 1
        if (nextIndex === KONAMI_CODE.length) {
          callback()
          setIndex(0)
        } else {
          setIndex(nextIndex)
        }
      } else {
        setIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [index, callback])
}
```

**Files to create:**
- `hooks/useKonamiCode.ts`
- Add to `app/layout.tsx` or create wrapper component

**Decision needed:** What should the effect be?

---

### 10. Easter Egg: Console Message

**Spec reference:** Easter Eggs section - "Print once per session when DevTools opens"

**Implementation:**

```typescript
// lib/console-easter-egg.ts
export function printConsoleEasterEgg() {
  if (typeof window === 'undefined') return

  const hasRun = sessionStorage.getItem('console-easter-egg')
  if (hasRun) return

  console.log(`
%c ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ███████╗██████╗
 ██║   ██║██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
 ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║██║  ██║█████╗  ██║  ██║
 ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██║  ██║██╔══╝  ██║  ██║
  ╚████╔╝ ██║██████╔╝███████╗    ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝
   ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝

%c 👋 Hey, you're poking around. I respect that.

 ⚠️  Please don't hack me—I vibe coded this whole thing.

 🤖 Built with: Next.js, Tailwind, MDX, and mass collaboration with Claude
 🔗 Source: github.com/[repo]

 Speaking of which, did you know the Golden Gate Bridge connects San
 Francisco to Marin County? The 1.7-mile suspension bridge, completed
 in 1937, features that iconic International Orange color. I find it
 genuinely fascinating how the bridge has become such a symbol of—

 Wait, sorry. Wrong Claude. Where was I?

 Anyway, if you find a bug, it's a feature.
`, 'color: #FFB86B; font-family: monospace;', 'color: #fff;')

  sessionStorage.setItem('console-easter-egg', 'true')
}
```

**Files to create:**
- `lib/console-easter-egg.ts`
- Call from client component in layout

---

### 11. Wikilinks + Backlinks System

**Spec reference:** Content Model - Linking Rules

**Current state:** Not implemented

**Required functionality:**
- Support `[[Some Idea]]` syntax in essays/notes
- Build-time pipeline extracts backlinks
- Shared tags create soft edges in graph (low weight)
- Manual `related[]` takes precedence over inferred relationships

**Implementation approach:**

1. Create remark plugin for wikilink parsing:

```typescript
// lib/remark-wikilinks.ts
import { visit } from 'unist-util-visit'

export function remarkWikilinks() {
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /\[\[([^\]]+)\]\]/g
      // Transform [[link]] to actual links
    })
  }
}
```

2. Add to Content Collections MDX config

3. Compute backlinks at build time in `lib/backlinks.ts`

4. Add backlinks to essay/note pages

**Files to create:**
- `lib/remark-wikilinks.ts`
- `lib/backlinks.ts`
- Modify `content-collections.ts`
- Modify essay/note page templates

---

### 12. Reading Stats Charts

**Spec reference:** Phase 4 - "Books per year (bar chart), Genre/topic breakdown (treemap or pie)"

**Current state:** Basic stat cards only (total, read, 5-star, avg rating)

**Required:**
- Books read per year (bar chart)
- Genre/topic breakdown (treemap or pie)
- Rating distribution

**Implementation:**
- Add Recharts dependency (or custom SVG)
- Create `components/library/ReadingStatsCharts.tsx`
- Compute stats at build time or client-side

**Decision needed:** Use Recharts or custom SVG for bundle size?

---

## Implementation Priority Order

### Sprint 1: SEO/Infrastructure (Est: 2-3 hours)
1. ✅ 404 page
2. ✅ Sitemap
3. ✅ Structured data (JSON-LD)

### Sprint 2: Content (Blocked on Trey)
4. About page content
5. Now page content
6. Projects page + content
7. Colophon expansion
8. Powerlifting content

### Sprint 3: Polish (Est: 3-4 hours)
9. Konami code easter egg
10. Console message easter egg
11. Wikilinks/backlinks system
12. Reading stats charts

---

## Verification Commands

```bash
# Build check
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# E2E tests
pnpm test:e2e

# Check sitemap
curl http://localhost:3000/sitemap.xml

# Validate structured data
# Use: https://search.google.com/test/rich-results
```

---

## Files Reference

### Key existing files
- `app/layout.tsx` - Root layout
- `content-collections.ts` - Content schema
- `lib/books/index.ts` - Book utilities
- `lib/graph/generate.ts` - Graph generation
- `lib/search/generate-index.ts` - Search index

### Files to create
- `app/not-found.tsx` - Custom 404
- `app/sitemap.ts` - Sitemap generation
- `lib/structured-data.ts` - JSON-LD utilities
- `hooks/useKonamiCode.ts` - Konami code hook
- `lib/console-easter-egg.ts` - DevTools message
- `lib/remark-wikilinks.ts` - Wikilink parser
- `lib/backlinks.ts` - Backlinks computation

---

## Notes for Implementing Agent

1. **Read CLAUDE.md first** - Contains build commands, project structure, and patterns
2. **Verification loop**: Always run `pnpm typecheck && pnpm lint && pnpm build` after changes
3. **Design tokens**: All colors/spacing in `app/globals.css` under `@theme`
4. **Font classes**: `font-satoshi` (UI), `font-newsreader` (prose), `font-mono` (code)
5. **Component patterns**: Check existing components in `components/` for patterns
6. **Content imports**: Use `import { allEssays, allNotes } from 'content-collections'`

---

*Audit complete. Ready for implementation.*
