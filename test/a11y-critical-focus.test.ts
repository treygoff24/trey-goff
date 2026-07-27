import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = join(__dirname, '..')

function read(relativePath: string): string {
  return readFileSync(join(projectRoot, relativePath), 'utf-8')
}

test('A1: InteractiveShell should have a skip link', () => {
  const source = read('components/interactive/InteractiveShell.tsx')
  const hasSkipLink =
    (source.includes('Skip to content') || source.includes('skip-link')) && source.includes('href')
  assert.ok(hasSkipLink, 'InteractiveShell should have skip link')
})

// A2 and A3 used to assert the trap inline in each dialog. Both now delegate to the one
// `useModalDismiss` hook, so the trap is asserted once, where it lives, and each dialog is
// only checked for still going through it.

test('A2: SettingsMenu should use the shared modal dismiss hook', () => {
  const source = read('components/interactive/SettingsMenu.tsx')
  assert.ok(source.includes('useModalDismiss('), 'SettingsMenu should call useModalDismiss')
})

test('A3: ContentOverlay should use the shared modal dismiss hook', () => {
  const source = read('components/interactive/ContentOverlay.tsx')
  assert.ok(source.includes('useModalDismiss('), 'ContentOverlay should call useModalDismiss')
})

test('A2/A3: the modal dismiss hook should have a Tab key handler', () => {
  const source = read('hooks/useModalDismiss.ts')
  const hasTab =
    source.includes('e.key === "Tab"') ||
    source.includes("e.key === 'Tab'") ||
    source.includes('e.key !== "Tab"') ||
    source.includes("e.key !== 'Tab'")
  assert.ok(hasTab, 'useModalDismiss should handle Tab key')
})

test('A2/A3: the modal dismiss hook should implement focus wrapping', () => {
  const source = read('hooks/useModalDismiss.ts')
  const hasWrap = source.includes('firstElement') && source.includes('lastElement')
  assert.ok(hasWrap, 'useModalDismiss should have focus wrapping')
})

test('A2/A3: the modal dismiss hook should wrap Tab backward on Shift+Tab', () => {
  const source = read('hooks/useModalDismiss.ts')
  const hasBackward = source.includes('e.shiftKey') && source.includes('firstElement')
  assert.ok(hasBackward, 'useModalDismiss should handle Shift+Tab')
})

test('A2/A3: the modal dismiss hook should wrap Tab forward', () => {
  const source = read('hooks/useModalDismiss.ts')
  const hasForward = source.includes('!e.shiftKey') && source.includes('lastElement')
  assert.ok(hasForward, 'useModalDismiss should wrap forward')
})

test('A2/A3: the modal dismiss hook should preventDefault', () => {
  const source = read('hooks/useModalDismiss.ts')
  assert.ok(source.includes('e.preventDefault()'), 'useModalDismiss should preventDefault')
})
