import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

test('library page provides a semantic heading and description for the interactive route', () => {
  const page = read('app/library/page.tsx')
  const wrapper = read('components/library/FloatingLibraryWrapper.tsx')

  assert.match(page, /const\s+libraryTitle\s*=\s*'Library'/)
  assert.match(
    page,
    /const\s+libraryDescription\s*=\s*'Books that have shaped my thinking on governance, economics, and building better systems\.'/,
  )
  assert.match(
    page,
    /<FloatingLibraryWrapper[\s\S]*title=\{libraryTitle\}[\s\S]*description=\{libraryDescription\}[\s\S]*\/>/,
    'library page should pass semantic text into the wrapper',
  )

  assert.match(wrapper, /import\s+\{\s*useId\s*\}\s+from\s+['"]react['"]/)
  assert.match(wrapper, /aria-labelledby=\{titleId\}/)
  assert.match(wrapper, /aria-describedby=\{descriptionId\}/)
  assert.match(wrapper, /const\s+titleId\s*=\s*useId\(\)/)
  assert.match(wrapper, /const\s+descriptionId\s*=\s*useId\(\)/)
  assert.match(wrapper, /<header className="sr-only">[\s\S]*<h1 id=\{titleId\}>/)
  assert.match(wrapper, /<h2[^>]*className="mb-4 font-satoshi text-4xl font-medium text-text-1"/)
})
