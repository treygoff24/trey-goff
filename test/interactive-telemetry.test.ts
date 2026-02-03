import assert from 'node:assert/strict'
import test, { afterEach, beforeEach } from 'node:test'
import {
  getSessionId,
  getTimeSinceStart,
  getTimeToMilestone,
  isTelemetryEnabled,
  recordContextLost,
  recordDownloadComplete,
  recordEntryChoice,
  recordFpsSample,
  recordLongFrame,
  recordMemoryWarning,
  recordMilestone,
  recordQualityTierChange,
  recordReturnToNormal,
  recordRoomEntered,
  resetTelemetry,
  setTelemetryEnabled,
} from '@/lib/interactive/telemetry'

const originalConsoleLog = console.log
const originalEnv = process.env.NODE_ENV
let logs: unknown[][] = []

const findLog = (type: string) => logs.find((args) => args[1] === type)
const findFlushLog = () =>
  logs.find((args) => args[0] === '[Telemetry] Flushed')

beforeEach(() => {
  logs = []
  console.log = (...args: unknown[]) => {
    logs.push(args)
  }
  process.env.NODE_ENV = 'development'
  resetTelemetry()
  setTelemetryEnabled(true)
})

afterEach(() => {
  console.log = originalConsoleLog
  process.env.NODE_ENV = originalEnv
  setTelemetryEnabled(true)
})

test('records milestones and timing helpers', () => {
  recordMilestone('first_render', { reason: 'test' })

  const timing = getTimeToMilestone('first_render')
  assert.ok(typeof timing === 'number')
  assert.ok(getTimeSinceStart() >= 0)

  const log = findLog('milestone:first_render')
  assert.ok(log)
  assert.equal((log?.[2] as Record<string, unknown>).reason, 'test')
})

test('records download completion with throughput', () => {
  recordDownloadComplete('chunk-a', 1_000_000, 1000)
  const log = findLog('milestone:download_complete')
  assert.ok(log)

  const data = log?.[2] as Record<string, unknown>
  assert.equal(data.chunkId, 'chunk-a')
  assert.equal(data.throughputMbps, 8)
})

test('tracks room dwell time when entering a new room', () => {
  const originalNow = Date.now
  let now = 1000
  Date.now = () => now

  recordRoomEntered('mainhall')
  now = 6000
  recordRoomEntered('library')

  Date.now = originalNow

  const exitLog = findLog('engagement:room_exited')
  assert.ok(exitLog)
  const data = exitLog?.[2] as Record<string, unknown>
  assert.equal(data.room, 'mainhall')
  assert.equal(data.dwellTimeMs, 5000)
})

test('records quality tier changes with initial tier', () => {
  recordQualityTierChange('high', 'medium', 'auto')
  recordQualityTierChange('medium', 'low', 'user')

  const logsForTier = logs.filter((args) => args[1] === 'engagement:quality_tier_changed')
  assert.equal(logsForTier.length, 2)

  const lastData = logsForTier[1]?.[2] as Record<string, unknown>
  assert.equal(lastData.initialTier, 'high')
  assert.equal(lastData.fromTier, 'medium')
  assert.equal(lastData.toTier, 'low')
})

test('recordReturnToNormal flushes events and reports rooms', () => {
  recordRoomEntered('mainhall')
  recordReturnToNormal('mainhall')

  const returnLog = findLog('engagement:return_to_normal')
  assert.ok(returnLog)
  const data = returnLog?.[2] as Record<string, unknown>
  assert.ok(Array.isArray(data.roomsVisited))
  assert.ok((data.roomsVisited as string[]).includes('mainhall'))

  assert.ok(findFlushLog())
})

test('recordFpsSample emits a sampled event after interval', () => {
  const originalNow = Date.now
  let now = 0
  Date.now = () => now
  resetTelemetry()

  recordFpsSample(60)
  now = 6000
  recordFpsSample(30)

  Date.now = originalNow

  const log = findLog('performance:fps_sample')
  assert.ok(log)
})

test('records long frames and memory warnings', () => {
  recordLongFrame(40)
  recordLongFrame(60)
  recordMemoryWarning(900, 1000)

  const longFrameLog = findLog('performance:long_frame')
  assert.ok(longFrameLog)
  const memoryLog = findLog('performance:memory_warning')
  assert.ok(memoryLog)
})

test('recordContextLost flushes immediately', () => {
  recordContextLost()
  assert.ok(findLog('performance:context_lost'))
  assert.ok(findFlushLog())
})

test('telemetry enable/disable toggles logging', () => {
  setTelemetryEnabled(false)
  recordEntryChoice('normal')
  assert.equal(logs.length, 0)

  setTelemetryEnabled(true)
  recordEntryChoice('interactive')
  assert.ok(findLog('engagement:entry_choice'))
})

test('session id changes after reset', () => {
  const first = getSessionId()
  resetTelemetry()
  const second = getSessionId()
  assert.notEqual(first, second)
})

test('isTelemetryEnabled reflects state', () => {
  setTelemetryEnabled(false)
  assert.equal(isTelemetryEnabled(), false)
  setTelemetryEnabled(true)
  assert.equal(isTelemetryEnabled(), true)
})
