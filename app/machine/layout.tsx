import type { Metadata } from 'next'
import { connection } from 'next/server'
import { satoshi, newsreader, monaspace } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'The Compound Machine',
  description: 'Change the rules and watch the same people build two different futures.',
}

export default async function MachineLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection()
  return (
    <div
      className={`${satoshi.variable} ${newsreader.variable} ${monaspace.variable} min-h-screen bg-bg-0`}
    >
      {children}
    </div>
  )
}
