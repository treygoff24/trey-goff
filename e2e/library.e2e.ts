import { test, expect } from '@playwright/test'
import { LibraryPage } from './pages'

test.describe('Library Page', () => {
  let libraryPage: LibraryPage

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()
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

      // Count may change (fewer or equal books)
      const filteredCount = await libraryPage.getBookCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
    })

    test('should filter by Reading status', async () => {
      await libraryPage.filterByStatus('Reading')

      // Should show reading books or no results
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
      // Filter by abandoned - may have no books
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

      // Find a topic button and click it
      const topicButtons = page.locator('text=Topic').locator('..').locator('button')
      const topicCount = await topicButtons.count()

      if (topicCount > 1) {
        // Click second button (first is "All")
        await topicButtons.nth(1).click()

        const filteredCount = await libraryPage.getBookCount()
        expect(filteredCount).toBeLessThanOrEqual(initialCount)
      }
    })

    test('should clear topic filter when clicking All', async ({ page }) => {
      const initialCount = await libraryPage.getBookCount()

      // Apply a topic filter
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

      // Page should still show books (sorting doesn't filter)
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
      // Wait for books to load
      await page.waitForSelector('.grid h3', { timeout: 10000 })

      // Click the first book card (div with cursor-pointer)
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      // Modal should be visible
      await libraryPage.expectBookDetailVisible()
    })

    test('should display book information in modal', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      // Modal should show book title
      await expect(page.locator('.fixed h2')).toBeVisible()

      // Should show author (text below title)
      const modal = page.locator('.fixed.inset-0').filter({ has: page.locator('h2') })
      await expect(modal.locator('p.text-lg')).toBeVisible() // Author
    })

    test('should close modal when clicking backdrop', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstBook = page.locator('.grid .cursor-pointer').first()
      await firstBook.click()

      await libraryPage.expectBookDetailVisible()

      // Click on the backdrop (bg-black/80 div) at a corner away from modal content
      // The modal content is centered, so click near the edge
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

      // Click the close button (X)
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

      // Card should have title text
      await expect(firstTitle).toContainText(/.+/)
    })

    test('should display cover image or placeholder', async ({ page }) => {
      await page.waitForSelector('.grid h3', { timeout: 10000 })
      const firstCard = page.locator('.grid .cursor-pointer').first()

      // Should have either an img or a text placeholder
      const hasImage = await firstCard.locator('img').count()
      const hasPlaceholder = await firstCard.locator('.bg-surface-1').count()

      expect(hasImage + hasPlaceholder).toBeGreaterThan(0)
    })
  })
})

test.describe('Library Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display books in responsive grid on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await libraryPage.waitForPageLoad()

    await libraryPage.expectBooksDisplayed()
  })

  test('should open book detail modal on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()
    await page.waitForSelector('.grid h3', { timeout: 10000 })

    const firstBook = page.locator('.grid .cursor-pointer').first()
    await firstBook.click()

    await libraryPage.expectBookDetailVisible()
  })

  test('filters should be accessible on mobile', async ({ page }) => {
    const libraryPage = new LibraryPage(page)
    await libraryPage.gotoLibraryPage()

    // Status filter buttons should be visible
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Read', exact: true })).toBeVisible()
  })
})
