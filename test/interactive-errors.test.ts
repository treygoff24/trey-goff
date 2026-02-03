import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ChunkLoadError,
  ContextLostError,
  MemoryExhaustionError,
  ShaderError,
  checkMemoryPressure,
  getRecoveryStrategy,
  monitorMemory,
  monitorTabSuspension,
  retryWithBackoff,
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

test('checkMemoryPressure returns null when memory is unavailable', () => {
  const originalMemory = (performance as Performance & { memory?: unknown }).memory
  ;(performance as Performance & { memory?: unknown }).memory = undefined

  const result = checkMemoryPressure()
  assert.equal(result, null)

  ;(performance as Performance & { memory?: unknown }).memory = originalMemory
})

test('checkMemoryPressure reports usage stats when available', () => {
  const originalMemory = (performance as Performance & { memory?: unknown }).memory
  ;(performance as Performance & { memory?: unknown }).memory = {
    usedJSHeapSize: 80 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024,
  }

  const result = checkMemoryPressure()
  assert.ok(result)
  assert.equal(result?.usedMb, 80)
  assert.equal(result?.limitMb, 100)
  assert.equal(Math.round(result?.usagePct ?? 0), 80)

  ;(performance as Performance & { memory?: unknown }).memory = originalMemory
})

test('monitorMemory triggers warnings and cleans up', () => {
  const originalMemory = (performance as Performance & { memory?: unknown }).memory
  ;(performance as Performance & { memory?: unknown }).memory = {
    usedJSHeapSize: 90 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024,
  }

  const originalSetInterval = globalThis.setInterval
  const originalClearInterval = globalThis.clearInterval
  let storedCallback: (() => void) | null = null
  let clearedId: NodeJS.Timeout | null = null

  globalThis.setInterval = ((callback) => {
    storedCallback = callback as () => void
    return 123 as unknown as NodeJS.Timeout
  }) as typeof setInterval

  globalThis.clearInterval = ((id) => {
    clearedId = id as NodeJS.Timeout
  }) as typeof clearInterval

  let warned = false
  const cleanup = monitorMemory(() => {
    warned = true
  }, 80)

  storedCallback?.()
  assert.equal(warned, true)

  cleanup()
  assert.equal(clearedId, 123 as unknown as NodeJS.Timeout)

  globalThis.setInterval = originalSetInterval
  globalThis.clearInterval = originalClearInterval
  ;(performance as Performance & { memory?: unknown }).memory = originalMemory
})

test('monitorTabSuspension fires suspend and restore callbacks', () => {
  const globalAny = globalThis as typeof globalThis & { document?: unknown }
  const originalDocument = globalAny.document

  let visibilityHandler: (() => void) | null = null
  globalAny.document = {
    visibilityState: 'visible',
    addEventListener: (_event: string, handler: () => void) => {
      visibilityHandler = handler
    },
    removeEventListener: () => {
      visibilityHandler = null
    },
  }

  let suspendCount = 0
  let restoreCount = 0
  const cleanup = monitorTabSuspension(
    () => {
      restoreCount += 1
    },
    () => {
      suspendCount += 1
    }
  )

  ;(globalAny.document as { visibilityState: string }).visibilityState = 'hidden'
  visibilityHandler?.()
  ;(globalAny.document as { visibilityState: string }).visibilityState = 'visible'
  visibilityHandler?.()

  assert.equal(suspendCount, 1)
  assert.equal(restoreCount, 1)

  cleanup()
  globalAny.document = originalDocument
})

test('retryWithBackoff retries until success', async () => {
  let attempts = 0
  const result = await retryWithBackoff(async () => {
    attempts += 1
    if (attempts < 3) {
      throw new Error('nope')
    }
    return 'ok'
  }, 3, 1)

  assert.equal(result, 'ok')
  assert.equal(attempts, 3)
})

test('retryWithBackoff throws the last error after max attempts', async () => {
  let attempts = 0
  await assert.rejects(
    () =>
      retryWithBackoff(async () => {
        attempts += 1
        throw new Error('fail')
      }, 2, 1),
    /fail/
  )
  assert.equal(attempts, 2)
})
