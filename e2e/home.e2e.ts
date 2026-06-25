import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Home', () => {
  let basePage: BasePage

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page)
    await basePage.goto('/')
  })

  test('renders the Aurora hero and key editorial sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Designing the systems that let human progress compound\./,
      }),
    ).toBeVisible()

    await expect(page.getByRole('link', { name: /Read the writing/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /See the work/ })).toBeVisible()
    await expect(page.getByText('Four paths into the work')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Selected work' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Featured essays' })).toBeVisible()
  })

  test('surfaces primary CTAs and featured content', async ({ page }) => {
    const heroSection = page.locator('header').filter({
      has: page.getByRole('heading', {
        level: 1,
        name: /Designing the systems that let human progress compound\./,
      }),
    })

    await expect(heroSection.getByRole('link', { name: /Read the writing/ })).toBeVisible()
    await expect(heroSection.getByRole('link', { name: /See the work/ })).toBeVisible()

    const selectedWorkSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Selected work' }),
    })
    await expect(selectedWorkSection.getByRole('heading', { name: 'Próspera' })).toBeVisible()

    const featuredWritingSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Featured essays' }),
    })
    await expect(featuredWritingSection.getByRole('link')).toHaveCount(4)
  })

  test('shows the four path rows', async ({ page }) => {
    const pathSection = page.locator('section').filter({ hasText: 'Four paths into the work' })

    await expect(pathSection.getByRole('link', { name: /Writing/ })).toBeVisible()
    await expect(pathSection.getByRole('link', { name: /Projects/ })).toBeVisible()
    await expect(pathSection.getByRole('link', { name: /Library/ })).toBeVisible()
    await expect(pathSection.getByRole('link', { name: /About/ })).toBeVisible()
  })
})
