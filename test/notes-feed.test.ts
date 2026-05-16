import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GET } from '@/app/notes/feed.xml/route'
import { allNotes } from 'content-collections'

test('notes feed endpoint returns RSS XML with note links', async () => {
  const response = await GET()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'application/xml')

  const body = await response.text()
  assert.match(body, /<rss/i)
  assert.match(body, /<channel>/i)
  assert.match(body, /Trey Goff — Notes/i)
  assert.match(body, /https:\/\/trey\.world\/notes#/)
})

test('notes feed endpoint does not mutate generated notes collection order', async () => {
  const originalNotes = [...allNotes]

  try {
    allNotes.reverse()
    const orderBeforeFeed = allNotes.map((note) => note.slug)

    await GET()

    assert.deepEqual(
      allNotes.map((note) => note.slug),
      orderBeforeFeed,
    )
  } finally {
    allNotes.splice(0, allNotes.length, ...originalNotes)
  }
})
