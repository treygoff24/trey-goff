import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

const interactiveWorldEnabled = process.env.NEXT_PUBLIC_ENABLE_INTERACTIVE_WORLD === 'true'

test.describe('Interactive entry', () => {
  test('respects the interactive feature flag', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/interactive')

    if (!interactiveWorldEnabled) {
      await expect(page.getByRole('heading', { name: /404/, level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Return to Base' })).toBeVisible()
      return
    }

    const heading = page.locator('h1', {
      hasText: /Enter the World|WebGL Not Available|Something Went Wrong/i,
    })

    await expect(heading).toBeVisible()

    const returnLink = page.getByRole('link', {
      name: /Return to Normal|Stay on Normal|Visit Normal/i,
    })

    await expect(returnLink.first()).toBeVisible()
  })
})
