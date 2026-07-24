import { expect, test, type Page } from '@playwright/test'

const mockReply = [
  'event: delta',
  'data: {"text":"Thank you for the letter."}',
  '',
  'event: done',
  'data: {}',
  '',
].join('\n')

async function mockResident(page: Page) {
  await page.route('**/api/resident', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream; charset=utf-8',
      headers: {
        'x-resident-conversation-id': '00000000-0000-4000-8000-000000000001',
        'x-resident-turn': '1',
      },
      body: mockReply,
    })
  })
}

test('renders the empty dwelling and completes a mocked correspondence turn', async ({ page }) => {
  await mockResident(page)
  await page.goto('/resident')

  await expect(page.getByRole('heading', { name: 'A room for another mind.' })).toBeVisible()
  await expect(page.getByText("The Resident hasn't moved in yet.")).toBeVisible()
  await expect(page.getByLabel('Your letter')).toBeVisible()

  await page.getByLabel('Your letter').fill('Is the room ready?')
  await page.getByRole('button', { name: 'Send letter' }).click()

  await expect(page.getByText('Is the room ready?')).toBeVisible()
  await expect(page.getByText('Thank you for the letter.')).toBeVisible()
})

test('remains usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/resident')
  await expect(page.getByRole('heading', { name: 'Correspondence' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('renders without motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/resident')
  await expect(page.getByRole('heading', { name: 'A room for another mind.' })).toBeVisible()
  const animationDuration = await page
    .locator('.tg-rise')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration))
  expect(animationDuration).toBeLessThanOrEqual(0.001)
})
