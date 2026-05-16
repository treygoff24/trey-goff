import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SUBSCRIBE_MAX_BODY_BYTES } from '@/lib/subscribe-request'

process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER = 'true'
process.env.BUTTONDOWN_API_KEY = 'test-buttondown-key'

const routeModule = import('@/app/api/subscribe/route')
let ipCounter = 80

function nextClientIp() {
  ipCounter++
  return `203.0.113.${ipCounter}`
}

function jsonRequest(
  body: unknown,
  {
    contentType = 'application/json',
    ip = nextClientIp(),
  }: { contentType?: string; ip?: string } = {},
) {
  return new Request('https://trey.world/api/subscribe', {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'x-forwarded-for': ip,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

async function withMockFetch(
  handler: Parameters<typeof fetch>[0] extends never
    ? never
    : (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>,
  run: (calls: Parameters<typeof fetch>[]) => Promise<void>,
) {
  const originalFetch = globalThis.fetch
  const calls: Parameters<typeof fetch>[] = []
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    calls.push(args)
    return handler(...args)
  }) as typeof fetch

  try {
    await run(calls)
  } finally {
    globalThis.fetch = originalFetch
  }
}

async function postSubscribe(request: import('next/server').NextRequest) {
  const { POST } = await routeModule
  return POST(request)
}

test('subscribe route uses shared request helpers', () => {
  const src = readFileSync(join(process.cwd(), 'app/api/subscribe/route.ts'), 'utf-8')
  assert.match(src, /parseSubscribePostBody/)
  assert.match(src, /getTrustedClientIp/)
  assert.match(src, /isJsonContentType/)
})

test('subscribe route rejects oversized streamed bodies without buffering them with request.text()', async () => {
  const body = JSON.stringify({
    email: `${'a'.repeat(SUBSCRIBE_MAX_BODY_BYTES)}@example.com`,
  })
  const bodyBytes = new TextEncoder().encode(body)
  const originalFetch = globalThis.fetch
  let fetchCalls = 0
  globalThis.fetch = (async () => {
    fetchCalls++
    throw new Error('fetch should not be called for oversized bodies')
  }) as typeof fetch

  try {
    const response = await postSubscribe({
      headers: new Headers({
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.44',
      }),
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bodyBytes)
          controller.close()
        },
      }),
      text() {
        throw new Error('request.text() should not be called')
      },
    } as unknown as import('next/server').NextRequest)

    assert.equal(response.status, 413)
    assert.equal(fetchCalls, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('subscribe route sends valid subscriptions to Buttondown', async () => {
  await withMockFetch(
    async () => new Response(null, { status: 201 }),
    async (calls) => {
      const response = await postSubscribe(jsonRequest({ email: 'hi@example.com' }))
      const data = await response.json()
      const init = calls[0]?.[1] as RequestInit | undefined
      const headers = init?.headers as Record<string, string> | undefined

      assert.equal(response.status, 200)
      assert.deepEqual(data, { message: 'Success! Check your inbox to confirm.' })
      assert.equal(calls.length, 1)
      assert.equal(calls[0]?.[0], 'https://api.buttondown.email/v1/subscribers')
      assert.equal(init?.method, 'POST')
      assert.equal(headers?.Authorization, 'Token test-buttondown-key')
      assert.equal(init?.body, JSON.stringify({ email: 'hi@example.com', tags: ['website'] }))
    },
  )
})

test('subscribe route treats already-subscribed Buttondown responses as success', async () => {
  await withMockFetch(
    async () =>
      new Response(JSON.stringify({ email: ['This email is already subscribed'] }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    async (calls) => {
      const response = await postSubscribe(jsonRequest({ email: 'duplicate@example.com' }))
      const data = await response.json()

      assert.equal(response.status, 200)
      assert.deepEqual(data, { message: 'Success! Check your inbox to confirm.' })
      assert.equal(calls.length, 1)
    },
  )
})

test('subscribe route maps Buttondown rate limits to 429', async () => {
  await withMockFetch(
    async () => new Response(null, { status: 429 }),
    async () => {
      const response = await postSubscribe(jsonRequest({ email: 'limited@example.com' }))
      const data = await response.json()

      assert.equal(response.status, 429)
      assert.deepEqual(data, { error: 'Too many requests. Please try again later.' })
    },
  )
})

test('subscribe route rejects invalid JSON before calling Buttondown', async () => {
  await withMockFetch(
    async () => {
      throw new Error('fetch should not be called for invalid JSON')
    },
    async (calls) => {
      const response = await postSubscribe(jsonRequest('{', { ip: nextClientIp() }))
      const data = await response.json()

      assert.equal(response.status, 400)
      assert.deepEqual(data, { error: 'Invalid JSON' })
      assert.equal(calls.length, 0)
    },
  )
})

test('subscribe route rejects non-JSON content types before calling Buttondown', async () => {
  await withMockFetch(
    async () => {
      throw new Error('fetch should not be called for non-JSON requests')
    },
    async (calls) => {
      const response = await postSubscribe(
        jsonRequest('email=hi@example.com', { contentType: 'text/plain' }),
      )
      const data = await response.json()

      assert.equal(response.status, 415)
      assert.deepEqual(data, { error: 'Content-Type must be application/json' })
      assert.equal(calls.length, 0)
    },
  )
})

test('subscribe route enforces local rate limits before calling Buttondown again', async () => {
  const ip = nextClientIp()

  await withMockFetch(
    async () => new Response(null, { status: 201 }),
    async (calls) => {
      for (let requestIndex = 0; requestIndex < 5; requestIndex++) {
        const response = await postSubscribe(
          jsonRequest({ email: `person-${requestIndex}@example.com` }, { ip }),
        )
        assert.equal(response.status, 200)
      }

      const response = await postSubscribe(jsonRequest({ email: 'blocked@example.com' }, { ip }))
      const data = await response.json()

      assert.equal(response.status, 429)
      assert.deepEqual(data, { error: 'Too many requests. Please try again later.' })
      assert.equal(response.headers.get('Retry-After'), '60')
      assert.equal(calls.length, 5)
    },
  )
})
