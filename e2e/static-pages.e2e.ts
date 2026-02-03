import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Static content pages', () => {
  test('About page shows mission and bio', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/about')

    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
    await expect(page.getByText('Mission')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Bio' })).toBeVisible()
  })

  test('Now page shows last updated and sections', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/now')

    await expect(page.getByRole('heading', { name: 'Now' })).toBeVisible()
    await expect(page.getByText(/Last updated:/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Current focus' })).toBeVisible()
  })

  test('Colophon page highlights stack', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/colophon')

    await expect(page.getByRole('heading', { name: 'Colophon' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Stack' })).toBeVisible()
  })

  test('Powerlifting page shows hidden content and table', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/powerlifting')

    await expect(page.getByRole('heading', { name: 'Powerlifting' })).toBeVisible()
    await expect(page.getByText(/hidden page/i)).toBeVisible()

    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(3)
  })

  test('Projects page shows projects or empty state', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/projects')

    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()

    const cards = page.locator('article')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      await expect(cards.first().getByRole('heading')).toBeVisible()
    } else {
      await expect(page.getByText(/Projects coming soon/i)).toBeVisible()
    }
  })
})
