import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  QUALITY_PRESETS,
  applyReducedMotion,
  createAutoTuneState,
  getAutoTunedTier,
  getCanvasConfig,
  getQualitySettings,
  recordFrameSample,
} from '@/lib/interactive/quality'

test('getQualitySettings returns presets and auto defaults to medium', () => {
  assert.deepEqual(getQualitySettings('low'), QUALITY_PRESETS.low)
  assert.deepEqual(getQualitySettings('medium'), QUALITY_PRESETS.medium)
  assert.deepEqual(getQualitySettings('high'), QUALITY_PRESETS.high)
  assert.deepEqual(getQualitySettings('auto'), QUALITY_PRESETS.medium)
})

test('applyReducedMotion disables motion-heavy postprocessing', () => {
  const reduced = applyReducedMotion(QUALITY_PRESETS.high)

  assert.equal(reduced.postprocessing.noise, null)
  assert.equal(reduced.postprocessing.chromaticAberration, null)
  assert.equal(reduced.postprocessing.depthOfField, null)
  assert.deepEqual(reduced.postprocessing.bloom, QUALITY_PRESETS.high.postprocessing.bloom)
})

test('getCanvasConfig mirrors quality settings', () => {
  const config = getCanvasConfig(QUALITY_PRESETS.medium)

  assert.equal(config.dpr, QUALITY_PRESETS.medium.dpr)
  assert.equal(config.gl.antialias, QUALITY_PRESETS.medium.antialias)
  assert.equal(config.gl.powerPreference, 'high-performance')
  assert.equal(config.gl.outputColorSpace, 'srgb')
})

test('auto-tuning downgrades when frame times are high', () => {
  const state = createAutoTuneState(false)
  const now = performance.now()

  state.samples = Array.from({ length: 60 }, (_, i) => ({
    frameTime: 30,
    timestamp: now - 500 + i,
  }))
  state.sampleCount = 60
  state.lastAdjustment = now - 10000

  const result = recordFrameSample(state, 30)
  assert.equal(result, 'low')
  assert.equal(getAutoTunedTier(state), 'low')
})

test('auto-tuning upgrades when frame times are low', () => {
  const state = createAutoTuneState(false)
  const now = performance.now()

  state.currentTier = 'low'
  state.samples = Array.from({ length: 60 }, (_, i) => ({
    frameTime: 8,
    timestamp: now - 500 + i,
  }))
  state.sampleCount = 60
  state.lastAdjustment = now - 10000

  const result = recordFrameSample(state, 8)
  assert.equal(result, 'medium')
  assert.equal(getAutoTunedTier(state), 'medium')
})

test('auto-tuning never upgrades on mobile', () => {
  const state = createAutoTuneState(true)
  const now = performance.now()

  state.currentTier = 'low'
  state.samples = Array.from({ length: 60 }, (_, i) => ({
    frameTime: 8,
    timestamp: now - 500 + i,
  }))
  state.sampleCount = 60
  state.lastAdjustment = now - 10000

  const result = recordFrameSample(state, 8)
  assert.equal(result, null)
  assert.equal(getAutoTunedTier(state), 'low')
})
