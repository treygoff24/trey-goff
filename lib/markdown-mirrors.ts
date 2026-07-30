import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { allEssays, allNotes } from 'content-collections'
import { siteUrl } from '@/lib/site-config'

const mirrorsDirectory = join(process.cwd(), 'content', 'mirrors')

function byNewest<T extends { date: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function publishedEssays() {
  return allEssays.filter((essay) => essay.status !== 'draft')
}

function stripMdxStatements(markdown: string): string {
  let fence: string | undefined

  return markdown
    .split('\n')
    .filter((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
      if (fenceMatch) {
        const marker = fenceMatch[1]![0]
        if (!fence) fence = marker
        else if (fence === marker) fence = undefined
        return true
      }

      return Boolean(fence) || !/^\s*(?:import|export)\s+/.test(line)
    })
    .join('\n')
}

/** Removes MDX-only statements and component wrappers without changing ordinary Markdown. */
export function cleanMdx(markdown: string): string {
  return stripMdxStatements(markdown).replace(
    /<\/?[A-Z][\w]*(?:\.[A-Z][\w]*)?(?:\s[^<>]*?)?\s*\/?>/g,
    '',
  )
}

function oneLineSummary(markdown: string): string {
  const summary = cleanMdx(markdown)
    .replace(/^\s*#+\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return summary.length > 220 ? `${summary.slice(0, 217).trimEnd()}...` : summary
}

function mirrorNames(): string[] {
  try {
    return readdirSync(mirrorsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.slice(0, -3))
      .sort()
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
    throw error
  }
}

function mirrorPath(name: string): string | null {
  if (!/^[\w.-]+$/.test(name)) return null
  return join(mirrorsDirectory, `${name}.md`)
}

export function getMirrorNames(): string[] {
  return mirrorNames()
}

export function getMirrorMarkdown(name: string): string | null {
  const path = mirrorPath(name)
  if (!path) return null

  try {
    if (!statSync(path).isFile()) return null
    return readFileSync(path, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
}

function markdownResponseBody(body: string): string {
  return `${body.trimEnd()}\n`
}

export function buildEssayMarkdown(slug: string): string | null {
  const essay = publishedEssays().find((candidate) => candidate.slug === slug)
  if (!essay) return null

  return markdownResponseBody(
    [
      `# ${essay.title}`,
      '',
      `Date: ${essay.date} | Summary: ${essay.summary} | Canonical: ${siteUrl}/writing/${essay.slug}`,
      '',
      cleanMdx(essay.content).trim(),
    ].join('\n'),
  )
}

export function buildNotesMarkdown(): string {
  const sections = byNewest(allNotes).map((note) => {
    const title = note.title || `Note: ${note.date}`
    return [
      `## ${title}`,
      '',
      `Date: ${note.date} | Canonical: ${siteUrl}/notes#${encodeURIComponent(note.slug)}`,
      '',
      cleanMdx(note.content).trim(),
    ].join('\n')
  })

  return markdownResponseBody(['# Notes', '', ...sections].join('\n\n'))
}

function mirrorSitemapEntry(name: string) {
  const content = getMirrorMarkdown(name) ?? ''
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || name

  return {
    title,
    summary: oneLineSummary(content) || `Markdown mirror for ${name}.`,
    url: `${siteUrl}/${name}.md`,
  }
}

export function buildSitemapMarkdown(): string {
  const entries = [
    ...publishedEssays().map((essay) => ({
      title: essay.title,
      summary: essay.summary,
      url: `${siteUrl}/writing/${essay.slug}.md`,
    })),
    {
      title: 'Notes',
      summary: 'Quick thoughts, dispatches, and interesting links.',
      url: `${siteUrl}/notes.md`,
    },
    ...getMirrorNames().map(mirrorSitemapEntry),
    {
      title: 'Markdown sitemap',
      summary: "An index of the site's markdown representations.",
      url: `${siteUrl}/sitemap.md`,
    },
  ]

  return markdownResponseBody(
    [
      '# Markdown sitemap',
      '',
      'Every markdown representation available from this site.',
      '',
      ...entries.map((entry) => `- [${entry.title}](${entry.url}) — ${entry.summary}`),
    ].join('\n'),
  )
}
