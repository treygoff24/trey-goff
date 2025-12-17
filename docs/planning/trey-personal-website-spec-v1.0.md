# Trey Personal Website Spec v1.0
## "The Control Room"

**Status:** Implementation-Ready  
**Date:** December 2025  
**Stack:** Next.js 15 + TypeScript + Tailwind v4 + Content Collections + MDX

---

## North Star

A personal website that functions as an explorable index of your mind: writing, projects, reading, and idea relationships—presented with ruthless clarity and premium polish.

**Non-goals (protect the vibe):**
- No template-y blog aesthetic
- No heavy CMS overhead
- No gimmicky motion
- No slow pages
- No light mode (dark permanently)

---

## Success Criteria

The site ships when all of this is true:

- Navigation is instant and predictable on desktop and mobile
- Lighthouse Performance score: 90+ (mobile)
- LCP < 2.5s, CLS < 0.1, INP < 200ms
- First Load JS < 100KB (excluding lazy-loaded modules)
- Typography is luxurious and readable (50-75 characters per line)
- Command palette exists everywhere and feels like the main interface
- The library is compelling and explorable
- The knowledge graph is useful, not a toy
- The whole thing feels expensive

---

## Experience Concept

### The Control Room Landing

The homepage is an intellectual command console:

- Dark graphite base with warm backlight gradient
- Subtle, purpose-driven motion
- A single dominant input affordance (the command bar) that teaches navigation

First screen communicates:
- Who you are (one-line thesis)
- What you do (channels: Writing, Library, Graph, Projects, About/Now)
- How to navigate (keyboard-forward, command palette hint)

### Navigation Philosophy

Keep standard nav simple and consistent. The command palette is the real center of gravity.

### Tone

Warm, calm, backlit, high-contrast, soft edges, precise typography. More *Her* than cyberpunk. The interface feels like a premium instrument panel—alive but never distracting.

---

## Tech Stack

### Core

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript | Cutting edge, excellent DX, Vercel-native |
| Styling | Tailwind CSS v4 + CSS variable tokens | CSS-first config, token-driven theming |
| UI Primitives | shadcn/ui (Radix-based) + cmdk | Accessible, composable, command palette foundation |
| Content | Content Collections + MDX | Type-safe, build-time, actively maintained |
| Search | Orama | Local, instant, zero dependencies, lazy-loaded |
| Animation | Motion for React (primary) + GSAP ScrollTrigger (complex scroll) | Best React integration + battle-tested scroll control |
| Graph | Sigma.js + Graphology | WebGL rendering, precomputed layouts |
| Deployment | Vercel | Native integration, edge functions, analytics |

### Content Pipeline

```
MDX files → Content Collections → Type-safe data → Build-time processing → Static JSON/pages
```

- Wikilinks (`[[Some Idea]]`) extracted and converted to backlinks
- Reading time, word count, TOC computed at build
- Search index generated at build time
- Book covers fetched and cached at build time

### Not Using (Explicit Exclusions)

- Contentlayer (unmaintained)
- Vercel KV (sunset)
- View Transitions API (experimental, not production-ready)
- Partial Prerendering (experimental)
- Light mode (permanently excluded)

---

## Information Architecture

### Routes

```
/                   → Control Room (landing)
/writing            → Essays list
/writing/[slug]     → Individual essay
/notes              → Notes feed (thoughts, dispatches, links)
/library            → Bookshelf + reading stats
/library/[slug]     → Book detail (optional, could be modal)
/graph              → Knowledge graph explorer
/projects           → Portfolio / workshop
/about              → Thesis + bio
/now                → Current focus
/subscribe          → Newsletter signup
/colophon           → How the site was built
/powerlifting       → Hidden easter egg (unlisted, noindex)
```

---

## Content Model

All content managed via Content Collections with MDX.

### 1. Essays (`content/essays/*.mdx`)

```typescript
{
  title: string
  slug: string
  date: string // ISO date
  summary: string // 1-2 sentences
  tags: string[]
  status: 'draft' | 'published' | 'evergreen' | 'dated'
  hero?: string // optional hero image
  canonicalUrl?: string
  related?: string[] // manual related essay slugs
  
  // Computed at build:
  readingTime: number
  wordCount: number
  toc: TocItem[]
  backlinks: string[]
}
```

### 2. Notes (`content/notes/*.mdx`)

```typescript
{
  date: string
  title?: string // optional, many notes won't have titles
  type: 'thought' | 'dispatch' | 'link' // for filtering/styling
  tags?: string[]
  source?: string // URL if it's a link-type note
  mood?: string // optional, for personal flavor
  
  // Computed:
  permalink: string
  backlinks: string[]
}
```

### 3. Projects (`content/projects/*.mdx`)

```typescript
{
  name: string
  slug: string
  oneLiner: string
  problem: string
  approach: string
  status: 'active' | 'shipped' | 'on-hold' | 'archived' | 'idea'
  type: 'software' | 'policy' | 'professional' | 'experiment'
  roles: string[]
  links: { label: string, url: string }[]
  images?: string[]
  tags: string[]
  
  // Computed:
  featuredRank: number
}
```

### 4. Books (`content/library/books.json`)

```typescript
{
  title: string
  author: string
  year: number
  isbn?: string
  status: 'want' | 'reading' | 'read' | 'abandoned'
  rating?: 1 | 2 | 3 | 4 | 5 // or custom scale
  dateRead?: string
  topics: string[]
  whyILoveIt: string // short blurb, always present
  review?: string // optional longer review (could be MDX path)
  
  // Computed:
  coverUrl: string // resolved from Open Library / Google / placeholder
  sortKey: string
}
```

### 5. Graph Data (`content/graph/`)

```typescript
// nodes.json
{
  id: string
  label: string
  type: 'idea' | 'essay' | 'project' | 'book' | 'person' | 'place'
  href?: string
  tags: string[]
  weight: number
}

// edges.json
{
  source: string
  target: string
  relationship: 'influences' | 'contrasts' | 'expands' | 'references'
  weight: number
}
```

### Linking Rules

- Support wikilinks: `[[Some Idea]]` in essays/notes
- Build-time pipeline extracts backlinks
- Shared tags create soft edges in graph (low weight)
- Manual `related[]` takes precedence over inferred relationships

---

## Design System

### Color Tokens (Dark Mode Only)

```css
:root {
  /* Backgrounds */
  --bg-0: #070A0F;           /* Deepest void */
  --bg-1: #0B1020;           /* Primary background */
  
  /* Surfaces */
  --surface-1: rgba(255, 255, 255, 0.06);
  --surface-2: rgba(255, 255, 255, 0.10);
  
  /* Borders */
  --border-1: rgba(255, 255, 255, 0.10);
  --border-2: rgba(255, 255, 255, 0.16);
  
  /* Text */
  --text-1: rgba(255, 255, 255, 0.92);   /* Primary */
  --text-2: rgba(255, 255, 255, 0.72);   /* Secondary */
  --text-3: rgba(255, 255, 255, 0.52);   /* Tertiary */
  
  /* Warm accent (primary) */
  --warm: #FFB86B;
  
  /* Electric accent (sparingly) */
  --accent: #7C5CFF;
  
  /* Semantic */
  --success: #34D399;
  --warning: #FBBF24;
  --error: #F87171;
}
```

No light mode. No toggle. Dark permanently.

### Typography

**Font Stack:**

| Role | Font | Fallback | Source |
|------|------|----------|--------|
| UI / Display | Satoshi | system-ui, sans-serif | Fontshare (free) |
| Prose / Body | Newsreader | Georgia, serif | Google Fonts / next/font |
| Monospace | Monaspace Neon | monospace | GitHub (free) |

**Type Scale (fluid with clamp):**

```css
:root {
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3rem);
  --text-5xl: clamp(3rem, 2.25rem + 3.75vw, 4rem);
}
```

**Reading Comfort:**

- Body size: 18-20px fluid
- Line height: 1.55 for prose
- Max reading width: 65ch (within 50-75ch comfort band)
- Paragraph spacing: 1.5em

### Motion System

**Library:** Motion for React (primary), GSAP ScrollTrigger (complex scroll only)

**Principles:**

1. Motion communicates state, never decorates
2. Honor `prefers-reduced-motion` with meaningful reductions
3. Ambient motion is extremely subtle
4. Micro-interactions preserved even under reduced motion when essential

**Decision Framework:**

| Use CSS when... | Use JS (Motion) when... |
|-----------------|-------------------------|
| Simple hover/focus transitions | Route/page transitions |
| Opacity/transform state changes | Orchestrated sequences |
| Keyframe animations without measurement | Dynamic measurement needed |
| No coordination required | Scroll progress mapping |

**Reduced Motion Policy:**

```typescript
// Single source of truth
const motionPolicy = {
  // Disabled under reduced motion:
  ambientAnimation: false,
  parallax: false,
  autoPlayingLoops: false,
  
  // Converted to instant/discrete:
  pageTransitions: 'instant',
  scrollReveal: 'instant',
  
  // Preserved (essential feedback):
  focusStates: true,
  pressedStates: true,
  hoverHighlights: true,
}
```

### Spacing Scale

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-full: 9999px;
}
```

---

## Core Components

### Global Shell

- `AppLayout` — root layout with providers
- `TopNav` — minimal, always present
- `CommandPaletteProvider` — wraps app, handles ⌘K
- `Footer` — quiet, links to colophon

### Content Components

- `Prose` — typography wrapper for long-form content
- `TOC` — sticky table of contents (desktop)
- `Callout` — note/warn/idea blocks
- `CodeBlock` — syntax highlighting with copy button
- `ContentCard` — reusable card for essays/projects/books
- `TagPill` — clickable tag component

### Command Palette

- `CommandDialog` — modal container (shadcn/cmdk)
- `CommandSearchInput` — search input with icon
- `CommandResultsList` — virtualized results
- `CommandModeFilter` — filter by content type
- `CommandAction` — action model (name, keywords, icon, href, handler)

### Library

- `BookshelfGrid` — 2D grid of books
- `BookCard` — individual book display
- `BookDetailPanel` — expanded book view (modal or slide-over)
- `ReadingStatusFilter` — filter by status
- `ReadingStatsChart` — books per year, genre breakdown

### Graph

- `GraphCanvas` — Sigma.js WebGL renderer
- `NodeInspectorPanel` — node detail sidebar
- `GraphSearch` — search within graph (synced with command palette)

---

## Page Specifications

### `/` Control Room

**Above the fold:**
- Identity line: one sentence thesis
- Mode tiles: Writing, Library, Graph, Projects
- Command bar: "Search everything… (⌘K)"
- Ambient background: warm gradient + subtle noise texture

**Interactions:**
- Typing in command bar searches inline, Enter navigates
- ⌘K works anywhere on page
- Subtle parallax on mode tiles (disabled for reduced motion)

**Mobile:**
- Stacked mode tiles
- Prominent search button (opens bottom sheet command palette)

### `/writing`

**Layout:**
- Featured essays section (pinned/highlighted)
- All essays grid/list
- Filters: tags, year, status
- Search (shares index with command palette)

**Cards show:**
- Title
- 1-2 line summary
- Tags (2-3 max visible)
- Date
- Reading time

### `/writing/[slug]`

**The crown jewel.** Best-in-class reading experience.

**Layout:**
- Strict 65ch max width
- Generous vertical spacing
- Sticky TOC on desktop (left or right sidebar)
- Mobile: floating TOC button → dropdown

**Content:**
- Hero image (optional)
- Title + metadata (date, reading time, tags)
- Prose content with full MDX support
- Related content section:
  - Manual `related[]` first
  - Then inferred from backlinks + graph

**Footer:**
- Newsletter CTA
- Previous/Next essay navigation
- Backlinks list

### `/notes`

**Layout:**
- Chronological feed (newest first)
- Compact cards, notes feel alive not over-produced
- Filter by type (thought/dispatch/link) and tags
- Search integrated

**Cards show:**
- Date
- Title (if present)
- First ~100 chars of content
- Type indicator
- Tags

### `/library`

**Default view:** 2D grid, lightning fast

**Filters:**
- Status: want, reading, read, abandoned
- Rating
- Topics/genres

**Book cards show:**
- Cover image
- Title
- Author
- Rating (if rated)
- Status indicator

**Book detail (modal or panel):**
- Large cover
- Full metadata
- "Why I love it" blurb
- Longer review (if exists)
- Related essays (by topic)
- Buy links

**Reading Stats Dashboard:**
- Books read per year (bar chart)
- Genre/topic breakdown (treemap or pie)
- Rating distribution
- Currently reading + queue
- Total books logged

**Implementation:** Stats computed at build time, rendered with Recharts or custom SVG

### `/graph`

**Layout:**
- Full-viewport Sigma.js canvas
- Inspector panel (slide-over from right)
- Search bar (synced with command palette)

**Interactions:**
- Click node → opens inspector with definition, links, edges
- Hover → highlight connections
- Zoom → label density adapts (hide labels when zoomed out)
- Search → highlights matching nodes

**Performance:**
- Layout precomputed at build time (ForceAtlas2)
- No continuous physics simulation
- Labels rendered on demand

**Mobile:**
- Simplified view or list fallback
- Touch gestures for pan/zoom
- Consider: is full graph useful on mobile? Maybe show list + mini local graph

### `/projects`

**Layout:**
- Case study style
- One-liner, problem, approach, status
- Artifacts (screenshots, links)
- Connected to graph

**Cards show:**
- Name
- One-liner
- Status badge
- Type badge
- Key image

### `/about`

**Two sections:**

**Section 1: The Thesis** (prominent, distinct design)

This is not a bio—it's your intellectual foundation.

Structure:
1. **The Problem**: Why governance failures cause unnecessary suffering
2. **The Lever**: Why governance reform is highest-leverage
3. **The Mechanism**: How acceleration zones / SEZs work
4. **The Vision**: What success looks like
5. **The Work**: What you're specifically doing
6. **The Philosophy**: Classical liberalism, human agency, etc.

Design: Larger type, more breathing room, possibly different layout than standard prose. This should feel like a manifesto, not a blog post.

**Section 2: Bio** (below thesis)
- Narrative about who you are
- Background and journey
- Professional affiliations
- How to connect (links)

### `/now`

- Current focus areas
- What you're working on
- What you're reading
- Recent/upcoming travel
- "Last updated: [date]" prominent

Keep it simple, update weekly or bi-weekly.

### `/subscribe`

- Clean, minimal
- Custom form (not embedded widget)
- Value proposition: what subscribers get
- Privacy note

### `/colophon`

For builders and the curious.

- Tech stack with brief rationale
- Design influences and inspiration
- Typography choices
- Performance philosophy
- Accessibility approach
- Link to GitHub repo (if open-sourced)
- Credits and thanks

### `/powerlifting` (Hidden)

Easter egg. Not linked anywhere. Discoverable via:
- Command palette (typing "powerlifting" or "gym")
- Direct URL

Content:
- Your lifting history
- PRs you hit
- What the sport taught you about discipline, systematic progression, adversity
- Maybe some photos

Config: `noindex` in metadata, excluded from sitemap.

---

## Command Palette Specification

### Triggering

- Desktop: `Cmd+K` / `Ctrl+K`
- Mobile: Visible search button → opens bottom sheet

### Action Types

| Type | Examples |
|------|----------|
| Navigate | Go to Writing, Go to Library, Go to Graph |
| Jump | Open specific essay, book, project, note |
| Filter | "Books: Reading", "Essays tagged: governance" |
| System | Copy URL, Copy citation |
| Easter egg | "powerlifting" → hidden page |

### Ranking Logic

1. Exact match
2. Prefix match
3. Fuzzy match
4. Boost recently visited
5. Boost pinned/featured content

### Search Index

**Build time:**
- Extract: titles, summaries, headings, tags, first 200 chars of content
- Include: essays, notes, books, projects, graph nodes
- Output: compact JSON index

**Runtime:**
- Load index immediately (small, cached)
- Lazy-load Orama engine on first palette open
- Target: <50ms query time

### Mobile UX

- Bottom sheet presentation
- 44px+ tap targets
- Clear section separators
- Obvious dismiss gesture
- Same index and actions as desktop

---

## Newsletter Integration

**Provider:** Buttondown

**Why:** Developer-friendly, custom domains, API for custom forms, RSS-to-email, webhooks, indie vibe.

**Implementation:**

1. Custom subscribe form on `/subscribe` and in essay footers
2. Form POSTs to `/api/subscribe` (server-only route)
3. API route calls Buttondown API to create subscriber
4. Success: "Check your inbox to confirm"
5. Error states: invalid email, already subscribed, rate limited

**RSS-to-email:**
- Connect Essays RSS feed to Buttondown
- New essay → automatic email to subscribers

**Webhook:**
- Subscribe/unsubscribe events logged for analytics

---

## RSS Feeds

**Library:** `feed` package via Next.js Route Handlers

**Feeds generated:**

| URL | Content |
|-----|---------|
| `/feed.xml` | All content (essays + notes) |
| `/essays/feed.xml` | Essays only |
| `/notes/feed.xml` | Notes only |

**Configuration:**
- Full content (not truncated)
- Route Handler with `force-static` caching
- Proper escaping and date formatting

---

## Book Cover Resolution

**Strategy:** Build-time resolution with caching

**Pipeline:**

1. For each book, check if manual `coverUrl` provided → use it
2. Try Open Library Covers API by ISBN
3. Fallback: Google Books API by ISBN/title
4. Final fallback: Generate placeholder SVG with title/author + themed gradient

**Caching:**
- Download resolved covers to `/public/covers/` at build time
- Store mapping in build output
- No runtime API calls for covers

**Rate limits:**
- Open Library: 100 requests per IP per 5 minutes for non-OLID lookups
- Batch processing with delays during build

---

## Knowledge Graph

### Data Pipeline

1. Parse MDX frontmatter (tags, topics, references)
2. Extract wikilinks from content bodies
3. Build directed link graph
4. Compute backlinks by inversion
5. Add soft edges from shared tags (low weight)
6. Compute stable layout at build time (ForceAtlas2 via Graphology)
7. Ship node positions as static JSON

### Rendering

- Sigma.js WebGL renderer
- Labels hidden when zoomed out, shown on hover/selection
- Keep React out of hot path (canvas shouldn't re-render on hover)

### Performance (100-500 nodes)

- Precomputed layout eliminates runtime physics
- Label culling by zoom level
- No continuous simulation

### Minimum Viable Graph (if full implementation delayed)

- Per-page backlinks and outgoing links list
- Small "local neighborhood" mini-map (1 hop from current node)
- Full `/graph` explorer as stretch goal

---

## Easter Eggs

### 1. Konami Code

↑↑↓↓←→←→BA triggers something fun.

Implementation: `konami-code-js` package or simple custom hook. Support both keyboard and touch.

Ideas for effect:
- Retro mode (8-bit styling)
- Secret message
- Confetti
- Unlocks hidden content

### 2. Console Message

Print once per session when DevTools opens:

```
 ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ███████╗██████╗ 
 ██║   ██║██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
 ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║██║  ██║█████╗  ██║  ██║
 ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██║  ██║██╔══╝  ██║  ██║
  ╚████╔╝ ██║██████╔╝███████╗    ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝
   ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝ 

 👋 Hey, you're poking around. I respect that.
 
 ⚠️  Please don't hack me—I vibe coded this whole thing.
 
 🤖 Built with: Next.js, Tailwind, MDX, and mass collaboration with Claude
 🔗 Source: github.com/[repo]
 
 Speaking of which, did you know the Golden Gate Bridge connects San 
 Francisco to Marin County? The 1.7-mile suspension bridge, completed 
 in 1937, features that iconic International Orange color. I find it 
 genuinely fascinating how the bridge has become such a symbol of—
 
 Wait, sorry. Wrong Claude. Where was I?
 
 Anyway, if you find a bug, it's a feature.
```

Use `%c` CSS styling for color. The Golden Gate tangent is a reference to "Golden Gate Claude," an Anthropic experiment where they made Claude obsessed with the bridge.

### 3. Hidden Routes

- `/powerlifting` — unlisted, `noindex`, not in sitemap
- Discoverable via command palette or direct URL

---

## Accessibility Requirements

**Standard:** WCAG 2.2 AA

### Must-haves

- Full keyboard navigation everywhere
- Visible focus states (designed, not browser default)
- Command palette fully usable with screen readers
- `prefers-reduced-motion` honored with sensible behavior
- Color contrast ratios met (4.5:1 text, 3:1 UI)
- Alt text on all images
- Semantic HTML throughout
- Skip links for main content

### Testing

- axe DevTools during development
- VoiceOver / NVDA manual testing before launch
- Keyboard-only navigation testing

---

## SEO

### Metadata

- `generateMetadata` for dynamic pages
- Consistent title template: `Page Title — Trey`
- Descriptions for all pages
- Canonical URLs

### Open Graph Images

- Dynamic generation via Next.js `ImageResponse`
- Template: dark background, title, site branding
- Generated at build time for static pages
- On-demand for dynamic routes

### Structured Data

- Person schema on `/about`
- Article schema on essays
- Book schema on library items

### Sitemap

- Auto-generated, excludes hidden routes
- Submitted to Google Search Console

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance (mobile) | 90+ |
| LCP (Largest Contentful Paint) | < 2.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| INP (Interaction to Next Paint) | < 200ms |
| First Load JS | < 100KB |
| Time to Interactive (3G) | < 3.5s |

### Strategies

- Static generation for all content pages
- Aggressive code splitting
- Lazy load: Orama, Sigma.js, Recharts
- Font subsetting (Latin only)
- Image optimization via Next.js
- Preload critical assets

---

## Implementation Phases

### Phase 1: Foundation + Design System

**Deliverables:**
- Next.js 15 scaffold with App Router + TypeScript
- Tailwind v4 configuration with CSS variable tokens
- Font setup: Satoshi, Newsreader, Monaspace via `next/font`
- Color tokens and spacing scale
- Motion for React configuration
- Reduced motion hook and policy
- Base layout: `AppLayout`, `TopNav`, `Footer`
- `Prose` component with typography system
- Routes: `/`, `/about`, `/now`, `/colophon`

**Exit criteria:**
- Design system documented and functional
- Base pages render with correct typography
- Reduced motion works correctly

### Phase 2: Content Pipeline + Writing

**Deliverables:**
- Content Collections setup with Next.js adapter
- MDX pipeline with custom components (`Callout`, `CodeBlock`)
- Essays collection with all computed fields
- Notes collection with type field
- `/writing` list page with cards
- `/writing/[slug]` with full reading experience
- `/notes` feed page
- `TOC` component (sticky desktop, dropdown mobile)
- RSS feed generation (all three feeds)
- Basic OG image generation

**Exit criteria:**
- Can create essay in MDX, see it on site
- Reading experience feels premium
- RSS feeds validate

### Phase 3: Command Palette + Search

**Deliverables:**
- shadcn/ui `CommandDialog` integration
- Build-time search index generation
- Orama integration (lazy-loaded)
- All action types: navigate, jump, filter, share
- Mobile trigger button + bottom sheet presentation
- Keyboard shortcuts working

**Exit criteria:**
- ⌘K opens palette instantly
- Search returns relevant results < 50ms
- Mobile UX is smooth

### Phase 4: Library

**Deliverables:**
- Books JSON schema and data file
- Book cover resolution pipeline (build-time)
- `BookshelfGrid`, `BookCard`, `BookDetailPanel`
- Filters: status, rating, topics
- Reading stats dashboard with charts
- Connect books to essays via topics

**Exit criteria:**
- Library feels explorable
- Stats render correctly
- Covers load fast (cached)

### Phase 5: Newsletter + Polish

**Deliverables:**
- Buttondown integration
- `/subscribe` page with custom form
- `/api/subscribe` route
- Newsletter CTA in essay footers
- Accessibility audit and fixes
- Performance profiling and optimization
- Motion tuning and reduced motion verification
- Easter eggs: Konami code, console message, `/powerlifting`
- 404 page design

**Exit criteria:**
- Newsletter flow works end-to-end
- Lighthouse 90+ on mobile
- All accessibility checks pass
- Easter eggs work

### Phase 6 (Stretch): Knowledge Graph

**Deliverables:**
- Wikilinks extraction from MDX
- Backlinks computation
- Nodes/edges data pipeline
- Build-time layout computation
- Sigma.js renderer
- `NodeInspectorPanel`
- `/graph` route
- Graph search integration

**Exit criteria:**
- Graph renders smoothly
- Clicking nodes shows details
- Search highlights nodes

### Future (v2+)

- 3D bookshelf mode (R3F + drei)
- Graph trails (save and share paths)
- Curated reading curricula as first-class objects
- Comments / reactions (maybe)
- Analytics dashboard (private)

---

## File Structure

```
/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Control Room
│   ├── writing/
│   │   ├── page.tsx                # Essays list
│   │   └── [slug]/page.tsx         # Essay detail
│   ├── notes/page.tsx
│   ├── library/page.tsx
│   ├── graph/page.tsx
│   ├── projects/page.tsx
│   ├── about/page.tsx
│   ├── now/page.tsx
│   ├── subscribe/page.tsx
│   ├── colophon/page.tsx
│   ├── powerlifting/page.tsx       # Hidden
│   ├── api/
│   │   └── subscribe/route.ts
│   ├── feed.xml/route.ts
│   ├── essays/feed.xml/route.ts
│   └── notes/feed.xml/route.ts
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── TopNav.tsx
│   │   └── Footer.tsx
│   ├── content/
│   │   ├── Prose.tsx
│   │   ├── TOC.tsx
│   │   ├── Callout.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ContentCard.tsx
│   │   └── TagPill.tsx
│   ├── command/
│   │   ├── CommandPalette.tsx
│   │   ├── CommandProvider.tsx
│   │   └── actions.ts
│   ├── library/
│   │   ├── BookshelfGrid.tsx
│   │   ├── BookCard.tsx
│   │   ├── BookDetailPanel.tsx
│   │   └── ReadingStats.tsx
│   └── graph/
│       ├── GraphCanvas.tsx
│       ├── NodeInspector.tsx
│       └── GraphSearch.tsx
├── content/
│   ├── essays/
│   │   └── *.mdx
│   ├── notes/
│   │   └── *.mdx
│   ├── projects/
│   │   └── *.mdx
│   ├── library/
│   │   └── books.json
│   └── graph/
│       ├── nodes.json
│       └── edges.json
├── lib/
│   ├── content.ts                  # Content Collections config
│   ├── search.ts                   # Orama setup
│   ├── graph.ts                    # Graph data processing
│   ├── covers.ts                   # Book cover resolution
│   └── motion.ts                   # Animation utilities
├── styles/
│   └── globals.css                 # Tailwind + tokens
├── public/
│   └── covers/                     # Cached book covers
└── content-collections.ts          # Content Collections config
```

---

## Development Workflow

### Local Development

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
```

### Content Workflow

1. Create/edit MDX file in `content/`
2. Dev server hot-reloads
3. Content Collections validates and types
4. Commit and push
5. Vercel builds and deploys

### Pre-commit Checks

- TypeScript compilation
- ESLint
- Build succeeds

---

## Testing Strategy

### Unit Tests

**Framework:** Vitest (fast, ESM-native, great DX)

**What to test:**
- Content utilities (reading time calculation, slug generation, backlinks extraction)
- Search index generation
- Graph data transformations
- Book cover resolution logic
- Date formatting and sorting functions

**What NOT to unit test:**
- React components (use integration tests instead)
- Styling
- Third-party library internals

### Integration / Component Tests

**Framework:** Vitest + Testing Library

**What to test:**
- Command palette: opens, searches, navigates
- Content cards: render correct data
- Filters: apply correctly
- Mobile menu: opens/closes
- Forms: validation, submission states

### End-to-End Tests

**Framework:** Playwright

**Critical paths to test:**
- Landing → navigate to essay → read → navigate to related
- Command palette search → jump to result
- Library filters → book detail → back
- Subscribe form → success state
- Mobile navigation flow

**Visual regression (optional):**
- Playwright screenshots for key pages
- Compare against baselines
- Catch unintended style changes

### Accessibility Testing

**Automated:**
- axe-core integration in Playwright tests
- Run on every page during E2E

**Manual (pre-launch checklist):**
- Full keyboard navigation
- Screen reader testing (VoiceOver, NVDA)
- Reduced motion verification
- Color contrast spot checks

### Performance Testing

**Lighthouse CI:**
- Run in GitHub Actions on every PR
- Fail if Performance score < 85
- Warn if < 90

**Bundle analysis:**
- `@next/bundle-analyzer` on build
- Track JS size over time
- Alert if first-load JS exceeds 100KB

### Test Commands

```bash
pnpm test           # Run unit + integration tests
pnpm test:e2e       # Run Playwright E2E
pnpm test:a11y      # Run accessibility checks
pnpm test:coverage  # Generate coverage report
pnpm test:watch     # Watch mode for development
```

### Coverage Targets

| Area | Target |
|------|--------|
| Utilities/lib | 90%+ |
| Components | 70%+ |
| Overall | 75%+ |

Don't chase 100%. Focus coverage on logic that matters.

---

## External Services

| Service | Purpose | Setup Required |
|---------|---------|----------------|
| Vercel | Hosting, deployment, analytics | Connect repo |
| Buttondown | Newsletter | Create account, get API key |
| Google Search Console | SEO monitoring | Verify domain |
| Open Library API | Book covers | None (no auth) |
| Google Books API | Book cover fallback | Get API key |

---

## Open Decisions (Resolve During Build)

1. **Domain name**: trey.world? treyrader.com? other?
2. **Book rating scale**: 1-5 stars vs. custom labels (Life-changing / Essential / Good / Interesting)?
3. **Graph**: full implementation in v1 or defer to v2?
4. **Konami code effect**: what does it do?
5. **Open source**: public repo or private?

---

## Success Metrics (Post-Launch)

- Time on site (are people exploring?)
- Pages per session
- Newsletter signups
- RSS subscribers
- Command palette usage (custom event)
- Return visitors

---

## References

### Typography
- Baymard Institute: Line Length Readability
- Butterick's Practical Typography
- Utopia.fyi: Fluid Type Calculator

### Tech
- Content Collections docs
- shadcn/ui Command component
- Orama docs
- Motion for React docs
- GSAP ScrollTrigger docs
- Sigma.js docs

### Inspiration
- Bruno Simon (3D portfolio)
- Paco Coursey (minimal, beautiful)
- Maggie Appleton (digital garden)
- Josh Comeau (reading experience)
- Linear, Vercel, Raycast (command palette UX)

---

*This spec is v1.0 — ready for implementation. Let's build.*
