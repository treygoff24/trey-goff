import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  arePreviewSecretsEqual,
  canAccessDraftPreview,
  isValidPreviewSessionCookie,
  previewSessionToken,
} from '@/lib/preview-auth'

describe('previewSessionToken + isValidPreviewSessionCookie', () => {
  test('cookie validates for matching secret', () => {
    const secret = 'my-preview-secret'
    const token = previewSessionToken(secret)
    assert.equal(isValidPreviewSessionCookie(token, secret), true)
  })

  test('rejects wrong secret', () => {
    const token = previewSessionToken('a')
    assert.equal(isValidPreviewSessionCookie(token, 'b'), false)
  })

  test('rejects empty cookie or secret', () => {
    assert.equal(isValidPreviewSessionCookie(undefined, 'x'), false)
    assert.equal(isValidPreviewSessionCookie('x', undefined), false)
  })
})

describe('arePreviewSecretsEqual', () => {
  test('matches equal strings', () => {
    assert.equal(arePreviewSecretsEqual('abc', 'abc'), true)
  })

  test('rejects unequal strings', () => {
    assert.equal(arePreviewSecretsEqual('abc', 'abd'), false)
  })
})

describe('canAccessDraftPreview', () => {
  test('allows any session in non-production', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'development',
        allowDraftPreview: false,
        previewSecret: undefined,
        sessionCookie: undefined,
      }),
      true,
    )
  })

  test('allows in test environment without cookie', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'test',
        allowDraftPreview: false,
        previewSecret: 'x',
        sessionCookie: undefined,
      }),
      true,
    )
  })

  test('production denies when ALLOW_DRAFT_PREVIEW is off even with cookie', () => {
    const secret = 's'
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        allowDraftPreview: false,
        previewSecret: secret,
        sessionCookie: previewSessionToken(secret),
      }),
      false,
    )
  })

  test('production denies when secret not configured', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        allowDraftPreview: true,
        previewSecret: undefined,
        sessionCookie: 'anything',
      }),
      false,
    )
  })

  test('production denies without session cookie', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        allowDraftPreview: true,
        previewSecret: 'configured',
        sessionCookie: undefined,
      }),
      false,
    )
  })

  test('production denies with invalid session cookie', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        allowDraftPreview: true,
        previewSecret: 'configured',
        sessionCookie: 'tampered',
      }),
      false,
    )
  })

  test('production allows with flag, secret, and valid session cookie', () => {
    const secret = 'configured'
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        allowDraftPreview: true,
        previewSecret: secret,
        sessionCookie: previewSessionToken(secret),
      }),
      true,
    )
  })
})
