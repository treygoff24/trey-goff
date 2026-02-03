import { test } from 'node:test'
import assert from 'node:assert/strict'
import appearanceCovers from '@/public/appearance-covers.json'
import {
  getAllAppearances,
  getAllTypes,
  getAppearanceThumbnail,
  getAppearancesByType,
  getFeaturedAppearances,
  sortAppearancesByDate,
} from '@/lib/media'

test('media helpers return appearances and featured subset', () => {
  const appearances = getAllAppearances()
  assert.ok(appearances.length > 0)

  const featured = getFeaturedAppearances()
  for (const appearance of featured) {
    assert.equal(appearance.featured, true)
  }
})

test('media helpers filter and sort appearances', () => {
  const appearances = getAllAppearances()
  const sorted = sortAppearancesByDate(appearances)

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date).getTime()
    const next = new Date(sorted[i].date).getTime()
    assert.ok(prev >= next)
  }

  const types = getAllTypes()
  for (const type of types) {
    const matches = getAppearancesByType(type)
    assert.ok(matches.every((appearance) => appearance.type === type))
  }
})

test('media thumbnails resolve from cover map or fallback artwork', () => {
  const appearances = getAllAppearances()
  const coverMap = appearanceCovers as Record<string, string>

  const withCover = appearances.find((appearance) => coverMap[appearance.id])
  assert.ok(withCover, 'expected at least one appearance with a resolved cover')

  if (withCover) {
    assert.equal(getAppearanceThumbnail(withCover), coverMap[withCover.id])
  }

  const withFallback = appearances.find(
    (appearance) => !coverMap[appearance.id] && appearance.showArtwork
  )

  if (withFallback) {
    assert.equal(getAppearanceThumbnail(withFallback), withFallback.showArtwork)
  }
})
