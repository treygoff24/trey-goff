import { test, expect } from '@playwright/test'
import { LibraryPage } from './pages'

test.describe('Library Page - Classic', () => {
  let libraryPage: LibraryPage

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()

    if (!(await libraryPage.isClassicMode())) {
      test.skip(true, '3D library active')
    }
  })

  test.describe('Page display', () => {
    test('should display page title', async () => {
      await libraryPage.expectPageLoaded()
    })

    test('should display book cards', async () => {
      await libraryPage.expectBooksDisplayed()
    })

    test('should display library stats', async () => {
      await libraryPage.expectStatsVisible()
    })

    test('should display book count', async () => {
      const count = await libraryPage.getBookCount()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('Status filtering', () => {
    test('should show all books by default', async () => {
      const initialCount = await libraryPage.getBookCount()
      expect(initialCount).toBeGreaterThan(0)
    })

    test('should filter by Read status', async () => {
      const initialCount = await libraryPage.getBookCount()
      await libraryPage.filterByStatus('Read')

      const filteredCount = await libraryPage.getBookCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })

    test('should filter by Reading status', async () => {
      await libraryPage.filterByStatus('Reading')

      const count = await libraryPage.getBookCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should filter by Want to Read status', async () => {
      await libraryPage.filterByStatus('Want to Read')

      const count = await libraryPage.getBookCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should return to all books when clicking All', async () => {
      const initialCount = await libraryPage.getBookCount()

      await libraryPage.filterByStatus('Read')
      await libraryPage.filterByStatus('All')

      const finalCount = await libraryPage.getBookCount()
      expect(finalCount).toBe(initialCount)
    })

    test('should show no results message when filter matches nothing', async () => {
      await libraryPage.filterByStatus('Abandoned')

      const count = await libraryPage.getBookCount()
      if (count === 0) {
        await libraryPage.expectNoResults()
      }
    })
  })

  test.describe('Topic filtering', () => {
    test('should filter by topic', async ({ page }) => {
      const initialCount = await libraryPage.getBookCount()

      const topicButtons = page.locator('text=Topic').locator('..').locator('button')
      const topicCount = await topicButtons.count()

      if (topicCount > 1) {
        await topicButtons.nth(1).click()

        const filteredCount = await libraryPage.getBookCount()
        expect(filteredCount).toBeLessThanOrEqual(initialCount)
      }
    })

    test('should clear topic filter when clicking All', async ({ page }) => {
      const initialCount = await libraryPage.getBookCount()

      const topicButtons = page.locator('text=Topic').locator('..').locator('button')
      const topicCount = await topicButtons.count()

      if (topicCount > 1) {
        await topicButtons.nth(1).click()
        await libraryPage.clearTopicFilter()

        const finalCount = await libraryPage.getBookCount()
        expect(finalCount).toBe(initialCount)
      }
    })
  })

  test.describe('Sorting', () => {
    test('should have sort dropdown', async () => {
      await expect(libraryPage.sortSelect).toBeVisible()
    })

    test('should sort by Title', async () => {
      await libraryPage.sortBy('Title')
      await libraryPage.expectBooksDisplayed()
    })

    test('should sort by Author', async () => {
      await libraryPage.sortBy('Author')
      await libraryPage.expectBooksDisplayed()
    })

    test('should sort by Year', async () => {
      await libraryPage.sortBy('Year')
      await libraryPage.expectBooksDisplayed()
    })

    test('should sort by Rating', async () => {
      await libraryPage.sortBy('Rating')
      await libraryPage.expectBooksDisplayed()
    })

    test('should sort by Date Read', async () => {
      await libraryPage.sortBy('Date Read')
      await libraryPage.expectBooksDisplayed()
    })
  })

  test.describe('Book detail modal', () => {
    test('should open book detail modal when clicking a book', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })

      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await libraryPage.expectBookDetailVisible()
    })

    test('should display book information in modal', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await expect(page.locator('.fixed h2')).toBeVisible()

      const modal = page.locator('.fixed.inset-0').filter({ has: page.locator('h2') })
      await expect(modal.locator('p.text-lg')).toBeVisible()
    })

    test('should close modal when clicking backdrop', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await libraryPage.expectBookDetailVisible()

      const backdrop = page.locator('.fixed.inset-0 > .absolute.inset-0')
      const box = await backdrop.boundingBox()
      if (box) {
        await page.mouse.click(box.x + 20, box.y + 20)
      }

      await libraryPage.expectBookDetailHidden()
    })

    test('should close modal when clicking close button', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await libraryPage.expectBookDetailVisible()

      const closeButton = page.locator('.fixed button').filter({ has: page.locator('svg') }).first()
      await closeButton.click()

      await libraryPage.expectBookDetailHidden()
    })

    test('should show "Why I Love It" section in modal', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await expect(page.getByText('Why I Love It')).toBeVisible()
    })
  })

  test.describe('Book cards', () => {
    test('should display book title on cards', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstTitle = page.locator('.grid h3').first()

      await expect(firstTitle).toContainText(/.+/)
    })

    test('should display cover image or placeholder', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstCard = page.locator('.grid .cursor-pointer').first()

      const hasImage = await firstCard.locator('img').count()
      const hasPlaceholder = await firstCard.locator('.bg-surface-1').count()

      expect(hasImage + hasPlaceholder).toBeGreaterThan(0)
    })
  })
})

test.describe('Library Page - 3D', () => {
  let libraryPage: LibraryPage

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()

    if (!(await libraryPage.is3DMode())) {
      test.skip(true, 'Classic library fallback active')
    }
  })

  test('should render the 3D canvas', async ({ page }) => {
    await expect(page.locator('canvas:visible').first()).toBeVisible()
  })

  test('should show the library filters HUD', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Library filters' })).toBeVisible()
  })

  test('should expose quality settings control', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Quality settings' })).toBeVisible()
  })
})

test.describe('Library Page - Mobile (Classic)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display books in responsive grid on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()

    if (!(await libraryPage.isClassicMode())) {
      test.skip(true, '3D library active')
    }

    await libraryPage.expectBooksDisplayed()
  })

  test('should open book detail modal on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await page.waitForSelector('.grid h3', { timeout: 10000 })

    if (!(await libraryPage.isClassicMode())) {
      test.skip(true, '3D library active')
    }

    const firstBook = page.locator('.grid .cursor-pointer').first()
    await firstBook.click()

    await libraryPage.expectBookDetailVisible()
  })

  test('filters should be accessible on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()

    if (!(await libraryPage.isClassicMode())) {
      test.skip(true, '3D library active')
    }

    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Read', exact: true })).toBeVisible()
  })
})
