/**
 * A marker string every instrument client component stamps onto its root element, so it is
 * compiled verbatim into whatever chunk that component lands in.
 *
 * `scripts/check-bundle-isolation.ts` uses it as the proof of isolation: the sentinel must
 * appear in the client chunks of an instrumented piece and in none of an ordinary essay's.
 * That is a stronger claim than the package-name scan, which cannot see first-party code.
 */
export const INSTRUMENT_SENTINEL = 'tg-instrument-chunk-v1'
