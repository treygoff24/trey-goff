import { attemptDate, isValidDate, type Instrument } from './instrument'

export interface ActivityDay {
  date: string
  count: number
}

export interface ShippingRepo {
  name: string
  fullName: string
  url: string
  description: string | null
  language: string | null
  touchedAt: string
}

export interface ShippingData {
  days: ActivityDay[]
  repos: ShippingRepo[]
  eventCount: number
}

interface GitHubEvent {
  created_at: string
  repo: {
    name: string
  }
}

interface GitHubRepo {
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  pushed_at: string
  fork: boolean
  private: boolean
}

function isEvent(value: unknown): value is GitHubEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as GitHubEvent
  return (
    isValidDate(event.created_at) &&
    !!event.repo &&
    typeof event.repo.name === 'string' &&
    /^[^/]+\/[^/]+$/.test(event.repo.name)
  )
}

function isRepo(value: unknown): value is GitHubRepo {
  if (!value || typeof value !== 'object') return false
  const repo = value as GitHubRepo
  return (
    typeof repo.name === 'string' &&
    repo.name.trim() !== '' &&
    typeof repo.full_name === 'string' &&
    /^[^/]+\/[^/]+$/.test(repo.full_name) &&
    isHttpUrl(repo.html_url) &&
    isValidDate(repo.pushed_at) &&
    (repo.description === null || typeof repo.description === 'string') &&
    (repo.language === null || typeof repo.language === 'string') &&
    typeof repo.fork === 'boolean' &&
    typeof repo.private === 'boolean'
  )
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function getShippingInstrument(
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<Instrument<ShippingData>> {
  const source = 'api.github.com/users/treygoff · public events + repos'

  try {
    if (process.env.MISSION_CONTROL_FORCE_GITHUB_FAILURE === 'true') {
      throw new Error('GitHub failure forced for e2e')
    }

    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'trey-goff-mission-control',
    }
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

    const [eventResponses, reposResponse] = await Promise.all([
      Promise.all(
        [1, 2, 3].map((page) =>
          fetcher(`https://api.github.com/users/treygoff/events/public?per_page=100&page=${page}`, {
            headers,
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(6000),
          }),
        ),
      ),
      fetcher('https://api.github.com/users/treygoff/repos?per_page=100&sort=pushed', {
        headers,
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000),
      }),
    ])

    if (eventResponses.some((response) => !response.ok) || !reposResponse.ok) {
      throw new Error('GitHub request failed')
    }

    const [eventPages, repoValues]: [unknown[], unknown] = await Promise.all([
      Promise.all(eventResponses.map((response) => response.json())),
      reposResponse.json(),
    ])
    if (eventPages.some((page) => !Array.isArray(page)) || !Array.isArray(repoValues)) {
      throw new Error('Unexpected GitHub response')
    }
    const eventValues = eventPages.flatMap((page) => page as unknown[])

    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(now)
      date.setUTCDate(now.getUTCDate() - (29 - index))
      return { date: date.toISOString().slice(0, 10), count: 0 }
    })
    const daysByDate = new Map(days.map((day) => [day.date, day]))
    if (!eventValues.every(isEvent) || !repoValues.every(isRepo)) {
      throw new Error('Malformed GitHub response')
    }
    const events = eventValues
    for (const event of events) {
      const day = daysByDate.get(event.created_at.slice(0, 10))
      if (day) day.count += 1
    }

    const repoMetadata = new Map(repoValues.map((repo) => [repo.full_name, repo]))
    const repos = Array.from(
      events
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .reduce((touched, event) => {
          if (!touched.has(event.repo.name)) touched.set(event.repo.name, event.created_at)
          return touched
        }, new Map<string, string>())
        .entries(),
    )
      .slice(0, 3)
      .map(([fullName, touchedAt]) => {
        const metadata = repoMetadata.get(fullName)
        return {
          name: fullName.split('/')[1]!,
          fullName,
          url: metadata?.html_url ?? `https://github.com/${fullName}`,
          description: metadata?.description ?? null,
          language: metadata?.language ?? null,
          touchedAt,
        }
      })

    return {
      data: { days, repos, eventCount: days.reduce((total, day) => total + day.count, 0) },
      asOf: now.toISOString(),
      source,
      stale: false,
    }
  } catch {
    return {
      data: null,
      asOf: attemptDate(now),
      source,
      stale: false,
    }
  }
}
