import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { withContentCollections } from '@content-collections/next'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  turbopack: {
    // Anchor Turbopack to the actual project directory instead of letting it infer
    // the workspace root from the parent-level lockfile in /Users/treygoff.
    root: projectRoot,
  },

  // Static security headers (CSP is set dynamically in root `proxy.ts` with a per-request nonce on strict routes)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.mzstatic.com', pathname: '/**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
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
