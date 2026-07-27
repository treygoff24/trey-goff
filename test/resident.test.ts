import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { journalSchema } from '@/lib/resident/journal-schema'

describe('Resident journal collection', () => {
  test('requires the complete journal frontmatter and content contract', () => {
    const valid = journalSchema.safeParse({
      title: 'A real entry',
      date: '2026-07-19',
      entryNumber: 1,
      model: 'claude-fable-5',
      content: 'Observed, not invented.',
    })
    assert.equal(valid.success, true)
    assert.equal(journalSchema.safeParse({ ...valid.data, content: undefined }).success, false)
  })
})
