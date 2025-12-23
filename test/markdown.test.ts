import assert from 'node:assert/strict'
import test from 'node:test'
import { markdownToHtml } from '@/lib/markdown'

test('markdownToHtml converts markdown into HTML with heading ids', async () => {
  const html = await markdownToHtml('# Hello World\n\nThis is *mine*.')

  assert.match(html, /<h1[^>]*id="hello-world"[^>]*>Hello World<\/h1>/)
  assert.match(html, /<p>This is <em>mine<\/em>\.<\/p>/)
  assert.doesNotMatch(html, /^#\s+Hello World/m)
})

test('markdownToHtml handles empty string', async () => {
  const html = await markdownToHtml('')
  assert.equal(html.trim(), '')
})

test('markdownToHtml preserves code blocks without parsing markdown inside', async () => {
  const markdown = '```js\nconst x = "# Not a heading";\n```'
  const html = await markdownToHtml(markdown)

  assert.match(html, /<pre>/)
  assert.match(html, /<code/)
  assert.doesNotMatch(html, /<h1/)
})

test('markdownToHtml renders GFM tables', async () => {
  const markdown = `
| Name | Age |
|------|-----|
| Alice | 30 |
`
  const html = await markdownToHtml(markdown)

  assert.match(html, /<table>/)
  assert.match(html, /<th>Name<\/th>/)
  assert.match(html, /<td>Alice<\/td>/)
})

test('markdownToHtml escapes raw HTML', async () => {
  const markdown = '<div class="custom">Raw HTML</div>'
  const html = await markdownToHtml(markdown)

  assert.match(html, /&lt;div class="custom"&gt;Raw HTML&lt;\/div&gt;/)
  assert.doesNotMatch(html, /<div class="custom">Raw HTML<\/div>/)
})
