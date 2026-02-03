import { test, expect } from '@playwright/test'
import { CommandPalettePage } from './pages'

const navigationTimeout = 15000

test.describe('Command Palette', () => {
  let commandPalette: CommandPalettePage

  test.beforeEach(async ({ page }) => {
    commandPalette = new CommandPalettePage(page)
    await commandPalette.goto('/')
  })

  test.describe('Opening and closing', () => {
    test('should open with Cmd+K keyboard shortcut', async ({ page }) => {
      await page.waitForSelector('html[data-command-palette-ready="true"]')
      await page.keyboard.press('Meta+k')
      await expect(commandPalette.dialog).toBeVisible()
      await expect(commandPalette.searchInput).toBeFocused()
    })

    test('should open with Ctrl+K keyboard shortcut', async ({ page }) => {
      await page.waitForSelector('html[data-command-palette-ready="true"]')
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
      await commandPalette.selectResultExact('Home')

      await expect(page).toHaveURL('/', { timeout: navigationTimeout })
    })

    test('should navigate to Writing when selecting Writing', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Writing')

      await expect(page).toHaveURL('/writing', { timeout: navigationTimeout })
    })

    test('should navigate to Notes when selecting Notes', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Notes')

      await expect(page).toHaveURL('/notes', { timeout: navigationTimeout })
    })

    test('should navigate to Library when selecting Library', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Library')

      await expect(page).toHaveURL('/library', { timeout: navigationTimeout })
    })

    test('should navigate to Projects when selecting Projects', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Projects')

      await expect(page).toHaveURL('/projects', { timeout: navigationTimeout })
    })

    test('should navigate to About when selecting About', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('About')

      await expect(page).toHaveURL('/about', { timeout: navigationTimeout })
    })

    test('should navigate to Now when selecting Now', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Now')

      await expect(page).toHaveURL('/now', { timeout: navigationTimeout })
    })

    test('should navigate to Knowledge Graph when selecting Knowledge Graph', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.selectResultExact('Knowledge Graph')

      await expect(page).toHaveURL('/graph', { timeout: navigationTimeout })
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

      await expect
        .poll(async () => commandPalette.commandList.getByRole('option').count(), {
          timeout: 5000,
        })
        .toBeGreaterThan(0)

      // Results should contain writing-related items
      const results = await commandPalette.getVisibleResults()
      const resultsText = results.join(' ').toLowerCase()
      expect(resultsText).toContain('writing')
    })

    test('should show empty state when no results match', async () => {
      await commandPalette.openCommandPalette()
      await commandPalette.search('xyznonexistentquery123')

      await commandPalette.expectEmptyState()
    })

    test('should navigate to search result when clicking', async ({ page }) => {
      await commandPalette.openCommandPalette()
      await commandPalette.search('library')

      await expect
        .poll(async () => commandPalette.commandList.getByRole('option').count(), {
          timeout: 5000,
        })
        .toBeGreaterThan(0)

      // Click on a result
      await commandPalette.selectResult('Library')

      await expect(page).toHaveURL('/library', { timeout: navigationTimeout })
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
      await commandPalette.selectResultExact('RSS Feed')

      await expect(page).toHaveURL('/feed.xml', { timeout: navigationTimeout })
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

      // One item should be selected (aria-selected)
      await expect
        .poll(
          async () =>
            commandPalette.commandList.locator('[aria-selected="true"]').count(),
          { timeout: 5000 }
        )
        .toBeGreaterThan(0)
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
    const searchButton = commandPalette.page.getByRole('button', { name: 'Search', exact: true })
    await searchButton.click()

    await expect(commandPalette.dialog).toBeVisible()
  })

  test('should be usable on mobile viewport', async ({ page }) => {
    await commandPalette.openCommandPalette()

    // Dialog should be visible and properly sized
    await expect(commandPalette.dialog).toBeVisible()
    await expect(commandPalette.searchInput).toBeVisible()

    // Navigation should work
    await commandPalette.selectResultExact('Library')
    await expect(page).toHaveURL('/library', { timeout: navigationTimeout })
  })
})
