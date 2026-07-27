import { TIMESTAMP_PATTERN, verdictSchema, type ClientLedger } from '@/lib/instruments/types'

/**
 * What a verdict filter can name. The six verdicts, plus the state of the claims that carry
 * none: `unverified` is a status in the data rather than a verdict, but a reader filtering
 * the ledger meets it as a seventh band and must be able to share that view.
 */
export const LEDGER_STATE_VALUES = [...verdictSchema.options, 'unverified'] as const
export type LedgerFilterState = (typeof LEDGER_STATE_VALUES)[number]

const LEDGER_STATES: ReadonlySet<string> = new Set(LEDGER_STATE_VALUES)

export interface InstrumentUrlState {
  verdicts: LedgerFilterState[]
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

const MAX_QUERY = 120

/**
 * What the piece actually contains. Shape validation alone lets a URL name section `Z` or
 * claim `C145` — ids that parse but do not exist — so every id-bearing parameter is
 * checked against the piece's own data.
 */
export interface InstrumentVocabulary {
  sections: ReadonlySet<string>
  claims: ReadonlySet<string>
  /** Inclusive upper bound of the episode, in seconds. */
  duration: number
}

/** `h:mm:ss` (or `m:ss`) to a second count. */
export function toSeconds(timestamp: string): number {
  return timestamp.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

/**
 * A piece with no ledger. Every id-bearing parameter is then unknown by definition and gets
 * dropped, which leaves `audit` — the one piece of state an unledgered piece still shares.
 */
export const EMPTY_VOCABULARY: InstrumentVocabulary = {
  sections: new Set(),
  claims: new Set(),
  duration: 0,
}

/** The vocabulary a claims ledger defines: its declared sections, its claim ids, its span. */
export function vocabularyFromLedger(ledger: ClientLedger): InstrumentVocabulary {
  const stamps = ledger.claims.flatMap((claim) => claim.timestamps.map(toSeconds))
  return {
    sections: new Set(ledger.sections.map((section) => section.id)),
    claims: new Set(ledger.claims.map((claim) => claim.id)),
    duration: Math.max(0, ...stamps),
  }
}

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

function parseRange(
  raw: string | null,
  vocabulary?: InstrumentVocabulary,
): [string, string] | null {
  if (raw === null) return null
  const [from, to, ...rest] = raw.split('-')
  if (from === undefined || to === undefined || rest.length > 0) return null
  if (!TIMESTAMP_PATTERN.test(from) || !TIMESTAMP_PATTERN.test(to)) return null
  if (toSeconds(from) > toSeconds(to)) return null
  if (vocabulary && toSeconds(to) > vocabulary.duration) return null
  return [from, to]
}

/**
 * Reads state out of a query string. Anything malformed is dropped, never thrown on.
 * Passing the piece's vocabulary additionally drops ids the piece does not contain.
 */
export function parseInstrumentState(
  params: ReadableParams,
  vocabulary?: InstrumentVocabulary,
): InstrumentUrlState {
  const claim = params.get(PARAMS.claim)
  const query = params.get(PARAMS.query) ?? ''
  const knownSection = (value: string) =>
    vocabulary ? vocabulary.sections.has(value) : /^[A-Z]$/.test(value)
  const knownClaim = (value: string) =>
    vocabulary ? vocabulary.claims.has(value) : /^C\d{3}$/.test(value)

  return {
    verdicts: list(params, PARAMS.verdicts, (value) =>
      LEDGER_STATES.has(value),
    ) as LedgerFilterState[],
    sections: list(params, PARAMS.sections, knownSection),
    claim: claim !== null && knownClaim(claim) ? claim : null,
    range: parseRange(params.get(PARAMS.range), vocabulary),
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
