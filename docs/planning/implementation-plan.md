# The Control Room - Implementation Plan

**Spec Version:** 1.0
**Created:** December 2025
**Status:** In Progress

---

## Overview

This plan transforms the spec into actionable development tasks, sequenced to minimize rework and maximize velocity. Each phase builds on the previous, with clear exit criteria before moving forward.

### Critical Path

```
Phase 1 (Foundation) → Phase 2 (Content) → Phase 3 (Search) → Phase 4 (Library) → Phase 5 (Polish) → Phase 6 (Graph)
```

### Performance Targets (Tracked Throughout)

| Metric | Target |
|--------|--------|
| Lighthouse Mobile | 90+ |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| First Load JS | < 100KB |

---

## Phase 1: Foundation + Design System

**Goal:** Establish the technical foundation, design tokens, and base layout components. Everything else builds on this.

**Dependencies:** None (starting point)

**Estimated Effort:** L (3-5 days)

---

### Task 1.0: Create CONTEXT.md

**Description:** Create a persistent build context file at the repo root. This file survives context compaction and serves as Claude Code's reference document for autonomous development across sessions.

**Files to create:**
- `/CONTEXT.md`

**Content:**

```markdown
# The Control Room - Build Context

## What This Is
Personal website for Trey Goff. Dark mode only. Command palette-first navigation.

## Tech Stack
- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS v4 with CSS-first tokens
- Content: Content Collections + MDX
- Search: Orama (lazy-loaded)
- UI: shadcn/ui (Radix-based) + cmdk
- Animation: Motion for React (primary) + GSAP ScrollTrigger (complex scroll)
- Graph: Sigma.js + Graphology (Phase 6)
- Deploy: Vercel

## Design Tokens
- Background: #070A0F (void), #0B1020 (primary)
- Surface: rgba(255,255,255,0.06), rgba(255,255,255,0.10)
- Text: rgba(255,255,255,0.92/0.72/0.52)
- Warm accent: #FFB86B
- Electric accent: #7C5CFF
- Fonts: Satoshi (UI), Newsreader (prose), Monaspace Neon (mono)

## Key Files
- `/content-collections.ts` - Content schema definitions
- `/app/layout.tsx` - Root layout with providers
- `/lib/fonts.ts` - Font configuration
- `/lib/motion.ts` - Animation utilities and reduced motion policy
- `/lib/search.ts` - Orama search setup
- `/lib/covers.ts` - Book cover resolution pipeline

## Build Commands
\`\`\`bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
pnpm covers     # Resolve book covers (build-time)
\`\`\`

## Performance Targets
- Lighthouse Mobile: 90+
- LCP: < 2.5s
- CLS: < 0.1
- INP: < 200ms
- First Load JS: < 100KB

## Current Phase
Phase 1: Foundation + Design System

## Implementation Progress
- [ ] Phase 1: Foundation + Design System
- [ ] Phase 2: Content Pipeline + Writing
- [ ] Phase 3: Command Palette + Search
- [ ] Phase 4: Library
- [ ] Phase 5: Newsletter + Polish
- [ ] Phase 6: Knowledge Graph (stretch)

## Notes
<!-- Claude Code: Update this section with important discoveries, decisions, and context as you work -->

```

**Maintenance rules:**
1. Claude Code must update "Current Phase" when moving between phases
2. Claude Code should add notes in the "Notes" section for important decisions or context that should persist
3. Check off implementation progress items as phases complete

**Acceptance criteria:**
- [ ] `/CONTEXT.md` exists at repo root
- [ ] All sections populated with correct information
- [ ] File is readable and serves as quick reference

---

### Task 1.1: Project Scaffold

**Description:** Initialize Next.js 15 with App Router, TypeScript strict mode, and essential tooling.

**Files to create:**
- `/package.json`
- `/tsconfig.json`
- `/next.config.ts`
- `/.eslintrc.json`
- `/.prettierrc`
- `/app/layout.tsx`
- `/app/page.tsx`

**Commands:**
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**Technical approach:**
1. Use `pnpm` as package manager (faster, stricter)
2. Enable TypeScript strict mode in `tsconfig.json`
3. Configure path aliases: `@/*` maps to project root
4. Set up ESLint with Next.js recommended rules
5. Add Prettier with Tailwind plugin for class sorting

**Post-scaffold configuration:**
```json
// tsconfig.json additions
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Acceptance criteria:**
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build` completes successfully
- [ ] TypeScript strict mode enabled
- [ ] ESLint passes with no warnings

---

### Task 1.2: Tailwind v4 Configuration

**Description:** Set up Tailwind CSS v4 with CSS-first configuration and design tokens.

**Files to create/modify:**
- `/app/globals.css` (primary config location for Tailwind v4)
- `/tailwind.config.ts` (minimal, v4 uses CSS)

**Technical approach:**

Tailwind v4 uses CSS-native configuration. Define all tokens in `globals.css`:

```css
/* /app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors - Dark Mode Only */
  --color-bg-0: #070A0F;
  --color-bg-1: #0B1020;

  --color-surface-1: rgba(255, 255, 255, 0.06);
  --color-surface-2: rgba(255, 255, 255, 0.10);

  --color-border-1: rgba(255, 255, 255, 0.10);
  --color-border-2: rgba(255, 255, 255, 0.16);

  --color-text-1: rgba(255, 255, 255, 0.92);
  --color-text-2: rgba(255, 255, 255, 0.72);
  --color-text-3: rgba(255, 255, 255, 0.52);

  --color-warm: #FFB86B;
  --color-accent: #7C5CFF;
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-error: #F87171;

  /* Typography Scale (fluid) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3rem);
  --text-5xl: clamp(3rem, 2.25rem + 3.75vw, 4rem);

  /* Spacing Scale */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-24: 6rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
}
```

**Acceptance criteria:**
- [ ] Tailwind classes work with custom tokens (`bg-bg-1`, `text-text-1`, etc.)
- [ ] Fluid typography scales correctly across viewport sizes
- [ ] No light mode styles present anywhere

---

### Task 1.3: Font Setup

**Description:** Configure the three-font stack using `next/font` for optimal loading.

**Files to create/modify:**
- `/lib/fonts.ts`
- `/app/layout.tsx`

**Fonts to configure:**

| Role | Font | Source |
|------|------|--------|
| UI/Display | Satoshi | Fontshare (self-hosted) |
| Prose/Body | Newsreader | Google Fonts via next/font |
| Monospace | Monaspace Neon | GitHub (self-hosted) |

**Technical approach:**

1. **Satoshi** - Download from Fontshare, place in `/public/fonts/`, use `next/font/local`
2. **Newsreader** - Use `next/font/google` with `display: 'swap'`
3. **Monaspace Neon** - Download from GitHub, self-host, use `next/font/local`

```typescript
// /lib/fonts.ts
import localFont from 'next/font/local'
import { Newsreader } from 'next/font/google'

export const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400' },
    { path: '../public/fonts/Satoshi-Medium.woff2', weight: '500' },
    { path: '../public/fonts/Satoshi-Bold.woff2', weight: '700' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

export const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
})

export const monaspace = localFont({
  src: '../public/fonts/MonaspaceNeon-Regular.woff2',
  variable: '--font-mono',
  display: 'swap',
})
```

**Files to download:**
- Satoshi: https://www.fontshare.com/fonts/satoshi
- Monaspace: https://github.com/githubnext/monaspace/releases

**Acceptance criteria:**
- [ ] All three fonts load without FOUT (flash of unstyled text)
- [ ] Font CSS variables available: `--font-satoshi`, `--font-newsreader`, `--font-mono`
- [ ] Lighthouse shows no font-related performance warnings
- [ ] Fonts subset to Latin only

---

### Task 1.4: Reduced Motion System

**Description:** Create a centralized motion policy that respects `prefers-reduced-motion`.

**Files to create:**
- `/lib/motion.ts`
- `/hooks/useReducedMotion.ts`

**Technical approach:**

```typescript
// /hooks/useReducedMotion.ts
'use client'
import { useEffect, useState } from 'react'

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
```

```typescript
// /lib/motion.ts
export const motionConfig = {
  // Disabled under reduced motion
  ambient: { disabled: true },
  parallax: { disabled: true },
  autoPlay: { disabled: true },

  // Converted to instant
  pageTransition: { reduced: { duration: 0 } },
  scrollReveal: { reduced: { duration: 0 } },

  // Always preserved
  focus: { preserved: true },
  hover: { preserved: true },
  pressed: { preserved: true },
}

export function getMotionProps(reducedMotion: boolean) {
  return {
    transition: reducedMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: 'easeOut' },
  }
}
```

**Acceptance criteria:**
- [ ] Hook correctly detects system preference
- [ ] Motion config provides consistent reduced motion behavior
- [ ] Can be imported and used by any component

---

### Task 1.5: Base Layout Components

**Description:** Create the global shell: `AppLayout`, `TopNav` (with mobile drawer), and `Footer`.

**Files to create:**
- `/components/layout/AppLayout.tsx`
- `/components/layout/TopNav.tsx`
- `/components/layout/MobileNav.tsx`
- `/components/layout/Footer.tsx`
- `/app/layout.tsx` (modify)

**TopNav requirements:**
- Minimal, always present
- Logo/site name (links to `/`)
- Primary nav links: Writing, Library, Projects, About (hidden on mobile)
- Command palette trigger (⌘K hint on desktop, search icon on mobile)
- Mobile: hamburger button that opens slide-out drawer

**Footer requirements:**
- Quiet, not attention-seeking
- Links: Colophon, RSS, Subscribe, Twitter/X, GitHub
- Copyright line

**Technical approach:**

```typescript
// /components/layout/TopNav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { MobileNav } from './MobileNav'

const navItems = [
  { href: '/writing', label: 'Writing' },
  { href: '/library', label: 'Library' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]

export function TopNav() {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border-1 bg-bg-1/80 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-satoshi text-lg font-medium text-text-1">
            Trey
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href ? 'text-text-1' : 'text-text-2 hover:text-text-1'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <button className="flex items-center gap-2 rounded-md border border-border-1 px-3 py-1.5 text-sm text-text-3 transition-colors hover:border-border-2 hover:text-text-2">
              Search
              <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
            </button>
          </div>

          {/* Mobile nav controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Search button - opens command palette */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Hamburger button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navItems={navItems}
        currentPath={pathname}
      />
    </>
  )
}
```

```typescript
// /components/layout/MobileNav.tsx
'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/lib/motion'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navItems: Array<{ href: string; label: string }>
  currentPath: string
}

export function MobileNav({ isOpen, onClose, navItems, currentPath }: MobileNavProps) {
  const prefersReducedMotion = useReducedMotion()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Close when navigating
  useEffect(() => {
    onClose()
  }, [currentPath, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.nav
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-72 bg-bg-1 border-l border-border-1 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Close button */}
            <div className="flex h-16 items-center justify-end px-4 border-b border-border-1">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-1 hover:text-text-1"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    currentPath === item.href
                      ? 'bg-surface-2 text-text-1'
                      : 'text-text-2 hover:bg-surface-1 hover:text-text-1'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Secondary links */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-1">
              <div className="flex flex-col gap-1">
                <Link
                  href="/now"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-3 hover:text-text-2 transition-colors"
                >
                  Now
                </Link>
                <Link
                  href="/subscribe"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-3 hover:text-text-2 transition-colors"
                >
                  Subscribe
                </Link>
                <Link
                  href="/colophon"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-text-3 hover:text-text-2 transition-colors"
                >
                  Colophon
                </Link>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
```

**Acceptance criteria:**
- [ ] Layout renders on all pages
- [ ] Nav highlights current route
- [ ] Footer links are functional
- [ ] Mobile: hamburger button visible below md breakpoint
- [ ] Mobile: drawer slides in from right when hamburger clicked
- [ ] Mobile: drawer closes on backdrop click, Escape key, or navigation
- [ ] Mobile: drawer respects reduced motion preference
- [ ] Mobile: proper focus management and ARIA attributes
- [ ] Sticky header with backdrop blur

---

### Task 1.6: Prose Component

**Description:** Create the typography wrapper for long-form content with optimal reading experience.

**Files to create:**
- `/components/content/Prose.tsx`
- Update `/app/globals.css` with prose styles

**Requirements from spec:**
- Body size: 18-20px fluid
- Line height: 1.55 for prose
- Max reading width: 65ch
- Paragraph spacing: 1.5em
- Uses Newsreader for body text

**Technical approach:**

```typescript
// /components/content/Prose.tsx
import { cn } from '@/lib/utils'

interface ProseProps {
  children: React.ReactNode
  className?: string
}

export function Prose({ children, className }: ProseProps) {
  return (
    <div className={cn('prose', className)}>
      {children}
    </div>
  )
}
```

```css
/* Add to globals.css */
.prose {
  --prose-body: var(--color-text-1);
  --prose-headings: var(--color-text-1);
  --prose-links: var(--color-warm);
  --prose-code: var(--color-accent);

  font-family: var(--font-newsreader);
  font-size: var(--text-base);
  line-height: 1.55;
  color: var(--prose-body);
  max-width: 65ch;
}

.prose p {
  margin-bottom: 1.5em;
}

.prose h1, .prose h2, .prose h3, .prose h4 {
  font-family: var(--font-satoshi);
  font-weight: 600;
  color: var(--prose-headings);
  margin-top: 2em;
  margin-bottom: 0.75em;
}

.prose h1 { font-size: var(--text-4xl); }
.prose h2 { font-size: var(--text-2xl); }
.prose h3 { font-size: var(--text-xl); }

.prose a {
  color: var(--prose-links);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--prose-code);
  background: var(--color-surface-1);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
}

.prose blockquote {
  border-left: 3px solid var(--color-warm);
  padding-left: 1em;
  font-style: italic;
  color: var(--color-text-2);
}

.prose ul, .prose ol {
  padding-left: 1.5em;
  margin-bottom: 1.5em;
}

.prose li {
  margin-bottom: 0.5em;
}
```

**Acceptance criteria:**
- [ ] Prose renders with correct typography
- [ ] Max width is 65ch
- [ ] Line height is comfortable (1.55)
- [ ] Links use warm accent color
- [ ] Code blocks use monospace font
- [ ] Blockquotes styled distinctly

---

### Task 1.7: Utility Functions

**Description:** Create shared utility functions used across the project.

**Files to create:**
- `/lib/utils.ts`

**Technical approach:**

```typescript
// /lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}
```

**Dependencies to install:**
```bash
pnpm add clsx tailwind-merge
```

**Acceptance criteria:**
- [ ] `cn()` merges Tailwind classes correctly
- [ ] Date formatting functions work as expected

---

### Task 1.8: Static Pages Scaffold

**Description:** Create placeholder pages for `/about`, `/now`, and `/colophon`.

**Files to create:**
- `/app/about/page.tsx`
- `/app/now/page.tsx`
- `/app/colophon/page.tsx`

**Technical approach:**

Each page follows the same pattern for now:

```typescript
// /app/about/page.tsx
import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'About — Trey',
  description: 'Who I am and what I believe.',
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>About</h1>
        <p>Content coming soon.</p>
      </Prose>
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] All three pages render
- [ ] Each has proper metadata
- [ ] Uses Prose component for typography
- [ ] Accessible via navigation

---

### Task 1.9: Control Room Landing Page (Basic)

**Description:** Create the initial homepage structure with placeholder content.

**Files to modify:**
- `/app/page.tsx`

**Requirements from spec:**
- Identity line: one sentence thesis
- Mode tiles: Writing, Library, Graph, Projects
- Command bar placeholder
- Dark background with warm gradient

**Technical approach:**

```typescript
// /app/page.tsx
import Link from 'next/link'

const modes = [
  { href: '/writing', label: 'Writing', description: 'Essays and notes' },
  { href: '/library', label: 'Library', description: 'Books and reading' },
  { href: '/graph', label: 'Graph', description: 'Connected ideas' },
  { href: '/projects', label: 'Projects', description: 'Things I\'ve built' },
]

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)]">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-0 via-bg-1 to-bg-1" />

      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        {/* Identity */}
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Trey Goff
        </h1>
        <p className="text-xl text-text-2 mb-12 max-w-xl mx-auto">
          Building better governance through acceleration zones and institutional innovation.
        </p>

        {/* Command bar placeholder */}
        <button className="mx-auto mb-16 flex w-full max-w-md items-center gap-3 rounded-lg border border-border-1 bg-surface-1 px-4 py-3 text-left text-text-3 transition-colors hover:border-border-2 hover:bg-surface-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search everything...</span>
          <kbd className="ml-auto rounded bg-surface-2 px-2 py-0.5 font-mono text-xs">⌘K</kbd>
        </button>

        {/* Mode tiles */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {modes.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="group rounded-lg border border-border-1 bg-surface-1 p-6 text-left transition-all hover:border-border-2 hover:bg-surface-2"
            >
              <h2 className="font-satoshi text-lg font-medium text-text-1 group-hover:text-warm">
                {mode.label}
              </h2>
              <p className="mt-1 text-sm text-text-3">
                {mode.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] Homepage renders with identity and mode tiles
- [ ] Command bar placeholder is clickable (will wire up in Phase 3)
- [ ] Gradient background visible
- [ ] Mode tiles link to correct routes
- [ ] Responsive: 2 columns on mobile, 4 on desktop

---

### Task 1.10: Motion for React Setup

**Description:** Install and configure Motion for React (formerly Framer Motion).

**Files to create/modify:**
- Install package
- `/lib/motion.ts` (extend with Motion config)

**Commands:**
```bash
pnpm add motion
```

**Technical approach:**

Create reusable animation variants:

```typescript
// /lib/motion.ts (add to existing file)
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Default transition
export const defaultTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1], // ease-out
}

// Reduced motion variant
export const reducedMotionTransition = {
  duration: 0,
}
```

**Acceptance criteria:**
- [ ] Motion package installed
- [ ] Animation variants exported and usable
- [ ] Reduced motion variants available

---

### Phase 1 Verification Checklist

Before moving to Phase 2, verify:

- [ ] `pnpm dev` runs without errors
- [ ] `pnpm build` completes successfully
- [ ] `pnpm lint` passes
- [ ] TypeScript strict mode enabled, no type errors
- [ ] All design tokens (colors, spacing, typography) work in Tailwind classes
- [ ] Three fonts load correctly (Satoshi, Newsreader, Monaspace)
- [ ] TopNav renders on all pages with working links
- [ ] Footer renders with links
- [ ] Prose component renders with correct typography
- [ ] Homepage displays with mode tiles and gradient
- [ ] `/about`, `/now`, `/colophon` pages render
- [ ] Reduced motion hook detects system preference
- [ ] Mobile responsive layout works
- [ ] No light mode styles anywhere
- [ ] First load JS under target (check with build output)

---

## Phase 2: Content Pipeline + Writing

**Goal:** Establish the content management system with Content Collections, MDX processing, and the full writing experience (essays + notes).

**Dependencies:** Phase 1 complete (design system, Prose component, layout)

**Estimated Effort:** XL (5-7 days)

---

### Task 2.1: Content Collections Setup

**Description:** Install and configure Content Collections with the Next.js adapter for type-safe content management.

**Files to create:**
- `/content-collections.ts` (root config)
- `/content/essays/.gitkeep`
- `/content/notes/.gitkeep`
- `/content/projects/.gitkeep`

**Commands:**
```bash
pnpm add @content-collections/core @content-collections/next @content-collections/mdx
```

**Technical approach:**

```typescript
// /content-collections.ts
import { defineCollection, defineConfig } from '@content-collections/core'
import { compileMDX } from '@content-collections/mdx'

const essays = defineCollection({
  name: 'essays',
  directory: 'content/essays',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string(),
    date: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published', 'evergreen', 'dated']).default('draft'),
    hero: z.string().optional(),
    canonicalUrl: z.string().optional(),
    related: z.array(z.string()).optional(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document)
    const slug = document._meta.path.replace(/\.mdx$/, '')
    const wordCount = document.content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    return {
      ...document,
      mdx,
      slug,
      wordCount,
      readingTime,
      // TOC and backlinks computed in separate tasks
    }
  },
})

const notes = defineCollection({
  name: 'notes',
  directory: 'content/notes',
  include: '**/*.mdx',
  schema: (z) => ({
    date: z.string(),
    title: z.string().optional(),
    type: z.enum(['thought', 'dispatch', 'link']).default('thought'),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
    mood: z.string().optional(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document)
    const slug = document._meta.path.replace(/\.mdx$/, '')

    return {
      ...document,
      mdx,
      slug,
      permalink: `/notes/${slug}`,
    }
  },
})

export default defineConfig({
  collections: [essays, notes],
})
```

**Update next.config.ts:**
```typescript
// /next.config.ts
import { withContentCollections } from '@content-collections/next'

const nextConfig = {
  // existing config
}

export default withContentCollections(nextConfig)
```

**Acceptance criteria:**
- [ ] Content Collections installed and configured
- [ ] `pnpm build` generates typed content
- [ ] Essays and notes collections defined with schemas
- [ ] Content directory structure created

---

### Task 2.2: MDX Components

**Description:** Create custom MDX components for rich content: Callout, CodeBlock, and other prose enhancements.

**Files to create:**
- `/components/mdx/Callout.tsx`
- `/components/mdx/CodeBlock.tsx`
- `/components/mdx/Image.tsx`
- `/components/mdx/Link.tsx`
- `/components/mdx/index.tsx` (exports all components)

**Technical approach:**

```typescript
// /components/mdx/Callout.tsx
import { cn } from '@/lib/utils'

interface CalloutProps {
  type?: 'note' | 'warning' | 'idea' | 'important'
  title?: string
  children: React.ReactNode
}

const styles = {
  note: 'border-l-accent bg-accent/5',
  warning: 'border-l-warning bg-warning/5',
  idea: 'border-l-warm bg-warm/5',
  important: 'border-l-error bg-error/5',
}

const icons = {
  note: '📝',
  warning: '⚠️',
  idea: '💡',
  important: '❗',
}

export function Callout({ type = 'note', title, children }: CalloutProps) {
  return (
    <aside
      className={cn(
        'my-6 rounded-r-lg border-l-4 p-4',
        styles[type]
      )}
    >
      {title && (
        <p className="mb-2 font-satoshi font-medium text-text-1">
          <span className="mr-2">{icons[type]}</span>
          {title}
        </p>
      )}
      <div className="text-text-2">{children}</div>
    </aside>
  )
}
```

```typescript
// /components/mdx/CodeBlock.tsx
'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: string
  className?: string
  filename?: string
}

export function CodeBlock({ children, className, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || 'text'

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-6 overflow-hidden rounded-lg border border-border-1 bg-bg-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-1 px-4 py-2">
        <span className="font-mono text-xs text-text-3">
          {filename || language}
        </span>
        <button
          onClick={copyToClipboard}
          className="rounded px-2 py-1 text-xs text-text-3 transition-colors hover:bg-surface-1 hover:text-text-2"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4">
        <code className={cn('font-mono text-sm', className)}>
          {children}
        </code>
      </pre>
    </div>
  )
}
```

```typescript
// /components/mdx/index.tsx
import { Callout } from './Callout'
import { CodeBlock } from './CodeBlock'
import NextImage from 'next/image'
import NextLink from 'next/link'

// Custom link that handles internal vs external
function Link({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isInternal = href?.startsWith('/') || href?.startsWith('#')

  if (isInternal) {
    return (
      <NextLink href={href || '#'} {...props}>
        {children}
      </NextLink>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}

// Optimized image
function Image({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <figure className="my-8">
      <NextImage
        src={src || ''}
        alt={alt || ''}
        width={800}
        height={450}
        className="rounded-lg"
        {...props}
      />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-text-3">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

export const mdxComponents = {
  Callout,
  pre: CodeBlock,
  a: Link,
  img: Image,
}
```

**Acceptance criteria:**
- [ ] Callout component renders with 4 variants
- [ ] CodeBlock has copy button and syntax display
- [ ] Links handle internal/external correctly
- [ ] Images optimized via next/image
- [ ] Components exported for MDX usage

---

### Task 2.3: Syntax Highlighting Setup

**Description:** Add syntax highlighting for code blocks using Shiki (build-time highlighting).

**Commands:**
```bash
pnpm add shiki
```

**Files to modify:**
- `/content-collections.ts` (add rehype plugin)
- `/components/mdx/CodeBlock.tsx` (handle highlighted HTML)

**Technical approach:**

Update Content Collections to use Shiki via rehype:

```typescript
// /lib/shiki.ts
import { createHighlighter } from 'shiki'

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null

export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'tsx', 'jsx', 'json', 'css', 'html', 'bash', 'markdown'],
    })
  }
  return highlighter
}

export async function highlightCode(code: string, lang: string) {
  const hl = await getHighlighter()
  return hl.codeToHtml(code, {
    lang,
    theme: 'github-dark',
  })
}
```

**Acceptance criteria:**
- [ ] Code blocks render with syntax highlighting
- [ ] Theme matches site dark mode
- [ ] Common languages supported (TS, JS, CSS, JSON, bash)
- [ ] No runtime JS for highlighting (build-time only)

---

### Task 2.4: Reading Time and Word Count

**Description:** Implement accurate reading time calculation with proper word counting.

**Files to create:**
- `/lib/content.ts`

**Technical approach:**

```typescript
// /lib/content.ts
export function calculateReadingTime(content: string): number {
  // Remove MDX/JSX components
  const text = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]*`/g, '') // Remove inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Convert links to text
    .replace(/[#*_~]/g, '') // Remove markdown formatting

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const wordsPerMinute = 200

  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export function countWords(content: string): number {
  const text = content
    .replace(/<[^>]*>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')

  return text.trim().split(/\s+/).filter(Boolean).length
}
```

Update content-collections.ts to use these functions in transform.

**Acceptance criteria:**
- [ ] Reading time calculated accurately
- [ ] Code blocks excluded from word count
- [ ] Minimum 1 minute reading time
- [ ] Values available on essay documents

---

### Task 2.5: Table of Contents Generation

**Description:** Extract headings from MDX content to generate a table of contents at build time.

**Files to create:**
- `/lib/toc.ts`

**Technical approach:**

```typescript
// /lib/toc.ts
export interface TocItem {
  id: string
  text: string
  level: number
  children: TocItem[]
}

export function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm
  const headings: { level: number; text: string; id: string }[] = []

  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = slugify(text)

    headings.push({ level, text, id })
  }

  return buildTocTree(headings)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildTocTree(headings: { level: number; text: string; id: string }[]): TocItem[] {
  const root: TocItem[] = []
  const stack: TocItem[] = []

  for (const heading of headings) {
    const item: TocItem = {
      id: heading.id,
      text: heading.text,
      level: heading.level,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(item)
    } else {
      stack[stack.length - 1].children.push(item)
    }

    stack.push(item)
  }

  return root
}
```

**Acceptance criteria:**
- [ ] TOC extracts h2, h3, h4 headings
- [ ] IDs generated from heading text (slugified)
- [ ] Nested structure for hierarchy
- [ ] Available on essay documents at build time

---

### Task 2.6: TOC Component

**Description:** Create the sticky table of contents component for desktop and dropdown for mobile.

**Files to create:**
- `/components/content/TOC.tsx`
- `/components/content/TOCMobile.tsx`

**Technical approach:**

```typescript
// /components/content/TOC.tsx
'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TocItem } from '@/lib/toc'

interface TOCProps {
  items: TocItem[]
}

export function TOC({ items }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    const headings = document.querySelectorAll('h2, h3, h4')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [])

  const renderItems = (items: TocItem[], depth = 0) => (
    <ul className={cn('space-y-2', depth > 0 && 'ml-4 mt-2')}>
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className={cn(
              'block text-sm transition-colors',
              activeId === item.id
                ? 'text-warm font-medium'
                : 'text-text-3 hover:text-text-2'
            )}
          >
            {item.text}
          </a>
          {item.children.length > 0 && renderItems(item.children, depth + 1)}
        </li>
      ))}
    </ul>
  )

  if (items.length === 0) return null

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
      <p className="mb-4 font-satoshi text-sm font-medium text-text-2">
        On this page
      </p>
      {renderItems(items)}
    </nav>
  )
}
```

```typescript
// /components/content/TOCMobile.tsx
'use client'
import { useState } from 'react'
import type { TocItem } from '@/lib/toc'

interface TOCMobileProps {
  items: TocItem[]
}

export function TOCMobile({ items }: TOCMobileProps) {
  const [open, setOpen] = useState(false)

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border-1 bg-bg-1 shadow-lg"
        aria-label="Table of contents"
      >
        <svg className="h-5 w-5 text-text-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-16 right-0 w-64 rounded-lg border border-border-1 bg-bg-1 p-4 shadow-xl">
          <p className="mb-3 font-satoshi text-sm font-medium text-text-2">
            On this page
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-text-3 hover:text-text-2"
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] Desktop TOC is sticky in sidebar
- [ ] Active heading highlighted during scroll
- [ ] Mobile TOC is floating button with dropdown
- [ ] Clicking item scrolls to heading and closes mobile dropdown
- [ ] Hidden when no headings exist

---

### Task 2.7: Essay List Page

**Description:** Create the `/writing` page with essay cards, filtering, and search integration.

**Files to create:**
- `/app/writing/page.tsx`
- `/components/content/EssayCard.tsx`

**Technical approach:**

```typescript
// /app/writing/page.tsx
import { allEssays } from 'content-collections'
import { EssayCard } from '@/components/content/EssayCard'

export const metadata = {
  title: 'Writing — Trey',
  description: 'Essays on governance, technology, and institutional innovation.',
}

export default function WritingPage() {
  const publishedEssays = allEssays
    .filter((essay) => essay.status !== 'draft')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const featuredEssays = publishedEssays.filter((e) => e.status === 'evergreen')
  const recentEssays = publishedEssays.filter((e) => e.status !== 'evergreen')

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Writing
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Long-form essays on governance reform, technology policy, and building better institutions.
        </p>
      </header>

      {featuredEssays.length > 0 && (
        <section className="mb-16">
          <h2 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3 mb-6">
            Featured
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredEssays.map((essay) => (
              <EssayCard key={essay.slug} essay={essay} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3 mb-6">
          All Essays
        </h2>
        <div className="space-y-4">
          {recentEssays.map((essay) => (
            <EssayCard key={essay.slug} essay={essay} />
          ))}
        </div>
      </section>
    </main>
  )
}
```

```typescript
// /components/content/EssayCard.tsx
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { TagPill } from './TagPill'

interface EssayCardProps {
  essay: {
    slug: string
    title: string
    summary: string
    date: string
    tags: string[]
    readingTime: number
    status: string
  }
  featured?: boolean
}

export function EssayCard({ essay, featured }: EssayCardProps) {
  if (featured) {
    return (
      <Link
        href={`/writing/${essay.slug}`}
        className="group block rounded-lg border border-border-1 bg-surface-1 p-6 transition-all hover:border-border-2 hover:bg-surface-2"
      >
        <h3 className="font-satoshi text-xl font-medium text-text-1 group-hover:text-warm mb-2">
          {essay.title}
        </h3>
        <p className="text-text-2 mb-4 line-clamp-2">
          {essay.summary}
        </p>
        <div className="flex items-center gap-4 text-sm text-text-3">
          <span>{formatDate(essay.date)}</span>
          <span>{essay.readingTime} min read</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/writing/${essay.slug}`}
      className="group flex items-baseline justify-between gap-4 py-3 border-b border-border-1 transition-colors hover:border-border-2"
    >
      <div className="min-w-0">
        <h3 className="font-satoshi text-lg font-medium text-text-1 group-hover:text-warm truncate">
          {essay.title}
        </h3>
        <p className="text-sm text-text-3 truncate mt-1">
          {essay.summary}
        </p>
      </div>
      <div className="flex-shrink-0 text-sm text-text-3">
        {formatDate(essay.date)}
      </div>
    </Link>
  )
}
```

**Acceptance criteria:**
- [ ] `/writing` displays all published essays
- [ ] Featured (evergreen) essays shown prominently
- [ ] Essays sorted by date (newest first)
- [ ] Cards show title, summary, date, reading time
- [ ] Links work to individual essays

---

### Task 2.8: Essay Detail Page

**Description:** Create the `/writing/[slug]` page with the premium reading experience.

**Files to create:**
- `/app/writing/[slug]/page.tsx`

**Technical approach:**

```typescript
// /app/writing/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { allEssays } from 'content-collections'
import { MDXContent } from '@content-collections/mdx/react'
import { mdxComponents } from '@/components/mdx'
import { Prose } from '@/components/content/Prose'
import { TOC } from '@/components/content/TOC'
import { TOCMobile } from '@/components/content/TOCMobile'
import { TagPill } from '@/components/content/TagPill'
import { formatDate } from '@/lib/utils'

interface EssayPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return allEssays.map((essay) => ({
    slug: essay.slug,
  }))
}

export async function generateMetadata({ params }: EssayPageProps) {
  const essay = allEssays.find((e) => e.slug === params.slug)
  if (!essay) return {}

  return {
    title: `${essay.title} — Trey`,
    description: essay.summary,
    openGraph: {
      title: essay.title,
      description: essay.summary,
      type: 'article',
      publishedTime: essay.date,
      tags: essay.tags,
    },
  }
}

export default function EssayPage({ params }: EssayPageProps) {
  const essay = allEssays.find((e) => e.slug === params.slug)

  if (!essay || essay.status === 'draft') {
    notFound()
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="lg:grid lg:grid-cols-[1fr_250px] lg:gap-12">
        {/* Main content */}
        <article>
          {/* Header */}
          <header className="mb-12">
            <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
              {essay.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-3 mb-6">
              <time dateTime={essay.date}>{formatDate(essay.date)}</time>
              <span>{essay.readingTime} min read</span>
              <span>{essay.wordCount.toLocaleString()} words</span>
            </div>

            {essay.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {essay.tags.map((tag) => (
                  <TagPill key={tag} tag={tag} />
                ))}
              </div>
            )}
          </header>

          {/* Body */}
          <Prose>
            <MDXContent code={essay.mdx} components={mdxComponents} />
          </Prose>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border-1">
            {/* Newsletter CTA placeholder - Phase 5 */}
            <div className="rounded-lg border border-border-1 bg-surface-1 p-6 text-center">
              <p className="font-satoshi font-medium text-text-1 mb-2">
                Enjoyed this essay?
              </p>
              <p className="text-sm text-text-3">
                Newsletter signup coming soon.
              </p>
            </div>
          </footer>
        </article>

        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <TOC items={essay.toc || []} />
        </aside>
      </div>

      {/* Mobile TOC */}
      <TOCMobile items={essay.toc || []} />
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] Essay renders with full MDX content
- [ ] Header shows title, date, reading time, word count, tags
- [ ] Prose styling applied (65ch max, proper typography)
- [ ] Desktop TOC in sidebar
- [ ] Mobile TOC floating button
- [ ] 404 for drafts and invalid slugs
- [ ] Metadata generated for SEO/OG

---

### Task 2.9: TagPill Component

**Description:** Create a reusable tag component for filtering and display.

**Files to create:**
- `/components/content/TagPill.tsx`

**Technical approach:**

```typescript
// /components/content/TagPill.tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  href?: string
  active?: boolean
  size?: 'sm' | 'md'
}

export function TagPill({ tag, href, active, size = 'sm' }: TagPillProps) {
  const classes = cn(
    'inline-flex items-center rounded-full border transition-colors',
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
    active
      ? 'border-warm bg-warm/10 text-warm'
      : 'border-border-1 text-text-3 hover:border-border-2 hover:text-text-2'
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {tag}
      </Link>
    )
  }

  return <span className={classes}>{tag}</span>
}
```

**Acceptance criteria:**
- [ ] Tag renders with pill styling
- [ ] Active state has warm accent
- [ ] Optional link behavior
- [ ] Two sizes available

---

### Task 2.10: Notes Collection and Page

**Description:** Create the notes collection and `/notes` feed page.

**Files to create:**
- `/app/notes/page.tsx`
- `/components/content/NoteCard.tsx`

**Technical approach:**

```typescript
// /app/notes/page.tsx
import { allNotes } from 'content-collections'
import { NoteCard } from '@/components/content/NoteCard'

export const metadata = {
  title: 'Notes — Trey',
  description: 'Quick thoughts, dispatches, and interesting links.',
}

export default function NotesPage() {
  const notes = allNotes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Notes
        </h1>
        <p className="text-lg text-text-2">
          Quick thoughts, dispatches from the field, and interesting links.
        </p>
      </header>

      <div className="space-y-8">
        {notes.map((note) => (
          <NoteCard key={note.slug} note={note} />
        ))}
      </div>
    </main>
  )
}
```

```typescript
// /components/content/NoteCard.tsx
import { MDXContent } from '@content-collections/mdx/react'
import { mdxComponents } from '@/components/mdx'
import { formatDate } from '@/lib/utils'

interface NoteCardProps {
  note: {
    slug: string
    title?: string
    date: string
    type: 'thought' | 'dispatch' | 'link'
    source?: string
    mdx: string
    tags?: string[]
  }
}

const typeLabels = {
  thought: 'Thought',
  dispatch: 'Dispatch',
  link: 'Link',
}

const typeColors = {
  thought: 'text-accent',
  dispatch: 'text-warm',
  link: 'text-success',
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="border-b border-border-1 pb-8">
      <div className="flex items-center gap-3 mb-3 text-sm">
        <span className={typeColors[note.type]}>{typeLabels[note.type]}</span>
        <span className="text-text-3">{formatDate(note.date)}</span>
      </div>

      {note.title && (
        <h2 className="font-satoshi text-xl font-medium text-text-1 mb-3">
          {note.title}
        </h2>
      )}

      <div className="prose prose-sm">
        <MDXContent code={note.mdx} components={mdxComponents} />
      </div>

      {note.source && (
        <a
          href={note.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm text-warm hover:underline"
        >
          Source
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </article>
  )
}
```

**Acceptance criteria:**
- [ ] Notes display in chronological feed
- [ ] Type indicator (thought/dispatch/link) visible
- [ ] Notes without titles display correctly
- [ ] Source links for link-type notes
- [ ] MDX content renders inline

---

### Task 2.11: Sample Content

**Description:** Create sample essays and notes to test the pipeline.

**Files to create:**
- `/content/essays/hello-world.mdx`
- `/content/essays/governance-innovation.mdx`
- `/content/notes/2024-01-first-note.mdx`
- `/content/notes/2024-01-interesting-link.mdx`

**Technical approach:**

```mdx
---
title: "Hello World: Building The Control Room"
date: "2024-01-15"
summary: "An introduction to this site and what I hope to accomplish."
tags: ["meta", "personal"]
status: "published"
---

# Hello World

This is the first essay on The Control Room. Welcome.

## Why Build This

I wanted a space that felt like *mine*...

<Callout type="idea" title="The Vision">
A personal website should be an explorable index of your mind.
</Callout>

## What's Coming

More essays, more notes, more connections.

```

**Acceptance criteria:**
- [ ] Sample essays render correctly
- [ ] Sample notes render correctly
- [ ] MDX components (Callout) work in content
- [ ] All computed fields (reading time, word count) populate

---

### Task 2.12: RSS Feed Generation

**Description:** Create RSS feeds for all content, essays only, and notes only.

**Files to create:**
- `/app/feed.xml/route.ts`
- `/app/writing/feed.xml/route.ts`
- `/app/notes/feed.xml/route.ts`

**Commands:**
```bash
pnpm add feed
```

**Technical approach:**

```typescript
// /app/feed.xml/route.ts
import { Feed } from 'feed'
import { allEssays, allNotes } from 'content-collections'

// TODO: Replace SITE_DOMAIN with actual domain before deploy (e.g., trey.world, treyrader.com)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://SITE_DOMAIN'

export async function GET() {
  const feed = new Feed({
    title: 'Trey Goff',
    description: 'Essays and notes on governance, technology, and institutional innovation.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Trey Goff`,
    author: {
      name: 'Trey Goff',
      link: siteUrl,
    },
  })

  // Add essays
  const publishedEssays = allEssays
    .filter((e) => e.status !== 'draft')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  for (const essay of publishedEssays) {
    feed.addItem({
      title: essay.title,
      id: `${siteUrl}/writing/${essay.slug}`,
      link: `${siteUrl}/writing/${essay.slug}`,
      description: essay.summary,
      date: new Date(essay.date),
      category: essay.tags.map((tag) => ({ name: tag })),
    })
  }

  // Add notes
  const sortedNotes = allNotes.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const note of sortedNotes) {
    feed.addItem({
      title: note.title || `Note: ${note.date}`,
      id: `${siteUrl}/notes#${note.slug}`,
      link: `${siteUrl}/notes#${note.slug}`,
      date: new Date(note.date),
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
```

Create similar routes for `/writing/feed.xml` (essays only) and `/notes/feed.xml` (notes only).

**Acceptance criteria:**
- [ ] `/feed.xml` returns valid RSS with all content
- [ ] `/writing/feed.xml` returns essays only
- [ ] `/notes/feed.xml` returns notes only
- [ ] Feeds validate (use W3C Feed Validator)
- [ ] Proper caching headers set

---

### Task 2.13: Basic OG Image Generation

**Description:** Set up dynamic Open Graph image generation for essays.

**Files to create:**
- `/app/writing/[slug]/opengraph-image.tsx`
- `/lib/og.tsx` (shared OG image template)

**Technical approach:**

```typescript
// /app/writing/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { allEssays } from 'content-collections'

export const runtime = 'edge'
export const alt = 'Essay preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: { slug: string } }) {
  const essay = allEssays.find((e) => e.slug === params.slug)

  if (!essay) {
    return new ImageResponse(
      <div style={{ background: '#0B1020', width: '100%', height: '100%' }} />,
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #070A0F, #0B1020)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.92)',
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          {essay.title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.72)',
            marginBottom: 48,
          }}
        >
          {essay.summary}
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#FFB86B',
          }}
        >
          SITE_DOMAIN
        </div>
      </div>
    ),
    { ...size }
  )
}
```

**Acceptance criteria:**
- [ ] OG images generated for each essay
- [ ] Images show title, summary, site branding
- [ ] Dark theme matches site
- [ ] Images are 1200x630px

---

### Phase 2 Verification Checklist

Before moving to Phase 3, verify:

- [ ] Content Collections configured and generating types
- [ ] `pnpm build` processes all MDX content
- [ ] Essays display on `/writing` with correct sorting
- [ ] Individual essays render at `/writing/[slug]`
- [ ] Notes display on `/notes` feed
- [ ] MDX components (Callout, CodeBlock) work in content
- [ ] Syntax highlighting renders correctly
- [ ] Reading time and word count calculated
- [ ] TOC generates and displays (desktop + mobile)
- [ ] TagPill component renders correctly
- [ ] RSS feeds validate at all three URLs
- [ ] OG images generate for essays
- [ ] Sample content renders without errors
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## Phase 3: Command Palette + Search

**Goal:** Implement the command palette as the primary navigation interface with instant search powered by Orama.

**Dependencies:** Phase 2 complete (content collections generating data for search index)

**Estimated Effort:** L (3-5 days)

---

### Task 3.1: shadcn/ui Setup

**Description:** Initialize shadcn/ui and install the command (cmdk) component as the foundation for the command palette.

**Commands:**
```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add command dialog
```

**Files created by shadcn:**
- `/components/ui/command.tsx`
- `/components/ui/dialog.tsx`
- `/lib/utils.ts` (may need merge with existing)

**Configuration choices:**
- Style: New York
- Base color: Neutral (we'll override with our tokens)
- CSS variables: Yes
- Tailwind config: Update to use our existing tokens

**Post-install modifications:**

Update the generated components to use our design tokens:

```typescript
// Modify /components/ui/command.tsx colors
// Replace default colors with our tokens:
// - bg-popover → bg-bg-1
// - text-popover-foreground → text-text-1
// - border → border-border-1
```

**Acceptance criteria:**
- [ ] shadcn/ui initialized
- [ ] Command and Dialog components installed
- [ ] Components styled with our design tokens
- [ ] No visual conflicts with existing styles

---

### Task 3.2: Command Palette Provider

**Description:** Create a React context provider that manages command palette state globally and handles keyboard shortcuts.

**Files to create:**
- `/components/command/CommandProvider.tsx`
- `/components/command/useCommandPalette.ts`

**Technical approach:**

```typescript
// /components/command/CommandProvider.tsx
'use client'
import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }

      // Also handle Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, toggle])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  }
  return context
}
```

```typescript
// /components/command/useCommandPalette.ts
export { useCommandPalette } from './CommandProvider'
```

**Integration with layout:**

```typescript
// Update /app/layout.tsx
import { CommandPaletteProvider } from '@/components/command/CommandProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CommandPaletteProvider>
          {/* existing layout */}
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
```

**Acceptance criteria:**
- [ ] Provider wraps entire application
- [ ] Cmd+K / Ctrl+K toggles palette from anywhere
- [ ] Escape closes palette
- [ ] Context accessible via hook

---

### Task 3.3: Search Index Generation

**Description:** Generate a search index at build time containing all searchable content (essays, notes, books, projects, navigation).

**Files to create:**
- `/lib/search/generate-index.ts`
- `/lib/search/types.ts`
- `/scripts/generate-search-index.ts`

**Technical approach:**

```typescript
// /lib/search/types.ts
export interface SearchDocument {
  id: string
  type: 'essay' | 'note' | 'book' | 'project' | 'page' | 'action'
  title: string
  description?: string
  content?: string // First 200 chars for essays/notes
  tags?: string[]
  url: string
  keywords?: string[] // Additional search terms
  priority?: number // For ranking (higher = more important)
}

export interface SearchIndex {
  documents: SearchDocument[]
  version: string
  generatedAt: string
}
```

```typescript
// /lib/search/generate-index.ts
import { allEssays, allNotes } from 'content-collections'
import type { SearchDocument, SearchIndex } from './types'

// Navigation pages (static)
const navigationPages: SearchDocument[] = [
  { id: 'nav-home', type: 'page', title: 'Home', description: 'The Control Room', url: '/', priority: 10 },
  { id: 'nav-writing', type: 'page', title: 'Writing', description: 'Essays and long-form content', url: '/writing', priority: 10 },
  { id: 'nav-notes', type: 'page', title: 'Notes', description: 'Quick thoughts and links', url: '/notes', priority: 10 },
  { id: 'nav-library', type: 'page', title: 'Library', description: 'Books and reading', url: '/library', priority: 10 },
  { id: 'nav-projects', type: 'page', title: 'Projects', description: 'Things I\'ve built', url: '/projects', priority: 10 },
  { id: 'nav-about', type: 'page', title: 'About', description: 'Who I am and what I believe', url: '/about', priority: 10 },
  { id: 'nav-now', type: 'page', title: 'Now', description: 'What I\'m currently focused on', url: '/now', priority: 8 },
  { id: 'nav-subscribe', type: 'page', title: 'Subscribe', description: 'Newsletter signup', url: '/subscribe', priority: 8 },
  { id: 'nav-colophon', type: 'page', title: 'Colophon', description: 'How this site was built', url: '/colophon', priority: 6 },
]

// Quick actions
const quickActions: SearchDocument[] = [
  { id: 'action-copy-url', type: 'action', title: 'Copy current URL', keywords: ['share', 'link', 'clipboard'], url: '#copy-url', priority: 5 },
  { id: 'action-rss', type: 'action', title: 'RSS Feed', description: 'Subscribe via RSS', url: '/feed.xml', priority: 5 },
]

// Easter egg
const easterEggs: SearchDocument[] = [
  { id: 'easter-powerlifting', type: 'page', title: 'Powerlifting', description: 'The hidden gym page', keywords: ['gym', 'lifting', 'fitness', 'strength'], url: '/powerlifting', priority: 1 },
]

export function generateSearchIndex(): SearchIndex {
  const documents: SearchDocument[] = []

  // Add navigation
  documents.push(...navigationPages)

  // Add actions
  documents.push(...quickActions)

  // Add essays
  for (const essay of allEssays) {
    if (essay.status === 'draft') continue

    documents.push({
      id: `essay-${essay.slug}`,
      type: 'essay',
      title: essay.title,
      description: essay.summary,
      content: essay.content.slice(0, 200),
      tags: essay.tags,
      url: `/writing/${essay.slug}`,
      priority: essay.status === 'evergreen' ? 8 : 6,
    })
  }

  // Add notes
  for (const note of allNotes) {
    documents.push({
      id: `note-${note.slug}`,
      type: 'note',
      title: note.title || `Note from ${note.date}`,
      content: note.content.slice(0, 200),
      tags: note.tags,
      url: `/notes#${note.slug}`,
      priority: 4,
    })
  }

  // Add easter eggs (low priority, but findable)
  documents.push(...easterEggs)

  return {
    documents,
    version: '1.0',
    generatedAt: new Date().toISOString(),
  }
}
```

```typescript
// /scripts/generate-search-index.ts
import { writeFileSync } from 'fs'
import { generateSearchIndex } from '../lib/search/generate-index'

const index = generateSearchIndex()
writeFileSync('./public/search-index.json', JSON.stringify(index))
console.log(`Generated search index with ${index.documents.length} documents`)
```

**Add to build process in package.json:**
```json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-search-index.ts",
    "build": "next build"
  }
}
```

**Acceptance criteria:**
- [ ] Search index generated at build time
- [ ] Index includes essays, notes, pages, actions
- [ ] Index saved to `/public/search-index.json`
- [ ] Index is compact (minimal content, just enough for search)

---

### Task 3.4: Orama Search Integration

**Description:** Integrate Orama as the client-side search engine with lazy loading.

**Commands:**
```bash
pnpm add @orama/orama
```

**Files to create:**
- `/lib/search/orama.ts`
- `/hooks/useSearch.ts`

**Technical approach:**

```typescript
// /lib/search/orama.ts
import { create, insert, search, type Orama } from '@orama/orama'
import type { SearchDocument, SearchIndex } from './types'

let db: Orama<any> | null = null
let initPromise: Promise<void> | null = null

export async function initializeSearch(): Promise<void> {
  if (db) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    // Fetch the pre-built index
    const response = await fetch('/search-index.json')
    const index: SearchIndex = await response.json()

    // Create Orama database
    db = await create({
      schema: {
        id: 'string',
        type: 'string',
        title: 'string',
        description: 'string',
        content: 'string',
        tags: 'string[]',
        url: 'string',
        keywords: 'string[]',
        priority: 'number',
      },
    })

    // Insert all documents
    for (const doc of index.documents) {
      await insert(db, {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        description: doc.description || '',
        content: doc.content || '',
        tags: doc.tags || [],
        url: doc.url,
        keywords: doc.keywords || [],
        priority: doc.priority || 5,
      })
    }
  })()

  return initPromise
}

export interface SearchResult {
  id: string
  type: SearchDocument['type']
  title: string
  description?: string
  url: string
  score: number
}

export async function searchDocuments(query: string): Promise<SearchResult[]> {
  if (!db) {
    await initializeSearch()
  }

  if (!query.trim()) {
    return []
  }

  const results = await search(db!, {
    term: query,
    properties: ['title', 'description', 'content', 'tags', 'keywords'],
    boost: {
      title: 3,
      keywords: 2,
      description: 1.5,
      tags: 1.5,
      content: 1,
    },
    limit: 20,
  })

  return results.hits.map((hit) => ({
    id: hit.document.id as string,
    type: hit.document.type as SearchDocument['type'],
    title: hit.document.title as string,
    description: hit.document.description as string | undefined,
    url: hit.document.url as string,
    score: hit.score,
  }))
}
```

```typescript
// /hooks/useSearch.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { searchDocuments, initializeSearch, type SearchResult } from '@/lib/search/orama'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize search on first use (lazy load)
  const initialize = useCallback(async () => {
    if (isInitialized) return
    setIsLoading(true)
    await initializeSearch()
    setIsInitialized(true)
    setIsLoading(false)
  }, [isInitialized])

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchAsync = async () => {
      await initialize()
      const results = await searchDocuments(query)
      setResults(results)
    }

    // Debounce search
    const timeout = setTimeout(searchAsync, 100)
    return () => clearTimeout(timeout)
  }, [query, initialize])

  return {
    query,
    setQuery,
    results,
    isLoading,
    isInitialized,
    initialize,
  }
}
```

**Acceptance criteria:**
- [ ] Orama loads lazily on first palette open
- [ ] Search returns results in < 50ms
- [ ] Results ranked by relevance + priority boost
- [ ] Handles empty queries gracefully

---

### Task 3.5: Command Palette UI

**Description:** Build the main command palette dialog with search input, results list, and keyboard navigation.

**Files to create:**
- `/components/command/CommandPalette.tsx`
- `/components/command/CommandResults.tsx`
- `/components/command/CommandItem.tsx`

**Technical approach:**

```typescript
// /components/command/CommandPalette.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandPalette } from './CommandProvider'
import { useSearch } from '@/hooks/useSearch'
import { CommandResults } from './CommandResults'

export function CommandPalette() {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const { query, setQuery, results, isLoading, initialize } = useSearch()

  // Initialize search when palette opens
  useEffect(() => {
    if (open) {
      initialize()
    }
  }, [open, initialize])

  // Clear query when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open, setQuery])

  const handleSelect = (url: string) => {
    setOpen(false)

    // Handle special actions
    if (url === '#copy-url') {
      navigator.clipboard.writeText(window.location.href)
      return
    }

    // Navigate
    router.push(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search everything..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 text-center text-sm text-text-3">
            Loading search...
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!isLoading && !query && (
          <QuickActions onSelect={handleSelect} />
        )}

        {!isLoading && query && results.length > 0 && (
          <CommandResults results={results} onSelect={handleSelect} />
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Quick actions shown when no query
function QuickActions({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <>
      <CommandGroup heading="Navigation">
        <CommandItem onSelect={() => onSelect('/writing')}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Writing
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/library')}>
          <BookIcon className="mr-2 h-4 w-4" />
          Library
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/projects')}>
          <FolderIcon className="mr-2 h-4 w-4" />
          Projects
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/about')}>
          <UserIcon className="mr-2 h-4 w-4" />
          About
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Actions">
        <CommandItem onSelect={() => onSelect('#copy-url')}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy current URL
        </CommandItem>
        <CommandItem onSelect={() => onSelect('/feed.xml')}>
          <RssIcon className="mr-2 h-4 w-4" />
          RSS Feed
        </CommandItem>
      </CommandGroup>
    </>
  )
}

// Simple icon components (or use lucide-react)
function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
// ... other icons
```

```typescript
// /components/command/CommandResults.tsx
'use client'
import { CommandGroup, CommandItem } from '@/components/ui/command'
import type { SearchResult } from '@/lib/search/orama'

interface CommandResultsProps {
  results: SearchResult[]
  onSelect: (url: string) => void
}

const typeLabels: Record<string, string> = {
  page: 'Pages',
  essay: 'Essays',
  note: 'Notes',
  book: 'Books',
  project: 'Projects',
  action: 'Actions',
}

const typeIcons: Record<string, React.ReactNode> = {
  page: <HomeIcon className="mr-2 h-4 w-4" />,
  essay: <FileTextIcon className="mr-2 h-4 w-4" />,
  note: <PenIcon className="mr-2 h-4 w-4" />,
  book: <BookIcon className="mr-2 h-4 w-4" />,
  project: <FolderIcon className="mr-2 h-4 w-4" />,
  action: <ZapIcon className="mr-2 h-4 w-4" />,
}

export function CommandResults({ results, onSelect }: CommandResultsProps) {
  // Group results by type
  const grouped = results.reduce((acc, result) => {
    const type = result.type
    if (!acc[type]) acc[type] = []
    acc[type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Order: pages first, then essays, notes, books, projects, actions
  const typeOrder = ['page', 'essay', 'note', 'book', 'project', 'action']

  return (
    <>
      {typeOrder.map((type) => {
        const items = grouped[type]
        if (!items || items.length === 0) return null

        return (
          <CommandGroup key={type} heading={typeLabels[type]}>
            {items.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => onSelect(result.url)}
              >
                {typeIcons[type]}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.description && (
                    <span className="text-xs text-text-3 line-clamp-1">
                      {result.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )
      })}
    </>
  )
}
```

**Acceptance criteria:**
- [ ] Dialog opens centered on screen
- [ ] Search input auto-focused
- [ ] Results grouped by type
- [ ] Keyboard navigation (up/down arrows, Enter to select)
- [ ] Visual feedback on hover/focus
- [ ] Selecting item closes palette and navigates

---

### Task 3.6: Action Types Implementation

**Description:** Implement all action types: navigate, jump, filter, and system actions.

**Files to create:**
- `/lib/search/actions.ts`
- `/components/command/actions/CopyUrlAction.tsx`

**Technical approach:**

```typescript
// /lib/search/actions.ts
export type ActionType = 'navigate' | 'jump' | 'filter' | 'system'

export interface CommandAction {
  id: string
  type: ActionType
  label: string
  description?: string
  keywords?: string[]
  icon?: string
  shortcut?: string
  handler: () => void | Promise<void>
}

// System actions that don't require search
export function createSystemActions(
  router: ReturnType<typeof import('next/navigation').useRouter>,
  closePanel: () => void
): CommandAction[] {
  return [
    {
      id: 'copy-url',
      type: 'system',
      label: 'Copy current URL',
      keywords: ['share', 'link', 'clipboard'],
      handler: async () => {
        await navigator.clipboard.writeText(window.location.href)
        closePanel()
        // Could show toast notification
      },
    },
    {
      id: 'copy-citation',
      type: 'system',
      label: 'Copy citation',
      keywords: ['cite', 'reference', 'academic'],
      handler: async () => {
        const title = document.title
        const url = window.location.href
        const citation = `${title}. ${url}`
        await navigator.clipboard.writeText(citation)
        closePanel()
      },
    },
  ]
}

// Filter actions for specific content types
export function createFilterActions(
  router: ReturnType<typeof import('next/navigation').useRouter>,
  closePanel: () => void
): CommandAction[] {
  return [
    {
      id: 'filter-reading',
      type: 'filter',
      label: 'Books: Currently Reading',
      keywords: ['reading', 'books', 'current'],
      handler: () => {
        router.push('/library?status=reading')
        closePanel()
      },
    },
    {
      id: 'filter-essays-governance',
      type: 'filter',
      label: 'Essays tagged: governance',
      keywords: ['governance', 'policy', 'essays'],
      handler: () => {
        router.push('/writing?tag=governance')
        closePanel()
      },
    },
  ]
}
```

**Acceptance criteria:**
- [ ] Navigate actions go to pages
- [ ] Jump actions go to specific content items
- [ ] Filter actions apply query parameters
- [ ] System actions (copy URL) work correctly
- [ ] All actions close palette after execution

---

### Task 3.7: Mobile Bottom Sheet

**Description:** Create a mobile-optimized command palette that presents as a bottom sheet.

**Files to create:**
- `/components/command/CommandBottomSheet.tsx`
- `/components/command/MobileCommandTrigger.tsx`

**Technical approach:**

```typescript
// /components/command/CommandBottomSheet.tsx
'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandPalette } from './CommandProvider'
import { useSearch } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'

export function CommandBottomSheet() {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const { query, setQuery, results, isLoading, initialize } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      initialize()
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [open, initialize, setQuery])

  const handleSelect = (url: string) => {
    setOpen(false)
    if (url === '#copy-url') {
      navigator.clipboard.writeText(window.location.href)
      return
    }
    router.push(url)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border-1 bg-bg-1',
          'max-h-[85vh] overflow-hidden',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-12 rounded-full bg-border-2" />
        </div>

        {/* Search input */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-lg border border-border-1 bg-surface-1 px-4 py-3">
            <SearchIcon className="h-5 w-5 text-text-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search everything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-text-1 placeholder:text-text-3 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-text-3 hover:text-text-2"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-8">
          {isLoading && (
            <div className="py-8 text-center text-text-3">Loading...</div>
          )}

          {!isLoading && !query && (
            <MobileQuickActions onSelect={handleSelect} />
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-8 text-center text-text-3">No results found</div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.url)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-1 active:bg-surface-2"
                >
                  <ResultIcon type={result.type} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-text-1 truncate">
                      {result.title}
                    </div>
                    {result.description && (
                      <div className="text-sm text-text-3 truncate">
                        {result.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MobileQuickActions({ onSelect }: { onSelect: (url: string) => void }) {
  const quickLinks = [
    { label: 'Writing', url: '/writing', icon: FileTextIcon },
    { label: 'Library', url: '/library', icon: BookIcon },
    { label: 'Projects', url: '/projects', icon: FolderIcon },
    { label: 'About', url: '/about', icon: UserIcon },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {quickLinks.map((link) => (
        <button
          key={link.url}
          onClick={() => onSelect(link.url)}
          className="flex items-center gap-3 rounded-lg border border-border-1 bg-surface-1 p-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
        >
          <link.icon className="h-5 w-5 text-text-2" />
          <span className="font-medium text-text-1">{link.label}</span>
        </button>
      ))}
    </div>
  )
}
```

```typescript
// /components/command/MobileCommandTrigger.tsx
'use client'
import { useCommandPalette } from './CommandProvider'

export function MobileCommandTrigger() {
  const { setOpen } = useCommandPalette()

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-1 bg-surface-1 text-text-2 transition-colors hover:bg-surface-2 md:hidden"
      aria-label="Open search"
    >
      <SearchIcon className="h-5 w-5" />
    </button>
  )
}
```

**Acceptance criteria:**
- [ ] Bottom sheet slides up from bottom on mobile
- [ ] Backdrop closes sheet when tapped
- [ ] Handle bar for visual affordance
- [ ] Input auto-focuses on open
- [ ] Results have 44px+ tap targets
- [ ] Smooth animation (300ms slide)

---

### Task 3.8: Responsive Command Palette

**Description:** Create a wrapper component that renders the appropriate command palette based on viewport.

**Files to create:**
- `/components/command/ResponsiveCommandPalette.tsx`

**Technical approach:**

```typescript
// /components/command/ResponsiveCommandPalette.tsx
'use client'
import { useEffect, useState } from 'react'
import { CommandPalette } from './CommandPalette'
import { CommandBottomSheet } from './CommandBottomSheet'

export function ResponsiveCommandPalette() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check initial viewport
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // SSR: render nothing initially, hydrate on client
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return isMobile ? <CommandBottomSheet /> : <CommandPalette />
}
```

**Update layout to use responsive version:**

```typescript
// /app/layout.tsx
import { CommandPaletteProvider } from '@/components/command/CommandProvider'
import { ResponsiveCommandPalette } from '@/components/command/ResponsiveCommandPalette'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CommandPaletteProvider>
          <TopNav />
          {children}
          <Footer />
          <ResponsiveCommandPalette />
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
```

**Acceptance criteria:**
- [ ] Desktop (768px+) shows centered dialog
- [ ] Mobile (<768px) shows bottom sheet
- [ ] Transition between modes on resize
- [ ] No hydration mismatch errors

---

### Task 3.9: Homepage Command Bar Integration

**Description:** Wire up the command bar placeholder on the homepage to open the command palette.

**Files to modify:**
- `/app/page.tsx`

**Technical approach:**

```typescript
// /app/page.tsx
'use client'
import { useCommandPalette } from '@/components/command/CommandProvider'

export default function HomePage() {
  const { setOpen } = useCommandPalette()

  return (
    <main className="relative min-h-[calc(100vh-4rem)]">
      {/* ... existing content ... */}

      {/* Command bar - now functional */}
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mb-16 flex w-full max-w-md items-center gap-3 rounded-lg border border-border-1 bg-surface-1 px-4 py-3 text-left text-text-3 transition-colors hover:border-border-2 hover:bg-surface-2"
      >
        <SearchIcon className="h-5 w-5" />
        <span>Search everything...</span>
        <kbd className="ml-auto hidden rounded bg-surface-2 px-2 py-0.5 font-mono text-xs sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* ... mode tiles ... */}
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] Clicking command bar opens palette
- [ ] Keyboard shortcut hint visible on desktop
- [ ] Works on both desktop and mobile

---

### Task 3.10: TopNav Search Button Integration

**Description:** Connect the TopNav search button to open the command palette.

**Files to modify:**
- `/components/layout/TopNav.tsx`

**Technical approach:**

```typescript
// /components/layout/TopNav.tsx
'use client'
import { useCommandPalette } from '@/components/command/CommandProvider'
import { MobileCommandTrigger } from '@/components/command/MobileCommandTrigger'

export function TopNav() {
  const { setOpen } = useCommandPalette()

  return (
    <header className="...">
      <nav className="...">
        {/* ... logo and nav links ... */}

        <div className="flex items-center gap-4">
          {/* Desktop search button */}
          <button
            onClick={() => setOpen(true)}
            className="hidden items-center gap-2 rounded-md border border-border-1 px-3 py-1.5 text-sm text-text-3 transition-colors hover:border-border-2 hover:text-text-2 md:flex"
          >
            Search
            <kbd className="rounded bg-surface-1 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd>
          </button>

          {/* Mobile search button */}
          <MobileCommandTrigger />
        </div>
      </nav>
    </header>
  )
}
```

**Acceptance criteria:**
- [ ] Desktop button opens dialog
- [ ] Mobile button opens bottom sheet
- [ ] Both show correct visual styling

---

### Task 3.11: Recently Visited Tracking

**Description:** Track recently visited pages to boost them in search results and show as quick actions.

**Files to create:**
- `/hooks/useRecentlyVisited.ts`
- `/lib/search/recent.ts`

**Technical approach:**

```typescript
// /lib/search/recent.ts
const STORAGE_KEY = 'trey-recently-visited'
const MAX_RECENT = 5

export interface RecentItem {
  url: string
  title: string
  visitedAt: number
}

export function getRecentlyVisited(): RecentItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addRecentlyVisited(url: string, title: string): void {
  if (typeof window === 'undefined') return

  const recent = getRecentlyVisited()

  // Remove if already exists
  const filtered = recent.filter((item) => item.url !== url)

  // Add to front
  const updated = [
    { url, title, visitedAt: Date.now() },
    ...filtered,
  ].slice(0, MAX_RECENT)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearRecentlyVisited(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
```

```typescript
// /hooks/useRecentlyVisited.ts
'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getRecentlyVisited, addRecentlyVisited, type RecentItem } from '@/lib/search/recent'

export function useRecentlyVisited() {
  const pathname = usePathname()
  const [recent, setRecent] = useState<RecentItem[]>([])

  // Load recent on mount
  useEffect(() => {
    setRecent(getRecentlyVisited())
  }, [])

  // Track page visits
  useEffect(() => {
    // Don't track home page
    if (pathname === '/') return

    const title = document.title.replace(' — Trey', '')
    addRecentlyVisited(pathname, title)
    setRecent(getRecentlyVisited())
  }, [pathname])

  return recent
}
```

**Acceptance criteria:**
- [ ] Recent pages stored in localStorage
- [ ] Max 5 recent items
- [ ] Duplicates replaced, not duplicated
- [ ] Recent items shown in command palette

---

### Task 3.12: Keyboard Shortcut Hints

**Description:** Add visual hints for keyboard shortcuts throughout the interface.

**Files to create:**
- `/components/ui/kbd.tsx`

**Technical approach:**

```typescript
// /components/ui/kbd.tsx
import { cn } from '@/lib/utils'

interface KbdProps {
  children: React.ReactNode
  className?: string
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 items-center justify-center rounded border border-border-1 bg-surface-1 px-1.5 font-mono text-xs text-text-3',
        className
      )}
    >
      {children}
    </kbd>
  )
}

// Platform-aware modifier key
export function ModifierKey() {
  // This will be 'Cmd' on Mac, 'Ctrl' on Windows/Linux
  // Detected client-side
  return <Kbd>⌘</Kbd> // Simplified; could detect platform
}
```

**Acceptance criteria:**
- [ ] Kbd component styled consistently
- [ ] Shortcuts visible in nav and command palette
- [ ] Platform-appropriate modifier shown (Cmd vs Ctrl)

---

### Phase 3 Verification Checklist

Before moving to Phase 4, verify:

- [ ] `Cmd+K` / `Ctrl+K` opens command palette from any page
- [ ] Search returns relevant results in < 50ms
- [ ] Results grouped by type (pages, essays, notes, etc.)
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] Desktop dialog centered with backdrop
- [ ] Mobile bottom sheet slides up smoothly
- [ ] Clicking result navigates and closes palette
- [ ] System actions work (copy URL, RSS)
- [ ] Easter egg "powerlifting" findable via search
- [ ] Recently visited pages tracked
- [ ] Homepage command bar opens palette
- [ ] TopNav search button works on desktop and mobile
- [ ] No console errors or hydration mismatches
- [ ] Orama loads lazily (check network tab)
- [ ] Search index generated during build

---

## Phase 4: Library

**Goal:** Build the book library with cover resolution, filtering, detail views, and reading statistics dashboard.

**Dependencies:** Phase 3 complete (search index will include books)

**Estimated Effort:** L (4-6 days)

---

### Task 4.1: Books JSON Schema and Data File

**Description:** Define the book data schema and create the initial books.json data file.

**Files to create:**
- `/content/library/books.json`
- `/lib/books/types.ts`

**Technical approach:**

```typescript
// /lib/books/types.ts
export interface Book {
  // Core fields (required)
  id: string
  title: string
  author: string
  year: number

  // Identifiers
  isbn?: string
  isbn13?: string

  // Status and rating
  status: 'want' | 'reading' | 'read' | 'abandoned'
  rating?: 1 | 2 | 3 | 4 | 5
  dateRead?: string // ISO date
  dateStarted?: string // ISO date

  // Categorization
  topics: string[]
  genre?: string

  // Content
  whyILoveIt: string // Always present, short blurb
  review?: string // Optional longer review
  reviewMdxPath?: string // Path to MDX file for full review

  // Links
  amazonUrl?: string
  goodreadsUrl?: string
  bookshopUrl?: string

  // Override cover (if manual)
  coverUrl?: string

  // Computed at build time
  _computed?: {
    coverUrl: string
    sortKey: string
    slug: string
  }
}

export interface BooksData {
  books: Book[]
  lastUpdated: string
}

export type BookStatus = Book['status']
export type BookRating = NonNullable<Book['rating']>
```

```json
// /content/library/books.json
{
  "lastUpdated": "2024-01-15",
  "books": [
    {
      "id": "progress-and-poverty",
      "title": "Progress and Poverty",
      "author": "Henry George",
      "year": 1879,
      "isbn13": "9780911312584",
      "status": "read",
      "rating": 5,
      "dateRead": "2023-06-15",
      "topics": ["economics", "land", "governance", "classical-liberalism"],
      "genre": "economics",
      "whyILoveIt": "The most important book on political economy ever written. George's diagnosis of why progress creates poverty remains devastatingly relevant."
    },
    {
      "id": "the-problem-of-political-authority",
      "title": "The Problem of Political Authority",
      "author": "Michael Huemer",
      "year": 2012,
      "isbn13": "9781137281654",
      "status": "read",
      "rating": 5,
      "dateRead": "2023-08-20",
      "topics": ["philosophy", "governance", "libertarianism", "ethics"],
      "genre": "philosophy",
      "whyILoveIt": "A rigorous philosophical examination of why governments claim authority and whether those claims are justified. Changed how I think about legitimacy."
    }
  ]
}
```

**Acceptance criteria:**
- [ ] Type definitions cover all book fields
- [ ] JSON schema is valid and parseable
- [ ] Sample books added for testing
- [ ] Status and rating enums defined

---

### Task 4.2: Book Cover Resolution Pipeline

**Description:** Build a build-time pipeline to resolve book covers from multiple sources with fallback.

**Files to create:**
- `/lib/books/covers.ts`
- `/lib/books/cover-apis.ts`
- `/scripts/resolve-book-covers.ts`

**Commands:**
```bash
pnpm add sharp # For image processing
```

**Technical approach:**

```typescript
// /lib/books/cover-apis.ts
import fs from 'fs/promises'
import path from 'path'

const COVERS_DIR = './public/covers'

// Open Library API (no auth required)
export async function fetchOpenLibraryCover(isbn: string): Promise<string | null> {
  const sizes = ['L', 'M', 'S'] // Try large first

  for (const size of sizes) {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg`

    try {
      const response = await fetch(url, { method: 'HEAD' })

      // Open Library returns 200 with a 1x1 pixel for missing covers
      // Check content-length to detect this
      const contentLength = response.headers.get('content-length')
      if (response.ok && contentLength && parseInt(contentLength) > 1000) {
        return url
      }
    } catch {
      continue
    }
  }

  return null
}

// Google Books API (optional API key for higher limits)
export async function fetchGoogleBooksCover(
  isbn?: string,
  title?: string,
  author?: string
): Promise<string | null> {
  let query = ''

  if (isbn) {
    query = `isbn:${isbn}`
  } else if (title && author) {
    query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`
  } else {
    return null
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes'
  const url = apiKey
    ? `${baseUrl}?q=${query}&key=${apiKey}`
    : `${baseUrl}?q=${query}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      // Google returns http URLs, convert to https and get larger size
      let coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail
      coverUrl = coverUrl.replace('http://', 'https://')
      coverUrl = coverUrl.replace('zoom=1', 'zoom=2') // Larger image

      return coverUrl
    }
  } catch {
    return null
  }

  return null
}

// Generate placeholder SVG
export function generatePlaceholderCover(title: string, author: string): string {
  // Create a gradient based on title hash for variety
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const hue = hash % 360

  const svg = `
    <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 30%, 15%)" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360}, 30%, 25%)" />
        </linearGradient>
      </defs>
      <rect width="300" height="450" fill="url(#grad)" />
      <text x="150" y="180" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui" font-size="20" font-weight="600">
        ${escapeXml(truncate(title, 25))}
      </text>
      <text x="150" y="220" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui" font-size="14">
        ${escapeXml(truncate(author, 30))}
      </text>
    </svg>
  `.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case "'": return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '...' : str
}
```

```typescript
// /lib/books/covers.ts
import fs from 'fs/promises'
import path from 'path'
import {
  fetchOpenLibraryCover,
  fetchGoogleBooksCover,
  generatePlaceholderCover,
} from './cover-apis'
import type { Book } from './types'

const COVERS_DIR = './public/covers'
const COVER_CACHE_FILE = './.cover-cache.json'

interface CoverCache {
  [bookId: string]: {
    url: string
    resolvedAt: string
    source: 'manual' | 'openlibrary' | 'google' | 'placeholder'
  }
}

export async function resolveBookCover(book: Book): Promise<string> {
  // 1. Manual override
  if (book.coverUrl) {
    return book.coverUrl
  }

  const isbn = book.isbn13 || book.isbn

  // 2. Try Open Library
  if (isbn) {
    const olCover = await fetchOpenLibraryCover(isbn)
    if (olCover) {
      return olCover
    }
  }

  // 3. Try Google Books
  const googleCover = await fetchGoogleBooksCover(isbn, book.title, book.author)
  if (googleCover) {
    return googleCover
  }

  // 4. Generate placeholder
  return generatePlaceholderCover(book.title, book.author)
}

export async function resolveAllCovers(books: Book[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // Load existing cache
  let cache: CoverCache = {}
  try {
    const cacheData = await fs.readFile(COVER_CACHE_FILE, 'utf-8')
    cache = JSON.parse(cacheData)
  } catch {
    // No cache exists
  }

  // Process books with rate limiting
  for (const book of books) {
    // Check cache first
    if (cache[book.id] && !book.coverUrl) {
      results.set(book.id, cache[book.id].url)
      continue
    }

    console.log(`Resolving cover for: ${book.title}`)

    const coverUrl = await resolveBookCover(book)
    results.set(book.id, coverUrl)

    // Update cache
    cache[book.id] = {
      url: coverUrl,
      resolvedAt: new Date().toISOString(),
      source: book.coverUrl ? 'manual' : 'openlibrary', // Simplified
    }

    // Rate limit: wait 200ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  // Save cache
  await fs.writeFile(COVER_CACHE_FILE, JSON.stringify(cache, null, 2))

  return results
}
```

```typescript
// /scripts/resolve-book-covers.ts
import { readFileSync, writeFileSync } from 'fs'
import { resolveAllCovers } from '../lib/books/covers'
import type { BooksData } from '../lib/books/types'

async function main() {
  console.log('Resolving book covers...')

  // Load books
  const booksData: BooksData = JSON.parse(
    readFileSync('./content/library/books.json', 'utf-8')
  )

  // Resolve covers
  const covers = await resolveAllCovers(booksData.books)

  // Write cover mapping
  const coverMap = Object.fromEntries(covers)
  writeFileSync('./public/cover-map.json', JSON.stringify(coverMap, null, 2))

  console.log(`Resolved ${covers.size} book covers`)
}

main().catch(console.error)
```

**Add to build process:**
```json
{
  "scripts": {
    "covers": "tsx scripts/resolve-book-covers.ts",
    "prebuild": "pnpm covers && tsx scripts/generate-search-index.ts"
  }
}
```

**Acceptance criteria:**
- [ ] Covers resolved from Open Library by ISBN
- [ ] Fallback to Google Books API
- [ ] Placeholder generated for missing covers
- [ ] Cover URLs cached to avoid repeated API calls
- [ ] Rate limiting prevents API abuse
- [ ] Cover map written to public directory

---

### Task 4.3: Books Data Loading

**Description:** Create utilities to load and process books data with computed fields.

**Files to create:**
- `/lib/books/index.ts`
- `/lib/books/utils.ts`

**Technical approach:**

```typescript
// /lib/books/utils.ts
import type { Book, BookStatus } from './types'

export function getBookSlug(book: Book): string {
  return book.id
}

export function getBookSortKey(book: Book): string {
  // Sort by: status priority, then date read (desc), then title
  const statusPriority: Record<BookStatus, number> = {
    reading: 0,
    read: 1,
    want: 2,
    abandoned: 3,
  }

  const priority = statusPriority[book.status]
  const date = book.dateRead || book.dateStarted || '0000-00-00'

  return `${priority}-${date}-${book.title.toLowerCase()}`
}

export function filterBooks(
  books: Book[],
  filters: {
    status?: BookStatus | BookStatus[]
    rating?: number
    topic?: string
    genre?: string
    search?: string
  }
): Book[] {
  return books.filter((book) => {
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      if (!statuses.includes(book.status)) return false
    }

    // Rating filter
    if (filters.rating !== undefined) {
      if (!book.rating || book.rating < filters.rating) return false
    }

    // Topic filter
    if (filters.topic) {
      if (!book.topics.includes(filters.topic)) return false
    }

    // Genre filter
    if (filters.genre) {
      if (book.genre !== filters.genre) return false
    }

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const searchable = `${book.title} ${book.author} ${book.topics.join(' ')}`.toLowerCase()
      if (!searchable.includes(query)) return false
    }

    return true
  })
}

export function sortBooks(
  books: Book[],
  sortBy: 'date' | 'rating' | 'title' | 'author' = 'date'
): Book[] {
  return [...books].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        const dateA = a.dateRead || a.dateStarted || '0000-00-00'
        const dateB = b.dateRead || b.dateStarted || '0000-00-00'
        return dateB.localeCompare(dateA) // Descending

      case 'rating':
        return (b.rating || 0) - (a.rating || 0) // Descending

      case 'title':
        return a.title.localeCompare(b.title)

      case 'author':
        return a.author.localeCompare(b.author)

      default:
        return 0
    }
  })
}
```

```typescript
// /lib/books/index.ts
import booksData from '@/content/library/books.json'
import type { Book, BooksData } from './types'
import { getBookSlug, getBookSortKey } from './utils'

// Load cover map (generated at build time)
let coverMap: Record<string, string> = {}

export async function loadCoverMap(): Promise<void> {
  if (typeof window !== 'undefined') {
    const response = await fetch('/cover-map.json')
    coverMap = await response.json()
  }
}

export function getAllBooks(): Book[] {
  return (booksData as BooksData).books.map((book) => ({
    ...book,
    _computed: {
      coverUrl: coverMap[book.id] || `/covers/${book.id}.jpg`,
      sortKey: getBookSortKey(book),
      slug: getBookSlug(book),
    },
  }))
}

export function getBookById(id: string): Book | undefined {
  return getAllBooks().find((book) => book.id === id)
}

export function getBooksByStatus(status: Book['status']): Book[] {
  return getAllBooks().filter((book) => book.status === status)
}

export function getBooksByTopic(topic: string): Book[] {
  return getAllBooks().filter((book) => book.topics.includes(topic))
}

export function getAllTopics(): string[] {
  const topics = new Set<string>()
  getAllBooks().forEach((book) => {
    book.topics.forEach((topic) => topics.add(topic))
  })
  return Array.from(topics).sort()
}

export function getAllGenres(): string[] {
  const genres = new Set<string>()
  getAllBooks().forEach((book) => {
    if (book.genre) genres.add(book.genre)
  })
  return Array.from(genres).sort()
}

// Re-export types and utils
export * from './types'
export * from './utils'
```

**Acceptance criteria:**
- [ ] Books load from JSON file
- [ ] Computed fields (coverUrl, sortKey, slug) added
- [ ] Filter functions work correctly
- [ ] Sort functions work correctly
- [ ] Topics and genres extracted

---

### Task 4.4: BookCard Component

**Description:** Create the book card component for grid display.

**Files to create:**
- `/components/library/BookCard.tsx`

**Technical approach:**

```typescript
// /components/library/BookCard.tsx
'use client'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Book } from '@/lib/books/types'

interface BookCardProps {
  book: Book
  coverUrl: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const statusColors: Record<Book['status'], string> = {
  reading: 'bg-warm',
  read: 'bg-success',
  want: 'bg-accent',
  abandoned: 'bg-text-3',
}

const sizeClasses = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40',
}

export function BookCard({ book, coverUrl, onClick, size = 'md' }: BookCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col text-left transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-warm focus:ring-offset-2 focus:ring-offset-bg-1',
        sizeClasses[size]
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-border-1 bg-surface-1">
        <Image
          src={coverUrl}
          alt={`Cover of ${book.title}`}
          fill
          sizes={size === 'sm' ? '96px' : size === 'md' ? '128px' : '160px'}
          className="object-cover transition-opacity group-hover:opacity-90"
        />

        {/* Status indicator */}
        <div
          className={cn(
            'absolute right-2 top-2 h-2 w-2 rounded-full',
            statusColors[book.status]
          )}
          title={book.status}
        />

        {/* Rating overlay on hover */}
        {book.rating && (
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="pb-3 text-sm font-medium text-white">
              {'★'.repeat(book.rating)}
              {'☆'.repeat(5 - book.rating)}
            </div>
          </div>
        )}
      </div>

      {/* Title and author */}
      <div className="mt-2 space-y-0.5">
        <h3 className="line-clamp-2 text-sm font-medium text-text-1 group-hover:text-warm">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-text-3">
          {book.author}
        </p>
      </div>
    </button>
  )
}
```

**Acceptance criteria:**
- [ ] Cover image displays with correct aspect ratio
- [ ] Status indicator visible
- [ ] Rating shows on hover
- [ ] Title and author truncate properly
- [ ] Three size variants work
- [ ] Hover state with scale transform
- [ ] Accessible focus state

---

### Task 4.5: BookshelfGrid Component

**Description:** Create the responsive grid layout for displaying books.

**Files to create:**
- `/components/library/BookshelfGrid.tsx`

**Technical approach:**

```typescript
// /components/library/BookshelfGrid.tsx
'use client'
import { useState, useEffect } from 'react'
import { BookCard } from './BookCard'
import { loadCoverMap } from '@/lib/books'
import type { Book } from '@/lib/books/types'

interface BookshelfGridProps {
  books: Book[]
  onBookClick?: (book: Book) => void
}

export function BookshelfGrid({ books, onBookClick }: BookshelfGridProps) {
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCovers() {
      try {
        const response = await fetch('/cover-map.json')
        const covers = await response.json()
        setCoverMap(covers)
      } catch (error) {
        console.error('Failed to load cover map:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCovers()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded-lg bg-surface-1" />
            <div className="mt-2 h-4 w-3/4 rounded bg-surface-1" />
            <div className="mt-1 h-3 w-1/2 rounded bg-surface-1" />
          </div>
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-3">No books match your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          coverUrl={coverMap[book.id] || book.coverUrl || '/covers/placeholder.svg'}
          onClick={() => onBookClick?.(book)}
        />
      ))}
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] Responsive grid (3 cols on mobile, up to 7 on desktop)
- [ ] Loading skeleton while covers load
- [ ] Empty state for no results
- [ ] Click handler passed to cards
- [ ] Cover map loaded client-side

---

### Task 4.6: BookDetailPanel Component

**Description:** Create the slide-over panel or modal for book details.

**Files to create:**
- `/components/library/BookDetailPanel.tsx`

**Technical approach:**

```typescript
// /components/library/BookDetailPanel.tsx
'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Book } from '@/lib/books/types'

interface BookDetailPanelProps {
  book: Book | null
  coverUrl: string
  isOpen: boolean
  onClose: () => void
  relatedEssays?: { slug: string; title: string }[]
}

export function BookDetailPanel({
  book,
  coverUrl,
  isOpen,
  onClose,
  relatedEssays = [],
}: BookDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !book) return null

  const statusLabels: Record<Book['status'], string> = {
    reading: 'Currently Reading',
    read: 'Finished',
    want: 'Want to Read',
    abandoned: 'Abandoned',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border-1 bg-bg-1',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-1 bg-bg-1 px-6 py-4">
          <h2 className="font-satoshi text-lg font-medium text-text-1">
            Book Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-3 transition-colors hover:bg-surface-1 hover:text-text-2"
            aria-label="Close panel"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cover and basic info */}
          <div className="flex gap-6">
            <div className="w-32 flex-shrink-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border-1">
                <Image
                  src={coverUrl}
                  alt={`Cover of ${book.title}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-satoshi text-2xl font-medium text-text-1">
                {book.title}
              </h3>
              <p className="mt-1 text-lg text-text-2">{book.author}</p>
              <p className="mt-1 text-sm text-text-3">{book.year}</p>

              {/* Rating */}
              {book.rating && (
                <div className="mt-3 text-warm">
                  {'★'.repeat(book.rating)}
                  {'☆'.repeat(5 - book.rating)}
                </div>
              )}

              {/* Status badge */}
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full border border-border-1 px-3 py-1 text-sm text-text-2">
                  {statusLabels[book.status]}
                </span>
              </div>

              {book.dateRead && (
                <p className="mt-2 text-sm text-text-3">
                  Finished: {formatDate(book.dateRead)}
                </p>
              )}
            </div>
          </div>

          {/* Why I Love It */}
          <div className="mt-8">
            <h4 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
              Why I Love It
            </h4>
            <p className="mt-2 text-text-2 leading-relaxed">
              {book.whyILoveIt}
            </p>
          </div>

          {/* Topics */}
          {book.topics.length > 0 && (
            <div className="mt-8">
              <h4 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
                Topics
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {book.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-border-1 px-3 py-1 text-sm text-text-2"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review (if exists) */}
          {book.review && (
            <div className="mt-8">
              <h4 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
                Full Review
              </h4>
              <p className="mt-2 text-text-2 leading-relaxed">
                {book.review}
              </p>
            </div>
          )}

          {/* Related Essays */}
          {relatedEssays.length > 0 && (
            <div className="mt-8">
              <h4 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
                Related Essays
              </h4>
              <ul className="mt-2 space-y-2">
                {relatedEssays.map((essay) => (
                  <li key={essay.slug}>
                    <Link
                      href={`/writing/${essay.slug}`}
                      className="text-warm hover:underline"
                      onClick={onClose}
                    >
                      {essay.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Buy Links */}
          <div className="mt-8 flex flex-wrap gap-3">
            {book.amazonUrl && (
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-1"
              >
                Amazon
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
            {book.bookshopUrl && (
              <a
                href={book.bookshopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-1"
              >
                Bookshop.org
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
            {book.goodreadsUrl && (
              <a
                href={book.goodreadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border-1 px-4 py-2 text-sm text-text-2 transition-colors hover:bg-surface-1"
              >
                Goodreads
                <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
```

**Acceptance criteria:**
- [ ] Slide-over panel from right
- [ ] Shows cover, title, author, year
- [ ] Rating displayed as stars
- [ ] Status badge visible
- [ ] "Why I Love It" blurb shown
- [ ] Topics displayed as pills
- [ ] Related essays linked
- [ ] Buy links (Amazon, Bookshop, Goodreads)
- [ ] Escape key closes panel
- [ ] Backdrop click closes panel
- [ ] Body scroll locked when open

---

### Task 4.7: Library Filters Component

**Description:** Create the filter controls for status, rating, and topics.

**Files to create:**
- `/components/library/LibraryFilters.tsx`

**Technical approach:**

```typescript
// /components/library/LibraryFilters.tsx
'use client'
import { cn } from '@/lib/utils'
import type { BookStatus } from '@/lib/books/types'

interface LibraryFiltersProps {
  // Status filter
  selectedStatus: BookStatus | 'all'
  onStatusChange: (status: BookStatus | 'all') => void

  // Rating filter
  minRating: number | null
  onRatingChange: (rating: number | null) => void

  // Topic filter
  selectedTopic: string | null
  onTopicChange: (topic: string | null) => void
  availableTopics: string[]

  // Counts
  counts: {
    all: number
    reading: number
    read: number
    want: number
    abandoned: number
  }
}

const statusOptions: { value: BookStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Books' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'want', label: 'Want to Read' },
  { value: 'abandoned', label: 'Abandoned' },
]

export function LibraryFilters({
  selectedStatus,
  onStatusChange,
  minRating,
  onRatingChange,
  selectedTopic,
  onTopicChange,
  availableTopics,
  counts,
}: LibraryFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => {
          const count = option.value === 'all' ? counts.all : counts[option.value]
          const isActive = selectedStatus === option.value

          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                isActive
                  ? 'border-warm bg-warm/10 text-warm'
                  : 'border-border-1 text-text-3 hover:border-border-2 hover:text-text-2'
              )}
            >
              {option.label}
              <span className="ml-2 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Rating filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-3">Min rating:</span>
          <div className="flex gap-1">
            {[null, 3, 4, 5].map((rating) => (
              <button
                key={rating ?? 'any'}
                onClick={() => onRatingChange(rating)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm transition-colors',
                  minRating === rating
                    ? 'bg-surface-2 text-text-1'
                    : 'text-text-3 hover:bg-surface-1 hover:text-text-2'
                )}
              >
                {rating === null ? 'Any' : `${rating}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Topic filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-3">Topic:</span>
          <select
            value={selectedTopic || ''}
            onChange={(e) => onTopicChange(e.target.value || null)}
            className="rounded-md border border-border-1 bg-surface-1 px-3 py-1.5 text-sm text-text-2 focus:border-warm focus:outline-none"
          >
            <option value="">All topics</option>
            {availableTopics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(selectedStatus !== 'all' || minRating !== null || selectedTopic !== null) && (
          <button
            onClick={() => {
              onStatusChange('all')
              onRatingChange(null)
              onTopicChange(null)
            }}
            className="text-sm text-text-3 hover:text-text-2"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] Status filter with counts
- [ ] Rating filter (Any, 3+, 4+, 5)
- [ ] Topic dropdown filter
- [ ] Clear all filters button
- [ ] Active states visually distinct
- [ ] Counts update with selections

---

### Task 4.8: Reading Stats Dashboard

**Description:** Build the reading statistics section with visualizations.

**Files to create:**
- `/components/library/ReadingStats.tsx`
- `/components/library/charts/BooksPerYearChart.tsx`
- `/components/library/charts/TopicsBreakdown.tsx`
- `/components/library/charts/RatingDistribution.tsx`

**Commands:**
```bash
pnpm add recharts
```

**Technical approach:**

```typescript
// /components/library/ReadingStats.tsx
'use client'
import { useMemo } from 'react'
import { BooksPerYearChart } from './charts/BooksPerYearChart'
import { TopicsBreakdown } from './charts/TopicsBreakdown'
import { RatingDistribution } from './charts/RatingDistribution'
import type { Book } from '@/lib/books/types'

interface ReadingStatsProps {
  books: Book[]
}

export function ReadingStats({ books }: ReadingStatsProps) {
  const stats = useMemo(() => {
    const readBooks = books.filter((b) => b.status === 'read')
    const readingBooks = books.filter((b) => b.status === 'reading')
    const wantBooks = books.filter((b) => b.status === 'want')

    // Books per year
    const booksPerYear = readBooks.reduce((acc, book) => {
      if (book.dateRead) {
        const year = new Date(book.dateRead).getFullYear()
        acc[year] = (acc[year] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)

    // Topic breakdown
    const topicCounts = readBooks.reduce((acc, book) => {
      book.topics.forEach((topic) => {
        acc[topic] = (acc[topic] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    // Rating distribution
    const ratingCounts = readBooks.reduce((acc, book) => {
      if (book.rating) {
        acc[book.rating] = (acc[book.rating] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)

    // Average rating
    const ratedBooks = readBooks.filter((b) => b.rating)
    const avgRating = ratedBooks.length > 0
      ? ratedBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBooks.length
      : 0

    return {
      totalRead: readBooks.length,
      currentlyReading: readingBooks.length,
      wantToRead: wantBooks.length,
      booksPerYear,
      topicCounts,
      ratingCounts,
      avgRating,
    }
  }, [books])

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Books Read" value={stats.totalRead} />
        <StatCard label="Currently Reading" value={stats.currentlyReading} />
        <StatCard label="Want to Read" value={stats.wantToRead} />
        <StatCard label="Average Rating" value={stats.avgRating.toFixed(1)} suffix="★" />
      </div>

      {/* Charts */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
          <h3 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
            Books per Year
          </h3>
          <BooksPerYearChart data={stats.booksPerYear} />
        </div>

        <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
          <h3 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
            Rating Distribution
          </h3>
          <RatingDistribution data={stats.ratingCounts} />
        </div>
      </div>

      <div className="rounded-lg border border-border-1 bg-surface-1 p-6">
        <h3 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
          Topics Breakdown
        </h3>
        <TopicsBreakdown data={stats.topicCounts} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: number | string
  suffix?: string
}) {
  return (
    <div className="rounded-lg border border-border-1 bg-surface-1 p-4">
      <p className="text-sm text-text-3">{label}</p>
      <p className="mt-1 font-satoshi text-3xl font-medium text-text-1">
        {value}
        {suffix && <span className="text-warm">{suffix}</span>}
      </p>
    </div>
  )
}
```

```typescript
// /components/library/charts/BooksPerYearChart.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface BooksPerYearChartProps {
  data: Record<number, number>
}

export function BooksPerYearChart({ data }: BooksPerYearChartProps) {
  const chartData = Object.entries(data)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year)

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-text-3">No data yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="year"
          tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0B1020',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.92)' }}
          itemStyle={{ color: '#FFB86B' }}
        />
        <Bar dataKey="count" fill="#FFB86B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

```typescript
// /components/library/charts/RatingDistribution.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface RatingDistributionProps {
  data: Record<number, number>
}

export function RatingDistribution({ data }: RatingDistributionProps) {
  const chartData = [1, 2, 3, 4, 5].map((rating) => ({
    rating: '★'.repeat(rating),
    count: data[rating] || 0,
    value: rating,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical">
        <XAxis
          type="number"
          tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          type="category"
          dataKey="rating"
          tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0B1020',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.value >= 4 ? '#FFB86B' : 'rgba(255,255,255,0.2)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

```typescript
// /components/library/charts/TopicsBreakdown.tsx
'use client'

interface TopicsBreakdownProps {
  data: Record<string, number>
}

export function TopicsBreakdown({ data }: TopicsBreakdownProps) {
  const sortedTopics = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10 topics

  const maxCount = Math.max(...sortedTopics.map(([, count]) => count))

  if (sortedTopics.length === 0) {
    return <p className="py-8 text-center text-text-3">No data yet</p>
  }

  return (
    <div className="space-y-3">
      {sortedTopics.map(([topic, count]) => (
        <div key={topic} className="flex items-center gap-3">
          <span className="w-32 truncate text-sm text-text-2">{topic}</span>
          <div className="flex-1">
            <div className="h-4 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-warm transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-8 text-right text-sm text-text-3">{count}</span>
        </div>
      ))}
    </div>
  )
}
```

**Acceptance criteria:**
- [ ] Summary cards show totals
- [ ] Books per year bar chart
- [ ] Rating distribution horizontal bars
- [ ] Topics breakdown with progress bars
- [ ] Charts styled to match dark theme
- [ ] Responsive on mobile
- [ ] Recharts lazy-loaded

---

### Task 4.9: Library Page

**Description:** Assemble the library page with all components.

**Files to create:**
- `/app/library/page.tsx`

**Technical approach:**

```typescript
// /app/library/page.tsx
'use client'
import { useState, useMemo } from 'react'
import { getAllBooks, getAllTopics, filterBooks, sortBooks } from '@/lib/books'
import { BookshelfGrid } from '@/components/library/BookshelfGrid'
import { BookDetailPanel } from '@/components/library/BookDetailPanel'
import { LibraryFilters } from '@/components/library/LibraryFilters'
import { ReadingStats } from '@/components/library/ReadingStats'
import type { Book, BookStatus } from '@/lib/books/types'

export default function LibraryPage() {
  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | 'all'>('all')
  const [minRating, setMinRating] = useState<number | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // Panel state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [coverMap, setCoverMap] = useState<Record<string, string>>({})

  // View state
  const [view, setView] = useState<'grid' | 'stats'>('grid')

  // Data
  const allBooks = useMemo(() => getAllBooks(), [])
  const allTopics = useMemo(() => getAllTopics(), [])

  // Filtered books
  const filteredBooks = useMemo(() => {
    let books = allBooks

    if (selectedStatus !== 'all') {
      books = filterBooks(books, { status: selectedStatus })
    }
    if (minRating !== null) {
      books = filterBooks(books, { rating: minRating })
    }
    if (selectedTopic) {
      books = filterBooks(books, { topic: selectedTopic })
    }

    return sortBooks(books, 'date')
  }, [allBooks, selectedStatus, minRating, selectedTopic])

  // Counts for filters
  const counts = useMemo(() => ({
    all: allBooks.length,
    reading: allBooks.filter((b) => b.status === 'reading').length,
    read: allBooks.filter((b) => b.status === 'read').length,
    want: allBooks.filter((b) => b.status === 'want').length,
    abandoned: allBooks.filter((b) => b.status === 'abandoned').length,
  }), [allBooks])

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-satoshi text-4xl font-medium text-text-1">
              Library
            </h1>
            <p className="mt-2 text-lg text-text-2">
              Books that shaped my thinking.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border-1 p-1">
            <button
              onClick={() => setView('grid')}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                view === 'grid'
                  ? 'bg-surface-2 text-text-1'
                  : 'text-text-3 hover:text-text-2'
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setView('stats')}
              className={`rounded-md px-4 py-2 text-sm transition-colors ${
                view === 'stats'
                  ? 'bg-surface-2 text-text-1'
                  : 'text-text-3 hover:text-text-2'
              }`}
            >
              Stats
            </button>
          </div>
        </div>
      </header>

      {view === 'grid' ? (
        <>
          {/* Filters */}
          <div className="mb-8">
            <LibraryFilters
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              minRating={minRating}
              onRatingChange={setMinRating}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              availableTopics={allTopics}
              counts={counts}
            />
          </div>

          {/* Book grid */}
          <BookshelfGrid
            books={filteredBooks}
            onBookClick={setSelectedBook}
          />
        </>
      ) : (
        <ReadingStats books={allBooks} />
      )}

      {/* Book detail panel */}
      <BookDetailPanel
        book={selectedBook}
        coverUrl={selectedBook ? coverMap[selectedBook.id] || '' : ''}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </main>
  )
}
```

**Metadata (add via generateMetadata or layout):**
```typescript
export const metadata = {
  title: 'Library — Trey',
  description: 'Books that shaped my thinking on governance, economics, and philosophy.',
}
```

**Acceptance criteria:**
- [ ] Grid view shows all books
- [ ] Stats view shows dashboard
- [ ] Filters work correctly
- [ ] Book detail panel opens on click
- [ ] View toggle switches between grid and stats
- [ ] URL query params for filters (optional)

---

### Task 4.10: Connect Books to Essays

**Description:** Create relationships between books and essays based on shared topics.

**Files to create:**
- `/lib/books/relations.ts`

**Technical approach:**

```typescript
// /lib/books/relations.ts
import { allEssays } from 'content-collections'
import { getAllBooks } from '@/lib/books'
import type { Book } from '@/lib/books/types'

interface RelatedEssay {
  slug: string
  title: string
  relevanceScore: number
}

export function getRelatedEssays(book: Book): RelatedEssay[] {
  const bookTopics = new Set(book.topics.map((t) => t.toLowerCase()))

  const related: RelatedEssay[] = []

  for (const essay of allEssays) {
    if (essay.status === 'draft') continue

    const essayTags = new Set(essay.tags.map((t) => t.toLowerCase()))

    // Calculate overlap
    const overlap = [...bookTopics].filter((topic) => essayTags.has(topic))

    if (overlap.length > 0) {
      related.push({
        slug: essay.slug,
        title: essay.title,
        relevanceScore: overlap.length,
      })
    }
  }

  // Sort by relevance and return top 5
  return related
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5)
}

export function getBooksForEssay(essayTags: string[]): Book[] {
  const tags = new Set(essayTags.map((t) => t.toLowerCase()))
  const books = getAllBooks()

  return books
    .filter((book) => {
      const bookTopics = book.topics.map((t) => t.toLowerCase())
      return bookTopics.some((topic) => tags.has(topic))
    })
    .slice(0, 5)
}
```

**Update BookDetailPanel to use relations:**
```typescript
// In BookDetailPanel, fetch related essays
const relatedEssays = useMemo(
  () => (book ? getRelatedEssays(book) : []),
  [book]
)
```

**Acceptance criteria:**
- [ ] Books show related essays in detail panel
- [ ] Essays can show related books (optional)
- [ ] Matching based on topic/tag overlap
- [ ] Limited to top 5 results

---

### Task 4.11: Add Books to Search Index

**Description:** Include books in the search index for command palette.

**Files to modify:**
- `/lib/search/generate-index.ts`

**Technical approach:**

```typescript
// Add to /lib/search/generate-index.ts

import booksData from '@/content/library/books.json'

// In generateSearchIndex():

// Add books
for (const book of booksData.books) {
  documents.push({
    id: `book-${book.id}`,
    type: 'book',
    title: book.title,
    description: `${book.author} • ${book.whyILoveIt.slice(0, 100)}`,
    tags: book.topics,
    url: `/library?book=${book.id}`, // Or could open panel directly
    keywords: [book.author, book.genre, ...book.topics],
    priority: book.status === 'read' && book.rating === 5 ? 7 : 5,
  })
}
```

**Acceptance criteria:**
- [ ] Books appear in search results
- [ ] Book title, author searchable
- [ ] Topics searchable
- [ ] Clicking result opens library with book

---

### Task 4.12: Sample Books Data

**Description:** Add more sample books to test the library.

**Files to modify:**
- `/content/library/books.json`

**Add 10-15 sample books across different statuses and ratings to test:**
- Multiple "read" books with ratings
- At least one "currently reading"
- A few "want to read"
- Books across different topics
- Books from different years

**Acceptance criteria:**
- [ ] 10+ sample books in data file
- [ ] Mix of statuses represented
- [ ] Mix of ratings represented
- [ ] Multiple topics covered
- [ ] Stats dashboard has meaningful data

---

### Phase 4 Verification Checklist

Before moving to Phase 5, verify:

- [ ] Books JSON schema defined and validated
- [ ] Cover resolution pipeline works (Open Library → Google → placeholder)
- [ ] Cover cache prevents repeated API calls
- [ ] BookCard displays correctly with all states
- [ ] BookshelfGrid responsive (3-7 columns)
- [ ] BookDetailPanel shows all book info
- [ ] Filters work (status, rating, topic)
- [ ] Filter counts update correctly
- [ ] Reading stats dashboard displays
- [ ] Charts render with correct data
- [ ] Books appear in search results
- [ ] Related essays shown in book detail
- [ ] View toggle works (grid/stats)
- [ ] Mobile layout works
- [ ] No console errors
- [ ] Recharts bundle lazy-loaded

---

## Phase 5: Newsletter + Polish

**Goal:** Complete the site with newsletter integration, accessibility compliance, performance optimization, easter eggs, and final polish.

**Dependencies:** Phases 1-4 complete (all core features built)

**Estimated Effort:** L (4-6 days)

---

### Task 5.1: Buttondown Account Setup

**Description:** Set up Buttondown account and configure API access.

**External steps (manual):**
1. Create account at buttondown.email
2. Configure newsletter settings (name, description, from address)
3. Set up custom domain (optional, for branded emails)
4. Generate API key from Settings > API
5. Add API key to environment variables

**Files to create/modify:**
- `/.env.local` (add `BUTTONDOWN_API_KEY`)
- `/.env.example` (document required variables)

**Environment variables:**
```bash
# /.env.local
BUTTONDOWN_API_KEY=your-api-key-here

# Optional: for RSS-to-email
# TODO: Replace with actual domain before deploy
NEXT_PUBLIC_SITE_URL=https://SITE_DOMAIN
```

**Acceptance criteria:**
- [ ] Buttondown account created
- [ ] API key generated and stored securely
- [ ] Environment variables documented

---

### Task 5.2: Subscribe API Route

**Description:** Create the server-side API route that handles newsletter subscriptions.

**Files to create:**
- `/app/api/subscribe/route.ts`

**Technical approach:**

```typescript
// /app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY

interface ButtondownError {
  detail?: string
  email?: string[]
}

export async function POST(request: NextRequest) {
  // Validate API key exists
  if (!BUTTONDOWN_API_KEY) {
    console.error('BUTTONDOWN_API_KEY not configured')
    return NextResponse.json(
      { error: 'Newsletter service not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Call Buttondown API
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: ['website'],
      }),
    })

    // Handle Buttondown response
    if (response.status === 201) {
      return NextResponse.json(
        { message: 'Success! Check your inbox to confirm.' },
        { status: 201 }
      )
    }

    if (response.status === 400) {
      const errorData: ButtondownError = await response.json()

      // Check for already subscribed
      if (errorData.email?.some((e) => e.includes('already subscribed'))) {
        return NextResponse.json(
          { error: 'You are already subscribed!' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: errorData.detail || 'Invalid email' },
        { status: 400 }
      )
    }

    // Rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

**Acceptance criteria:**
- [ ] POST endpoint accepts email
- [ ] Validates email format
- [ ] Calls Buttondown API
- [ ] Handles success (201)
- [ ] Handles already subscribed
- [ ] Handles rate limiting
- [ ] Returns appropriate error messages

---

### Task 5.3: Subscribe Page

**Description:** Create the dedicated `/subscribe` page with a custom form.

**Files to create:**
- `/app/subscribe/page.tsx`
- `/components/newsletter/SubscribeForm.tsx`

**Technical approach:**

```typescript
// /app/subscribe/page.tsx
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'

export const metadata = {
  title: 'Subscribe — Trey',
  description: 'Get essays on governance, technology, and institutional innovation delivered to your inbox.',
}

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <div className="text-center mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Subscribe
        </h1>
        <p className="text-lg text-text-2">
          Get new essays delivered to your inbox. No spam, unsubscribe anytime.
        </p>
      </div>

      <SubscribeForm />

      <div className="mt-12 text-center">
        <h2 className="font-satoshi text-sm font-medium uppercase tracking-wider text-text-3 mb-4">
          What you'll get
        </h2>
        <ul className="space-y-3 text-text-2">
          <li>New essays on governance and institutional innovation</li>
          <li>Occasional notes and dispatches</li>
          <li>Early access to projects and ideas</li>
        </ul>
      </div>

      <p className="mt-12 text-center text-sm text-text-3">
        Your email is safe. I never share subscriber data and you can unsubscribe with one click.
        Powered by{' '}
        <a
          href="https://buttondown.email"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-2 hover:text-warm"
        >
          Buttondown
        </a>
        .
      </p>
    </main>
  )
}
```

```typescript
// /components/newsletter/SubscribeForm.tsx
'use client'
import { useState, FormEvent } from 'react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Success! Check your inbox.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className={cn(
        'rounded-lg border border-success/30 bg-success/10 p-6 text-center',
        compact && 'p-4'
      )}>
        <p className="font-medium text-success">
          {message}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={cn(
        'flex gap-3',
        compact ? 'flex-col sm:flex-row' : 'flex-col'
      )}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={status === 'loading'}
          className={cn(
            'flex-1 rounded-lg border border-border-1 bg-surface-1 px-4 py-3 text-text-1 placeholder:text-text-3',
            'focus:border-warm focus:outline-none focus:ring-1 focus:ring-warm',
            'disabled:opacity-50',
            compact && 'py-2'
          )}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'rounded-lg bg-warm px-6 py-3 font-medium text-bg-1 transition-colors',
            'hover:bg-warm/90 focus:outline-none focus:ring-2 focus:ring-warm focus:ring-offset-2 focus:ring-offset-bg-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            compact && 'py-2 px-4'
          )}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </div>

      {status === 'error' && message && (
        <p className="text-sm text-error">{message}</p>
      )}
    </form>
  )
}
```

**Acceptance criteria:**
- [ ] Page renders with form
- [ ] Form validates email
- [ ] Loading state during submission
- [ ] Success state with confirmation message
- [ ] Error state with message
- [ ] Privacy note visible
- [ ] Compact variant for embedding

---

### Task 5.4: Newsletter CTA in Essay Footer

**Description:** Add newsletter signup CTA to essay footers.

**Files to modify:**
- `/app/writing/[slug]/page.tsx`

**Technical approach:**

Replace the placeholder newsletter CTA in essay footer:

```typescript
// In /app/writing/[slug]/page.tsx footer section
import { SubscribeForm } from '@/components/newsletter/SubscribeForm'

// Replace the placeholder div with:
<div className="rounded-lg border border-border-1 bg-surface-1 p-6">
  <h3 className="font-satoshi text-lg font-medium text-text-1 mb-2">
    Enjoyed this essay?
  </h3>
  <p className="text-sm text-text-2 mb-4">
    Subscribe to get new essays delivered to your inbox.
  </p>
  <SubscribeForm compact />
</div>
```

**Acceptance criteria:**
- [ ] CTA appears at bottom of every essay
- [ ] Uses compact form variant
- [ ] Styled consistently with site
- [ ] Works independently on each essay page

---

### Task 5.5: Accessibility Audit and Fixes

**Description:** Conduct thorough accessibility audit and fix any issues.

**Tools to use:**
- axe DevTools browser extension
- Lighthouse accessibility audit
- Manual keyboard navigation testing
- VoiceOver (macOS) / NVDA (Windows) testing

**Checklist of items to verify/fix:**

**Keyboard Navigation:**
- [ ] All interactive elements focusable
- [ ] Focus order logical (follows visual order)
- [ ] Skip link to main content
- [ ] Command palette fully keyboard accessible
- [ ] Modal/panel focus trapping
- [ ] Escape closes modals

**Focus States:**
- [ ] All focusable elements have visible focus indicator
- [ ] Focus indicators use design system (warm accent ring)
- [ ] Focus not lost when content updates

**Screen Reader:**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have accessible names
- [ ] Landmarks used correctly (header, main, nav, footer)
- [ ] Headings hierarchy correct (h1 > h2 > h3)
- [ ] Live regions for dynamic content (search results)

**Color and Contrast:**
- [ ] Text meets 4.5:1 contrast ratio
- [ ] UI elements meet 3:1 contrast ratio
- [ ] Information not conveyed by color alone

**Motion:**
- [ ] `prefers-reduced-motion` honored
- [ ] No auto-playing animations
- [ ] Animations can be paused/stopped

**Files to create:**
- `/components/a11y/SkipLink.tsx`

```typescript
// /components/a11y/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-warm focus:px-4 focus:py-2 focus:text-bg-1 focus:outline-none"
    >
      Skip to main content
    </a>
  )
}
```

Add to layout:
```typescript
// /app/layout.tsx
<body>
  <SkipLink />
  {/* ... rest of layout */}
  <main id="main-content">
    {children}
  </main>
</body>
```

**Acceptance criteria:**
- [ ] axe DevTools reports 0 critical/serious issues
- [ ] Lighthouse accessibility score 90+
- [ ] Full keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Skip link works
- [ ] All contrast ratios pass

---

### Task 5.6: Performance Optimization

**Description:** Optimize site to meet performance targets.

**Targets:**
- Lighthouse Performance: 90+ (mobile)
- LCP: < 2.5s
- CLS: < 0.1
- INP: < 200ms
- First Load JS: < 100KB

**Optimization checklist:**

**Bundle Size:**
- [ ] Analyze bundle with `@next/bundle-analyzer`
- [ ] Lazy load heavy components (Recharts, Sigma.js, Orama)
- [ ] Code split by route
- [ ] Remove unused dependencies
- [ ] Tree shake imports

**Images:**
- [ ] All images use next/image
- [ ] Proper sizing with `sizes` attribute
- [ ] WebP/AVIF formats via Next.js
- [ ] Lazy load below-fold images
- [ ] Book covers properly sized

**Fonts:**
- [ ] Fonts preloaded
- [ ] Font subsetting (Latin only)
- [ ] `font-display: swap`
- [ ] No FOUT/FOIT

**JavaScript:**
- [ ] Defer non-critical JS
- [ ] No blocking scripts
- [ ] Service worker for caching (optional)

**CSS:**
- [ ] Purge unused Tailwind classes
- [ ] Critical CSS inlined (Next.js handles)
- [ ] No render-blocking CSS

**Commands:**
```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

# Run analysis
ANALYZE=true pnpm build
```

**Files to modify:**
- `/next.config.ts` (add bundle analyzer, optimize config)

```typescript
// /next.config.ts
import { withContentCollections } from '@content-collections/next'

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { hostname: 'covers.openlibrary.org' },
      { hostname: 'books.google.com' },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
}

export default withContentCollections(nextConfig)
```

**Acceptance criteria:**
- [ ] Lighthouse Performance 90+ on mobile
- [ ] First Load JS < 100KB (check build output)
- [ ] LCP < 2.5s on 3G throttling
- [ ] CLS < 0.1
- [ ] No layout shifts from images/fonts

---

### Task 5.7: Motion Tuning

**Description:** Fine-tune all animations and verify reduced motion behavior.

**Files to review/modify:**
- `/lib/motion.ts`
- All components using Motion for React
- CSS transitions in globals.css

**Motion inventory:**

| Element | Normal Motion | Reduced Motion |
|---------|---------------|----------------|
| Page transitions | Fade (200ms) | Instant |
| Command palette open | Scale + fade (150ms) | Instant |
| Bottom sheet | Slide up (300ms) | Instant |
| Book detail panel | Slide right (300ms) | Instant |
| Card hovers | Scale (150ms) | Preserved |
| Focus states | Outline transition | Preserved |
| TOC highlight | Color transition | Preserved |

**Technical approach:**

Create motion wrapper component:

```typescript
// /components/motion/MotionWrapper.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface MotionWrapperProps {
  children: React.ReactNode
  className?: string
}

export function FadeIn({ children, className }: MotionWrapperProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
```

**Acceptance criteria:**
- [ ] All animations feel purposeful, not decorative
- [ ] Animation durations consistent (150-300ms)
- [ ] Reduced motion setting disables animations
- [ ] Essential feedback preserved (focus, hover)
- [ ] No janky or stuttering animations

---

### Task 5.8: Konami Code Easter Egg

**Description:** Implement the Konami code easter egg.

**Files to create:**
- `/hooks/useKonamiCode.ts`
- `/components/easter-eggs/KonamiEffect.tsx`

**Technical approach:**

```typescript
// /hooks/useKonamiCode.ts
'use client'
import { useEffect, useState, useCallback } from 'react'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
]

export function useKonamiCode(callback: () => void) {
  const [index, setIndex] = useState(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const expectedKey = KONAMI_CODE[index]

    if (event.code === expectedKey) {
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
  }, [index, callback])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
```

```typescript
// /components/easter-eggs/KonamiEffect.tsx
'use client'
import { useState } from 'react'
import { useKonamiCode } from '@/hooks/useKonamiCode'

export function KonamiEffect() {
  const [activated, setActivated] = useState(false)

  useKonamiCode(() => {
    setActivated(true)
    // Could trigger various effects:
    // - Confetti
    // - Retro mode
    // - Secret message
    // - Unlock hidden content

    // Auto-dismiss after 5 seconds
    setTimeout(() => setActivated(false), 5000)
  })

  if (!activated) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <p className="font-mono text-4xl text-warm mb-4">
          🎮 KONAMI CODE ACTIVATED! 🎮
        </p>
        <p className="text-text-2">
          You found the secret. Here's a virtual high five. ✋
        </p>
        <button
          onClick={() => setActivated(false)}
          className="mt-6 rounded-lg border border-border-1 px-4 py-2 text-text-2 hover:bg-surface-1"
        >
          Nice!
        </button>
      </div>
    </div>
  )
}
```

Add to layout:
```typescript
// /app/layout.tsx
import { KonamiEffect } from '@/components/easter-eggs/KonamiEffect'

// Inside body:
<KonamiEffect />
```

**Acceptance criteria:**
- [ ] Konami code sequence detected
- [ ] Effect triggers on completion
- [ ] Effect dismisses automatically or on click
- [ ] Works on desktop (keyboard)
- [ ] Doesn't interfere with normal usage

---

### Task 5.9: Console Message Easter Egg

**Description:** Print a fun message when DevTools opens.

**Files to create:**
- `/lib/console-message.ts`
- `/components/easter-eggs/ConsoleMessage.tsx`

**Technical approach:**

```typescript
// /lib/console-message.ts
export function printConsoleMessage() {
  // Only run in browser
  if (typeof window === 'undefined') return

  // Only print once per session
  const key = 'trey-console-message-shown'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, 'true')

  const asciiArt = `
 ██╗   ██╗██╗██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ███████╗██████╗
 ██║   ██║██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
 ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║██║  ██║█████╗  ██║  ██║
 ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██║  ██║██╔══╝  ██║  ██║
  ╚████╔╝ ██║██████╔╝███████╗    ╚██████╗╚██████╔╝██████╔╝███████╗██████╔╝
   ╚═══╝  ╚═╝╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═════╝
`

  const message = `
%c${asciiArt}
%c👋 Hey, you're poking around. I respect that.

%c⚠️  Please don't hack me—I vibe coded this whole thing.

%c🤖 Built with: Next.js, Tailwind, MDX, and mass collaboration with Claude
🔗 Source: github.com/treygoff/trey-goff

Speaking of which, did you know the Golden Gate Bridge connects San
Francisco to Marin County? The 1.7-mile suspension bridge, completed
in 1937, features that iconic International Orange color. I find it
genuinely fascinating how the bridge has become such a symbol of—

Wait, sorry. Wrong Claude. Where was I?

Anyway, if you find a bug, it's a feature.
`

  console.log(
    message,
    'color: #FFB86B; font-family: monospace;', // ASCII art
    'color: #fff; font-size: 14px;', // Greeting
    'color: #FBBF24; font-size: 14px;', // Warning
    'color: rgba(255,255,255,0.7); font-size: 12px;' // Details
  )
}
```

```typescript
// /components/easter-eggs/ConsoleMessage.tsx
'use client'
import { useEffect } from 'react'
import { printConsoleMessage } from '@/lib/console-message'

export function ConsoleMessage() {
  useEffect(() => {
    printConsoleMessage()
  }, [])

  return null
}
```

Add to layout:
```typescript
// /app/layout.tsx
import { ConsoleMessage } from '@/components/easter-eggs/ConsoleMessage'

// Inside body:
<ConsoleMessage />
```

**Acceptance criteria:**
- [ ] Message prints when DevTools opens
- [ ] Only prints once per session
- [ ] ASCII art displays correctly
- [ ] Colors work in Chrome/Firefox/Safari
- [ ] Golden Gate Claude reference included

---

### Task 5.10: Powerlifting Hidden Page

**Description:** Create the hidden /powerlifting easter egg page.

**Files to create:**
- `/app/powerlifting/page.tsx`

**Technical approach:**

```typescript
// /app/powerlifting/page.tsx
import { Metadata } from 'next'
import { Prose } from '@/components/content/Prose'

export const metadata: Metadata = {
  title: 'Powerlifting — Trey',
  description: 'The gym is my laboratory.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PowerliftingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-12 text-center">
        <p className="text-sm text-text-3 mb-4">🏋️ You found the hidden page</p>
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Powerlifting
        </h1>
        <p className="text-lg text-text-2">
          The gym is my laboratory for systematic progression.
        </p>
      </header>

      <Prose>
        <h2>Why I Lift</h2>
        <p>
          Powerlifting taught me more about discipline, systematic progression, and
          embracing discomfort than any book ever could. The barbell doesn't care
          about your excuses.
        </p>

        <h2>Personal Records</h2>
        <p>
          These numbers don't mean much to anyone else, but they represent years
          of consistent work.
        </p>

        <table>
          <thead>
            <tr>
              <th>Lift</th>
              <th>Weight</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Squat</td>
              <td>---</td>
              <td>---</td>
            </tr>
            <tr>
              <td>Bench</td>
              <td>---</td>
              <td>---</td>
            </tr>
            <tr>
              <td>Deadlift</td>
              <td>---</td>
              <td>---</td>
            </tr>
          </tbody>
        </table>

        <h2>What the Sport Taught Me</h2>
        <ul>
          <li>
            <strong>Progressive overload</strong>: Small, consistent improvements
            compound into remarkable results.
          </li>
          <li>
            <strong>Deloads matter</strong>: Sometimes stepping back is the fastest
            way forward.
          </li>
          <li>
            <strong>Form over ego</strong>: Doing things correctly beats doing things
            impressively.
          </li>
          <li>
            <strong>The process is the point</strong>: The PRs are nice, but the
            daily practice is where the growth happens.
          </li>
        </ul>

        <h2>Current Program</h2>
        <p>
          I follow a periodized approach, cycling through hypertrophy, strength,
          and peaking phases. The specifics change, but the principles don't.
        </p>
      </Prose>

      <footer className="mt-16 pt-8 border-t border-border-1 text-center">
        <p className="text-sm text-text-3">
          This page is intentionally hidden from search engines and navigation.
          <br />
          You either know the URL or found it through the command palette. Nice.
        </p>
      </footer>
    </main>
  )
}
```

**Ensure excluded from sitemap:**
```typescript
// /app/sitemap.ts
export default function sitemap() {
  const routes = [
    '/',
    '/writing',
    '/notes',
    '/library',
    '/projects',
    '/about',
    '/now',
    '/subscribe',
    '/colophon',
    // Note: /powerlifting intentionally excluded
  ]

  return routes.map((route) => ({
    // TODO: Replace SITE_DOMAIN with actual domain before deploy
    url: `https://SITE_DOMAIN${route}`,
    lastModified: new Date(),
  }))
}
```

**Acceptance criteria:**
- [ ] Page renders at /powerlifting
- [ ] `noindex` meta tag present
- [ ] Excluded from sitemap
- [ ] Discoverable via command palette search
- [ ] Content placeholder ready for Trey to fill in

---

### Task 5.11: 404 Page Design

**Description:** Create a custom 404 page that fits the site aesthetic.

**Files to create:**
- `/app/not-found.tsx`

**Technical approach:**

```typescript
// /app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6">
        {/* Large 404 */}
        <h1 className="font-satoshi text-8xl font-bold text-text-3/20">
          404
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="font-satoshi text-2xl font-medium text-text-1">
            Page not found
          </h2>
          <p className="text-text-2 max-w-md">
            The page you're looking for doesn't exist or has been moved.
            Maybe try the command palette?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/"
            className="rounded-lg bg-warm px-6 py-3 font-medium text-bg-1 transition-colors hover:bg-warm/90"
          >
            Go home
          </Link>
          <button
            onClick={() => {
              // Trigger command palette
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
              })
              document.dispatchEvent(event)
            }}
            className="rounded-lg border border-border-1 px-6 py-3 font-medium text-text-2 transition-colors hover:bg-surface-1"
          >
            Open search
            <kbd className="ml-2 rounded bg-surface-1 px-1.5 py-0.5 font-mono text-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Easter egg hint */}
        <p className="pt-8 text-sm text-text-3">
          Or maybe you were looking for something{' '}
          <Link href="/powerlifting" className="text-warm hover:underline">
            hidden
          </Link>
          ?
        </p>
      </div>
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] 404 page renders for unknown routes
- [ ] Matches site design
- [ ] Clear message explaining the error
- [ ] Link to homepage
- [ ] Command palette trigger button
- [ ] Subtle hint to powerlifting page

---

### Task 5.12: Projects Page Scaffold

**Description:** Create the projects page structure (content to be added later).

**Files to create:**
- `/app/projects/page.tsx`
- `/components/projects/ProjectCard.tsx`

**Technical approach:**

```typescript
// /app/projects/page.tsx
import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Projects — Trey',
  description: 'Things I\'ve built and contributed to.',
}

// Placeholder projects until content is added
const projects = [
  {
    name: 'The Control Room',
    oneLiner: 'This website—an explorable index of my mind.',
    status: 'active',
    type: 'software',
    url: '/colophon',
  },
]

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Projects
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Things I've built, contributed to, and ideas I'm exploring.
        </p>
      </header>

      <div className="space-y-8">
        {projects.map((project) => (
          <article
            key={project.name}
            className="rounded-lg border border-border-1 bg-surface-1 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-satoshi text-xl font-medium text-text-1">
                  {project.name}
                </h2>
                <p className="mt-1 text-text-2">{project.oneLiner}</p>
              </div>
              <span className="rounded-full border border-border-1 px-3 py-1 text-xs text-text-3">
                {project.status}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 rounded-lg border border-dashed border-border-1 p-8 text-center">
        <p className="text-text-3">
          More projects coming soon. This page will expand as I document past
          and current work.
        </p>
      </div>
    </main>
  )
}
```

**Acceptance criteria:**
- [ ] Page renders at /projects
- [ ] Placeholder content present
- [ ] Matches site design
- [ ] Ready for real content later

---

### Task 5.13: Final QA Pass

**Description:** Comprehensive testing across browsers and devices.

**Testing matrix:**

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | Yes | Yes |
| Safari | Yes | Yes |
| Firefox | Yes | - |
| Edge | Yes | - |

**QA checklist:**

**Functionality:**
- [ ] All navigation links work
- [ ] Command palette works everywhere
- [ ] Search returns correct results
- [ ] Newsletter signup works
- [ ] RSS feeds valid
- [ ] Book covers load
- [ ] Filters work on library page

**Visual:**
- [ ] No visual regressions
- [ ] Dark mode consistent (no light leaks)
- [ ] Typography renders correctly
- [ ] Images load and display properly
- [ ] Responsive layouts work at all breakpoints

**Performance:**
- [ ] Lighthouse scores meet targets
- [ ] No console errors
- [ ] No network errors
- [ ] Fast on 3G throttling

**Content:**
- [ ] No placeholder text remaining (except intentional)
- [ ] All meta descriptions present
- [ ] OG images generate correctly

**Acceptance criteria:**
- [ ] All checklist items verified
- [ ] No blocking issues
- [ ] Ready for production deployment

---

### Task 5.14: Automated Testing Setup (Optional - Tech Debt)

**Description:** Set up automated testing infrastructure. This is optional for v1 launch but recommended as post-launch tech debt. Can be woven into each phase during development instead.

**Files to create:**
- `/vitest.config.ts`
- `/playwright.config.ts`
- `/.github/workflows/ci.yml`
- `/tests/setup.ts`
- `/tests/e2e/navigation.spec.ts`
- `/tests/e2e/search.spec.ts`
- `/tests/e2e/subscribe.spec.ts`
- `/tests/unit/utils.test.ts`
- `/tests/unit/search-index.test.ts`

**Technical approach:**

**1. Unit + Component Tests (Vitest + Testing Library)**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// /vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: ['**/*.d.ts', '**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

```typescript
// /tests/setup.ts
import '@testing-library/jest-dom'
```

**What to unit test:**
- Content utilities (reading time, slug generation, backlinks extraction)
- Search index generation
- Date formatting and sorting functions
- Book cover resolution logic
- Graph data transformations

**Example unit test:**

```typescript
// /tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest'
import { calculateReadingTime, formatDate } from '@/lib/utils'

describe('calculateReadingTime', () => {
  it('calculates reading time for short content', () => {
    const content = 'Hello world '.repeat(100) // ~200 words
    expect(calculateReadingTime(content)).toBe(1)
  })

  it('calculates reading time for long content', () => {
    const content = 'Hello world '.repeat(1000) // ~2000 words
    expect(calculateReadingTime(content)).toBe(10)
  })
})

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024')
  })
})
```

**2. End-to-End Tests (Playwright)**

```bash
pnpm add -D @playwright/test
npx playwright install
```

```typescript
// /playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Critical E2E paths to test:**

```typescript
// /tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('landing to essay to related', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Writing')
    await expect(page).toHaveURL('/writing')

    // Click first essay
    await page.click('article a >> nth=0')
    await expect(page.locator('h1')).toBeVisible()

    // Check related section exists
    await expect(page.locator('text=Related')).toBeVisible()
  })

  test('mobile navigation drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Open drawer
    await page.click('button[aria-label="Open menu"]')
    await expect(page.locator('nav[role="dialog"]')).toBeVisible()

    // Navigate
    await page.click('text=Writing')
    await expect(page).toHaveURL('/writing')
    await expect(page.locator('nav[role="dialog"]')).not.toBeVisible()
  })
})
```

```typescript
// /tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Command Palette', () => {
  test('opens with keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Meta+k')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test('search returns results', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Meta+k')
    await page.fill('input[placeholder*="Search"]', 'writing')
    await expect(page.locator('[cmdk-item]')).toHaveCount.greaterThan(0)
  })
})
```

```typescript
// /tests/e2e/subscribe.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Newsletter Subscribe', () => {
  test('shows success on valid email', async ({ page }) => {
    await page.goto('/subscribe')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Should show success message (mocked in test env)
    await expect(page.locator('text=Check your inbox')).toBeVisible()
  })

  test('shows error on invalid email', async ({ page }) => {
    await page.goto('/subscribe')
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=valid email')).toBeVisible()
  })
})
```

**3. Lighthouse CI (GitHub Actions)**

```yaml
# /.github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  lighthouse:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
```

```json
// /lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/writing",
        "http://localhost:3000/library"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**4. Package.json scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Coverage targets:**

| Area | Target |
|------|--------|
| Utilities/lib | 90%+ |
| Components | 70%+ |
| Overall | 75%+ |

**Acceptance criteria:**
- [ ] Vitest runs with `pnpm test`
- [ ] Playwright E2E tests run with `pnpm test:e2e`
- [ ] GitHub Actions CI passes on push/PR
- [ ] Lighthouse CI enforces performance/a11y thresholds
- [ ] Test coverage meets targets

**Note:** This task is flagged as optional for v1 launch. Recommend implementing after Phase 5 or incrementally during development. Manual QA (Task 5.13) is sufficient for launch.

---

### Phase 5 Verification Checklist

Before moving to Phase 6 (or launch), verify:

- [ ] Buttondown integration working end-to-end
- [ ] /subscribe page renders and form works
- [ ] Newsletter CTA in essay footers
- [ ] /api/subscribe handles all error cases
- [ ] Skip link present and working
- [ ] axe DevTools shows 0 critical issues
- [ ] Lighthouse accessibility 90+
- [ ] Lighthouse performance 90+ on mobile
- [ ] First Load JS < 100KB
- [ ] All animations respect reduced motion
- [ ] Konami code easter egg works
- [ ] Console message prints on DevTools open
- [ ] /powerlifting page hidden but accessible
- [ ] 404 page displays correctly
- [ ] /projects page scaffolded
- [ ] Cross-browser testing complete
- [ ] No console errors in production build
- [ ] All links work (no 404s from internal links)

---

## Phase 6: Knowledge Graph (Stretch)

**Goal:** Build the knowledge graph explorer that visualizes relationships between essays, notes, books, and ideas using Sigma.js + Graphology.

**Dependencies:** Phase 2 (Content Pipeline) complete, Phase 3 (Search) complete

**Estimated Effort:** XL (stretch goal - can be descoped to MVP)

**Critical Path:** Graph data pipeline -> Layout computation -> Sigma.js rendering -> Inspector panel

---

### Task 6.1: Graph Data Schema and Types

**Description:** Define TypeScript types for graph nodes and edges. Create the data structures that will power the knowledge graph.

**Files to create/modify:**
- `/lib/graph/types.ts`

**Technical approach:**

```typescript
// /lib/graph/types.ts

export type NodeType = 'idea' | 'essay' | 'project' | 'book' | 'person' | 'place' | 'note';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  href?: string;
  tags: string[];
  weight: number;
  // Position computed at build time
  x?: number;
  y?: number;
  // Visual properties
  size?: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'influences' | 'contrasts' | 'expands' | 'references' | 'tagged';
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    generatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

// For the inspector panel
export interface NodeDetail extends GraphNode {
  description?: string;
  connections: {
    incoming: Array<{ node: GraphNode; relationship: string }>;
    outgoing: Array<{ node: GraphNode; relationship: string }>;
  };
}
```

**Acceptance criteria:**
- [ ] All graph types defined with proper JSDoc comments
- [ ] Types support all node types from spec
- [ ] Edge relationship types match spec
- [ ] Position coordinates optional for runtime flexibility

---

### Task 6.2: Wikilink Parser

**Description:** Create a parser that extracts wikilinks (`[[Some Idea]]`) from MDX content. This enables automatic relationship discovery.

**Files to create/modify:**
- `/lib/graph/wikilink-parser.ts`

**Technical approach:**

```typescript
// /lib/graph/wikilink-parser.ts

export interface WikilinkMatch {
  text: string;           // The display text
  target: string;         // The target slug/id
  fullMatch: string;      // The full matched string
  position: {
    start: number;
    end: number;
  };
}

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(content: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const [fullMatch, target, displayText] = match;
    matches.push({
      text: displayText || target,
      target: slugify(target),
      fullMatch,
      position: {
        start: match.index,
        end: match.index + fullMatch.length,
      },
    });
  }

  return matches;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// Transform wikilinks to actual links in MDX output
export function transformWikilinksToLinks(
  content: string,
  linkResolver: (target: string) => string | null
): string {
  return content.replace(WIKILINK_REGEX, (fullMatch, target, displayText) => {
    const href = linkResolver(slugify(target));
    if (!href) {
      // Return as plain text if no matching content
      return displayText || target;
    }
    return `[${displayText || target}](${href})`;
  });
}
```

**Acceptance criteria:**
- [ ] Extracts simple wikilinks: `[[Some Idea]]`
- [ ] Extracts aliased wikilinks: `[[Some Idea|display text]]`
- [ ] Returns position information for each match
- [ ] Handles edge cases (empty, malformed)
- [ ] Transform function converts to markdown links

---

### Task 6.3: Graph Data Pipeline

**Description:** Build the pipeline that extracts graph data from all content sources at build time. This aggregates essays, notes, books, and projects into a unified graph structure.

**Files to create/modify:**
- `/lib/graph/build-graph.ts`
- `/lib/graph/index.ts`

**Technical approach:**

```typescript
// /lib/graph/build-graph.ts

import { allEssays, allNotes, allProjects } from 'content-collections';
import { extractWikilinks } from './wikilink-parser';
import type { GraphNode, GraphEdge, GraphData, NodeType } from './types';
import { loadBooks } from '@/lib/books';

interface ContentItem {
  id: string;
  title: string;
  type: NodeType;
  href: string;
  tags: string[];
  content: string;
}

export async function buildGraphData(): Promise<GraphData> {
  const nodes: Map<string, GraphNode> = new Map();
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>(); // Prevent duplicates

  // 1. Collect all content as nodes
  const essays = allEssays.filter(e => e.status === 'published' || e.status === 'evergreen');
  const notes = allNotes;
  const projects = allProjects;
  const books = await loadBooks();

  // Add essay nodes
  for (const essay of essays) {
    nodes.set(essay.slug, {
      id: essay.slug,
      label: essay.title,
      type: 'essay',
      href: `/writing/${essay.slug}`,
      tags: essay.tags,
      weight: calculateWeight(essay),
    });
  }

  // Add note nodes
  for (const note of notes) {
    const id = `note-${note.permalink}`;
    nodes.set(id, {
      id,
      label: note.title || `Note: ${note.date}`,
      type: 'note',
      href: `/notes#${note.permalink}`,
      tags: note.tags || [],
      weight: 1,
    });
  }

  // Add book nodes
  for (const book of books) {
    const id = `book-${book.slug}`;
    nodes.set(id, {
      id,
      label: book.title,
      type: 'book',
      href: `/library#${book.slug}`,
      tags: book.topics,
      weight: book.rating || 3,
    });
  }

  // Add project nodes
  for (const project of projects) {
    nodes.set(project.slug, {
      id: project.slug,
      label: project.name,
      type: 'project',
      href: `/projects/${project.slug}`,
      tags: project.tags,
      weight: project.status === 'active' ? 5 : 3,
    });
  }

  // 2. Extract wikilink edges
  for (const essay of essays) {
    const wikilinks = extractWikilinks(essay.content);
    for (const link of wikilinks) {
      if (nodes.has(link.target)) {
        const edgeId = `${essay.slug}->${link.target}`;
        if (!edgeSet.has(edgeId)) {
          edges.push({
            id: edgeId,
            source: essay.slug,
            target: link.target,
            relationship: 'references',
            weight: 2,
          });
          edgeSet.add(edgeId);
        }
      }
    }
  }

  // 3. Add manual related edges
  for (const essay of essays) {
    if (essay.related) {
      for (const relatedSlug of essay.related) {
        if (nodes.has(relatedSlug)) {
          const edgeId = `${essay.slug}->${relatedSlug}`;
          if (!edgeSet.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: essay.slug,
              target: relatedSlug,
              relationship: 'expands',
              weight: 3, // Manual relations weighted higher
            });
            edgeSet.add(edgeId);
          }
        }
      }
    }
  }

  // 4. Add soft edges from shared tags
  const tagToNodes = new Map<string, string[]>();
  for (const [id, node] of nodes) {
    for (const tag of node.tags) {
      if (!tagToNodes.has(tag)) {
        tagToNodes.set(tag, []);
      }
      tagToNodes.get(tag)!.push(id);
    }
  }

  for (const [tag, nodeIds] of tagToNodes) {
    // Only create edges for tags with 2-10 nodes (avoid hub nodes)
    if (nodeIds.length >= 2 && nodeIds.length <= 10) {
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const edgeId = `${nodeIds[i]}<->${nodeIds[j]}:${tag}`;
          if (!edgeSet.has(edgeId)) {
            edges.push({
              id: edgeId,
              source: nodeIds[i],
              target: nodeIds[j],
              relationship: 'tagged',
              weight: 0.5, // Low weight for inferred edges
            });
            edgeSet.add(edgeId);
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.size,
      edgeCount: edges.length,
    },
  };
}

function calculateWeight(essay: typeof allEssays[0]): number {
  let weight = 3; // Base weight
  if (essay.status === 'evergreen') weight += 2;
  if (essay.tags.length > 3) weight += 1;
  return weight;
}
```

**Acceptance criteria:**
- [ ] Collects nodes from essays, notes, books, projects
- [ ] Extracts wikilink relationships
- [ ] Adds manual `related[]` edges
- [ ] Creates soft edges from shared tags
- [ ] Prevents duplicate edges
- [ ] Includes metadata with counts and timestamp

---

### Task 6.4: Graph Layout Computation

**Description:** Use Graphology's ForceAtlas2 algorithm to compute stable node positions at build time. This eliminates runtime physics simulation.

**Files to create/modify:**
- `/lib/graph/compute-layout.ts`

**Commands:**
```bash
npm install graphology graphology-layout-forceatlas2 graphology-types
npm install -D @types/graphology
```

**Technical approach:**

```typescript
// /lib/graph/compute-layout.ts

import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { GraphData, GraphNode } from './types';

interface LayoutOptions {
  iterations?: number;
  settings?: {
    gravity?: number;
    scalingRatio?: number;
    strongGravityMode?: boolean;
    barnesHutOptimize?: boolean;
  };
}

export function computeLayout(
  data: GraphData,
  options: LayoutOptions = {}
): GraphData {
  const {
    iterations = 500,
    settings = {
      gravity: 1,
      scalingRatio: 10,
      strongGravityMode: false,
      barnesHutOptimize: true,
    },
  } = options;

  // Create Graphology graph
  const graph = new Graph();

  // Add nodes
  for (const node of data.nodes) {
    graph.addNode(node.id, {
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: getNodeSize(node),
      label: node.label,
      type: node.type,
    });
  }

  // Add edges
  for (const edge of data.edges) {
    try {
      graph.addEdge(edge.source, edge.target, {
        weight: edge.weight,
        relationship: edge.relationship,
      });
    } catch (e) {
      // Skip if edge already exists (undirected graph)
    }
  }

  // Run ForceAtlas2 layout
  forceAtlas2.assign(graph, {
    iterations,
    settings,
  });

  // Extract positions back to nodes
  const positionedNodes: GraphNode[] = data.nodes.map(node => {
    const attributes = graph.getNodeAttributes(node.id);
    return {
      ...node,
      x: attributes.x,
      y: attributes.y,
      size: attributes.size,
      color: getNodeColor(node.type),
    };
  });

  return {
    ...data,
    nodes: positionedNodes,
  };
}

function getNodeSize(node: GraphNode): number {
  const baseSizes: Record<string, number> = {
    essay: 8,
    book: 6,
    project: 7,
    note: 4,
    idea: 5,
    person: 5,
    place: 4,
  };
  return (baseSizes[node.type] || 5) * (1 + node.weight * 0.1);
}

function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    essay: '#FFB86B',    // Warm accent
    book: '#7C5CFF',     // Electric accent
    project: '#34D399',  // Success green
    note: 'rgba(255, 255, 255, 0.52)', // Tertiary text
    idea: '#FBBF24',     // Warning yellow
    person: '#F87171',   // Error red
    place: '#60A5FA',    // Blue
  };
  return colors[type] || 'rgba(255, 255, 255, 0.72)';
}
```

**Acceptance criteria:**
- [ ] Graphology and ForceAtlas2 installed
- [ ] Layout runs synchronously at build time
- [ ] Node positions stable and deterministic with same input
- [ ] Sizes vary by node type and weight
- [ ] Colors assigned by node type

---

### Task 6.5: Graph Data Generation Script

**Description:** Create a build script that generates the graph data JSON file. This runs during the build process.

**Files to create/modify:**
- `/scripts/generate-graph.ts`
- `/public/graph-data.json` (generated)
- `/package.json` (add script)

**Technical approach:**

```typescript
// /scripts/generate-graph.ts

import { buildGraphData } from '../lib/graph/build-graph';
import { computeLayout } from '../lib/graph/compute-layout';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('Building graph data...');

  const rawData = await buildGraphData();
  console.log(`  Nodes: ${rawData.metadata.nodeCount}`);
  console.log(`  Edges: ${rawData.metadata.edgeCount}`);

  console.log('Computing layout...');
  const layoutData = computeLayout(rawData, {
    iterations: 500,
  });

  // Normalize positions to 0-1000 range for consistent rendering
  const normalized = normalizePositions(layoutData);

  const outputPath = path.join(process.cwd(), 'public', 'graph-data.json');
  await fs.writeFile(outputPath, JSON.stringify(normalized, null, 2));

  console.log(`Graph data written to ${outputPath}`);
}

function normalizePositions(data: GraphData): GraphData {
  const xs = data.nodes.map(n => n.x || 0);
  const ys = data.nodes.map(n => n.y || 0);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return {
    ...data,
    nodes: data.nodes.map(node => ({
      ...node,
      x: ((node.x || 0) - minX) / rangeX * 1000,
      y: ((node.y || 0) - minY) / rangeY * 1000,
    })),
  };
}

main().catch(console.error);
```

Add to `package.json`:

```json
{
  "scripts": {
    "graph:build": "npx tsx scripts/generate-graph.ts",
    "prebuild": "npm run graph:build"
  }
}
```

**Acceptance criteria:**
- [ ] Script runs successfully with `npm run graph:build`
- [ ] Outputs valid JSON to `/public/graph-data.json`
- [ ] Positions normalized to consistent range
- [ ] Runs automatically before build via prebuild hook

---

### Task 6.6: Sigma.js Graph Canvas Component

**Description:** Create the main graph visualization component using Sigma.js for WebGL rendering. This is the core of the `/graph` page.

**Files to create/modify:**
- `/components/graph/GraphCanvas.tsx`
- `/components/graph/use-sigma.ts`

**Commands:**
```bash
npm install sigma
```

**Technical approach:**

```typescript
// /components/graph/use-sigma.ts

'use client';

import { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import type { GraphData } from '@/lib/graph/types';

interface UseSigmaOptions {
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  highlightedNode?: string | null;
}

export function useSigma(
  containerRef: React.RefObject<HTMLDivElement>,
  graphData: GraphData | null,
  options: UseSigmaOptions = {}
) {
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Create Graphology graph
    const graph = new Graph();

    for (const node of graphData.nodes) {
      graph.addNode(node.id, {
        x: node.x,
        y: node.y,
        size: node.size || 5,
        label: node.label,
        color: node.color || '#FFB86B',
        type: node.type,
      });
    }

    for (const edge of graphData.edges) {
      try {
        graph.addEdge(edge.source, edge.target, {
          weight: edge.weight,
          color: 'rgba(255, 255, 255, 0.1)',
        });
      } catch (e) {
        // Edge may already exist
      }
    }

    graphRef.current = graph;

    // Create Sigma renderer
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelRenderedSizeThreshold: 12,
      labelFont: 'Satoshi, system-ui, sans-serif',
      labelColor: { color: 'rgba(255, 255, 255, 0.92)' },
      labelSize: 12,
      defaultEdgeColor: 'rgba(255, 255, 255, 0.08)',
      defaultNodeColor: '#FFB86B',
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
    });

    sigmaRef.current = sigma;

    // Event handlers
    if (options.onNodeClick) {
      sigma.on('clickNode', ({ node }) => {
        options.onNodeClick?.(node);
      });
    }

    if (options.onNodeHover) {
      sigma.on('enterNode', ({ node }) => {
        options.onNodeHover?.(node);
        highlightConnections(graph, sigma, node);
      });

      sigma.on('leaveNode', () => {
        options.onNodeHover?.(null);
        resetHighlight(graph, sigma);
      });
    }

    setIsReady(true);

    return () => {
      sigma.kill();
      sigmaRef.current = null;
      graphRef.current = null;
    };
  }, [containerRef, graphData]);

  // Handle external highlight changes
  useEffect(() => {
    if (!sigmaRef.current || !graphRef.current) return;

    if (options.highlightedNode) {
      highlightConnections(
        graphRef.current,
        sigmaRef.current,
        options.highlightedNode
      );
    } else {
      resetHighlight(graphRef.current, sigmaRef.current);
    }
  }, [options.highlightedNode]);

  const zoomToNode = (nodeId: string) => {
    if (!sigmaRef.current || !graphRef.current) return;

    const nodePosition = graphRef.current.getNodeAttributes(nodeId);
    sigmaRef.current.getCamera().animate(
      { x: nodePosition.x, y: nodePosition.y, ratio: 0.3 },
      { duration: 500 }
    );
  };

  return { sigma: sigmaRef.current, graph: graphRef.current, isReady, zoomToNode };
}

function highlightConnections(graph: Graph, sigma: Sigma, nodeId: string) {
  const neighbors = new Set(graph.neighbors(nodeId));
  neighbors.add(nodeId);

  graph.forEachNode((node, attrs) => {
    graph.setNodeAttribute(
      node,
      'color',
      neighbors.has(node) ? attrs.color : 'rgba(255, 255, 255, 0.1)'
    );
  });

  graph.forEachEdge((edge, attrs, source, target) => {
    const isConnected = source === nodeId || target === nodeId;
    graph.setEdgeAttribute(
      edge,
      'color',
      isConnected ? 'rgba(255, 184, 107, 0.5)' : 'rgba(255, 255, 255, 0.03)'
    );
  });

  sigma.refresh();
}

function resetHighlight(graph: Graph, sigma: Sigma) {
  graph.forEachNode((node) => {
    const attrs = graph.getNodeAttributes(node);
    // Reset to original color based on type
    graph.setNodeAttribute(node, 'color', attrs.color);
  });

  graph.forEachEdge((edge) => {
    graph.setEdgeAttribute(edge, 'color', 'rgba(255, 255, 255, 0.08)');
  });

  sigma.refresh();
}
```

```typescript
// /components/graph/GraphCanvas.tsx

'use client';

import { useRef, useEffect, useState } from 'react';
import { useSigma } from './use-sigma';
import type { GraphData } from '@/lib/graph/types';

interface GraphCanvasProps {
  graphData: GraphData;
  onNodeSelect?: (nodeId: string) => void;
  selectedNode?: string | null;
  searchQuery?: string;
}

export function GraphCanvas({
  graphData,
  onNodeSelect,
  selectedNode,
  searchQuery,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { sigma, graph, isReady, zoomToNode } = useSigma(containerRef, graphData, {
    onNodeClick: onNodeSelect,
    onNodeHover: setHoveredNode,
    highlightedNode: selectedNode || hoveredNode,
  });

  // Handle search highlighting
  useEffect(() => {
    if (!graph || !sigma || !searchQuery) return;

    const query = searchQuery.toLowerCase();
    const matchingNodes = graphData.nodes
      .filter(n => n.label.toLowerCase().includes(query))
      .map(n => n.id);

    if (matchingNodes.length > 0) {
      // Zoom to first match
      zoomToNode(matchingNodes[0]);
    }
  }, [searchQuery, graph, sigma, graphData.nodes, zoomToNode]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full bg-bg-0"
        style={{ minHeight: '500px' }}
      />

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-0">
          <div className="text-text-2">Loading graph...</div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => sigma?.getCamera().animatedZoom({ duration: 200 })}
          className="w-10 h-10 rounded-lg bg-surface-1 text-text-1 hover:bg-surface-2 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => sigma?.getCamera().animatedUnzoom({ duration: 200 })}
          className="w-10 h-10 rounded-lg bg-surface-1 text-text-1 hover:bg-surface-2 transition-colors"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={() => sigma?.getCamera().animatedReset({ duration: 200 })}
          className="w-10 h-10 rounded-lg bg-surface-1 text-text-1 hover:bg-surface-2 transition-colors"
          aria-label="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Sigma.js installed and working
- [ ] Graph renders with correct node positions
- [ ] Node colors match type
- [ ] Labels appear on hover/zoom
- [ ] Click events fire correctly
- [ ] Hover highlights connections
- [ ] Zoom controls work

---

### Task 6.7: Node Inspector Panel

**Description:** Create a slide-over panel that shows details about the selected node, including its connections and links.

**Files to create/modify:**
- `/components/graph/NodeInspector.tsx`

**Technical approach:**

```typescript
// /components/graph/NodeInspector.tsx

'use client';

import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';

interface NodeInspectorProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: Map<string, GraphNode>;
  onClose: () => void;
  onNodeNavigate: (nodeId: string) => void;
}

export function NodeInspector({
  node,
  edges,
  allNodes,
  onClose,
  onNodeNavigate,
}: NodeInspectorProps) {
  if (!node) return null;

  const connections = getConnections(node.id, edges, allNodes);

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-1 border-l border-border-1 shadow-2xl z-50 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-bg-1/90 backdrop-blur-sm border-b border-border-1 p-6">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2"
                  style={{ backgroundColor: node.color, color: '#070A0F' }}
                >
                  {node.type}
                </span>
                <h2 className="text-2xl font-semibold text-text-1">
                  {node.label}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-3 hover:text-text-1 transition-colors"
                aria-label="Close inspector"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Tags */}
            {node.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-3 uppercase tracking-wide mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {node.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm bg-surface-1 text-text-2 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Link to content */}
            {node.href && (
              <div>
                <Link
                  href={node.href}
                  className="inline-flex items-center gap-2 text-warm hover:underline"
                >
                  View {node.type}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Outgoing connections */}
            {connections.outgoing.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-3 uppercase tracking-wide mb-3">
                  References ({connections.outgoing.length})
                </h3>
                <ul className="space-y-2">
                  {connections.outgoing.map(({ node: targetNode, relationship }) => (
                    <li key={targetNode.id}>
                      <button
                        onClick={() => onNodeNavigate(targetNode.id)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors text-left"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: targetNode.color }}
                        />
                        <div>
                          <div className="text-text-1">{targetNode.label}</div>
                          <div className="text-xs text-text-3">{relationship}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Incoming connections (backlinks) */}
            {connections.incoming.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-3 uppercase tracking-wide mb-3">
                  Referenced by ({connections.incoming.length})
                </h3>
                <ul className="space-y-2">
                  {connections.incoming.map(({ node: sourceNode, relationship }) => (
                    <li key={sourceNode.id}>
                      <button
                        onClick={() => onNodeNavigate(sourceNode.id)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors text-left"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sourceNode.color }}
                        />
                        <div>
                          <div className="text-text-1">{sourceNode.label}</div>
                          <div className="text-xs text-text-3">{relationship}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No connections */}
            {connections.outgoing.length === 0 && connections.incoming.length === 0 && (
              <div className="text-text-3 text-center py-8">
                No connections found
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getConnections(
  nodeId: string,
  edges: GraphEdge[],
  allNodes: Map<string, GraphNode>
) {
  const outgoing: Array<{ node: GraphNode; relationship: string }> = [];
  const incoming: Array<{ node: GraphNode; relationship: string }> = [];

  for (const edge of edges) {
    if (edge.source === nodeId) {
      const targetNode = allNodes.get(edge.target);
      if (targetNode) {
        outgoing.push({ node: targetNode, relationship: edge.relationship });
      }
    }
    if (edge.target === nodeId) {
      const sourceNode = allNodes.get(edge.source);
      if (sourceNode) {
        incoming.push({ node: sourceNode, relationship: edge.relationship });
      }
    }
  }

  return { outgoing, incoming };
}
```

**Acceptance criteria:**
- [ ] Panel slides in from right on node selection
- [ ] Shows node type, label, tags
- [ ] Links to actual content page
- [ ] Lists outgoing references
- [ ] Lists incoming references (backlinks)
- [ ] Click connection navigates to that node
- [ ] Close button works
- [ ] Escape key closes panel

---

### Task 6.8: Graph Search Integration

**Description:** Add a search bar to the graph page that highlights matching nodes. Sync with the command palette's search index.

**Files to create/modify:**
- `/components/graph/GraphSearch.tsx`

**Technical approach:**

```typescript
// /components/graph/GraphSearch.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { GraphNode } from '@/lib/graph/types';

interface GraphSearchProps {
  nodes: GraphNode[];
  onSearch: (query: string) => void;
  onNodeSelect: (nodeId: string) => void;
}

export function GraphSearch({ nodes, onSearch, onNodeSelect }: GraphSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 150);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      onSearch('');
      return;
    }

    const searchLower = debouncedQuery.toLowerCase();
    const matches = nodes.filter(node =>
      node.label.toLowerCase().includes(searchLower) ||
      node.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );

    setResults(matches.slice(0, 10));
    onSearch(debouncedQuery);
  }, [debouncedQuery, nodes, onSearch]);

  const handleSelect = useCallback((nodeId: string) => {
    onNodeSelect(nodeId);
    setQuery('');
    setIsOpen(false);
  }, [onNodeSelect]);

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search graph..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-border-1 rounded-lg text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-warm/50 focus:border-warm"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-1 border border-border-1 rounded-lg shadow-xl overflow-hidden z-50">
          <ul>
            {results.map((node) => (
              <li key={node.id}>
                <button
                  onClick={() => handleSelect(node.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-1 transition-colors text-left"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.color }}
                  />
                  <div>
                    <div className="text-text-1">{node.label}</div>
                    <div className="text-xs text-text-3">{node.type}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Search input styled consistently
- [ ] Debounced search (150ms)
- [ ] Shows matching nodes in dropdown
- [ ] Clicking result selects node and zooms
- [ ] Highlights matching nodes on graph
- [ ] Click outside closes dropdown

---

### Task 6.9: Graph Page

**Description:** Create the `/graph` page that brings together the canvas, search, and inspector components.

**Files to create/modify:**
- `/app/graph/page.tsx`
- `/app/graph/loading.tsx`

**Technical approach:**

```typescript
// /app/graph/page.tsx

import { Suspense } from 'react';
import { GraphExplorer } from './graph-explorer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Graph | Trey Goff',
  description: 'Explore the connections between ideas, essays, books, and projects.',
};

async function getGraphData() {
  // In production, this would be a static import or fetch from public
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/graph-data.json`,
    { next: { revalidate: false } }
  );
  return response.json();
}

export default async function GraphPage() {
  const graphData = await getGraphData();

  return (
    <main className="min-h-screen bg-bg-0">
      <div className="fixed top-16 left-0 right-0 z-40 px-4 py-3 bg-bg-0/80 backdrop-blur-sm border-b border-border-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-1">Knowledge Graph</h1>
          <div className="text-sm text-text-3">
            {graphData.metadata.nodeCount} nodes / {graphData.metadata.edgeCount} edges
          </div>
        </div>
      </div>

      <Suspense fallback={<GraphLoading />}>
        <GraphExplorer graphData={graphData} />
      </Suspense>
    </main>
  );
}

function GraphLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-text-2">Loading knowledge graph...</div>
    </div>
  );
}
```

```typescript
// /app/graph/graph-explorer.tsx

'use client';

import { useState, useMemo } from 'react';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphSearch } from '@/components/graph/GraphSearch';
import { NodeInspector } from '@/components/graph/NodeInspector';
import type { GraphData, GraphNode } from '@/lib/graph/types';

interface GraphExplorerProps {
  graphData: GraphData;
}

export function GraphExplorer({ graphData }: GraphExplorerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const nodesMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of graphData.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graphData.nodes]);

  const selectedNode = selectedNodeId ? nodesMap.get(selectedNodeId) || null : null;

  return (
    <div className="h-screen pt-16">
      {/* Search bar */}
      <div className="fixed top-28 left-4 z-50 w-80">
        <GraphSearch
          nodes={graphData.nodes}
          onSearch={setSearchQuery}
          onNodeSelect={setSelectedNodeId}
        />
      </div>

      {/* Graph canvas */}
      <div className="h-full">
        <GraphCanvas
          graphData={graphData}
          onNodeSelect={setSelectedNodeId}
          selectedNode={selectedNodeId}
          searchQuery={searchQuery}
        />
      </div>

      {/* Node inspector */}
      <NodeInspector
        node={selectedNode}
        edges={graphData.edges}
        allNodes={nodesMap}
        onClose={() => setSelectedNodeId(null)}
        onNodeNavigate={setSelectedNodeId}
      />
    </div>
  );
}
```

```typescript
// /app/graph/loading.tsx

export default function GraphLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-0">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-warm/30 border-t-warm rounded-full animate-spin" />
        <p className="text-text-2">Loading knowledge graph...</p>
      </div>
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Page loads at `/graph`
- [ ] Shows node/edge counts in header
- [ ] Search bar positioned correctly
- [ ] Full-viewport graph canvas
- [ ] Inspector opens on node click
- [ ] Loading state displays correctly
- [ ] Metadata (title, description) set

---

### Task 6.10: Mobile Graph View

**Description:** Create a mobile-friendly fallback for the knowledge graph. On small screens, show a list view with a mini local graph for the selected node.

**Files to create/modify:**
- `/components/graph/MobileGraphView.tsx`
- `/app/graph/graph-explorer.tsx` (update)

**Technical approach:**

```typescript
// /components/graph/MobileGraphView.tsx

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { GraphData, GraphNode, GraphEdge } from '@/lib/graph/types';

interface MobileGraphViewProps {
  graphData: GraphData;
}

type FilterType = 'all' | 'essay' | 'book' | 'project' | 'note';

export function MobileGraphView({ graphData }: MobileGraphViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = useMemo(() => {
    let nodes = graphData.nodes;

    if (filter !== 'all') {
      nodes = nodes.filter(n => n.type === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(n =>
        n.label.toLowerCase().includes(query) ||
        n.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return nodes.sort((a, b) => b.weight - a.weight);
  }, [graphData.nodes, filter, searchQuery]);

  const nodeConnections = useMemo(() => {
    if (!selectedNode) return { incoming: [], outgoing: [] };

    const nodesMap = new Map(graphData.nodes.map(n => [n.id, n]));
    const incoming: Array<{ node: GraphNode; relationship: string }> = [];
    const outgoing: Array<{ node: GraphNode; relationship: string }> = [];

    for (const edge of graphData.edges) {
      if (edge.source === selectedNode.id) {
        const target = nodesMap.get(edge.target);
        if (target) outgoing.push({ node: target, relationship: edge.relationship });
      }
      if (edge.target === selectedNode.id) {
        const source = nodesMap.get(edge.source);
        if (source) incoming.push({ node: source, relationship: edge.relationship });
      }
    }

    return { incoming, outgoing };
  }, [selectedNode, graphData]);

  const filterButtons: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'essay', label: 'Essays' },
    { value: 'book', label: 'Books' },
    { value: 'project', label: 'Projects' },
    { value: 'note', label: 'Notes' },
  ];

  return (
    <div className="min-h-screen bg-bg-0 pt-16 pb-24">
      {/* Search */}
      <div className="sticky top-16 z-40 bg-bg-0/90 backdrop-blur-sm border-b border-border-1 px-4 py-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          className="w-full px-4 py-2.5 bg-surface-1 border border-border-1 rounded-lg text-text-1 placeholder:text-text-3"
        />
      </div>

      {/* Filters */}
      <div className="sticky top-32 z-30 bg-bg-0/90 backdrop-blur-sm px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === value
                  ? 'bg-warm text-bg-0'
                  : 'bg-surface-1 text-text-2 hover:bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Node list */}
      <div className="px-4 py-4">
        <p className="text-sm text-text-3 mb-4">
          {filteredNodes.length} nodes
        </p>

        <ul className="space-y-2">
          {filteredNodes.map((node) => (
            <li key={node.id}>
              <button
                onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  selectedNode?.id === node.id
                    ? 'bg-surface-2 border border-warm/50'
                    : 'bg-surface-1 hover:bg-surface-2'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: node.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-1 truncate">
                      {node.label}
                    </div>
                    <div className="text-xs text-text-3 mt-1">
                      {node.type}
                    </div>
                    {node.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {node.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-xs bg-bg-0 text-text-3 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded view with connections */}
                {selectedNode?.id === node.id && (
                  <div className="mt-4 pt-4 border-t border-border-1 space-y-4">
                    {node.href && (
                      <Link
                        href={node.href}
                        className="inline-flex items-center gap-2 text-sm text-warm"
                      >
                        View {node.type} →
                      </Link>
                    )}

                    {nodeConnections.outgoing.length > 0 && (
                      <div>
                        <h4 className="text-xs text-text-3 uppercase mb-2">
                          References ({nodeConnections.outgoing.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {nodeConnections.outgoing.slice(0, 5).map(({ node: n }) => (
                            <span
                              key={n.id}
                              className="px-2 py-1 text-xs bg-bg-0 text-text-2 rounded"
                            >
                              {n.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {nodeConnections.incoming.length > 0 && (
                      <div>
                        <h4 className="text-xs text-text-3 uppercase mb-2">
                          Referenced by ({nodeConnections.incoming.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {nodeConnections.incoming.slice(0, 5).map(({ node: n }) => (
                            <span
                              key={n.id}
                              className="px-2 py-1 text-xs bg-bg-0 text-text-2 rounded"
                            >
                              {n.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

Update `graph-explorer.tsx` to use responsive view:

```typescript
// /app/graph/graph-explorer.tsx (updated)

'use client';

import { useState, useMemo } from 'react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { GraphSearch } from '@/components/graph/GraphSearch';
import { NodeInspector } from '@/components/graph/NodeInspector';
import { MobileGraphView } from '@/components/graph/MobileGraphView';
import type { GraphData, GraphNode } from '@/lib/graph/types';

interface GraphExplorerProps {
  graphData: GraphData;
}

export function GraphExplorer({ graphData }: GraphExplorerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const nodesMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of graphData.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graphData.nodes]);

  const selectedNode = selectedNodeId ? nodesMap.get(selectedNodeId) || null : null;

  // Mobile view
  if (isMobile) {
    return <MobileGraphView graphData={graphData} />;
  }

  // Desktop view
  return (
    <div className="h-screen pt-16">
      {/* Search bar */}
      <div className="fixed top-28 left-4 z-50 w-80">
        <GraphSearch
          nodes={graphData.nodes}
          onSearch={setSearchQuery}
          onNodeSelect={setSelectedNodeId}
        />
      </div>

      {/* Graph canvas */}
      <div className="h-full">
        <GraphCanvas
          graphData={graphData}
          onNodeSelect={setSelectedNodeId}
          selectedNode={selectedNodeId}
          searchQuery={searchQuery}
        />
      </div>

      {/* Node inspector */}
      <NodeInspector
        node={selectedNode}
        edges={graphData.edges}
        allNodes={nodesMap}
        onClose={() => setSelectedNodeId(null)}
        onNodeNavigate={setSelectedNodeId}
      />
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Mobile view shows list instead of canvas
- [ ] Filter buttons work (all, essays, books, etc.)
- [ ] Search filters nodes
- [ ] Tapping node expands to show connections
- [ ] Link to actual content works
- [ ] Smooth transitions between states

---

### Task 6.11: Backlinks Component for Content Pages

**Description:** Create a reusable backlinks component that shows what content references the current page. This provides value even without the full graph explorer.

**Files to create/modify:**
- `/components/content/Backlinks.tsx`
- `/app/writing/[slug]/page.tsx` (integrate)

**Technical approach:**

```typescript
// /components/content/Backlinks.tsx

import Link from 'next/link';
import type { GraphNode } from '@/lib/graph/types';

interface BacklinksProps {
  currentId: string;
  graphData: {
    nodes: GraphNode[];
    edges: Array<{ source: string; target: string; relationship: string }>;
  };
}

export function Backlinks({ currentId, graphData }: BacklinksProps) {
  const nodesMap = new Map(graphData.nodes.map(n => [n.id, n]));

  // Find all edges where this node is the target
  const backlinks = graphData.edges
    .filter(edge => edge.target === currentId)
    .map(edge => ({
      node: nodesMap.get(edge.source),
      relationship: edge.relationship,
    }))
    .filter((item): item is { node: GraphNode; relationship: string } =>
      item.node !== undefined && item.node.href !== undefined
    );

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-8 border-t border-border-1">
      <h2 className="text-lg font-semibold text-text-1 mb-4">
        Referenced by
      </h2>
      <ul className="space-y-3">
        {backlinks.map(({ node, relationship }) => (
          <li key={node.id}>
            <Link
              href={node.href!}
              className="group flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-surface-1 transition-colors"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                style={{ backgroundColor: node.color }}
              />
              <div>
                <span className="text-text-1 group-hover:text-warm transition-colors">
                  {node.label}
                </span>
                <span className="text-sm text-text-3 ml-2">
                  ({node.type})
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

**Acceptance criteria:**
- [ ] Shows list of content that references current page
- [ ] Each item links to the referencing content
- [ ] Color-coded by content type
- [ ] Hidden when no backlinks exist
- [ ] Integrated into essay detail pages

---

### Task 6.12: Local Neighborhood Mini-Graph

**Description:** Create a small, focused graph showing only the immediate connections of the current content. This is the MVP alternative to the full graph.

**Files to create/modify:**
- `/components/content/LocalGraph.tsx`

**Technical approach:**

```typescript
// /components/content/LocalGraph.tsx

'use client';

import { useRef, useEffect } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import type { GraphNode, GraphEdge } from '@/lib/graph/types';

interface LocalGraphProps {
  currentNodeId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

export function LocalGraph({ currentNodeId, nodes, edges, onNodeClick }: LocalGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);

  // Get 1-hop neighborhood
  const neighborIds = new Set<string>();
  neighborIds.add(currentNodeId);

  for (const edge of edges) {
    if (edge.source === currentNodeId) {
      neighborIds.add(edge.target);
    }
    if (edge.target === currentNodeId) {
      neighborIds.add(edge.source);
    }
  }

  const localNodes = nodes.filter(n => neighborIds.has(n.id));
  const localEdges = edges.filter(
    e => neighborIds.has(e.source) && neighborIds.has(e.target)
  );

  useEffect(() => {
    if (!containerRef.current || localNodes.length === 0) return;

    const graph = new Graph();

    // Position nodes in a circle around the center
    const centerNode = localNodes.find(n => n.id === currentNodeId);
    const otherNodes = localNodes.filter(n => n.id !== currentNodeId);
    const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

    if (centerNode) {
      graph.addNode(centerNode.id, {
        x: 0,
        y: 0,
        size: 12,
        label: centerNode.label,
        color: centerNode.color || '#FFB86B',
      });
    }

    otherNodes.forEach((node, i) => {
      const angle = i * angleStep;
      graph.addNode(node.id, {
        x: Math.cos(angle) * 100,
        y: Math.sin(angle) * 100,
        size: 8,
        label: node.label,
        color: node.color || '#FFB86B',
      });
    });

    for (const edge of localEdges) {
      try {
        graph.addEdge(edge.source, edge.target, {
          color: 'rgba(255, 255, 255, 0.15)',
        });
      } catch (e) {
        // Edge may already exist
      }
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelRenderedSizeThreshold: 0,
      labelFont: 'Satoshi, system-ui, sans-serif',
      labelColor: { color: 'rgba(255, 255, 255, 0.72)' },
      labelSize: 10,
      defaultEdgeColor: 'rgba(255, 255, 255, 0.1)',
      minCameraRatio: 0.5,
      maxCameraRatio: 2,
    });

    if (onNodeClick) {
      sigma.on('clickNode', ({ node }) => {
        if (node !== currentNodeId) {
          onNodeClick(node);
        }
      });
    }

    sigmaRef.current = sigma;

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [currentNodeId, localNodes, localEdges, onNodeClick]);

  if (localNodes.length <= 1) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border-1 overflow-hidden">
      <div className="px-4 py-2 border-b border-border-1 bg-surface-1">
        <h3 className="text-sm font-medium text-text-2">
          Local connections
        </h3>
      </div>
      <div
        ref={containerRef}
        className="h-48 bg-bg-0"
      />
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Shows current node at center
- [ ] Connected nodes arranged in circle
- [ ] Edges drawn between connected nodes
- [ ] Clicking node navigates to that content
- [ ] Hidden when no connections exist
- [ ] Renders at appropriate size

---

### Task 6.13: Graph Integration with Search Index

**Description:** Add graph nodes to the Orama search index so they're discoverable via the command palette.

**Files to create/modify:**
- `/lib/search/generate-index.ts` (update)

**Technical approach:**

Update the search index generation to include graph nodes:

```typescript
// Add to /lib/search/generate-index.ts

import graphData from '../../public/graph-data.json';

// In the generateSearchIndex function, add:

// Add graph nodes (ideas, concepts that aren't content)
const ideaNodes = graphData.nodes.filter(
  (node) => node.type === 'idea' || node.type === 'person' || node.type === 'place'
);

for (const node of ideaNodes) {
  documents.push({
    id: `graph-${node.id}`,
    type: 'graph-node',
    title: node.label,
    content: node.tags.join(' '),
    href: `/graph?node=${node.id}`,
    tags: node.tags,
    date: null,
  });
}
```

**Acceptance criteria:**
- [ ] Idea/person/place nodes appear in search
- [ ] Clicking result opens graph with node selected
- [ ] Deduplication prevents content nodes appearing twice

---

### Task 6.14: Sample Graph Data

**Description:** Create sample graph data for development and testing. Include a mix of essays, books, and manually-defined idea nodes.

**Files to create/modify:**
- `/content/graph/nodes.json`
- `/content/graph/edges.json`

**Technical approach:**

```json
// /content/graph/nodes.json
[
  {
    "id": "classical-liberalism",
    "label": "Classical Liberalism",
    "type": "idea",
    "tags": ["philosophy", "governance", "liberty"],
    "weight": 5
  },
  {
    "id": "charter-cities",
    "label": "Charter Cities",
    "type": "idea",
    "tags": ["governance", "reform", "urbanism"],
    "weight": 4
  },
  {
    "id": "paul-romer",
    "label": "Paul Romer",
    "type": "person",
    "tags": ["economist", "charter-cities"],
    "weight": 3
  },
  {
    "id": "special-economic-zones",
    "label": "Special Economic Zones",
    "type": "idea",
    "tags": ["governance", "economics", "development"],
    "weight": 4
  },
  {
    "id": "shenzhen",
    "label": "Shenzhen",
    "type": "place",
    "tags": ["china", "sez", "development"],
    "weight": 3
  }
]
```

```json
// /content/graph/edges.json
[
  {
    "source": "charter-cities",
    "target": "paul-romer",
    "relationship": "influences",
    "weight": 3
  },
  {
    "source": "charter-cities",
    "target": "special-economic-zones",
    "relationship": "expands",
    "weight": 2
  },
  {
    "source": "special-economic-zones",
    "target": "shenzhen",
    "relationship": "references",
    "weight": 2
  },
  {
    "source": "classical-liberalism",
    "target": "charter-cities",
    "relationship": "influences",
    "weight": 2
  }
]
```

**Acceptance criteria:**
- [ ] Sample nodes cover all types
- [ ] Sample edges demonstrate all relationships
- [ ] Data loads correctly in graph builder
- [ ] Graph renders with sample data

---

### Phase 6 Verification Checklist

Before considering Phase 6 complete, verify:

- [ ] Graph data types defined
- [ ] Wikilink parser extracts links correctly
- [ ] Graph pipeline builds from all content sources
- [ ] ForceAtlas2 layout computes stable positions
- [ ] Graph JSON generates at build time
- [ ] Sigma.js canvas renders correctly
- [ ] Node click opens inspector
- [ ] Hover highlights connections
- [ ] Search highlights matching nodes
- [ ] Mobile view shows list alternative
- [ ] Backlinks component works on essay pages
- [ ] Local graph shows neighborhood
- [ ] Graph nodes searchable in command palette
- [ ] Sample data renders correctly
- [ ] Performance acceptable (no jank on 500 nodes)

---

## Implementation Complete

This implementation plan covers all six phases required to build "The Control Room" personal website:

1. **Phase 1: Foundation + Design System** - Project setup, Tailwind v4, typography, layout
2. **Phase 2: Content Pipeline + Writing** - Content Collections, MDX, essays, notes, RSS
3. **Phase 3: Command Palette + Search** - shadcn/ui, Orama, keyboard navigation
4. **Phase 4: Library** - Books schema, cover resolution, reading stats
5. **Phase 5: Newsletter + Polish** - Buttondown, accessibility, easter eggs
6. **Phase 6: Knowledge Graph (Stretch)** - Sigma.js, Graphology, graph explorer

Each phase builds on the previous, with clear dependencies and verification checklists. The plan prioritizes foundation work first, then content infrastructure, then interactive features, and finally polish items.

**Recommended approach:**
- Complete Phases 1-3 for MVP
- Add Phase 4-5 for full launch
- Phase 6 as stretch goal or v2 feature
