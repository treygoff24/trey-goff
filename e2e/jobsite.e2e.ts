import { expect, test } from '@playwright/test'

const sceneAltPattern = /lot|workbench|trailer|tool|logbook|runners|inspector|golden hour|gate/i

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
}

test.describe('The Job Site', () => {
  test('renders the route, content, and eight meaningful scene alts', async ({ page }) => {
    await page.goto('/jobsite')

    await expect(page).toHaveTitle(/The Job Site/i)
    await expect(
      page.getByRole('heading', {
        name: /How I get real work out of AI, with no jargon and one construction site\./,
        level: 1,
      }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The new hire' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your first hour' })).toBeVisible()
    await expect(page.getByText('On the real site').first()).toBeVisible()

    const images = page.locator('.js-scene img')
    await expect(images).toHaveCount(8)
    const alts = await images.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('alt') ?? ''),
    )
    expect(new Set(alts).size).toBe(8)
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(24)
      expect(alt).toMatch(sceneAltPattern)
    }
  })

  test('keeps hard/easy mode direct routes deep-linkable while remembering neutral links', async ({
    page,
  }) => {
    await page.goto('/jobsite')
    const toggle = page.getByRole('navigation', { name: 'Choose version' })
    await expect(toggle.getByRole('link', { name: 'Easy mode', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect.poll(() => page.evaluate(() => localStorage.getItem('stack-mode'))).toBe('easy')

    await toggle.getByRole('link', { name: 'Hard mode', exact: true }).click()
    await expect(page).toHaveURL(/\/stack$/)
    await expect(
      page
        .getByRole('navigation', { name: 'Choose version' })
        .getByRole('link', { name: 'Hard mode', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('stack-mode'))).toBe('hard')

    await page.goto('/jobsite')
    await expect(page).toHaveURL(/\/jobsite$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('stack-mode'))).toBe('easy')

    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('stack-mode', 'easy'))
    await page.reload()
    await expect(page.getByRole('link', { name: 'How I work with AI →' })).toHaveAttribute(
      'href',
      '/jobsite',
    )
  })

  test('uses mobile crops at 390px without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/jobsite')

    await expect(page.getByRole('heading', { name: 'The new hire' })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    const currentSrc = await page
      .locator('.js-scene img')
      .first()
      .evaluate((image: HTMLImageElement) => decodeURIComponent(image.currentSrc))
    expect(currentSrc).toContain('beat-01-new-hire-mobile')
  })

  test('renders static scenes when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/jobsite')

    await expect(page.getByRole('heading', { name: 'The new hire' })).toBeVisible()
    const animationNames = await page
      .locator('.js-img, .js-plane-light')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName))
    expect(animationNames.every((name) => name === 'none')).toBe(true)
  })
})
