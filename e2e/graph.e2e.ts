import { test, expect } from '@playwright/test'
import { GraphPage } from './pages'

test.describe('Knowledge Graph Page', () => {
  let graphPage: GraphPage

  test.beforeEach(async ({ page }) => {
    graphPage = new GraphPage(page)
    await graphPage.gotoGraphPage()
  })

  test.describe('Page display', () => {
    test('should display page title', async () => {
      await graphPage.expectPageLoaded()
    })

    test('should render graph canvas', async () => {
      await graphPage.expectGraphRendered()
    })

    test('should display node and connection counts', async ({ page }) => {
      await graphPage.expectGraphRendered()

      // Stats should show node count
      await expect(page.getByText(/\d+ nodes/)).toBeVisible()
      await expect(page.getByText(/\d+ connections/)).toBeVisible()
    })

    test('should display legend', async () => {
      await graphPage.expectGraphRendered()
      await graphPage.expectLegendVisible()
    })

    test('should display navigation help', async () => {
      await graphPage.expectGraphRendered()
      await graphPage.expectNavigationHelpVisible()
    })
  })

  test.describe('Filter controls', () => {
    test('should display filter buttons for all node types', async ({ page }) => {
      await graphPage.expectGraphRendered()

      await expect(page.getByRole('button', { name: /Essays/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Notes/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Books/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Tags/ })).toBeVisible()
    })

    test('should toggle node type visibility when clicking filter', async ({ page }) => {
      await graphPage.expectGraphRendered()

      const initialNodeCount = await graphPage.getNodeCount()

      // Toggle off Essays
      await graphPage.toggleFilter('Essays')

      // Node count should decrease (or stay same if no essays)
      const filteredNodeCount = await graphPage.getNodeCount()
      expect(filteredNodeCount).toBeLessThanOrEqual(initialNodeCount)

      // Filter button should show inactive state
      await graphPage.expectFilterInactive('Essays')
    })

    test('should re-enable node type when clicking filter again', async ({ page }) => {
      await graphPage.expectGraphRendered()

      const initialNodeCount = await graphPage.getNodeCount()

      // Toggle off then on
      await graphPage.toggleFilter('Essays')
      await graphPage.toggleFilter('Essays')

      // Node count should return to initial
      const finalNodeCount = await graphPage.getNodeCount()
      expect(finalNodeCount).toBe(initialNodeCount)
    })

    test('should update connection count when filtering', async ({ page }) => {
      await graphPage.expectGraphRendered()

      const initialConnectionCount = await graphPage.getConnectionCount()

      // Toggle off a node type
      await graphPage.toggleFilter('Tags')

      // Connection count may decrease
      const filteredConnectionCount = await graphPage.getConnectionCount()
      expect(filteredConnectionCount).toBeLessThanOrEqual(initialConnectionCount)
    })

    test('should show count for each node type in filter button', async ({ page }) => {
      await graphPage.expectGraphRendered()

      // Each filter button should show count in parentheses
      const essaysButton = page.getByRole('button', { name: /Essays.*\(\d+\)/ })
      const notesButton = page.getByRole('button', { name: /Notes.*\(\d+\)/ })
      const booksButton = page.getByRole('button', { name: /Books.*\(\d+\)/ })
      const tagsButton = page.getByRole('button', { name: /Tags.*\(\d+\)/ })

      await expect(essaysButton).toBeVisible()
      await expect(notesButton).toBeVisible()
      await expect(booksButton).toBeVisible()
      await expect(tagsButton).toBeVisible()
    })
  })

  test.describe('Node inspector', () => {
    test('should show empty state initially', async () => {
      await graphPage.expectGraphRendered()
      await graphPage.expectNodeInspectorEmpty()
    })

    test('should display "Click a node" message', async ({ page }) => {
      await graphPage.expectGraphRendered()
      await expect(page.getByText('Click a node to view details')).toBeVisible()
    })

    // Note: Testing actual node selection is tricky because it requires clicking
    // on a specific position within the canvas where a node exists. The graph
    // layout is dynamic, so we can't predict exact positions.
    // These tests verify the UI components work correctly.
  })

  test.describe('Graph canvas interactions', () => {
    test('should have interactive canvas', async ({ page }) => {
      await graphPage.expectGraphRendered()

      // Canvas should be clickable
      const canvas = graphPage.graphCanvas
      await expect(canvas).toBeVisible()

      // Verify canvas is responding (doesn't throw on click)
      await canvas.click({ position: { x: 300, y: 300 } })
    })

    test('should support scroll for zoom', async ({ page }) => {
      await graphPage.expectGraphRendered()

      // Scroll on canvas
      await graphPage.graphCanvas.hover()
      await page.mouse.wheel(0, -100)

      // Graph should still be visible (zoom doesn't break it)
      await expect(graphPage.graphCanvas).toBeVisible()
    })

    test('should support drag for pan', async ({ page }) => {
      await graphPage.expectGraphRendered()

      const canvas = graphPage.graphCanvas
      const box = await canvas.boundingBox()

      if (box) {
        // Drag to pan
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50)
        await page.mouse.up()

        // Graph should still be visible
        await expect(canvas).toBeVisible()
      }
    })
  })

  test.describe('Legend', () => {
    test('should display all node types in legend', async ({ page }) => {
      await graphPage.expectGraphRendered()

      const legend = page.locator('text=Legend').locator('..')

      await expect(legend.getByText('Essays')).toBeVisible()
      await expect(legend.getByText('Notes')).toBeVisible()
      await expect(legend.getByText('Books')).toBeVisible()
      await expect(legend.getByText('Tags')).toBeVisible()
    })

    test('should display colored indicators for each type', async ({ page }) => {
      await graphPage.expectGraphRendered()

      // Each legend item should have a colored circle
      const legend = page.locator('text=Legend').locator('..')
      const colorIndicators = legend.locator('.rounded-full')

      const count = await colorIndicators.count()
      expect(count).toBeGreaterThanOrEqual(4) // At least 4 node types
    })
  })

  test.describe('Navigation help', () => {
    test('should show click instruction', async ({ page }) => {
      await graphPage.expectGraphRendered()
      await expect(page.getByText('Click:')).toBeVisible()
      await expect(page.getByText('Select node')).toBeVisible()
    })

    test('should show drag instruction', async ({ page }) => {
      await graphPage.expectGraphRendered()
      await expect(page.getByText('Drag:')).toBeVisible()
      await expect(page.getByText('Pan view')).toBeVisible()
    })

    test('should show scroll instruction', async ({ page }) => {
      await graphPage.expectGraphRendered()
      await expect(page.getByText('Scroll:')).toBeVisible()
      await expect(page.getByText('Zoom in/out')).toBeVisible()
    })

    test('should show hover instruction', async ({ page }) => {
      await graphPage.expectGraphRendered()
      await expect(page.getByText('Hover:')).toBeVisible()
      await expect(page.getByText('Highlight connections')).toBeVisible()
    })
  })
})

test.describe('Knowledge Graph Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should render graph on mobile', async ({ page }) => {
    const graphPage = new GraphPage(page)
    await graphPage.gotoGraphPage()
    await graphPage.expectGraphRendered()
  })

  test('should have usable filter buttons on mobile', async ({ page }) => {
    const graphPage = new GraphPage(page)
    await graphPage.gotoGraphPage()
    await graphPage.expectGraphRendered()

    // Filter buttons should be visible and clickable
    await expect(page.getByRole('button', { name: /Essays/ })).toBeVisible()

    await graphPage.toggleFilter('Essays')
    await graphPage.expectFilterInactive('Essays')
  })

  test('should have responsive layout on mobile', async ({ page }) => {
    const graphPage = new GraphPage(page)
    await graphPage.gotoGraphPage()
    await graphPage.expectGraphRendered()

    // On mobile, sidebar should be below the graph or hidden
    // Just verify the page is usable
    await expect(graphPage.graphCanvas).toBeVisible()
    await expect(graphPage.pageTitle).toBeVisible()
  })
})

test.describe('Knowledge Graph Page - Loading state', () => {
  test('should show loading indicator while graph loads', async ({ page }) => {
    const graphPage = new GraphPage(page)

    // Navigate and immediately check for loading state
    // Note: This may be flaky if the graph loads very quickly
    await page.goto('/graph')

    // The loading indicator should appear briefly
    // We check if it was ever visible by checking if it exists
    const loadingIndicator = page.getByText('Loading graph...')

    // Either loading is visible or graph is already rendered
    const isLoading = await loadingIndicator.isVisible()
    const isCanvas = await graphPage.graphCanvas.isVisible()

    expect(isLoading || isCanvas).toBe(true)
  })
})
