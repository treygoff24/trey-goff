# Downloads & Media Page Design

## Overview

Two features for trey.world:
1. **File Downloads** — Inline links and components for downloadable files in MDX content
2. **Media Page** — Showcase podcasts, YouTube videos, and talks with auto-thumbnails

---

## Feature 1: File Downloads

### Inline Download Links

Regular markdown links to `/public/downloads/` auto-styled with download icon:

```md
Grab the [full dataset](/downloads/dataset.csv) to follow along.
```

### Download Component

Featured downloads use `<Download>` MDX component:

```jsx
<Download
  file="research-data.zip"
  label="Download Research Data"
  size="2.4 MB"
/>
```

Renders as styled card with filename, label, size, and download icon.

### File Storage

All files in `/public/downloads/`. Next.js serves directly, no build step.

---

## Feature 2: Media Page

### Route

`/media` — Top-level navigation

### Data Structure

File: `content/media/appearances.json`

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
      "url": "https://youtube.com/watch?v=noFicZW7D18",
      "spotifyUrl": "https://open.spotify.com/episode/...",
      "featured": true,
      "summary": "Deep dive into Próspera's governance model...",
      "showArtwork": "https://i.scdn.co/image/..."
    }
  ]
}
```

**Fields:**
- `id` — URL slug, unique identifier
- `title` — Episode/talk title
- `show` — Podcast name, channel, or conference
- `type` — `"podcast"` | `"youtube"` | `"talk"` | `"interview"`
- `date` — ISO date for sorting
- `url` — Primary link (YouTube, Spotify, conference site)
- `spotifyUrl` / `appleUrl` — Optional secondary links
- `featured` — Boolean, pins to top of page
- `summary` — 1-2 paragraph executive summary
- `showArtwork` — URL for podcast/show logo (YouTube auto-fetches)

### Page Layout

1. **Header** — "Media" title, intro line
2. **Featured section** — 2-3 pinned appearances, large cards with thumbnails and summary excerpt
3. **Filter bar** — Pills: All | Podcasts | YouTube | Talks
4. **Chronological list** — All appearances, newest first, smaller cards

### Thumbnail Logic

1. YouTube URL → auto-fetch `https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg`
2. `showArtwork` field → use that
3. Fallback → placeholder with type icon

### Behavior

- Cards link externally (new tab)
- No internal detail pages
- Accessible via Cmd+K command palette

---

## Files to Create

```
content/media/appearances.json       # Data file
app/media/page.tsx                   # Media page
components/media/
  AppearanceCard.tsx                 # Card component (featured + list variants)
  MediaFilter.tsx                    # Type filter pills
components/mdx/
  Download.tsx                       # Download component for MDX
public/downloads/                    # Downloadable files directory
```

## Files to Modify

- `components/mdx/index.tsx` — Add Download component
- `app/globals.css` — Inline download link styles
- Command palette config — Add /media route
