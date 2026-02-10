import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { canAccessDraftPreview } from '@/lib/preview-auth'

describe('canAccessDraftPreview', () => {
  test('denies in production when DRAFT_PREVIEW_SECRET is missing', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        providedSecret: undefined,
        previewSecret: undefined,
      }),
      false
    )
  })

  test('requires a valid secret in production', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        providedSecret: undefined,
        previewSecret: 'top-secret',
      }),
      false
    )

    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        providedSecret: 'wrong-secret',
        previewSecret: 'top-secret',
      }),
      false
    )

    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'production',
        providedSecret: 'top-secret',
        previewSecret: 'top-secret',
      }),
      true
    )
  })

  test('allows preview in non-production environments', () => {
    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'development',
        providedSecret: undefined,
        previewSecret: undefined,
      }),
      true
    )

    assert.equal(
      canAccessDraftPreview({
        nodeEnv: 'test',
        providedSecret: 'wrong-secret',
        previewSecret: 'top-secret',
      }),
      true
    )
  })
})
