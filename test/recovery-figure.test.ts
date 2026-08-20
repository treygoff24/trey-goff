import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LANES, MAX_BEAT, tally } from '@/components/stack/recovery-data'

const without = LANES.find((l) => l.id === 'without')
const withRule = LANES.find((l) => l.id === 'with')

test('the scoreboard reads zero before the first beat', () => {
  assert.ok(without && withRule)
  assert.deepEqual(tally(without, 0), { commands: 0, dead: 0, at: '0:00', done: false })
  assert.deepEqual(tally(withRule, 0), { commands: 0, dead: 0, at: '0:00', done: false })
})

test('the tally advances with the beat clock and lands on the real totals', () => {
  assert.ok(without && withRule)
  let prev = tally(without, 0)
  for (let b = 1; b <= MAX_BEAT; b += 1) {
    const cur = tally(without, b)
    assert.ok(cur.commands >= prev.commands && cur.dead >= prev.dead)
    prev = cur
  }
  assert.deepEqual(tally(without, MAX_BEAT), { commands: 6, dead: 4, at: '9:12', done: true })
  assert.deepEqual(tally(withRule, MAX_BEAT), { commands: 2, dead: 0, at: '0:39', done: true })
})

test('the rule lane is finished by beat three and then holds', () => {
  assert.ok(withRule)
  const atThree = tally(withRule, 3)
  assert.equal(atThree.done, true)
  assert.deepEqual(tally(withRule, MAX_BEAT), atThree)
})
