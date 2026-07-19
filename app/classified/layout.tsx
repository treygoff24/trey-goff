import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Records Division',
  description: 'Notice of administrative non-access.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default function ClassifiedLayout({ children }: { children: React.ReactNode }) {
  return children
}
