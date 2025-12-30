import { Radio } from 'lucide-react'
import { TransmissionCard } from '@/components/transmissions'
import { getAllTransmissions, getFeaturedTransmissions } from '@/lib/transmissions'

export const metadata = {
  title: 'Transmissions',
  description: 'Writing published elsewhere across the network.',
}

export default function TransmissionsPage() {
  const allTransmissions = getAllTransmissions()
  const featuredTransmissions = getFeaturedTransmissions()
  const regularTransmissions = allTransmissions.filter((t) => !t.featured)

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      {/* Header with broadcast theme */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-warm/20 blur-xl rounded-full" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-warm/30 bg-surface-1">
              <Radio className="h-5 w-5 text-warm" />
            </div>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-warm/30 via-border-1 to-transparent" />
        </div>

        <h1 className="font-satoshi text-4xl font-medium text-text-1 mb-4">
          Transmissions
        </h1>
        <p className="text-lg text-text-2 max-w-2xl">
          Writing broadcast elsewhere across the network. Ideas that found homes
          in other publications, sent out into the world.
        </p>

        {/* Status indicator */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-1 bg-surface-1 px-3 py-1.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-text-3">
            <span className="text-text-2">{allTransmissions.length}</span> active transmissions
          </span>
        </div>
      </header>

      {/* Featured transmissions */}
      {featuredTransmissions.length > 0 && (
        <section className="mb-12">
          <h2 className="flex items-center gap-2 mb-6 text-sm font-medium uppercase tracking-wider text-text-3">
            <span className="h-px w-4 bg-warm" />
            Featured Signals
          </h2>
          <div className="space-y-4">
            {featuredTransmissions.map((transmission) => (
              <TransmissionCard
                key={transmission.id}
                transmission={transmission}
                variant="featured"
              />
            ))}
          </div>
        </section>
      )}

      {/* All transmissions */}
      {regularTransmissions.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 mb-6 text-sm font-medium uppercase tracking-wider text-text-3">
            <span className="h-px w-4 bg-border-1" />
            All Transmissions
          </h2>
          <div className="space-y-4">
            {regularTransmissions.map((transmission) => (
              <TransmissionCard
                key={transmission.id}
                transmission={transmission}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {allTransmissions.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-2 bg-surface-1/50 p-12 text-center">
          <Radio className="mx-auto h-12 w-12 text-text-3 mb-4" />
          <p className="text-text-2 mb-2">No transmissions yet</p>
          <p className="text-sm text-text-3">
            External publications will appear here once added.
          </p>
        </div>
      )}
    </div>
  )
}
