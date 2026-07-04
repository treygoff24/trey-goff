import { test, expect } from '@playwright/test'
import { LibraryPage } from './pages'

function isMobileProject(projectName: string) {
  return projectName.startsWith('mobile-')
}

test.describe('Library Page - Aurora lenses', () => {
  let libraryPage: LibraryPage

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()
  })

  test('renders the Aurora header, stats, category filters, and constellation lens', async ({
    page,
  }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'desktop-only category/header assertions')

    await libraryPage.expectPageLoaded()
    await expect(page.getByText('A reading life is a shape, not a list.')).toBeVisible()
    await expect(page.getByRole('button', { name: /All · 334/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Economics ·/ })).toBeVisible()
    await expect(libraryPage.constellationCanvas).toBeVisible()
  })

  test('switches between all four lenses', async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'desktop-only full lens content assertions')

    await expect(libraryPage.constellationCanvas).toBeVisible()

    await libraryPage.switchLens('Shelf')
    await expect(page.getByText('Arrange by')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Threads' })).toBeVisible()

    await libraryPage.switchLens('River')
    await expect(page.locator('[data-testid^="library-river-book-"]').first()).toBeVisible()
    await expect(page.getByText('1847')).toBeVisible()

    await libraryPage.switchLens('Index')
    await expect(page.getByRole('button', { name: 'Title' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Progress and Poverty/ })).toBeVisible()
  })

  test('category filters expose pressed state and preserve the lens', async ({
    page,
  }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), 'desktop-only category strip assertions')

    const economics = page.getByTestId('library-category-econ')
    await economics.click()
    await expect(economics).toHaveAttribute('aria-pressed', 'true')

    await libraryPage.switchLens('Shelf')
    await expect(page.getByText('Arrange by')).toBeVisible()

    const all = page.getByTestId('library-category-all')
    await all.click()
    await expect(all).toHaveAttribute('aria-pressed', 'true')
  })

  test('opens and closes book details from the shelf', async () => {
    await libraryPage.clickFirstShelfBook()
    await libraryPage.expectBookDetailVisible()
    await libraryPage.closeBookDetail()
  })

  test('drawer traps keyboard focus, restores focus, and can jump to the shelf', async ({
    page,
  }) => {
    await libraryPage.switchLens('Index')
    const book = page.getByTestId('library-index-book-progress-and-poverty')
    await book.focus()
    await page.keyboard.press('Enter')

    const close = page.getByRole('button', { name: 'Close', exact: true })
    await expect(close).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('button', { name: /See the Economics shelf/ })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(libraryPage.bookDetailDialog).not.toBeVisible()
    await expect(book).toBeFocused()

    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: /See the Economics shelf/ }).click()
    await expect(page.getByTestId('library-lens-shelf')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('library-category-econ')).toHaveAttribute('aria-pressed', 'true')
    await expect(libraryPage.bookDetailDialog).not.toBeVisible()
  })

  test('reduced motion keeps the constellation from continuously animating', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const original = window.requestAnimationFrame.bind(window)
      let count = 0
      window.requestAnimationFrame = (callback) => {
        count += 1
        return original(callback)
      }
      ;(window as typeof window & { __rafCount?: () => number }).__rafCount = () => count
    })

    const reducedPage = new LibraryPage(page)
    await reducedPage.gotoLibraryPage()
    await reducedPage.expectPageLoaded()
    await page.waitForTimeout(300)
    const before = await page.evaluate(
      () => (window as typeof window & { __rafCount?: () => number }).__rafCount?.() ?? 0,
    )
    await page.waitForTimeout(600)
    const after = await page.evaluate(
      () => (window as typeof window & { __rafCount?: () => number }).__rafCount?.() ?? 0,
    )
    expect(after - before).toBeLessThanOrEqual(2)
  })
})

test.describe('Library Page - Mobile Aurora', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('keeps the four-lens browser usable on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()

    await libraryPage.expectPageLoaded()
    await libraryPage.switchLens('Shelf')
    await expect(page.getByText('Arrange by')).toBeVisible()
    await expect(page.getByTestId('library-lens-constellation')).toBeVisible()
  })

  test('keeps the lens bar and drawer usable at handoff mobile widths', async ({ page }) => {
    await page.setViewportSize({ width: 441, height: 540 })
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.expectPageLoaded()
    await libraryPage.switchLens('Index')

    const switcherBox = await page.getByTestId('library-lens-switcher').boundingBox()
    expect(switcherBox).not.toBeNull()
    expect(switcherBox!.x).toBeGreaterThanOrEqual(0)
    expect(switcherBox!.x + switcherBox!.width).toBeLessThanOrEqual(441)

    await page.getByTestId('library-index-book-progress-and-poverty').click()
    await libraryPage.expectBookDetailVisible()
    await libraryPage.closeBookDetail()
  })
})
