import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('components/stack/RecoveryFigure.tsx', 'utf8')
const styles = readFileSync('components/stack/recovery-figure.css', 'utf8')

test('recovery figure uses one active beat for steps and tally', () => {
  assert.match(source, /const activeBeat = armed \? beat : MAX_BEAT/)
  assert.match(source, /tally\(lane, activeBeat\)/)
  assert.match(source, /activeBeat >= s\.beat \? ' is-on' : ''/)
})

test('armed recovery steps do not appear before their beat', () => {
  assert.match(styles, /#stack-root \.rcv\.is-armed \.rcv-step \{\s*opacity: 0;/)
})
