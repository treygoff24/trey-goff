import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('BookDetailPanel Escape key handler (A4)', () => {
  test('BookDetailPanel has Escape key handler in source code', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/library/floating/BookDetailPanel.tsx'),
      'utf-8'
    )
    
    assert.ok(
      source.includes('handleKeyDown') || source.includes('onKeyDown'),
      'Component should have a keyboard event handler'
    )
    
    assert.ok(
      source.match(/e\.key\s*===\s*['"]Escape['"]/),
      'Component should check for Escape key'
    )
    
    const hasEscapeBlock = source.match(/if\s*\([^)]*Escape[^)]*\)[^}]*{[^}]*(handleClose|selectBook\(null\))/)
    assert.ok(
      hasEscapeBlock,
      'Escape key should trigger close action (handleClose or selectBook(null))'
    )
  })
})

describe('Quality dropdown ARIA roles and Escape handler (A5)', () => {
  test('Quality dropdown container has role="listbox"', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/library/floating/LibraryHUD.tsx'),
      'utf-8'
    )

    const qualityDropdownMatch = source.match(
      /showQualityMenu[\s\S]*?<div[^>]*ref={qualityMenuRef}[^>]*>/
    )

    assert.ok(qualityDropdownMatch, 'Should find quality dropdown container')

    assert.ok(
      qualityDropdownMatch[0].includes('role="listbox"'),
      'Quality dropdown container should have role="listbox"'
    )
  })

  test('Quality dropdown options have role="option"', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/library/floating/LibraryHUD.tsx'),
      'utf-8'
    )

    const qualityOptionsMatch = source.match(
      /QUALITY_OPTIONS\.map\([^)]*\)[\s\S]*?<button[^>]*>/
    )

    assert.ok(qualityOptionsMatch, 'Should find quality options buttons')

    assert.ok(
      qualityOptionsMatch[0].includes('role="option"'),
      'Quality option buttons should have role="option"'
    )
  })

  test('Quality dropdown has Escape key handler', () => {
    const source = readFileSync(
      join(process.cwd(), 'components/library/floating/LibraryHUD.tsx'),
      'utf-8'
    )

    assert.ok(
      source.includes('handleKeyDown') || source.includes('onKeyDown'),
      'Component should have a keyboard event handler'
    )

    const hasEscapeHandler = source.match(
      /e\.key\s*===\s*['"]Escape['"][\s\S]*?setShowQualityMenu\(false\)/
    )

    assert.ok(
      hasEscapeHandler,
      'Escape key should close quality menu (setShowQualityMenu(false))'
    )
  })
})
