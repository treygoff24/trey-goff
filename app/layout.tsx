import type { Metadata } from 'next'
import { satoshi, newsreader, monaspace } from '@/lib/fonts'
import { TopNav } from '@/components/layout/TopNav'
import { Footer } from '@/components/layout/Footer'
import { InnerPageBackground } from '@/components/layout/InnerPageBackground'
import { SkipLink } from '@/components/layout/SkipLink'
import { CommandPaletteProvider, CommandPalette } from '@/components/command'
import { EasterEggs } from '@/components/easter-eggs/EasterEggs'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { generateOrganizationSchema } from '@/lib/structured-data'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { siteUrl } from '@/lib/site-config'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Trey Goff',
    template: '%s — Trey',
  },
  description: 'Governance, institutional design, and practical experimentation for a faster future.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'Trey Goff RSS Feed' },
        { url: '/writing/feed.xml', title: 'Writing RSS Feed' },
        { url: '/notes/feed.xml', title: 'Notes RSS Feed' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Trey Goff',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Trey Goff',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@treygoff',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = generateOrganizationSchema()

  return (
    <html
      lang="en"
      data-command-palette-ready="true"
      className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable}`}
    >
      <body className="flex min-h-screen flex-col isolate">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationSchema),
          }}
        />
        <CommandPaletteProvider>
          <InnerPageBackground />
          <div className="relative z-10 flex min-h-screen flex-1 flex-col">
            <SkipLink />
            <TopNav />
            <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <CommandPalette />
            <EasterEggs />
            <SpeedInsights />
          </div>
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
