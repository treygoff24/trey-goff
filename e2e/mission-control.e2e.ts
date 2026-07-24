import { expect, test } from '@playwright/test'

const sectionNames = ['Focus', 'Strength', 'Reading', 'Writing', 'Shipping', 'Orbit']

test.describe('Mission Control', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.delete('/mission-control/e2e-controls/github-offline')
    await page.request.delete('/mission-control/e2e-controls/focus-clock')
  })

  test('renders the complete sourced panel and its primary thread links', async ({ page }) => {
    await page.goto('/mission-control', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'A life, in instruments.', level: 1 }),
    ).toBeVisible()
    for (const name of sectionNames) {
      await expect(page.getByRole('heading', { name, level: 2 }).first()).toBeVisible()
    }

    await expect(page.getByText(/405 · 275 · 495/)).toBeVisible()
    await expect(page.getByText(/No book is marked in progress/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Open the library' })).toHaveAttribute(
      'href',
      '/library',
    )
  })

  test('remains complete and still under reduced motion', async ({ page }) => {
    await page.request.post('/mission-control/e2e-controls/focus-clock')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/mission-control', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('[data-mission-control]')).toBeVisible()
    await expect(page.locator('[data-instrument]')).toHaveCount(6)
    const animationDuration = await page
      .locator('[data-mission-control] > header')
      .evaluate((element) => getComputedStyle(element).animationDuration)
    expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.001)
    const clock = page.locator('[data-local-clock]')
    await expect(clock).toBeVisible()
    const initialTime = await clock.textContent()
    await page.waitForTimeout(1100)
    await expect(clock).toHaveText(initialTime ?? '')
  })

  test('stacks instrument columns within the viewport at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/mission-control', { waitUntil: 'domcontentloaded' })

    const sections = page.locator('[data-instrument]')
    await expect(sections).toHaveCount(6)
    for (let index = 0; index < (await sections.count()); index += 1) {
      const section = sections.nth(index)
      const [sectionBox, headerBox, bodyBox] = await Promise.all([
        section.boundingBox(),
        section.locator(':scope > header').boundingBox(),
        section.locator(':scope > div').boundingBox(),
      ])
      assertBox(sectionBox, 390)
      assertBox(headerBox, 390)
      assertBox(bodyBox, 390)
      expect(bodyBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1)
    }
  })

  test('renders Shipping offline while the other instruments remain available', async ({
    page,
  }) => {
    await page.request.post('/mission-control/e2e-controls/github-offline')
    await page.goto('/mission-control', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/GitHub isn't answering the observatory tonight/)).toBeVisible()
    for (const name of sectionNames.filter((name) => name !== 'Shipping')) {
      await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible()
    }
  })
})

function assertBox(box: { x: number; width: number } | null, viewportWidth: number) {
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth + 1)
}
