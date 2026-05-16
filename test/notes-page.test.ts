import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { allNotes } from 'content-collections'
import NotesPage from '@/app/notes/page'

test('notes page does not mutate generated notes collection order', async () => {
  const originalNotes = [...allNotes]

  try {
    allNotes.reverse()
    const orderBeforeRender = allNotes.map((note) => note.slug)

    await NotesPage()

    assert.deepEqual(
      allNotes.map((note) => note.slug),
      orderBeforeRender,
    )
  } finally {
    allNotes.splice(0, allNotes.length, ...originalNotes)
  }
})

test('notes page copies generated notes before sorting', () => {
  const source = readFileSync(join(process.cwd(), 'app/notes/page.tsx'), 'utf-8')

  assert.doesNotMatch(source, /allNotes\.sort\(/)
  assert.match(source, /\[\.\.\.allNotes\]\.sort\(/)
})
