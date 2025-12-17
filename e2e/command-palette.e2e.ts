import { test, expect } from '@playwright/test'
import { CommandPalettePage } from './pages'

test.describe('Command Palette', () => {
  let commandPalette: CommandPalettePage

  test.beforeEach(async ({ page }) => {
    commandPalette = new CommandPalettePage(page)
    await commandPalette.goto('/')
  })

  test.describe('Opening and closing', () => {
    test('should open with Cmd+K keyboard shortcut', async ({ page }) => {
      await page.keyboard.press('Meta+k')
      await expect(commandPalette.dialog).toBeVisible()
      await expect(commandPalette.searchInput).toBeFocused()
    })

    test('should open with Ctrl+K keyboard shortcut', async ({ page }) => {
      await page.keyboard.press('Control+k')
      await expect(commandPalette.dialog).toBeVisible()
    })

    test('should open when clicking the search button', async () => {
      await commandPalette.openCommandPaletteByClick()
      await expect(commandPalette.dialog).toBeVisible()
    })

    test('should close with Escape key', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await expect(commandPalette.dialog).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(commandPalette.dialog).not.toBeVisible()
    })

    test('should clear search query when closing', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.search('test query')

      await page.keyboard.press('Escape')
      await expect(commandPalette.dialog).not.toBeVisible()

      // Reopen and verify query is cleared
      await commandPalette.openCommandPalette()
      await expect(commandPalette.searchInput).toHaveValue('')
    })
  })

  test.describe('Navigation items', () => {
    test('should display navigation items when opened without query', async () => {
      await commandPalette.openCommandPalette()
      await commandPalette.expectNavigationItemsVisible()
    })

    test('should display action items when opened without query', async () => {
      await commandPalette.openCommandPalette()
      await commandPalette.expectActionsVisible()
    })

    test('should navigate to Home when selecting Home', async ({ page }) => {
      await commandPalette.goto('/about')
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Home')

      await expect(page).toHaveURL('/')
    })

    test('should navigate to Writing when selecting Writing', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Writing')

      await expect(page).toHaveURL('/writing')
    })

    test('should navigate to Notes when selecting Notes', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Notes')

      await expect(page).toHaveURL('/notes')
    })

    test('should navigate to Library when selecting Library', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Library')

      await expect(page).toHaveURL('/library')
    })

    test('should navigate to Projects when selecting Projects', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Projects')

      await expect(page).toHaveURL('/projects')
    })

    test('should navigate to About when selecting About', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('About')

      await expect(page).toHaveURL('/about')
    })

    test('should navigate to Now when selecting Now', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Now')

      await expect(page).toHaveURL('/now')
    })

    test('should navigate to Knowledge Graph when selecting Knowledge Graph', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('Knowledge Graph')

      await expect(page).toHaveURL('/graph')
    })
  })

  test.describe('Search functionality', () => {
    test('should show search input with placeholder', async () => {
      await commandPalette.openCommandPalette()
      await expect(commandPalette.searchInput).toHaveAttribute('placeholder', 'Search everything...')
    })

    test('should filter results as user types', async () => {
      await commandPalette.openCommandPalette()

      // Type a query
      await commandPalette.search('writing')

      // Wait for results to update
      await commandPalette.page.waitForTimeout(200)

      // Results should contain writing-related items
      const results = await commandPalette.getVisibleResults()
      const hasWritingResult = results.some((r) => r.toLowerCase().includes('writing'))
      expect(hasWritingResult).toBe(true)
    })

    test('should show empty state when no results match', async () => {
      await commandPalette.openCommandPalette()
      await commandPalette.search('xyznonexistentquery123')

      await commandPalette.expectEmptyState()
    })

    test('should navigate to search result when clicking', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.search('library')

      // Click on a result
      await commandPalette.selectResult('Library')

      await expect(page).toHaveURL('/library')
    })
  })

  test.describe('Actions', () => {
    test('should have Copy current URL action', async () => {
      await commandPalette.openCommandPalette()
      await expect(
        commandPalette.commandList.getByRole('option', { name: 'Copy current URL' })
      ).toBeVisible()
    })

    test('should have RSS Feed action', async () => {
      await commandPalette.openCommandPalette()
      await expect(
        commandPalette.commandList.getByRole('option', { name: 'RSS Feed' })
      ).toBeVisible()
    })

    test('should navigate to RSS feed when selecting RSS Feed', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResult('RSS Feed')

      await expect(page).toHaveURL('/feed.xml')
    })
  })

  test.describe('Keyboard navigation', () => {
    test('should focus search input when opened', async () => {
      await commandPalette.openCommandPalette()
      await expect(commandPalette.searchInput).toBeFocused()
    })

    test('should navigate results with arrow keys', async ({ page }) => {
      await commandPalette.openCommandPalette()

      // Press down arrow to select first item
      await page.keyboard.press('ArrowDown')

      // First item should be selected (has data-selected attribute)
      const firstItem = commandPalette.commandList.getByRole('option').first()
      await expect(firstItem).toHaveAttribute('data-selected', 'true')
    })

    test('should select result with Enter key', async ({ page }) => {
      await commandPalette.openCommandPalette()

      // Navigate to Writing
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown') // Move to Writing (second item)
      await page.keyboard.press('Enter')

      // Should close palette and navigate
      await expect(commandPalette.dialog).not.toBeVisible()
    })
  })
})

test.describe('Command Palette - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  let commandPalette: CommandPalettePage

  test.beforeEach(async ({ page }) => {
    commandPalette = new CommandPalettePage(page)
    await commandPalette.goto('/')
  })

  test('should open via mobile search button', async () => {
    // On mobile, there's a search icon button
    const searchButton = commandPalette.page.getByRole('button', { name: 'Search' })
    await searchButton.click()

    await expect(commandPalette.dialog).toBeVisible()
  })

  test('should be usable on mobile viewport', async ({ page }) => {
    await commandPalette.openCommandPalette()

    // Dialog should be visible and properly sized
    await expect(commandPalette.dialog).toBeVisible()
    await expect(commandPalette.searchInput).toBeVisible()

    // Navigation should work
    await commandPalette.selectResult('Library')
    await expect(page).toHaveURL('/library')
  })
})
