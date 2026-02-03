import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GET } from '@/app/feed.xml/route'

test('feed endpoint returns RSS XML', async () => {
  const response = await GET()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Content-Type'), 'application/xml')

  const body = await response.text()
  assert.match(body, /<rss/i)
  assert.match(body, /<channel>/i)
  assert.match(body, /Trey Goff/i)
})
