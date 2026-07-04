import { expect, test } from '@playwright/test'

const panel = (name: string) => `#workshop-panel-${name}`

// Interaction relies on React's click delegation; wait for the shell's hydration
// beacon before touching anything, or clicks land on inert SSR HTML (flaky on
// CPU-throttled mobile projects).
async function gotoWorkshop(page: import('@playwright/test').Page, url = '/projects') {
  await page.goto(url)
  await expect(page.locator('[data-hydrated="true"]')).toBeAttached()
}

async function openLens(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('tab', { name: new RegExp(`^${name}$`) }).click()
  await expect(page.locator(panel(name.toLowerCase()))).toBeVisible()
}

test.describe('Workshop', () => {
  test('renders the tablist with Bench active and other panels hidden', async ({ page }) => {
    await gotoWorkshop(page)

    await expect(page.getByRole('tablist', { name: 'Workshop lenses' })).toBeVisible()
    await expect(page.locator(panel('bench'))).toBeVisible()
    await expect(page.locator(panel('lineage'))).toBeHidden()
    await expect(page.locator(panel('ledger'))).toBeHidden()
  })

  test('routes to Ledger by hash and restores it after reload', async ({ page }) => {
    await gotoWorkshop(page)
    await openLens(page, 'Ledger')

    await expect(page).toHaveURL(/\/projects#ledger$/)
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Ledger' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(panel('ledger'))).toBeVisible()
  })

  test('renders sealed ledger rows as non-buttons with the amendment aria label', async ({
    page,
  }) => {
    await gotoWorkshop(page)
    await openLens(page, 'Ledger')

    const sealed = page.locator(`${panel('ledger')} [aria-label^="sealed project —"]`).first()
    await expect(sealed).toBeVisible()
    await expect(sealed).toHaveAttribute('aria-label', /^sealed project — .+, \d{4}$/)
    await expect.poll(() => sealed.evaluate((element) => element.tagName.toLowerCase())).toBe('div')
  })

  test('opens from a row, syncs ?p, closes with Esc, and restores row focus', async ({ page }) => {
    await gotoWorkshop(page)

    const row = page.locator(`${panel('bench')} [data-workshop-project="recon"]`)
    await row.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('recon')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe(null)
    await expect(row).toBeFocused()
  })

  test('opens from ?p=recon and clears the param on close', async ({ page }) => {
    await gotoWorkshop(page, '/projects?p=recon')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'recon' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe(null)
  })

  test('opens legacy project anchors in the drawer', async ({ page }) => {
    await gotoWorkshop(page, '/projects#the-control-room')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'The Control Room' })).toBeVisible()
  })

  test('keeps the lineage canvas semantic layer keyboard-operable', async ({ page }) => {
    await gotoWorkshop(page)
    await openLens(page, 'Lineage')

    await expect(page.locator(`${panel('lineage')} canvas`)).toHaveAttribute('aria-hidden', 'true')
    const nodes = page.locator(`${panel('lineage')} [data-workshop-project]`)
    await expect.poll(() => nodes.count()).toBeGreaterThanOrEqual(40)

    const startId = 'devslave'
    const start = page.locator(`${panel('lineage')} [data-workshop-project="${startId}"]`)
    await start.focus()
    await expect(start).toBeFocused()

    const ids = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '#workshop-panel-lineage ol button[data-workshop-project]',
        ),
        (button) => button.dataset.workshopProject ?? '',
      ),
    )
    const startIndex = ids.indexOf(startId)
    expect(startIndex).toBeGreaterThan(-1)
    const nextId = ids[(startIndex + 1) % ids.length]

    await page.keyboard.press('ArrowRight')
    await expect(
      page.locator(`${panel('lineage')} [data-workshop-project="${nextId}"]`),
    ).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('swaps drawer content from a lineage chip and focuses the new title', async ({ page }) => {
    await gotoWorkshop(page, '/projects?p=recon')

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'recon' })).toBeVisible()
    await expect(dialog.getByText('descends from')).toBeVisible()
    await dialog.getByRole('button', { name: 'foundry' }).click()

    const title = dialog.getByRole('heading', { name: 'foundry' })
    await expect(title).toBeVisible()
    await expect(title).toBeFocused()
    await expect.poll(() => new URL(page.url()).searchParams.get('p')).toBe('foundry')
  })

  test('drawer focus trap stays inside the panel after a title-to-chip swap', async ({ page }) => {
    await gotoWorkshop(page, '/projects?p=recon')

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'recon' })).toBeVisible()
    await dialog.getByRole('button', { name: 'foundry' }).click()

    const title = dialog.getByRole('heading', { name: 'foundry' })
    await expect(title).toBeFocused()

    const pressCount = await dialog.evaluate(
      (element) =>
        element.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ).length + 1,
    )
    for (let index = 0; index < pressCount; index += 1) {
      await page.keyboard.press('Tab')
    }
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.closest('[role="dialog"]')))
      .toBeTruthy()
  })

  test('shows activated lens content immediately under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoWorkshop(page)

    await expect(page.locator(`${panel('bench')} [data-workshop-project="recon"]`)).toBeVisible()

    await openLens(page, 'Lineage')
    await expect(page.locator(`${panel('lineage')} canvas`)).toBeVisible()

    await openLens(page, 'Ledger')
    const firstLedgerRow = page.locator(`${panel('ledger')} [data-workshop-project]`).first()
    await expect(firstLedgerRow).toBeVisible()
    await expect
      .poll(() => firstLedgerRow.evaluate((row) => getComputedStyle(row).opacity))
      .toBe('1')
  })

  test('renders all three panels without JavaScript and hides the tablist', async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL: baseURL ?? 'http://localhost:3101',
      javaScriptEnabled: false,
    })
    const noJsPage = await context.newPage()

    try {
      await noJsPage.goto('/projects', { waitUntil: 'domcontentloaded' })

      await expect(noJsPage.getByRole('tablist', { name: 'Workshop lenses' })).toBeHidden()
      await expect(noJsPage.locator(panel('bench'))).toBeVisible()
      await expect(noJsPage.locator(panel('lineage'))).toBeVisible()
      await expect(noJsPage.locator(panel('ledger'))).toBeVisible()
      await expect(
        noJsPage.locator(`${panel('bench')} [data-workshop-project="recon"]`),
      ).toBeVisible()
      await expect(noJsPage.locator(`${panel('lineage')} canvas`)).toBeVisible()
      await expect(
        noJsPage.locator(`${panel('ledger')} [data-workshop-project]`).first(),
      ).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
