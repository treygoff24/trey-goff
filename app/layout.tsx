import type { Metadata } from 'next'
import { satoshi, newsreader, monaspace } from '@/lib/fonts'
import { TopNav } from '@/components/layout/TopNav'
import { Footer } from '@/components/layout/Footer'
import {
  CommandPaletteProvider,
  CommandPalette,
} from '@/components/command'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Trey Goff',
    template: '%s — Trey',
  },
  description:
    'Building better governance through acceleration zones and institutional innovation.',
  metadataBase: new URL('https://trey.world'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trey.world',
    siteName: 'Trey Goff',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@treygoff',
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
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <CommandPaletteProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
