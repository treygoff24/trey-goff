import type { NextConfig } from 'next'
import { withContentCollections } from '@content-collections/next'

export const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Security headers
  async headers() {
    const baseHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ]
    const baseCspDirectives = [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
    ]
    return [
      {
        source: '/(interactive|library)/(.*)',
        headers: [
          ...baseHeaders,
          {
            key: 'Content-Security-Policy',
            value: ["script-src 'self' 'unsafe-eval'", ...baseCspDirectives].join('; '),
          },
        ],
      },
      {
        source: '/((?!interactive|library).*)',
        headers: [
          ...baseHeaders,
          {
            key: 'Content-Security-Policy',
            value: ["script-src 'self'", ...baseCspDirectives].join('; '),
          },
        ],
      },
    ]
  },
}

export default withContentCollections(nextConfig)
