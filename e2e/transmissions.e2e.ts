import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Transmissions page', () => {
  test('shows transmissions or empty state', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/transmissions')

    const main = page.locator('main')
    await expect(
      main.getByRole('heading', { name: 'Transmissions', level: 1 })
    ).toBeVisible()
    await expect(main.getByText(/active transmissions/i)).toBeVisible()

    const cards = main.locator('a[target="_blank"]')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible()
      await expect(main.getByText(/Read on/i).first()).toBeVisible()
    } else {
      await expect(main.getByText(/No transmissions yet/i)).toBeVisible()
    }
  })
})
