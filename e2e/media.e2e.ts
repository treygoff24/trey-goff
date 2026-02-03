import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Media page', () => {
  test('shows media listings and filters', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/media')

    const main = page.locator('main')
    await expect(main.getByRole('heading', { name: 'Media' })).toBeVisible()

    const allButton = main.getByRole('button', { name: 'All' })
    await expect(allButton).toBeVisible()
    await expect(allButton).toHaveAttribute('aria-pressed', 'true')

    const typeButtons = main.getByRole('button', {
      name: /Podcasts|YouTube|Talks|Interviews/i,
    })

    if ((await typeButtons.count()) > 0) {
      const first = typeButtons.first()
      await first.click()
      await expect(first).toHaveAttribute('aria-pressed', 'true')
    }

    const cards = main.locator('a[target="_blank"]')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible()
    } else {
      await expect(main.getByText(/No .*appearances yet/i)).toBeVisible()
    }
  })
})
