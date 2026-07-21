import { test, expect } from '@playwright/test'

test.describe('The Workshop', () => {
  test('renders the stations, ledger, and institutional block', async ({ page }) => {
    await page.goto('/projects')
    await expect(
      page.getByRole('heading', { level: 1, name: /One machine, many hands/ }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Coordination' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Verification' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Also on the bench' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Próspera' })).toBeVisible()
  })

  test('drawers are closed by default and open via the tool param', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.locator('details#fleet')).not.toHaveAttribute('open', '')
    await page.goto('/projects?tool=fleet#fleet')
    await expect(page.locator('details#fleet')).toHaveAttribute('open', '')
    await expect(page.getByText('Live capture · fleet')).toBeVisible()
  })

  test('a drawer opens on click and a wander link navigates to its neighbor', async ({ page }) => {
    await page.goto('/projects?tool=fleet#fleet')
    const wander = page.locator('details#fleet').getByRole('link', { name: 'Post' })
    await wander.click()
    await expect(page.locator('details#post')).toHaveAttribute('open', '')
    await expect(page.locator('details#fleet')).not.toHaveAttribute('open', '')
  })

  test('an unknown tool param renders the page with nothing open', async ({ page }) => {
    await page.goto('/projects?tool=does-not-exist')
    await expect(
      page.getByRole('heading', { level: 1, name: /One machine, many hands/ }),
    ).toBeVisible()
    await expect(page.locator('details[open]')).toHaveCount(0)
  })
})
