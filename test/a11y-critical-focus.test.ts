import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')

test('A1: FloatingLibrary should have a skip link', () => {
  const path = join(projectRoot, 'components/library/floating/FloatingLibrary.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasSkipLink = (source.includes('Skip to content') || source.includes('skip-link')) && source.includes('href')
  assert.ok(hasSkipLink, 'FloatingLibrary should have skip link')
})

test('A1: InteractiveShell should have a skip link', () => {
  const path = join(projectRoot, 'components/interactive/InteractiveShell.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasSkipLink = (source.includes('Skip to content') || source.includes('skip-link')) && source.includes('href')
  assert.ok(hasSkipLink, 'InteractiveShell should have skip link')
})

test('A2: SettingsMenu should have Tab key handler', () => {
  const path = join(projectRoot, 'components/interactive/SettingsMenu.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasTab = source.includes('e.key === "Tab"') || source.includes("e.key === 'Tab'") || source.includes('e.key \!== "Tab"') || source.includes("e.key \!== 'Tab'")
  assert.ok(hasTab, 'SettingsMenu should handle Tab key')
})

test('A2: SettingsMenu should implement focus wrapping', () => {
  const path = join(projectRoot, 'components/interactive/SettingsMenu.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasWrap = source.includes('firstElement') && source.includes('lastElement')
  assert.ok(hasWrap, 'SettingsMenu should have focus wrapping')
})

test('A2: SettingsMenu should handle Shift+Tab', () => {
  const path = join(projectRoot, 'components/interactive/SettingsMenu.tsx')
  const source = readFileSync(path, 'utf-8')
  assert.ok(source.includes('e.shiftKey'), 'SettingsMenu should handle Shift+Tab')
})

test('A3: ContentOverlay should have Tab handler', () => {
  const path = join(projectRoot, 'components/interactive/ContentOverlay.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasTab = source.includes('e.key === "Tab"') || source.includes("e.key === 'Tab'") || source.includes('e.key \!== "Tab"') || source.includes("e.key \!== 'Tab'")
  assert.ok(hasTab, 'ContentOverlay should handle Tab key')
})

test('A3: ContentOverlay should wrap Tab forward', () => {
  const path = join(projectRoot, 'components/interactive/ContentOverlay.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasForward = source.includes('\!e.shiftKey') && source.includes('lastElement')
  assert.ok(hasForward, 'ContentOverlay should wrap forward')
})

test('A3: ContentOverlay should wrap Tab backward', () => {
  const path = join(projectRoot, 'components/interactive/ContentOverlay.tsx')
  const source = readFileSync(path, 'utf-8')
  const hasBackward = source.includes('e.shiftKey') && source.includes('firstElement')
  assert.ok(hasBackward, 'ContentOverlay should wrap backward')
})

test('A3: ContentOverlay should preventDefault', () => {
  const path = join(projectRoot, 'components/interactive/ContentOverlay.tsx')
  const source = readFileSync(path, 'utf-8')
  assert.ok(source.includes('e.preventDefault()'), 'ContentOverlay should preventDefault')
})
