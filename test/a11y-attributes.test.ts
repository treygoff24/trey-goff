import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')

describe('A11y Attributes', () => {
  describe('A6: AppearanceCard image alt', () => {
    it('should have either empty alt with aria-hidden or unique descriptive alt', () => {
      const filePath = join(projectRoot, 'components/media/AppearanceCard.tsx')
      const content = readFileSync(filePath, 'utf-8')
      const hasAltAndAriaHidden =
        /alt=""[^>]*\s+aria-hidden="true"/.test(content) ||
        /aria-hidden="true"[^>]*\s+alt=""/.test(content)
      assert.ok(hasAltAndAriaHidden, 'Image should have empty alt with aria-hidden')
    })
  })

  describe('A7: Mobile navigation trigger is connected to its sheet', () => {
    it('should expose expanded state and an existing controlled sheet', () => {
      const filePath = join(projectRoot, 'components/layout/TopNav.tsx')
      const content = readFileSync(filePath, 'utf-8')
      assert.match(content, /aria-expanded=\{menuOpen\}/)
      assert.match(content, /aria-controls="mobile-navigation-sheet"/)
      assert.match(content, /id="mobile-navigation-sheet"/)
    })
  })

  describe('A8: Active nav link aria-current', () => {
    it('should have aria-current on active nav links', () => {
      const filePath = join(projectRoot, 'components/layout/TopNav.tsx')
      const content = readFileSync(filePath, 'utf-8')
      const hasAriaCurrent = /aria-current={isActive \? .page. : undefined}/.test(content)
      assert.ok(hasAriaCurrent, 'Active nav link should have aria-current attribute')
    })
  })
})
