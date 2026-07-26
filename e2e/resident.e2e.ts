import { expect, test } from '@playwright/test'

test('remains usable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/resident')
  await expect(page.getByRole('heading', { name: 'The Resident' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
  await expect(page.getByRole('link', { name: /The gallery/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('renders without motion when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/resident')
  await expect(page.getByRole('heading', { name: 'The Resident' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible()
  await expect(page.getByRole('link', { name: /The gallery/ })).toBeVisible()
  const animationDuration = await page
    .locator('.tg-rise')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration))
  expect(animationDuration).toBeLessThanOrEqual(0.001)
})
