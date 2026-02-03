import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllPublications,
  getAllTransmissions,
  getFeaturedTransmissions,
  getTransmissionsByPublication,
} from '@/lib/transmissions'

test('transmissions are sorted newest first', () => {
  const transmissions = getAllTransmissions()
  assert.ok(transmissions.length > 0)

  for (let i = 1; i < transmissions.length; i++) {
    const prev = new Date(transmissions[i - 1].date).getTime()
    const next = new Date(transmissions[i].date).getTime()
    assert.ok(prev >= next)
  }
})

test('featured transmissions are marked featured', () => {
  const featured = getFeaturedTransmissions()
  for (const transmission of featured) {
    assert.equal(transmission.featured, true)
  }
})

test('transmissions can be filtered by publication', () => {
  const publications = getAllPublications()
  const firstPublication = publications[0]

  if (!firstPublication) return

  const matches = getTransmissionsByPublication(firstPublication)
  assert.ok(matches.length > 0)
  assert.ok(matches.every((t) => t.publication === firstPublication))
})

test('getAllPublications returns a sorted list', () => {
  const publications = getAllPublications()
  const sorted = [...publications].sort()
  assert.deepEqual(publications, sorted)
})
