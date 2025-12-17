import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Subscribe',
  description: 'Get updates when I publish new essays.',
}

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Prose>
        <h1>Subscribe</h1>
        <p>
          Get notified when I publish new essays. No spam, unsubscribe anytime.
        </p>
      </Prose>

      <div className="mt-8 rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
        <p className="text-text-3">Newsletter signup coming soon.</p>
      </div>
    </div>
  )
}
