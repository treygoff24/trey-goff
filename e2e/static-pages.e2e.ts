import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Static content pages', () => {
  test('About page shows the new bio and fact rail', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/about')

    await expect(
      page.getByRole('heading', { name: /institutions that let human progress compound/i }),
    ).toBeVisible()
    await expect(page.getByText(/chief of staff and director of public affairs/i)).toBeVisible()
    await expect(page.getByText('Faith')).toBeVisible()
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

    await expect(page.getByRole('heading', { name: "Systems I'm building" })).toBeVisible()
    await expect(page.getByText(/websites, command-line & agent tooling/i)).toBeVisible()

    const rows = page.locator('article')
    const rowCount = await rows.count()

    if (rowCount > 0) {
      await expect(rows.first().getByRole('heading')).toBeVisible()
    } else {
      await expect(page.getByText(/Projects coming soon/i)).toBeVisible()
    }
  })

  test('Subscribe route is hidden when newsletter is disabled', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/subscribe')

    await expect(page.getByText('Signal Lost')).toBeVisible()
    await expect(page.getByText('The requested coordinates could not be found.')).toBeVisible()
  })
})
