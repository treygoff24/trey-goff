import type { EditionKind } from '@/lib/edition/schema'

export interface EditionCatalogLookupItem {
  type: EditionKind
  slug: string
  title: string
  summary: string
  tags: string[]
  href: string
  meta: string
  coverUrl?: string
  accent?: string
}

export interface EditionCatalogItem extends EditionCatalogLookupItem {
  date: string
}

export type EditionClientCatalogItem = EditionCatalogLookupItem

export interface ResolvedEditionSection {
  kind: EditionKind
  lede: string
  items: EditionClientCatalogItem[]
}

const KINDS = new Set<EditionKind>(['essays', 'projects', 'library', 'transmissions', 'about'])

export const EDITION_KIND_LABELS: Record<EditionKind, string> = {
  essays: 'Writing',
  projects: 'Projects',
  library: 'From the library',
  transmissions: 'Elsewhere',
  about: 'About',
}

export function sanitizeModelText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.replace(/https?:\/\//gi, '').slice(0, maxLength)
}

export function resolveCatalogItem(
  catalog: readonly EditionClientCatalogItem[],
  kind: EditionKind,
  slug: string,
): EditionClientCatalogItem | undefined {
  return catalog.find((item) => item.type === kind && item.slug === slug)
}

// The same work can exist under two kinds (an essay and its external printing),
// so cross-section dedup keys on normalized title, first appearance wins.
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function resolveEditionSections(
  catalog: readonly EditionClientCatalogItem[],
  sections: unknown,
): ResolvedEditionSection[] {
  if (!Array.isArray(sections)) return []

  const seenTitles = new Set<string>()

  return sections.slice(0, 4).flatMap((section) => {
    if (!section || typeof section !== 'object') return []

    const candidate = section as { kind?: unknown; lede?: unknown; slugs?: unknown }
    if (typeof candidate.kind !== 'string' || !KINDS.has(candidate.kind as EditionKind)) {
      return []
    }

    const kind = candidate.kind as EditionKind
    const slugs = Array.isArray(candidate.slugs) ? candidate.slugs.slice(0, 4) : []
    const items = slugs.flatMap((slug) => {
      if (typeof slug !== 'string') return []
      const item = resolveCatalogItem(catalog, kind, slug)
      if (!item || seenTitles.has(titleKey(item.title))) return []
      seenTitles.add(titleKey(item.title))
      return [item]
    })

    if (items.length === 0) return []

    return [
      {
        kind,
        lede: sanitizeModelText(candidate.lede, 200),
        items,
      },
    ]
  })
}
