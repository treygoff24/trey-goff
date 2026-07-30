import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { allEssays, allNotes } from 'content-collections'
import { siteUrl } from '@/lib/site-config'

const mirrorsDirectory = join(process.cwd(), 'content', 'mirrors')
const instrumentsDirectory = join(process.cwd(), 'content', 'instruments')

/** Capitalized MDX/JSX component tags (e.g. `<Callout>`, `</Callout.Root />`). */
const CAPITALIZED_JSX_TAG = /<\/?[A-Z][\w]*(?:\.[A-Z][\w]*)?(?:\s[^<>]*?)?\s*\/?>/g

/** Lowercase instrument custom elements (e.g. `<instrument-ledger>`, `</instrument-spine />`). */
const INSTRUMENT_TAG = /<\/?instrument-[\w-]*(?:\s[^<>]*?)?\s*\/?>/g

interface ClaimsLedgerSource {
  title?: string
  episode?: string
  url?: string
  date?: string
}

interface ClaimsLedgerSection {
  id: string
  title: string
}

interface ClaimsLedgerClaim {
  id: string
  section: string
  title: string
  claim: string
  speakers?: string[]
  timestamps?: string[]
  type?: string
  status?: string
  verdict?: string
  verdictLabel?: string
  rationale?: string
  finding?: string | null
  dossier?: string | null
}

interface ClaimsLedger {
  source?: ClaimsLedgerSource
  canonicalIds?: {
    first?: string
    last?: string
    total?: number
    unassigned?: string[]
  }
  sections?: ClaimsLedgerSection[]
  claims: ClaimsLedgerClaim[]
}

function byNewest<T extends { date: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function publishedEssays() {
  return allEssays.filter((essay) => essay.status !== 'draft')
}

function mapOutsideFences(markdown: string, transform: (line: string) => string | null): string {
  let fence: string | undefined

  return markdown
    .split('\n')
    .map((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
      if (fenceMatch) {
        const marker = fenceMatch[1]![0]
        if (!fence) fence = marker
        else if (fence === marker) fence = undefined
        return line
      }

      if (fence) return line
      return transform(line)
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}

function stripMdxStatements(markdown: string): string {
  return mapOutsideFences(markdown, (line) => (/^\s*(?:import|export)\s+/.test(line) ? null : line))
}

function stripTagsOutsideFences(markdown: string): string {
  return mapOutsideFences(markdown, (line) =>
    line.replace(CAPITALIZED_JSX_TAG, '').replace(INSTRUMENT_TAG, ''),
  )
}

/** Removes MDX-only statements and component wrappers without changing ordinary Markdown. */
export function cleanMdx(markdown: string): string {
  return stripTagsOutsideFences(stripMdxStatements(markdown))
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

function loadClaimsLedger(slug: string): ClaimsLedger | null {
  if (!/^[\w.-]+$/.test(slug)) return null

  const path = join(instrumentsDirectory, slug, 'claims.json')
  try {
    if (!statSync(path).isFile()) return null
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ClaimsLedger
    if (!Array.isArray(parsed.claims)) return null
    return parsed
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
}

function formatClaimsLedger(ledger: ClaimsLedger): string {
  const claims = ledger.claims
  const sectionTitles = new Map(
    (ledger.sections ?? []).map((section) => [section.id, section.title]),
  )
  const sourceTitle = ledger.source?.title?.trim() || 'instrument claims'
  const sourceUrl = ledger.source?.url?.trim()
  const sourceBit = sourceUrl ? `${sourceTitle} ([source](${sourceUrl}))` : sourceTitle

  const lines: string[] = ['## Claims ledger', '', `${claims.length} claims from ${sourceBit}.`, '']

  let previousSection: string | undefined
  for (const claim of claims) {
    if (claim.section !== previousSection) {
      previousSection = claim.section
      const sectionTitle = sectionTitles.get(claim.section)
      if (sectionTitle) {
        lines.push(`**${sectionTitle}**`, '')
      }
    }

    lines.push(`### ${claim.id} — ${claim.title}`, '')
    if (claim.verdictLabel) {
      lines.push(`Verdict: ${claim.verdictLabel}`, '')
    }
    lines.push(claim.claim, '')
    if (claim.rationale) {
      lines.push(claim.rationale, '')
    }
    if (claim.timestamps && claim.timestamps.length > 0) {
      lines.push(`Timestamps: ${claim.timestamps.join(', ')}`, '')
    }
  }

  return lines.join('\n').trimEnd()
}

export function buildEssayMarkdown(slug: string): string | null {
  const essay = publishedEssays().find((candidate) => candidate.slug === slug)
  if (!essay) return null

  const parts = [
    `# ${essay.title}`,
    '',
    `Date: ${essay.date} | Summary: ${essay.summary} | Canonical: ${siteUrl}/writing/${essay.slug}`,
    '',
    cleanMdx(essay.content).trim(),
  ]

  const ledger = loadClaimsLedger(slug)
  if (ledger) {
    parts.push('', formatClaimsLedger(ledger))
  }

  return markdownResponseBody(parts.join('\n'))
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
