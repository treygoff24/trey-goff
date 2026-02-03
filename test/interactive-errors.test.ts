import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ChunkLoadError,
  ContextLostError,
  MemoryExhaustionError,
  ShaderError,
  getRecoveryStrategy,
} from '@/lib/interactive/errors'

test('context lost requests reload', () => {
  const result = getRecoveryStrategy(new ContextLostError(), 0)
  assert.equal(result.action, 'reload')
  assert.equal(result.success, false)
})

test('chunk load error retries before fallback', () => {
  const retryResult = getRecoveryStrategy(new ChunkLoadError('chunk-a', 1), 0)
  assert.equal(retryResult.action, 'retry')
  assert.equal(retryResult.success, true)

  const fallbackResult = getRecoveryStrategy(new ChunkLoadError('chunk-a', 3), 0)
  assert.equal(fallbackResult.action, 'fallback')
  assert.equal(fallbackResult.success, false)
})

test('memory exhaustion downgrades then reloads', () => {
  const downgrade = getRecoveryStrategy(new MemoryExhaustionError(900, 1000), 0)
  assert.equal(downgrade.action, 'downgrade')
  assert.equal(downgrade.success, true)

  const reload = getRecoveryStrategy(new MemoryExhaustionError(900, 1000), 2)
  assert.equal(reload.action, 'reload')
  assert.equal(reload.success, false)
})

test('shader errors fall back to simplified materials', () => {
  const result = getRecoveryStrategy(new ShaderError('NebulaCore'), 0)
  assert.equal(result.action, 'fallback')
  assert.equal(result.success, true)
})

test('unknown errors retry then reload', () => {
  const retry = getRecoveryStrategy(new Error('boom'), 1)
  assert.equal(retry.action, 'retry')
  assert.equal(retry.success, true)

  const reload = getRecoveryStrategy(new Error('boom'), 3)
  assert.equal(reload.action, 'reload')
  assert.equal(reload.success, false)
  assert.equal(reload.message, 'boom')
})
