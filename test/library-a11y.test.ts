import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

test('library page provides a semantic heading and description for the Aurora route', () => {
  const page = read('app/library/page.tsx')

  assert.match(page, /const\s+libraryTitle\s*=\s*'Library'/)
  assert.match(page, /const\s+libraryDescription\s*=\s*'Everything Trey has read/)
  assert.match(
    page,
    /<AuroraLibrary[\s\S]*books=\{graph\.books\}[\s\S]*nodes=\{graph\.nodes\}[\s\S]*edges=\{graph\.edges\}/,
    'library page should render AuroraLibrary with graph data',
  )
})

test('AuroraLibrary exposes visible page heading and lens controls', () => {
  const lib = read('components/library/AuroraLibrary.tsx')
  assert.match(lib, /<h1\b/, 'route chrome should include an h1')
  assert.match(lib, /aria-pressed=\{lens === tab\.key\}/, 'lens tabs should expose pressed state')
  assert.match(
    lib,
    /aria-pressed=\{!activeCategory\}/,
    'category filters should expose pressed state',
  )
})

test('Aurora constellation canvas and book controls are accessible', () => {
  const lib = read('components/library/AuroraLibrary.tsx')
  assert.match(lib, /role="img"/, 'constellation canvas should expose an image role')
  assert.match(lib, /aria-label="Constellation of books linked by shared topics"/)
  assert.match(lib, /aria-label=\{`\$\{book\.title\} by \$\{book\.author\}`\}/)
  assert.match(lib, /focus-visible:outline-accent/, 'interactive books should keep visible focus')
})

test('Aurora detail drawer uses an accessible dialog primitive', () => {
  const lib = read('components/library/AuroraLibrary.tsx')
  assert.match(lib, /role="dialog"/)
  assert.match(lib, /aria-modal="true"/)
  assert.match(lib, /aria-labelledby="book-drawer-title"/)
  assert.match(lib, /aria-label="Close book details"/)
})
