import { existsSync, readFileSync, writeFileSync } from 'fs'

type JsonRecord = Record<string, unknown>

function omitKeys(value: JsonRecord, keys: string[]): JsonRecord {
  const clone = { ...value }
  for (const key of keys) {
    delete clone[key]
  }
  return clone
}

interface StableJsonOptions {
  formatting?: number
  preserveKeys?: string[]
}

export function writeStableJsonFile(
  filePath: string,
  payload: JsonRecord,
  { formatting = 2, preserveKeys = [] }: StableJsonOptions = {},
): { changed: boolean; preservedTimestamp: boolean } {
  let nextPayload = payload
  let preservedTimestamp = false

  if (existsSync(filePath)) {
    const existingPayload = JSON.parse(readFileSync(filePath, 'utf-8')) as JsonRecord

    if (preserveKeys.length > 0) {
      const existingComparable = omitKeys(existingPayload, preserveKeys)
      const nextComparable = omitKeys(payload, preserveKeys)

      if (JSON.stringify(existingComparable) === JSON.stringify(nextComparable)) {
        nextPayload = { ...payload }
        for (const key of preserveKeys) {
          if (key in existingPayload) {
            nextPayload[key] = existingPayload[key]
            preservedTimestamp = true
          }
        }
      }
    }

    if (JSON.stringify(existingPayload) === JSON.stringify(nextPayload)) {
      return { changed: false, preservedTimestamp }
    }
  }

  writeFileSync(filePath, JSON.stringify(nextPayload, null, formatting))
  return { changed: true, preservedTimestamp }
}
