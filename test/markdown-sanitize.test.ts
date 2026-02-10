import assert from 'node:assert/strict'
import test from 'node:test'
import { markdownToHtml } from '@/lib/markdown'

test('markdownToHtml strips script tags to prevent XSS', async () => {
  const markdown = 'Hello <script>alert("xss")</script> world'
  const html = await markdownToHtml(markdown)

  assert.doesNotMatch(html, /<script/)
  assert.doesNotMatch(html, /alert/)
  assert.match(html, /Hello/)
  assert.match(html, /world/)
})

test('markdownToHtml strips inline event handlers', async () => {
  const markdown = '<img src="x" onerror="alert(1)" />'
  const html = await markdownToHtml(markdown)

  assert.doesNotMatch(html, /onerror/)
  assert.doesNotMatch(html, /alert/)
})

test('markdownToHtml allows legitimate HTML elements', async () => {
  const markdown = `
<div>
  <blockquote>
    <p>This is a quote</p>
  </blockquote>
</div>

| Col 1 | Col 2 |
|-------|-------|
| A     | B     |
`
  const html = await markdownToHtml(markdown)

  // Legitimate HTML should pass through
  assert.match(html, /<div/)
  assert.match(html, /<blockquote/)
  assert.match(html, /<table/)
  assert.match(html, /<td>A<\/td>/)
})

test('markdownToHtml strips dangerous CSS classes', async () => {
  const markdown = '<div class="fixed inset-0 z-[9999] bg-black">Hijack</div>'
  const html = await markdownToHtml(markdown)
  assert.doesNotMatch(html, /class=/)
})

test('markdownToHtml strips javascript: URLs', async () => {
  const markdown = '<a href="javascript:alert(1)">Click</a>'
  const html = await markdownToHtml(markdown)

  assert.doesNotMatch(html, /javascript:/)
  assert.doesNotMatch(html, /alert/)
})
