import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'

const E2E_ANNEX_SECRET = 'e2e-annex-secret-with-at-least-thirty-two-chars'
const E2E_ANNEX_API_PORT = 3102
const entrySource = `---
title: A private note
date: 2026-07-19
summary: A mocked server-side GitHub entry.
---
# The note

Private words live here.`

let annexApi: Server

function sendJson(response: import('node:http').ServerResponse, body: unknown) {
  response.writeHead(200, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

test.beforeAll(async () => {
  annexApi = createServer((request, response) => {
    if (request.url === '/repos/e2e/annex-content/contents/entries') {
      sendJson(response, [
        { name: 'private-note.md', path: 'entries/private-note.md', type: 'file' },
      ])
      return
    }
    if (request.url === '/repos/e2e/annex-content/contents/entries/private-note.md') {
      sendJson(response, {
        encoding: 'base64',
        content: Buffer.from(entrySource).toString('base64'),
      })
      return
    }
    response.writeHead(404)
    response.end()
  })
  await new Promise<void>((resolve, reject) => {
    annexApi.once('error', reject)
    annexApi.listen(E2E_ANNEX_API_PORT, '127.0.0.1', resolve)
  })
})

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    annexApi.close((error) => (error ? reject(error) : resolve())),
  )
})

function expectPrivacyHeaders(
  response: Awaited<ReturnType<import('@playwright/test').Page['goto']>>,
) {
  // `next dev` rewrites Cache-Control to `no-cache, must-revalidate`, so this
  // e2e (which runs against the dev server) can only assert the response is
  // non-cacheable. The strict production value (`no-store, private`) is pinned
  // at the route level in test/annex.test.ts.
  expect(response?.headers()['cache-control']).toMatch(/no-store|no-cache/)
  expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow, noarchive, nosnippet')
}

test('strangers see the records-division gag with privacy headers', async ({ page }) => {
  const response = await page.goto('/classified')

  await expect(
    page.getByRole('heading', { name: 'Notice of administrative non-access' }),
  ).toBeVisible()
  await expect(page.getByText('Office of the Archivist · Records Division')).toBeVisible()
  await expect(page.getByText('Denied', { exact: true })).toBeVisible()
  expectPrivacyHeaders(response)
})

test('invalid keys are silently removed', async ({ page }) => {
  await page.goto('/classified?key=invalid')

  await expect(page).toHaveURL('/classified')
  await expect(
    page.getByRole('heading', { name: 'Notice of administrative non-access' }),
  ).toBeVisible()
})

test('a valid cookie gate renders mocked reading-room content with privacy headers', async ({
  page,
}) => {
  const response = await page.goto(`/classified?key=${encodeURIComponent(E2E_ANNEX_SECRET)}`)

  await expect(page).toHaveURL('/classified')
  expectPrivacyHeaders(response)
  await expect(page.getByText('Clearance granted · welcome back')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'A private note' })).toBeVisible()
  await page.getByRole('link', { name: 'A private note' }).click()
  await expect(page).toHaveURL('/classified/private-note')
  await expect(page.getByRole('heading', { name: 'A private note' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The note' })).toBeVisible()
})

test('gag remains usable at 390px with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/classified')

  await expect(
    page.getByRole('heading', { name: 'Notice of administrative non-access' }),
  ).toBeVisible()
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflows).toBe(false)
})
