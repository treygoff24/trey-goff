import { verdictSchema, type Verdict } from '@/lib/instruments/types'

export interface InstrumentUrlState {
  verdicts: Verdict[]
  sections: string[]
  claim: string | null
  /** Inclusive timestamp brush over the episode, as `h:mm:ss` bounds. */
  range: [string, string] | null
  query: string
  audit: boolean
}

export const PARAMS = {
  verdicts: 'v',
  sections: 's',
  claim: 'claim',
  range: 'range',
  query: 'q',
  audit: 'audit',
} as const

export const DEFAULT_INSTRUMENT_STATE: InstrumentUrlState = {
  verdicts: [],
  sections: [],
  claim: null,
  range: null,
  query: '',
  audit: false,
}

const SECTION = /^[A-Z]$/
const CLAIM_ID = /^C\d{3}$/
const TIMESTAMP = /^\d+:\d{2}:\d{2}$/
const MAX_QUERY = 120

interface ReadableParams {
  get(name: string): string | null
}

function list(params: ReadableParams, name: string, keep: (value: string) => boolean): string[] {
  const raw = params.get(name)
  if (raw === null) return []
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(keep)
  return [...new Set(values)]
}

function seconds(timestamp: string): number {
  return timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

function parseRange(raw: string | null): [string, string] | null {
  if (raw === null) return null
  const [from, to, ...rest] = raw.split('-')
  if (from === undefined || to === undefined || rest.length > 0) return null
  if (!TIMESTAMP.test(from) || !TIMESTAMP.test(to)) return null
  return seconds(from) <= seconds(to) ? [from, to] : null
}

/** Reads state out of a query string. Anything malformed is dropped, never thrown on. */
export function parseInstrumentState(params: ReadableParams): InstrumentUrlState {
  const claim = params.get(PARAMS.claim)
  const query = params.get(PARAMS.query) ?? ''

  return {
    verdicts: list(
      params,
      PARAMS.verdicts,
      (value) => verdictSchema.safeParse(value).success,
    ) as Verdict[],
    sections: list(params, PARAMS.sections, (value) => SECTION.test(value)),
    claim: claim !== null && CLAIM_ID.test(claim) ? claim : null,
    range: parseRange(params.get(PARAMS.range)),
    query: query.length <= MAX_QUERY ? query : '',
    audit: params.get(PARAMS.audit) === '1',
  }
}

/**
 * Writes state back into `search`, preserving every parameter the codec does not own.
 * Default-valued state drops its parameter rather than encoding an empty one.
 */
export function serializeInstrumentState(state: InstrumentUrlState, search = ''): string {
  const params = new URLSearchParams(search)

  const set = (name: string, value: string | null) => {
    if (value === null || value === '') params.delete(name)
    else params.set(name, value)
  }

  set(PARAMS.verdicts, state.verdicts.join(','))
  set(PARAMS.sections, state.sections.join(','))
  set(PARAMS.claim, state.claim)
  set(PARAMS.range, state.range ? state.range.join('-') : null)
  set(PARAMS.query, state.query.slice(0, MAX_QUERY))
  set(PARAMS.audit, state.audit ? '1' : null)

  const encoded = params.toString()
  return encoded === '' ? '' : `?${encoded}`
}

/** The URL the given state should live at, keeping the current path and hash. */
export function instrumentStateUrl(state: InstrumentUrlState, location: URL | Location): string {
  return `${location.pathname}${serializeInstrumentState(state, location.search)}${location.hash}`
}

export function instrumentStatesEqual(a: InstrumentUrlState, b: InstrumentUrlState): boolean {
  return serializeInstrumentState(a) === serializeInstrumentState(b)
}
