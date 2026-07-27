import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { withContentCollections } from '@content-collections/next'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export const nextConfig: NextConfig = {
  // .next is a single-writer resource: a `next build` run while a dev server is live silently
  // clobbers the server's chunks and the wreckage surfaces as mass element-not-found in e2e.
  // Lanes that must coexist with other agents (the e2e webServer sets NEXT_DIST_DIR=.next-e2e)
  // get their own output tree instead.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  // Must match `turbopack.root` — Next warns if tracing root and Turbopack root differ.
  // Both anchor to this app so a parent-level lockfile does not widen the workspace root.
  outputFileTracingRoot: projectRoot,
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
