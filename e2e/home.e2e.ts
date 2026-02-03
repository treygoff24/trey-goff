import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Home', () => {
  let basePage: BasePage

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page)
    await basePage.goto('/')
  })

  test('should render hero and key sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Designing the systems that let progress compound.',
      })
    ).toBeVisible()

    await expect(page.getByRole('link', { name: 'Read the work' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Four paths into the work' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Selected work' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Featured essays' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Get the signal' })
    ).toBeVisible()
  })

  test('should surface primary CTAs and featured content', async ({ page }) => {
    const heroSection = page.locator('section').filter({
      has: page.getByRole('heading', {
        level: 1,
        name: 'Designing the systems that let progress compound.',
      }),
    })

    await expect(heroSection.getByRole('link', { name: 'Read the work' })).toBeVisible()
    await expect(heroSection.getByRole('link', { name: 'Explore projects' })).toBeVisible()
    await expect(heroSection.getByRole('link', { name: 'Subscribe' })).toBeVisible()

    const featuredProjectSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Selected work' }),
    })
    await expect(featuredProjectSection.getByRole('link', { name: 'Case study' })).toBeVisible()
    await expect(featuredProjectSection.getByRole('link', { name: 'Colophon' })).toBeVisible()

    const featuredWritingSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Featured essays' }),
    })
    await expect(featuredWritingSection.locator('article')).toHaveCount(3)

    const ctaSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Get the signal' }),
    })
    await expect(ctaSection.getByRole('link', { name: 'Subscribe for updates' })).toBeVisible()
    await expect(ctaSection.getByRole('link', { name: 'See the latest essay' })).toBeVisible()
  })

  test('should show the four signal tiles', async ({ page }) => {
    const signalSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Four paths into the work' }),
    })

    await expect(signalSection.getByRole('link', { name: 'Writing' })).toBeVisible()
    await expect(signalSection.getByRole('link', { name: 'Projects' })).toBeVisible()
    await expect(signalSection.getByRole('link', { name: 'Library' })).toBeVisible()
    await expect(signalSection.getByRole('link', { name: 'Graph' })).toBeVisible()
  })
})
