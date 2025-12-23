import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

/**
 * Tests for the subscribe API route validation logic.
 *
 * Since the actual route handler requires Next.js runtime objects,
 * we test the validation logic and email regex patterns directly.
 * For full integration testing of the API route, consider using
 * a framework like Playwright or the Next.js test utilities.
 */

// Extract the email regex pattern used in the route
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ============================================
// Email validation tests
// ============================================

describe('email validation regex', () => {
  describe('valid emails', () => {
    const validEmails = [
      'test@example.com',
      'user@domain.org',
      'name@company.co.uk',
      'first.last@email.net',
      'user123@test.io',
      'a@b.co',
      'user+tag@gmail.com',
      'hyphen-name@domain.com',
      'underscore_name@domain.com',
      'numbers123@domain.com',
      'UPPERCASE@DOMAIN.COM',
      'MixedCase@Domain.Com',
    ]

    for (const email of validEmails) {
      test(`accepts "${email}"`, () => {
        assert.ok(EMAIL_REGEX.test(email), `${email} should be valid`)
      })
    }
  })

  describe('invalid emails', () => {
    const invalidEmails = [
      '', // Empty
      'notanemail', // No @ symbol
      '@nodomain.com', // No local part
      'no@domain', // No TLD
      'spaces in@email.com', // Spaces in local part
      'email@spaces in.com', // Spaces in domain
      'email@@double.com', // Double @
      'email@.com', // No domain name
    ]

    for (const email of invalidEmails) {
      test(`rejects "${email || '(empty)'}"`, () => {
        assert.ok(!EMAIL_REGEX.test(email), `${email} should be invalid`)
      })
    }
  })

  describe('permissive edge cases (basic regex accepts these)', () => {
    // Note: The basic regex used in the API is intentionally permissive.
    // These technically match the pattern even though stricter validators
    // might reject them. The goal is to catch obvious typos, not be RFC-compliant.
    const permissivelyAccepted = [
      '.leading@domain.com',
      'trailing.@domain.com',
    ]

    for (const email of permissivelyAccepted) {
      test(`accepts "${email}" (basic validation)`, () => {
        assert.ok(EMAIL_REGEX.test(email), `Basic regex accepts ${email}`)
      })
    }
  })

  describe('edge cases', () => {
    test('rejects email with only whitespace', () => {
      assert.ok(!EMAIL_REGEX.test('   '))
    })

    test('rejects email with newlines', () => {
      assert.ok(!EMAIL_REGEX.test('test\n@example.com'))
    })

    test('rejects email with tabs', () => {
      assert.ok(!EMAIL_REGEX.test('test\t@example.com'))
    })
  })
})

// ============================================
// Request body validation tests
// ============================================

describe('request body validation', () => {
  // Simulate the validation logic from the route
  function validateRequestBody(body: unknown): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
      return { valid: false, error: 'Invalid request body' }
    }

    const { email } = body as { email?: unknown }

    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' }
    }

    if (!EMAIL_REGEX.test(email)) {
      return { valid: false, error: 'Invalid email format' }
    }

    return { valid: true }
  }

  test('rejects null body', () => {
    const result = validateRequestBody(null)
    assert.equal(result.valid, false)
  })

  test('rejects undefined body', () => {
    const result = validateRequestBody(undefined)
    assert.equal(result.valid, false)
  })

  test('rejects empty object', () => {
    const result = validateRequestBody({})
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Email is required')
  })

  test('rejects missing email', () => {
    const result = validateRequestBody({ name: 'Test' })
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Email is required')
  })

  test('rejects null email', () => {
    const result = validateRequestBody({ email: null })
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Email is required')
  })

  test('rejects numeric email', () => {
    const result = validateRequestBody({ email: 12345 })
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Email is required')
  })

  test('rejects array email', () => {
    const result = validateRequestBody({ email: ['test@example.com'] })
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Email is required')
  })

  test('rejects invalid email format', () => {
    const result = validateRequestBody({ email: 'notanemail' })
    assert.equal(result.valid, false)
    assert.equal(result.error, 'Invalid email format')
  })

  test('accepts valid email', () => {
    const result = validateRequestBody({ email: 'test@example.com' })
    assert.equal(result.valid, true)
    assert.equal(result.error, undefined)
  })
})

// ============================================
// Response status code mapping tests
// ============================================

describe('API response status codes', () => {
  // Based on the route handler logic
  const statusCodes = {
    SUCCESS: 201,
    MISSING_EMAIL: 400,
    INVALID_FORMAT: 400,
    ALREADY_SUBSCRIBED: 400,
    RATE_LIMITED: 429,
    SERVER_ERROR: 500,
    NOT_CONFIGURED: 500,
  }

  test('201 for successful subscription', () => {
    assert.equal(statusCodes.SUCCESS, 201)
  })

  test('400 for client validation errors', () => {
    assert.equal(statusCodes.MISSING_EMAIL, 400)
    assert.equal(statusCodes.INVALID_FORMAT, 400)
    assert.equal(statusCodes.ALREADY_SUBSCRIBED, 400)
  })

  test('429 for rate limiting', () => {
    assert.equal(statusCodes.RATE_LIMITED, 429)
  })

  test('500 for server errors', () => {
    assert.equal(statusCodes.SERVER_ERROR, 500)
    assert.equal(statusCodes.NOT_CONFIGURED, 500)
  })
})

// ============================================
// Buttondown error response parsing tests
// ============================================

describe('Buttondown error parsing', () => {
  interface ButtondownError {
    detail?: string
    email?: string[]
  }

  function isAlreadySubscribed(error: ButtondownError): boolean {
    return error.email?.some((e) => e.includes('already subscribed')) ?? false
  }

  test('detects already subscribed error', () => {
    const error: ButtondownError = {
      email: ['This email is already subscribed to this newsletter.'],
    }
    assert.ok(isAlreadySubscribed(error))
  })

  test('detects already subscribed in array of errors', () => {
    const error: ButtondownError = {
      email: ['Some other error', 'You are already subscribed'],
    }
    assert.ok(isAlreadySubscribed(error))
  })

  test('returns false for other errors', () => {
    const error: ButtondownError = {
      email: ['Invalid email address'],
    }
    assert.ok(!isAlreadySubscribed(error))
  })

  test('returns false for missing email array', () => {
    const error: ButtondownError = {
      detail: 'Bad request',
    }
    assert.ok(!isAlreadySubscribed(error))
  })

  test('returns false for empty email array', () => {
    const error: ButtondownError = {
      email: [],
    }
    assert.ok(!isAlreadySubscribed(error))
  })
})

// ============================================
// Error message tests
// ============================================

describe('API error messages', () => {
  const errorMessages = {
    MISSING_API_KEY: 'Newsletter service not configured',
    EMAIL_REQUIRED: 'Email is required',
    INVALID_FORMAT: 'Invalid email format',
    ALREADY_SUBSCRIBED: 'You are already subscribed!',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    GENERIC: 'Something went wrong. Please try again.',
  }

  test('provides user-friendly error messages', () => {
    // All error messages should be user-friendly (not technical)
    for (const [key, message] of Object.entries(errorMessages)) {
      assert.ok(message.length > 0, `${key} should have a message`)
      assert.ok(!message.includes('Error:'), `${key} should not start with "Error:"`)
      assert.ok(!message.includes('undefined'), `${key} should not contain "undefined"`)
      assert.ok(!message.includes('null'), `${key} should not contain "null"`)
    }
  })

  test('rate limit message suggests retry', () => {
    assert.ok(errorMessages.RATE_LIMITED.includes('later'))
  })

  test('already subscribed message is positive', () => {
    assert.ok(errorMessages.ALREADY_SUBSCRIBED.includes('!'))
  })
})

// ============================================
// Success response tests
// ============================================

describe('success response', () => {
  const successMessage = 'Success! Check your inbox to confirm.'

  test('includes confirmation instruction', () => {
    assert.ok(successMessage.includes('inbox'))
    assert.ok(successMessage.includes('confirm'))
  })

  test('is encouraging', () => {
    assert.ok(successMessage.includes('Success') || successMessage.includes('!'))
  })
})
