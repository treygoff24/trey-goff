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
    test('should display site logo/name', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Trey' })).toBeVisible()
    })

    test('should navigate to home when clicking logo', async ({ page }) => {
      await page.goto('/about')
      await page.getByRole('link', { name: 'Trey' }).click()
      await expect(page).toHaveURL('/')
    })

    test('should display navigation links', async () => {
      // Use exact match to avoid matching homepage feature cards
      await expect(basePage.topNav.getByRole('link', { name: 'Writing', exact: true })).toBeVisible()
      await expect(basePage.topNav.getByRole('link', { name: 'Library', exact: true })).toBeVisible()
      await expect(basePage.topNav.getByRole('link', { name: 'Projects', exact: true })).toBeVisible()
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
      await expect(writingLink).toHaveClass(/font-medium/)
    })

    test('should display search button with keyboard hint', async () => {
      // Scope to the header nav to avoid matching homepage search button
      const searchButton = basePage.topNav.getByRole('button', { name: /search|command k/i })
      await expect(searchButton).toBeVisible()

      // Should show keyboard shortcut in the nav
      await expect(basePage.topNav.locator('kbd')).toContainText('K')
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

  test.describe('Mobile hamburger menu', () => {
    test('should display hamburger menu button', async () => {
      await expect(basePage.mobileMenuButton).toBeVisible()
    })

    test('should hide desktop nav links on mobile', async ({ page }) => {
      // Desktop nav links should be hidden
      const desktopNav = page.locator('.hidden.md\\:flex')
      await expect(desktopNav).not.toBeVisible()
    })

    test('should open mobile nav drawer when clicking hamburger', async () => {
      await basePage.openMobileNav()
      await expect(basePage.mobileNav).toBeVisible()
    })

    test('should close mobile nav when clicking close button', async () => {
      await basePage.openMobileNav()
      await basePage.closeMobileNav()
      await expect(basePage.mobileNav).not.toBeVisible()
    })

    test('should close mobile nav when pressing Escape', async ({ page }) => {
      await basePage.openMobileNav()
      await page.keyboard.press('Escape')
      await expect(basePage.mobileNav).not.toBeVisible()
    })

    test('should display nav links in mobile drawer', async () => {
      await basePage.openMobileNav()

      await expect(basePage.mobileNav.getByRole('link', { name: 'Writing' })).toBeVisible()
      await expect(basePage.mobileNav.getByRole('link', { name: 'Library' })).toBeVisible()
      await expect(basePage.mobileNav.getByRole('link', { name: 'Projects' })).toBeVisible()
      await expect(basePage.mobileNav.getByRole('link', { name: 'About' })).toBeVisible()
    })

    test('should navigate and close drawer when clicking a link', async ({ page }) => {
      await basePage.openMobileNav()
      await basePage.navigateViaMobileNav('Writing')

      // Drawer should close
      await expect(basePage.mobileNav).not.toBeVisible()

      // Should navigate to writing
      await expect(page).toHaveURL('/writing')
    })

    test('should display secondary links in mobile drawer', async () => {
      await basePage.openMobileNav()

      await expect(basePage.mobileNav.getByRole('link', { name: 'Now' })).toBeVisible()
      await expect(basePage.mobileNav.getByRole('link', { name: 'Subscribe' })).toBeVisible()
      await expect(basePage.mobileNav.getByRole('link', { name: 'Colophon' })).toBeVisible()
    })

    test('should close drawer when clicking backdrop', async ({ page }) => {
      await basePage.openMobileNav()

      // Click the backdrop
      const backdrop = page.locator('.fixed.inset-0.bg-black\\/60')
      await backdrop.click({ force: true })

      await expect(basePage.mobileNav).not.toBeVisible()
    })
  })

  test.describe('Mobile search', () => {
    test('should display mobile search button', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: 'Search' })
      await expect(searchButton).toBeVisible()
    })

    test('should open command palette when clicking mobile search', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: 'Search' })
      await searchButton.click()

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
    // Focus and activate skip link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    // Focus should move to main content
    await expect(basePage.mainContent).toBeFocused()
  })

  test('should have correct href pointing to main content', async () => {
    await expect(basePage.skipLink).toHaveAttribute('href', '#main-content')
  })

  test('main content should have matching id', async () => {
    await expect(basePage.mainContent).toHaveAttribute('id', 'main-content')
  })
})

test.describe('Navigation - Sticky header', () => {
  test('should have sticky header', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/')

    // Header should be sticky
    const header = page.locator('header')
    await expect(header).toHaveClass(/sticky/)
  })

  test('header should remain visible after scrolling', async ({ page }) => {
    const basePage = new BasePage(page)
    await basePage.goto('/library')

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))

    // Header should still be visible
    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header).toBeInViewport()
  })
})
