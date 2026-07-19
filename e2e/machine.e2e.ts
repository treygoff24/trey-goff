import { expect, test } from '@playwright/test'

async function waitForLiveMachine(page: import('@playwright/test').Page) {
  const liveHeading = page.getByRole('heading', { name: 'These are the rules. Change them.' })
  await expect(liveHeading).toBeVisible({ timeout: 30000 })
}

test.describe('The Compound Machine', () => {
  test('renders and lets the visitor change and compare rules', async ({ page }) => {
    await page.goto('/machine?seed=0')
    await waitForLiveMachine(page)

    const security = page.getByRole('slider', { name: /Property security/ })
    await security.fill('92')
    await expect(security).toHaveValue('92')
    await page.getByRole('button', { name: 'Compare two worlds' }).click()
    await expect(page.getByRole('button', { name: 'Right rules' })).toBeVisible()
    await expect(page.locator('section:has(#left-ledger-heading)')).toBeVisible()
    await expect(page.locator('section:has(#right-ledger-heading)')).toBeVisible()
    await expect(page.locator('[class*="viewport"]')).toHaveCount(2)
    await expect(page).toHaveURL(/seed=0/)
  })

  test('turns reduced motion into explicit still mode', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/machine?seed=43')
    await waitForLiveMachine(page)

    await expect(page.getByText('Still mode', { exact: true })).toBeVisible()
    const output = page.locator('section:has(#left-ledger-heading) dd').first()
    const before = await output.textContent()
    await page.getByRole('button', { name: 'Advance 5 years' }).click()
    await expect.poll(async () => output.textContent()).not.toBe(before)
    await expect(page.getByText('Still mode', { exact: true })).toBeVisible()
  })

  test('keeps the single-panel controls usable at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/machine?seed=44')
    await waitForLiveMachine(page)

    await expect(page.getByRole('slider')).toHaveCount(4)
    await expect(page.getByRole('button', { name: 'Compare two worlds' })).toBeDisabled()
    await expect(page.getByRole('link', { name: 'Return to the site' })).toBeVisible()
  })

  test('renders the fallback when WebGL2 is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null
    })
    await page.goto('/machine?seed=45')
    await expect(
      page.getByRole('heading', { name: 'The lights come on when people can build for tomorrow.' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Read the ideas behind the model' })).toBeVisible()
  })
})
