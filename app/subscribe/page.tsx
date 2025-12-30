import { SubscribeForm } from '@/components/newsletter/SubscribeForm'

export const metadata = {
  title: 'Subscribe',
  description:
    'Get essays on governance, technology, and institutional innovation delivered to your inbox.',
}

export default function SubscribePage() {
  return (
    <main className="relative mx-auto max-w-xl px-4 py-24">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-warm/5 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mb-12 text-center">
          {/* Signal indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warm opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warm" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-warm">
              Open Channel
            </span>
          </div>

          <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
            Subscribe
          </h1>
          <p className="text-lg text-text-2">
            Essays on governance, institutional innovation, and building better systems.
            <br />
            <span className="text-text-3">No spam. Unsubscribe anytime.</span>
          </p>
        </div>

        {/* Form card */}
        <div className="relative overflow-hidden rounded-xl border border-border-1 bg-surface-1/50 p-8 backdrop-blur-sm">
          {/* Corner accent */}
          <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-warm/10 to-transparent" />
          <div className="absolute bottom-0 left-0 h-16 w-16 bg-gradient-to-tr from-accent/10 to-transparent" />

          <div className="relative">
            <SubscribeForm />
          </div>
        </div>

        {/* What you'll get section */}
        <div className="mt-12">
          <h2 className="mb-6 text-center font-mono text-xs font-medium uppercase tracking-[0.2em] text-text-3">
            What to Expect
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="group rounded-lg border border-border-1 bg-surface-1/30 p-4 transition-colors hover:border-warm/30 hover:bg-surface-1/50">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-warm/10 text-warm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="mb-1 font-satoshi text-sm font-medium text-text-1">
                Long-form Essays
              </h3>
              <p className="text-xs leading-relaxed text-text-3">
                Deep dives on governance, policy experiments, and institutional design.
              </p>
            </div>

            <div className="group rounded-lg border border-border-1 bg-surface-1/30 p-4 transition-colors hover:border-accent/30 hover:bg-surface-1/50">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="mb-1 font-satoshi text-sm font-medium text-text-1">
                Field Notes
              </h3>
              <p className="text-xs leading-relaxed text-text-3">
                Quick dispatches from ongoing research and projects.
              </p>
            </div>

            <div className="group rounded-lg border border-border-1 bg-surface-1/30 p-4 transition-colors hover:border-success/30 hover:bg-surface-1/50">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <h3 className="mb-1 font-satoshi text-sm font-medium text-text-1">
                Early Access
              </h3>
              <p className="text-xs leading-relaxed text-text-3">
                First look at new projects and ideas before they launch.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <p className="mt-12 text-center text-xs text-text-3">
          Your email is private. No spam, ever.
          <br />
          Powered by{' '}
          <a
            href="https://buttondown.email"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-2 transition-colors hover:text-warm"
          >
            Buttondown
          </a>
          .
        </p>
      </div>
    </main>
  )
}
