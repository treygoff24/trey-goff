import { existsSync, readFileSync, writeFileSync } from 'fs'

/** The shape a JSON object takes once it comes back off disk, with no schema attached. */
type JsonRecord = Record<string, unknown>

/**
 * Shallow-copy a payload into a keyed record. Generator payloads are declared as
 * interfaces, which TypeScript refuses to widen to an index signature even though
 * every one of them is a plain JSON object at runtime — so the assertion lives here,
 * once, instead of at every call site.
 */
function toRecord(value: object): JsonRecord {
  return { ...value } as JsonRecord
}

function omitKeys(value: JsonRecord, keys: readonly string[]): JsonRecord {
  const clone = { ...value }
  for (const key of keys) {
    delete clone[key]
  }
  return clone
}

interface StableJsonOptions {
  formatting?: number
  preserveKeys?: readonly string[]
}

export function writeStableJsonFile<T extends object>(
  filePath: string,
  payload: T,
  { formatting = 2, preserveKeys = [] }: StableJsonOptions = {},
): { changed: boolean; preservedTimestamp: boolean } {
  let nextPayload: T | JsonRecord = payload
  let preservedTimestamp = false

  if (existsSync(filePath)) {
    const existingPayload = JSON.parse(readFileSync(filePath, 'utf-8')) as JsonRecord

    if (preserveKeys.length > 0) {
      const existingComparable = omitKeys(existingPayload, preserveKeys)
      const nextComparable = omitKeys(toRecord(payload), preserveKeys)

      if (JSON.stringify(existingComparable) === JSON.stringify(nextComparable)) {
        const merged = toRecord(payload)
        for (const key of preserveKeys) {
          if (key in existingPayload) {
            merged[key] = existingPayload[key]
            preservedTimestamp = true
          }
        }
        nextPayload = merged
      }
    }

    if (JSON.stringify(existingPayload) === JSON.stringify(nextPayload)) {
      return { changed: false, preservedTimestamp }
    }
  }

  writeFileSync(filePath, JSON.stringify(nextPayload, null, formatting))
  return { changed: true, preservedTimestamp }
}
