import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Topics page', () => {
  test('shows topic cards or empty state', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/topics')

    const main = page.locator('main')
    await expect(
      main.getByRole('heading', { name: 'Topics', level: 1 })
    ).toBeVisible()

    const topicLinks = main.locator('a[href^="/topics/"]')
    const linkCount = await topicLinks.count()

    if (linkCount > 0) {
      await expect(topicLinks.first()).toBeVisible()
      const href = await topicLinks.first().getAttribute('href')
      expect(href).toMatch(/^\/topics\//)
    } else {
      await expect(main.getByText(/No topics yet/i)).toBeVisible()
    }
  })
})
