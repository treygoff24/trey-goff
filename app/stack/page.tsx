import type { Metadata } from 'next'
import { StackShell } from '@/components/stack/StackShell'
import '@/components/stack/stack.css'

export const metadata: Metadata = {
  title: 'The Setup — how to build good software with untrustworthy agents',
  description:
    'A complete, working agentic development stack, explained from first principles and written with both the layman and the software engineer in mind.',
  openGraph: {
    title: 'The Setup',
    description:
      'A field manual for agentic software development — from first principles to a fleet of agents reviewing each other, with downloadable artifacts.',
  },
}

export default function StackPage() {
  return <StackShell />
}
