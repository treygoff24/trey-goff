import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractWikilinksFromMarkdown,
  normalizeWikiKey,
  splitWikilinkText,
} from '@/lib/wikilinks'
import { markdownToHtml } from '@/lib/markdown'

test('normalizeWikiKey strips punctuation and collapses spaces', () => {
  const key = normalizeWikiKey('Hello, World! 2025')
  assert.equal(key, 'hello world 2025')
})

test('splitWikilinkText handles labels and plain targets', () => {
  const segments = splitWikilinkText('Start [[Alpha]] mid [[Beta|B]] end')

  assert.deepEqual(segments, [
    { type: 'text', value: 'Start ' },
    { type: 'link', target: 'Alpha', label: 'Alpha' },
    { type: 'text', value: ' mid ' },
    { type: 'link', target: 'Beta', label: 'B' },
    { type: 'text', value: ' end' },
  ])
})

test('extractWikilinksFromMarkdown skips code and links', () => {
  const markdown = `
Link to [[Alpha]].

\`[[Inline]]\`

\`\`\`
[[Block]]
\`\`\`

[Label [[Ignored]]](https://example.com)
`

  const targets = extractWikilinksFromMarkdown(markdown)
  assert.deepEqual(targets, ['Alpha'])
})

test('markdownToHtml converts wikilinks to anchors', async () => {
  const html = await markdownToHtml('See [[The Control Room]].')
  assert.match(html, /href="\/projects#the-control-room"/)
})
