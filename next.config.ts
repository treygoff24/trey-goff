import type { NextConfig } from 'next'
import { withContentCollections } from '@content-collections/next'

export const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Static security headers (CSP is set dynamically in middleware with a per-request nonce)
  async headers() {
    const baseHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ]

    return [
      {
        source: '/:path*',
        headers: baseHeaders,
      },
    ]
  },
}

export default withContentCollections(nextConfig)
