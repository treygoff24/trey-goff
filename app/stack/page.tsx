import type { Metadata } from 'next'
import { StackShell } from '@/components/stack/StackShell'
import '@/components/stack/stack.css'

export const metadata: Metadata = {
  title: 'The Setup — how I actually build software now',
  description:
    'A complete, working agentic development stack, explained from first principles with the real artifacts attached. If you can open a terminal, you can have this by tonight.',
  openGraph: {
    title: 'The Setup',
    description:
      'A field manual for agentic software development — from first principles to a fleet of agents reviewing each other, with downloadable artifacts.',
  },
}

export default function StackPage() {
  return <StackShell />
}
