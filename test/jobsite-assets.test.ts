import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { nextConfig } from '@/next.config'

const jobsiteDir = join(process.cwd(), 'public', 'jobsite')
const blurDir = join(jobsiteDir, 'blur')
const beats = [
  'beat-01-new-hire',
  'beat-02-trailer',
  'beat-03-tool-rack',
  'beat-04-logbook',
  'beat-05-crews',
  'beat-06-inspector',
  'beat-07-boss',
  'beat-08-first-hour',
]

const wideLimit = 1.25 * 1024 * 1024
const mobileLimit = 700 * 1024
const aggregateLimit = 16 * 1024 * 1024

test('jobsite scene assets have the expected responsive WebP matrix', async () => {
  let aggregateBytes = 0

  for (const beat of beats) {
    const wide = join(jobsiteDir, `${beat}-wide.webp`)
    const mobile = join(jobsiteDir, `${beat}-mobile.webp`)

    const wideMetadata = await sharp(wide).metadata()
    assert.equal(wideMetadata.format, 'webp')
    assert.equal(wideMetadata.width, 3840, `${beat} wide width`)
    assert.equal(wideMetadata.height, 2560, `${beat} wide height`)
    const wideBytes = statSync(wide).size
    assert.ok(wideBytes <= wideLimit, `${beat} wide exceeds ${wideLimit} bytes`)

    const mobileMetadata = await sharp(mobile).metadata()
    assert.equal(mobileMetadata.format, 'webp')
    assert.equal(mobileMetadata.width, 1600, `${beat} mobile width`)
    assert.equal(mobileMetadata.height, 2000, `${beat} mobile height`)
    const mobileBytes = statSync(mobile).size
    assert.ok(mobileBytes <= mobileLimit, `${beat} mobile exceeds ${mobileLimit} bytes`)

    aggregateBytes += wideBytes + mobileBytes
  }

  assert.ok(aggregateBytes <= aggregateLimit, `jobsite assets exceed ${aggregateLimit} bytes`)
})

test('jobsite blur placeholders are present and tiny WebPs', async () => {
  const files = readdirSync(blurDir)
    .filter((file) => file.endsWith('.webp'))
    .sort()
  assert.deepEqual(
    files,
    beats.map((beat) => `${beat}.webp`),
  )

  for (const file of files) {
    const metadata = await sharp(join(blurDir, file)).metadata()
    assert.equal(metadata.format, 'webp')
    assert.ok((metadata.width ?? 0) <= 64, `${file} blur width is too large`)
    assert.ok((metadata.height ?? 0) <= 64, `${file} blur height is too large`)
  }
})

test('jobsite public assets avoid unsupported original formats', () => {
  const topLevelFiles = readdirSync(jobsiteDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort()

  assert.deepEqual(
    topLevelFiles,
    beats.flatMap((beat) => [`${beat}-mobile.webp`, `${beat}-wide.webp`]).sort(),
  )
  assert.equal(
    topLevelFiles.some((file) => /\.(?:avif|png|jpe?g)$/i.test(file)),
    false,
  )
})

test('Next image config can negotiate AVIF and WebP derivatives', () => {
  assert.deepEqual(nextConfig.images?.formats, ['image/avif', 'image/webp'])
})
