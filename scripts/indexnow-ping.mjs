#!/usr/bin/env node
/**
 * Postbuild IndexNow ping. No-op unless VERCEL_ENV === 'production'.
 * Network failures warn and exit 0 so they never fail the build.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY = '9ba14d897b5042d996b7dc71f5a3e0e7'
const DEFAULT_SITE_URL = 'https://www.treygoff.com'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function skip(message) {
  console.log(`indexnow-ping: skip — ${message}`)
  process.exit(0)
}

function warnAndExit(message) {
  console.warn(`indexnow-ping: ${message}`)
  process.exit(0)
}

function collectUrlsFromSitemapBody(xml) {
  const urls = []
  const locPattern = /<loc>([^<]+)<\/loc>/g
  for (const match of xml.matchAll(locPattern)) {
    const url = match[1]?.trim()
    if (url) urls.push(url)
  }
  return urls
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    skip(`VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'} (need production)`)
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '')
  const host = new URL(siteUrl).host
  const keyLocation = `${siteUrl}/${KEY}.txt`

  const distDir = process.env.NEXT_DIST_DIR || '.next'
  const sitemapBodyPath = join(root, distDir, 'server/app/sitemap.xml.body')

  if (!existsSync(sitemapBodyPath)) {
    warnAndExit(`sitemap body not found at ${sitemapBodyPath}`)
  }

  const xml = readFileSync(sitemapBodyPath, 'utf8')
  const urlList = collectUrlsFromSitemapBody(xml)

  if (urlList.length === 0) {
    warnAndExit('no URLs found in sitemap body')
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: KEY,
        keyLocation,
        urlList,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      warnAndExit(`IndexNow responded ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`)
    }

    console.log(`indexnow-ping: submitted ${urlList.length} URLs for ${host}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnAndExit(`network failure: ${message}`)
  }
}

main()
