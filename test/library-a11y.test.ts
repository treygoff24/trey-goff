import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

test('library page provides a semantic heading and description for the interactive route', () => {
  const page = read('app/library/page.tsx')

  assert.match(page, /const\s+libraryTitle\s*=\s*'Library'/)
  assert.match(
    page,
    /const\s+libraryDescription\s*=\s*'Books that have shaped my thinking on governance, economics, and building better systems\.'/,
  )
  assert.match(
    page,
    /<StackLibrary[\s\S]*books=\{books\}[\s\S]*\/>/,
    'library page should render StackLibrary with books prop',
  )
})

test('StackLibrary component has accessible book stripes', () => {
  const stripe = read('components/library/BookStripe.tsx')

  assert.match(stripe, /role='button'/, 'each stripe should have role="button"')
  assert.match(stripe, /tabIndex=\{0\}/, 'each stripe should be focusable')
  assert.match(stripe, /aria-label=\{book\.title\}/, 'each stripe should have an aria-label')
})
