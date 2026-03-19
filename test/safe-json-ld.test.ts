import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { serializeJsonLd } from '@/lib/safe-json-ld'

describe('serializeJsonLd', () => {
  test('escapes less-than so script tags cannot break out of JSON-LD script context', () => {
    const payload = { name: '</script><script>alert(1)</script>' }
    const out = serializeJsonLd(payload)
    assert.ok(!out.includes('</script>'), 'serialized output must not contain raw closing script')
    assert.ok(
      out.includes('\\u003c/script\\u003e') || out.includes('\\u003c'),
      'must escape angle brackets',
    )
  })

  test('round-trips through JSON.parse for values without angle brackets', () => {
    const payload = { title: 'Hello', nested: { x: 1 } }
    assert.deepEqual(JSON.parse(serializeJsonLd(payload)), payload)
  })

  test('escapes angle brackets inside nested string values', () => {
    const payload = { '@context': 'https://schema.org', itemListElement: [{ name: 'a<b' }] }
    const out = serializeJsonLd(payload)
    assert.ok(!out.includes('<b'))
    assert.deepEqual(JSON.parse(out), payload)
  })
})
