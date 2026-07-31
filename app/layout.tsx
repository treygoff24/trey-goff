import type { Metadata } from 'next'
import { satoshi, newsreader, monaspace } from '@/lib/fonts'
import { TopNav } from '@/components/layout/TopNav'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/layout/SkipLink'
import { AuroraBackground } from '@/components/layout/AuroraBackground'
import { CommandPaletteProvider, CommandPalette } from '@/components/command'
import { EasterEggs } from '@/components/easter-eggs/EasterEggs'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/structured-data'
import { serializeJsonLd } from '@/lib/safe-json-ld'
import { rssAlternates, siteUrl } from '@/lib/site-config'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Trey Goff',
    template: '%s — Trey',
  },
  description:
    'Governance, institutional design, and practical experimentation for a faster future.',
  authors: [{ name: 'Trey Goff', url: siteUrl }, { name: 'Fable (Claude)' }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': rssAlternates,
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
  const webSiteSchema = generateWebSiteSchema()

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable}`}
    >
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(webSiteSchema),
          }}
        />
        <CommandPaletteProvider>
          <AuroraBackground />
          <SkipLink />
          <TopNav />
          <main id="main-content" className="relative z-10 flex-1 outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CommandPalette />
          <EasterEggs />
          <SpeedInsights />
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
