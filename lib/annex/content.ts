import { Buffer } from 'node:buffer'
import { parseAnnexEntry, type AnnexEntry } from '@/lib/annex/frontmatter'

const CACHE_TTL_MS = 60_000
const GITHUB_API = 'https://api.github.com'
const FETCH_TIMEOUT_MS = 6_000
const MAX_ANNEX_ENTRIES = 50
const ENTRY_FETCH_CONCURRENCY = 4
const MAX_DECODED_ENTRY_BYTES = 256 * 1024
const MAX_BASE64_ENTRY_CHARS = Math.ceil((MAX_DECODED_ENTRY_BYTES / 3) * 4)

export type AnnexArchive = { status: 'ready'; entries: AnnexEntry[] } | { status: 'unavailable' }

interface AnnexContentOptions {
  token?: string
  repo?: string
  fetcher?: typeof fetch
  now?: number
  apiUrl?: string
}

interface GitHubDirectoryItem {
  name: string
  path: string
  type: string
}

let cache: { repo: string; expiresAt: number; entries: AnnexEntry[] } | undefined

function githubHeaders(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

async function fetchJson(url: string, token: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url, {
    cache: 'no-store',
    headers: githubHeaders(token),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
  return response.json()
}

function isDirectoryItem(value: unknown): value is GitHubDirectoryItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    item.type === 'file' &&
    typeof item.name === 'string' &&
    typeof item.path === 'string' &&
    /^entries\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(item.path)
  )
}

async function fetchEntry(
  item: GitHubDirectoryItem,
  repoUrl: string,
  token: string,
  fetcher: typeof fetch,
): Promise<AnnexEntry> {
  const data = await fetchJson(`${repoUrl}/contents/${item.path}`, token, fetcher)
  if (!data || typeof data !== 'object') throw new Error('Invalid GitHub file response')
  const file = data as Record<string, unknown>
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('Invalid GitHub file content')
  }
  const slug = item.name.slice(0, -3)
  if (file.content.length > MAX_BASE64_ENTRY_CHARS * 2) {
    throw new Error('Annex entry exceeds encoded size limit')
  }
  const encoded = file.content.replace(/\s/g, '')
  if (encoded.length > MAX_BASE64_ENTRY_CHARS) {
    throw new Error('Annex entry exceeds decoded size limit')
  }
  const decoded = Buffer.from(encoded, 'base64')
  if (decoded.length > MAX_DECODED_ENTRY_BYTES) {
    throw new Error('Annex entry exceeds decoded size limit')
  }
  return parseAnnexEntry(decoded.toString('utf8'), slug)
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const index = next++
        results[index] = await mapper(values[index]!)
      }
    }),
  )
  return results
}

export async function getAnnexArchive(options: AnnexContentOptions = {}): Promise<AnnexArchive> {
  const token = options.token ?? process.env.ANNEX_GITHUB_TOKEN ?? ''
  const repo = options.repo ?? process.env.ANNEX_CONTENT_REPO ?? ''
  const fetcher = options.fetcher ?? fetch
  const now = options.now ?? Date.now()
  const apiUrl = options.apiUrl ?? process.env.ANNEX_GITHUB_API_URL ?? GITHUB_API
  const useCache =
    options.fetcher === undefined && options.token === undefined && options.repo === undefined

  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return { status: 'unavailable' }
  }
  if (useCache && cache?.repo === repo && cache.expiresAt > now) {
    return { status: 'ready', entries: cache.entries }
  }

  try {
    const repoUrl = `${apiUrl.replace(/\/$/, '')}/repos/${repo}`
    const directory = await fetchJson(`${repoUrl}/contents/entries`, token, fetcher)
    if (!Array.isArray(directory)) throw new Error('Invalid GitHub directory response')
    const items = directory.filter(isDirectoryItem).slice(0, MAX_ANNEX_ENTRIES)
    const entries = await mapWithConcurrency(items, ENTRY_FETCH_CONCURRENCY, (item) =>
      fetchEntry(item, repoUrl, token, fetcher),
    )
    entries.sort((left, right) => right.date.localeCompare(left.date))
    if (useCache) cache = { repo, expiresAt: now + CACHE_TTL_MS, entries }
    return { status: 'ready', entries }
  } catch {
    return { status: 'unavailable' }
  }
}
