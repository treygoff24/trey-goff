import type { Metadata } from 'next'
import { JobSiteShell } from '@/components/jobsite/JobSiteShell'
import { pageAlternates } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'The Job Site — AI agents explained with no jargon',
  description:
    'The ELI5 companion to The Setup: how to get real work out of AI agents, explained through one construction-site analogy.',
  alternates: pageAlternates('/jobsite', { markdownPath: '/jobsite.md' }),
  openGraph: {
    title: 'The Job Site',
    description:
      'How to get real work out of AI, explained with no jargon and one construction site.',
  },
}

export default function JobSitePage() {
  return <JobSiteShell />
}
