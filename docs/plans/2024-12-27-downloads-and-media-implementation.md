# Downloads & Media Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add file download capabilities to MDX content and create a `/media` page showcasing podcasts, YouTube videos, and talks.

**Architecture:** Two independent features. (1) Download component + CSS for inline download links, files served from `/public/downloads/`. (2) Media page with JSON data source, auto-fetched YouTube thumbnails, featured section + chronological list with type filters.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Lucide icons, existing component patterns from library page.

---

## Progress

- [x] Task 1.1: Create downloads directory
- [x] Task 1.2: Create Download MDX component
- [x] Task 1.3: Register Download component in MDX
- [x] Task 1.4: Add inline download link styles
- [x] Task 2.1: Create media types
- [x] Task 2.2: Create appearances JSON data file
- [x] Task 2.3: Create media utility functions
- [x] Task 3.1: Create AppearanceCard component
- [x] Task 3.2: Create MediaFilter component
- [x] Task 3.3: Create MediaClient component
- [x] Task 3.4: Create media components index
- [x] Task 4.1: Create media page
- [x] Task 5.1: Add Media to TopNav
- [x] Task 5.2: Add Media to Command Palette
- [x] Task 6.1: Full verification

---

## Phase 1: File Downloads Feature

### Task 1.1: Create downloads directory

**Files:**
- Create: `public/downloads/.gitkeep`

**Step 1: Create the directory with placeholder**

```bash
mkdir -p public/downloads
touch public/downloads/.gitkeep
```

**Step 2: Verify**

```bash
ls -la public/downloads/
```

Expected: `.gitkeep` file exists.

**Step 3: Commit**

```bash
git add public/downloads/.gitkeep
git commit -m "chore: add public/downloads directory for downloadable files"
```

---

### Task 1.2: Create Download MDX component

**Files:**
- Create: `components/mdx/Download.tsx`

**Step 1: Create the component**

```tsx
import { cn } from '@/lib/utils'
import { Download as DownloadIcon } from 'lucide-react'

interface DownloadProps {
  file: string
  label?: string
  size?: string
}

export function Download({ file, label, size }: DownloadProps) {
  const href = `/downloads/${file}`
  const displayLabel = label || file

  return (
    <a
      href={href}
      download
      className={cn(
        'my-6 flex items-center gap-3 rounded-lg border border-border-1 bg-surface-1 p-4',
        'transition-colors hover:border-warm hover:bg-surface-2',
        'group'
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm/10 text-warm">
        <DownloadIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-satoshi font-medium text-text-1 group-hover:text-warm">
          {displayLabel}
        </p>
        {size && (
          <p className="text-sm text-text-3">{size}</p>
        )}
      </div>
      <span className="text-sm text-text-3 group-hover:text-warm">
        Download →
      </span>
    </a>
  )
}
```

**Step 2: Verify file exists and TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/mdx/Download.tsx
git commit -m "feat: add Download MDX component for featured file downloads"
```

---

### Task 1.3: Register Download component in MDX

**Files:**
- Modify: `components/mdx/index.tsx`

**Step 1: Update the MDX components registry**

Replace contents of `components/mdx/index.tsx`:

```tsx
import { Callout } from './Callout'
import { CodeBlock } from './CodeBlock'
import { Download } from './Download'

// MDX components mapping
export const mdxComponents = {
  Callout,
  pre: CodeBlock,
  Download,
}

export { Callout, CodeBlock, Download }
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/mdx/index.tsx
git commit -m "feat: register Download component for MDX content"
```

---

### Task 1.4: Add inline download link styles

**Files:**
- Modify: `app/globals.css`

**Step 1: Find the prose styles section and add download link styling**

Add after existing prose link styles (search for `.prose a` or similar):

```css
/* Download links - auto-styled when href contains /downloads/ */
.prose a[href*="/downloads/"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.prose a[href*="/downloads/"]::before {
  content: '↓';
  font-size: 0.875em;
}
```

**Step 2: Verify build passes**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add inline download link styling for MDX content"
```

---

## Phase 2: Media Data Layer

### Task 2.1: Create media types

**Files:**
- Create: `lib/media/types.ts`

**Step 1: Create the types file**

```ts
export type AppearanceType = 'podcast' | 'youtube' | 'talk' | 'interview'

export interface Appearance {
  id: string
  title: string
  show: string
  type: AppearanceType
  date: string
  url: string
  spotifyUrl?: string
  appleUrl?: string
  youtubeUrl?: string
  featured?: boolean
  summary: string
  showArtwork?: string
}

export interface AppearancesData {
  lastUpdated: string
  appearances: Appearance[]
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add lib/media/types.ts
git commit -m "feat: add media appearance types"
```

---

### Task 2.2: Create appearances JSON data file

**Files:**
- Create: `content/media/appearances.json`

**Step 1: Create the directory and data file**

```bash
mkdir -p content/media
```

Create `content/media/appearances.json`:

```json
{
  "lastUpdated": "2024-12-27",
  "appearances": [
    {
      "id": "prospera-perception-post-scarcity",
      "title": "Próspera, Perception, and Post-Scarcity",
      "show": "The Lunar Society",
      "type": "podcast",
      "date": "2025-11-28",
      "url": "https://www.youtube.com/watch?v=noFicZW7D18",
      "youtubeUrl": "https://www.youtube.com/watch?v=noFicZW7D18",
      "featured": true,
      "summary": "Deep dive into Próspera's governance model, how perception shapes policy outcomes, and why post-scarcity economics changes everything we think about incentives."
    }
  ]
}
```

**Step 2: Verify JSON is valid**

```bash
cat content/media/appearances.json | jq .
```

Expected: Formatted JSON output, no errors.

**Step 3: Commit**

```bash
git add content/media/appearances.json
git commit -m "feat: add appearances JSON data file with initial entry"
```

---

### Task 2.3: Create media utility functions

**Files:**
- Create: `lib/media/index.ts`

**Step 1: Create the utilities file**

```ts
import appearancesData from '@/content/media/appearances.json'
import type { Appearance, AppearancesData, AppearanceType } from './types'

// Get all appearances
export function getAllAppearances(): Appearance[] {
  return (appearancesData as AppearancesData).appearances
}

// Get featured appearances
export function getFeaturedAppearances(): Appearance[] {
  return getAllAppearances().filter((a) => a.featured)
}

// Get appearances by type
export function getAppearancesByType(type: AppearanceType): Appearance[] {
  return getAllAppearances().filter((a) => a.type === type)
}

// Get all unique types
export function getAllTypes(): AppearanceType[] {
  const types = new Set<AppearanceType>()
  getAllAppearances().forEach((a) => types.add(a.type))
  return Array.from(types)
}

// Sort appearances by date (newest first)
export function sortAppearancesByDate(appearances: Appearance[]): Appearance[] {
  return [...appearances].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(url: string): string | null {
  const videoId = extractYouTubeId(url)
  return videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null
}

// Get thumbnail for appearance (YouTube auto-fetch or showArtwork)
export function getAppearanceThumbnail(appearance: Appearance): string | null {
  // Try YouTube URL first
  const youtubeUrl = appearance.youtubeUrl || appearance.url
  if (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be')) {
    const thumbnail = getYouTubeThumbnail(youtubeUrl)
    if (thumbnail) return thumbnail
  }
  // Fall back to show artwork
  return appearance.showArtwork || null
}

export type { Appearance, AppearancesData, AppearanceType } from './types'
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add lib/media/index.ts
git commit -m "feat: add media utility functions with YouTube thumbnail extraction"
```

---

## Phase 3: Media Page Components

### Task 3.1: Create AppearanceCard component

**Files:**
- Create: `components/media/AppearanceCard.tsx`

**Step 1: Create the component**

```tsx
'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ExternalLink, Mic, Video, Presentation } from 'lucide-react'
import type { Appearance, AppearanceType } from '@/lib/media/types'
import { getAppearanceThumbnail } from '@/lib/media'
import { formatDate } from '@/lib/utils'

interface AppearanceCardProps {
  appearance: Appearance
  variant?: 'featured' | 'list'
}

const typeConfig: Record<
  AppearanceType,
  { label: string; icon: typeof Mic; className: string }
> = {
  podcast: {
    label: 'Podcast',
    icon: Mic,
    className: 'bg-accent/20 text-accent',
  },
  youtube: {
    label: 'YouTube',
    icon: Video,
    className: 'bg-error/20 text-error',
  },
  talk: {
    label: 'Talk',
    icon: Presentation,
    className: 'bg-warm/20 text-warm',
  },
  interview: {
    label: 'Interview',
    icon: Mic,
    className: 'bg-success/20 text-success',
  },
}

export function AppearanceCard({
  appearance,
  variant = 'list',
}: AppearanceCardProps) {
  const thumbnail = getAppearanceThumbnail(appearance)
  const config = typeConfig[appearance.type]
  const Icon = config.icon

  const isFeatured = variant === 'featured'

  return (
    <a
      href={appearance.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block overflow-hidden rounded-lg border border-border-1 bg-surface-1',
        'transition-all hover:border-warm hover:shadow-lg',
        isFeatured ? 'flex flex-col md:flex-row' : ''
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative overflow-hidden bg-surface-2',
          isFeatured
            ? 'aspect-video md:aspect-auto md:w-80 md:shrink-0'
            : 'aspect-video'
        )}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={appearance.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-12 w-12 text-text-3" />
          </div>
        )}
        {/* Type badge */}
        <div
          className={cn(
            'absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            config.className
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col p-4', isFeatured && 'md:p-6')}>
        <div className="mb-2 flex items-center gap-2 text-sm text-text-3">
          <span>{appearance.show}</span>
          <span>·</span>
          <span>{formatDate(new Date(appearance.date))}</span>
        </div>

        <h3
          className={cn(
            'font-satoshi font-medium text-text-1 group-hover:text-warm',
            isFeatured ? 'mb-3 text-xl' : 'mb-2 text-base'
          )}
        >
          {appearance.title}
        </h3>

        {isFeatured && appearance.summary && (
          <p className="mb-4 line-clamp-3 flex-1 text-sm text-text-2">
            {appearance.summary}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1 text-sm text-text-3 group-hover:text-warm">
          <span>Watch</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </a>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/media/AppearanceCard.tsx
git commit -m "feat: add AppearanceCard component with thumbnail support"
```

---

### Task 3.2: Create MediaFilter component

**Files:**
- Create: `components/media/MediaFilter.tsx`

**Step 1: Create the component**

```tsx
'use client'

import { cn } from '@/lib/utils'
import type { AppearanceType } from '@/lib/media/types'

interface MediaFilterProps {
  activeFilter: AppearanceType | null
  onFilterChange: (filter: AppearanceType | null) => void
  availableTypes: AppearanceType[]
}

const typeLabels: Record<AppearanceType, string> = {
  podcast: 'Podcasts',
  youtube: 'YouTube',
  talk: 'Talks',
  interview: 'Interviews',
}

export function MediaFilter({
  activeFilter,
  onFilterChange,
  availableTypes,
}: MediaFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterChange(null)}
        className={cn(
          'rounded-full px-3 py-1 text-sm transition-colors',
          activeFilter === null
            ? 'bg-warm text-bg-0'
            : 'bg-surface-1 text-text-2 hover:bg-surface-2'
        )}
      >
        All
      </button>
      {availableTypes.map((type) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={cn(
            'rounded-full px-3 py-1 text-sm transition-colors',
            activeFilter === type
              ? 'bg-warm text-bg-0'
              : 'bg-surface-1 text-text-2 hover:bg-surface-2'
          )}
        >
          {typeLabels[type]}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/media/MediaFilter.tsx
git commit -m "feat: add MediaFilter component for type filtering"
```

---

### Task 3.3: Create MediaClient component

**Files:**
- Create: `components/media/MediaClient.tsx`

**Step 1: Create the client component that handles filtering**

```tsx
'use client'

import { useState, useMemo } from 'react'
import type { Appearance, AppearanceType } from '@/lib/media/types'
import { sortAppearancesByDate } from '@/lib/media'
import { AppearanceCard } from './AppearanceCard'
import { MediaFilter } from './MediaFilter'

interface MediaClientProps {
  appearances: Appearance[]
  featuredAppearances: Appearance[]
  availableTypes: AppearanceType[]
}

export function MediaClient({
  appearances,
  featuredAppearances,
  availableTypes,
}: MediaClientProps) {
  const [typeFilter, setTypeFilter] = useState<AppearanceType | null>(null)

  const filteredAppearances = useMemo(() => {
    // Exclude featured from main list
    const featuredIds = new Set(featuredAppearances.map((a) => a.id))
    let filtered = appearances.filter((a) => !featuredIds.has(a.id))

    if (typeFilter) {
      filtered = filtered.filter((a) => a.type === typeFilter)
    }

    return sortAppearancesByDate(filtered)
  }, [appearances, featuredAppearances, typeFilter])

  return (
    <>
      {/* Featured section */}
      {featuredAppearances.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-satoshi text-xl font-medium text-text-1">
            Featured
          </h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {featuredAppearances.map((appearance) => (
              <AppearanceCard
                key={appearance.id}
                appearance={appearance}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* Filter bar */}
      <section className="mb-8">
        <MediaFilter
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
          availableTypes={availableTypes}
        />
      </section>

      {/* All appearances */}
      <section>
        {filteredAppearances.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAppearances.map((appearance) => (
              <AppearanceCard key={appearance.id} appearance={appearance} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-text-3">
            No {typeFilter ? `${typeFilter}s` : 'appearances'} yet.
          </p>
        )}
      </section>
    </>
  )
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/media/MediaClient.tsx
git commit -m "feat: add MediaClient component with filtering logic"
```

---

### Task 3.4: Create media components index

**Files:**
- Create: `components/media/index.tsx`

**Step 1: Create the barrel export**

```tsx
export { AppearanceCard } from './AppearanceCard'
export { MediaFilter } from './MediaFilter'
export { MediaClient } from './MediaClient'
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm typecheck
```

Expected: No errors.

**Step 3: Commit**

```bash
git add components/media/index.tsx
git commit -m "feat: add media components barrel export"
```

---

## Phase 4: Media Page Route

### Task 4.1: Create media page

**Files:**
- Create: `app/media/page.tsx`

**Step 1: Create the page**

```tsx
import { MediaClient } from '@/components/media'
import {
  getAllAppearances,
  getFeaturedAppearances,
  getAllTypes,
} from '@/lib/media'

export const metadata = {
  title: 'Media',
  description: 'Podcasts, interviews, and talks.',
}

export default function MediaPage() {
  const appearances = getAllAppearances()
  const featuredAppearances = getFeaturedAppearances()
  const availableTypes = getAllTypes()

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Media
        </h1>
        <p className="max-w-2xl text-lg text-text-2">
          Podcasts, interviews, and talks on governance, technology, and building better systems.
        </p>
      </header>

      <MediaClient
        appearances={appearances}
        featuredAppearances={featuredAppearances}
        availableTypes={availableTypes}
      />
    </div>
  )
}
```

**Step 2: Verify build passes**

```bash
pnpm build
```

Expected: Build succeeds, media page generated.

**Step 3: Commit**

```bash
git add app/media/page.tsx
git commit -m "feat: add /media page route"
```

---

## Phase 5: Navigation Integration

### Task 5.1: Add Media to TopNav

**Files:**
- Modify: `components/layout/TopNav.tsx`

**Step 1: Add Media to navItems array**

Find the `navItems` array near line 9 and update it:

```tsx
const navItems = [
  { href: '/writing', label: 'Writing' },
  { href: '/library', label: 'Library' },
  { href: '/media', label: 'Media' },
  { href: '/topics', label: 'Topics' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
]
```

**Step 2: Verify build passes**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add components/layout/TopNav.tsx
git commit -m "feat: add Media to top navigation"
```

---

### Task 5.2: Add Media to Command Palette

**Files:**
- Modify: `components/command/CommandPalette.tsx`

**Step 1: Add Video import to lucide-react imports**

Update the import at line 18-29:

```tsx
import {
  FileText,
  Book,
  Folder,
  User,
  Link,
  Rss,
  Home,
  Clock,
  BookOpen,
  Network,
  Hash,
  Video,
} from 'lucide-react'
```

**Step 2: Add Media CommandItem in QuickActions**

Find the Navigation CommandGroup (around line 99) and add after Library:

```tsx
<CommandItem onSelect={() => onSelect('/media')}>
  <Video className="mr-2 h-4 w-4" />
  Media
</CommandItem>
```

**Step 3: Verify build passes**

```bash
pnpm build
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add components/command/CommandPalette.tsx
git commit -m "feat: add Media to command palette navigation"
```

---

## Phase 6: Final Verification

### Task 6.1: Full verification

**Step 1: Run full verification suite**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: All pass.

**Step 2: Test dev server**

```bash
pnpm dev
```

Manually verify:
- [ ] `/media` page loads with featured appearance
- [ ] Type filters work
- [ ] YouTube thumbnail loads
- [ ] Cards link to external URLs
- [ ] Command palette (⌘K) shows Media option
- [ ] Top nav shows Media link

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues from verification"
```

---

## Summary

**Files created:**
- `public/downloads/.gitkeep`
- `components/mdx/Download.tsx`
- `lib/media/types.ts`
- `lib/media/index.ts`
- `content/media/appearances.json`
- `components/media/AppearanceCard.tsx`
- `components/media/MediaFilter.tsx`
- `components/media/MediaClient.tsx`
- `components/media/index.tsx`
- `app/media/page.tsx`

**Files modified:**
- `components/mdx/index.tsx`
- `app/globals.css`
- `components/layout/TopNav.tsx`
- `components/command/CommandPalette.tsx`

**Total tasks:** 12
**Estimated commits:** 12
