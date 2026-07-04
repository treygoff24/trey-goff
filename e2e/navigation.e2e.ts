import { test, expect } from '@playwright/test'
import { BasePage } from './pages'

test.describe('Navigation - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  let basePage: BasePage

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page)
    await basePage.goto('/')
  })

  test.describe('Top navigation', () => {
    test('should display site logo/name', async () => {
      await expect(
        basePage.topNav.getByRole('link', { name: 'Trey Goff', exact: true }),
      ).toBeVisible()
    })

    test('should navigate to home when clicking logo', async ({ page }) => {
      await page.goto('/about')
      await basePage.topNav.getByRole('link', { name: 'Trey Goff', exact: true }).click()
      await expect(page).toHaveURL('/')
    })

    test('should display navigation links', async () => {
      // Use exact match to avoid matching homepage feature cards
      await expect(
        basePage.topNav.getByRole('link', { name: 'Writing', exact: true }),
      ).toBeVisible()
      await expect(
        basePage.topNav.getByRole('link', { name: 'Library', exact: true }),
      ).toBeVisible()
      await expect(
        basePage.topNav.getByRole('link', { name: 'Projects', exact: true }),
      ).toBeVisible()
      await expect(basePage.topNav.getByRole('link', { name: 'About', exact: true })).toBeVisible()
    })

    test('should navigate to Writing page', async ({ page }) => {
      await basePage.navigateViaTopNav('Writing')
      await expect(page).toHaveURL('/writing')
    })

    test('should navigate to Library page', async ({ page }) => {
      await basePage.navigateViaTopNav('Library')
      await expect(page).toHaveURL('/library')
    })

    test('should navigate to Projects page', async ({ page }) => {
      await basePage.navigateViaTopNav('Projects')
      await expect(page).toHaveURL('/projects')
    })

    test('should navigate to About page', async ({ page }) => {
      await basePage.navigateViaTopNav('About')
      await expect(page).toHaveURL('/about')
    })

    test('should highlight current page in navigation', async ({ page }) => {
      await page.goto('/writing')

      // Writing link should have active styling
      const writingLink = basePage.topNav.getByRole('link', { name: 'Writing' })
      await expect(writingLink).toHaveAttribute('aria-current', 'page')
    })

    test('should keep search controls out of the handoff masthead', async () => {
      await expect(basePage.topNav.getByRole('button')).toHaveCount(0)
      await expect(basePage.topNav.locator('kbd')).toHaveCount(0)
    })
  })

  test.describe('Footer navigation', () => {
    test('should display footer', async () => {
      await expect(basePage.footer).toBeVisible()
    })

    test('should have footer links', async () => {
      // Footer typically has social links, RSS, etc.
      const footerLinks = basePage.footer.locator('a')
      const linkCount = await footerLinks.count()

      expect(linkCount).toBeGreaterThan(0)
    })
  })
})

test.describe('Navigation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  let basePage: BasePage

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page)
    await basePage.goto('/')
  })

  test.describe('Mobile inline navigation', () => {
    test('should display the handoff inline nav links instead of a drawer trigger', async ({
      page,
    }) => {
      await expect(basePage.topNav.getByRole('link', { name: 'Trey Goff' })).toBeVisible()
      await expect(
        basePage.topNav.getByRole('link', { name: 'Writing', exact: true }),
      ).toBeVisible()
      await expect(
        basePage.topNav.getByRole('link', { name: 'Library', exact: true }),
      ).toBeVisible()
      await expect(
        basePage.topNav.getByRole('link', { name: 'Projects', exact: true }),
      ).toBeVisible()
      await expect(basePage.topNav.getByRole('link', { name: 'About', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: /open menu|close menu/i })).toHaveCount(0)
    })

    test('should navigate from the mobile inline nav', async ({ page }) => {
      await basePage.navigateViaTopNav('Writing')
      await expect(page).toHaveURL('/writing')
    })

    test('should still open command palette from keyboard shortcut on mobile', async ({ page }) => {
      await page.keyboard.press('Control+k')
      await expect(page.getByRole('dialog')).toBeVisible()
    })
  })
})

test.describe('Skip Link - Accessibility', () => {
  let basePage: BasePage

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page)
    await basePage.goto('/')
  })

  test('should have skip link for keyboard navigation', async () => {
    // Skip link should exist but be visually hidden
    await expect(basePage.skipLink).toBeAttached()
  })

  test('should become visible when focused', async ({ page }) => {
    // Tab to focus the skip link
    await page.keyboard.press('Tab')

    // Skip link should now be visible
    await expect(basePage.skipLink).toBeVisible()
  })

  test('should navigate to main content when activated', async ({ page }) => {
    await basePage.useSkipLink()

    await expect(page).toHaveURL(/#main-content$/)
  })

  test('should have correct href pointing to main content', async () => {
    await expect(basePage.skipLink).toHaveAttribute('href', '#main-content')
  })

  test('main content should have matching id', async () => {
    await expect(basePage.mainContent).toHaveAttribute('id', 'main-content')
  })
})

test.describe('Navigation - Sticky header', () => {
  test('should have fixed transparent header', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/')

    const header = page.getByRole('banner')
    await expect(header).toHaveClass(/fixed/)
  })

  test('header should remain visible after scrolling', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/library')

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))

    // Header should still be visible
    const header = page.getByRole('banner')
    await expect(header).toBeVisible()
    await expect(header).toBeInViewport()
  })
})
