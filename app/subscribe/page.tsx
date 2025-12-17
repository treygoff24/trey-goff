import { SubscribeForm } from '@/components/newsletter/SubscribeForm'

export const metadata = {
  title: 'Subscribe',
  description:
    'Get essays on governance, technology, and institutional innovation delivered to your inbox.',
}

export default function SubscribePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24">
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Subscribe
        </h1>
        <p className="text-lg text-text-2">
          Get new essays delivered to your inbox. No spam, unsubscribe anytime.
        </p>
      </div>

      <SubscribeForm />

      <div className="mt-12 text-center">
        <h2 className="mb-4 font-satoshi text-sm font-medium uppercase tracking-wider text-text-3">
          What you&apos;ll get
        </h2>
        <ul className="space-y-3 text-text-2">
          <li>New essays on governance and institutional innovation</li>
          <li>Occasional notes and dispatches</li>
          <li>Early access to projects and ideas</li>
        </ul>
      </div>

      <p className="mt-12 text-center text-sm text-text-3">
        Your email is safe. I never share subscriber data and you can
        unsubscribe with one click. Powered by{' '}
        <a
          href="https://buttondown.email"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-2 hover:text-warm"
        >
          Buttondown
        </a>
        .
      </p>
    </main>
  )
}
