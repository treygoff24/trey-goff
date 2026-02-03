import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Interactive entry', () => {
  test('renders entry, fallback, or error state with return links', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/interactive')

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
