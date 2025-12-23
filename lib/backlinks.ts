import { allEssays, allNotes, allProjects } from 'content-collections'
import {
  extractWikilinksFromMarkdown,
  resolveWikiLink,
  type WikiLinkType,
  type WikiLinkTarget,
} from '@/lib/wikilinks'

export interface LinkEntry {
  id: string
  type: WikiLinkType
  title: string
  url: string
}

interface SourceEntry extends LinkEntry {
  content: string
}

interface BacklinkIndex {
  backlinks: Map<string, LinkEntry[]>
  outgoing: Map<string, LinkEntry[]>
}

const typeOrder: Record<WikiLinkType, number> = {
  essay: 1,
  project: 2,
  note: 3,
  topic: 4,
}

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

let cachedIndex: BacklinkIndex | null = null

function toLinkEntry(target: WikiLinkTarget): LinkEntry {
  return {
    id: target.id,
    type: target.type,
    title: target.title,
    url: target.url,
  }
}

function sortEntries(entries: LinkEntry[]): LinkEntry[] {
  return [...entries].sort((a, b) => {
    const typeDelta = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
    if (typeDelta !== 0) return typeDelta
    return a.title.localeCompare(b.title)
  })
}

function buildIndex(): BacklinkIndex {
  const backlinks = new Map<string, LinkEntry[]>()
  const outgoing = new Map<string, LinkEntry[]>()

  const sources: SourceEntry[] = [
    ...visibleEssays.map((essay) => ({
      id: `essay:${essay.slug}`,
      type: 'essay' as const,
      title: essay.title,
      url: `/writing/${essay.slug}`,
      content: essay.content,
    })),
    ...allProjects.map((project) => ({
      id: `project:${project.slug}`,
      type: 'project' as const,
      title: project.name,
      url: `/projects#${project.slug}`,
      content: project.content,
    })),
    ...allNotes.map((note) => ({
      id: `note:${note.slug}`,
      type: 'note' as const,
      title: note.title || `Note from ${note.date}`,
      url: `/notes#${note.slug}`,
      content: note.content,
    })),
  ]

  for (const source of sources) {
    const rawTargets = extractWikilinksFromMarkdown(source.content)
    const uniqueTargets = new Map<string, WikiLinkTarget>()

    for (const rawTarget of rawTargets) {
      const resolved = resolveWikiLink(rawTarget)
      if (!resolved) continue
      if (resolved.id === source.id) continue
      uniqueTargets.set(resolved.id, resolved)
    }

    if (uniqueTargets.size > 0) {
      const outgoingEntries = Array.from(uniqueTargets.values()).map(toLinkEntry)
      outgoing.set(source.id, sortEntries(outgoingEntries))
    }

    for (const resolved of uniqueTargets.values()) {
      const entry: LinkEntry = {
        id: source.id,
        type: source.type,
        title: source.title,
        url: source.url,
      }
      const existing = backlinks.get(resolved.id) ?? []
      existing.push(entry)
      backlinks.set(resolved.id, existing)
    }
  }

  for (const [key, entries] of backlinks.entries()) {
    backlinks.set(key, sortEntries(entries))
  }

  return { backlinks, outgoing }
}

function getIndex(): BacklinkIndex {
  if (!cachedIndex) {
    cachedIndex = buildIndex()
  }
  return cachedIndex
}

export function getBacklinksForEssay(slug: string): LinkEntry[] {
  return getIndex().backlinks.get(`essay:${slug}`) ?? []
}

export function getOutgoingLinksForEssay(slug: string): LinkEntry[] {
  return getIndex().outgoing.get(`essay:${slug}`) ?? []
}

export function getBacklinksForNote(slug: string): LinkEntry[] {
  return getIndex().backlinks.get(`note:${slug}`) ?? []
}

export function getOutgoingLinksForNote(slug: string): LinkEntry[] {
  return getIndex().outgoing.get(`note:${slug}`) ?? []
}
