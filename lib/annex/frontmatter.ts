export interface AnnexEntry {
  slug: string
  title: string
  date: string
  summary: string
  body: string
  wordCount: number
  readingTime: number
}

function unquote(value: string): string {
  const quote = value[0]
  return quote && quote === value.at(-1) && (quote === '"' || quote === "'")
    ? value.slice(1, -1)
    : value
}

export function parseAnnexEntry(source: string, slug: string): AnnexEntry {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(source)
  if (!match || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Invalid annex entry')
  }
  const [, frontmatter = '', rawBody = ''] = match

  const fields: Record<string, string> = Object.fromEntries(
    frontmatter.split(/\r?\n/).map((line) => {
      const separator = line.indexOf(':')
      if (separator < 1) throw new Error('Invalid annex frontmatter')
      return [line.slice(0, separator).trim(), unquote(line.slice(separator + 1).trim())]
    }),
  )
  const { title, date, summary } = fields
  if (
    !title ||
    !date ||
    !summary ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Annex entry is missing required frontmatter')
  }

  const body = rawBody.trim()
  const wordCount = body ? body.split(/\s+/).length : 0
  return {
    slug,
    title,
    date,
    summary,
    body,
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / 225)),
  }
}
