export function ClassifiedGag() {
  return (
    <div className="tg-page max-w-5xl">
      <section aria-labelledby="denial-title" className="border-y border-border-1">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-warm">
          <span>Restricted record · internal circulation only</span>
          <span>Control no. OAR-RD-0041</span>
        </div>

        <header className="grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="tg-eyebrow">Office of the Archivist · Records Division</p>
            <h1
              id="denial-title"
              className="mt-6 max-w-3xl font-newsreader text-[clamp(2.6rem,6vw,4.8rem)] font-medium leading-[0.98] tracking-[-0.025em] text-text-1"
            >
              Notice of administrative non-access
            </h1>
          </div>
          <div className="-rotate-3 border-2 border-warm px-5 py-3 font-mono text-lg font-semibold uppercase tracking-[0.22em] text-warm sm:mt-5">
            Denied
          </div>
        </header>

        <dl className="grid border-y border-border-1 font-mono text-[11px] uppercase tracking-[0.14em] sm:grid-cols-2">
          <div className="border-b border-border-1 py-4 sm:border-r sm:px-4">
            <dt className="text-text-3">Subject</dt>
            <dd className="mt-1 text-text-1">Unauthorized arrival</dd>
          </div>
          <div className="border-b border-border-1 py-4 sm:px-4">
            <dt className="text-text-3">Clearance presented</dt>
            <dd className="mt-1 text-text-1">Not found</dd>
          </div>
          <div className="border-b border-border-1 py-4 sm:border-b-0 sm:border-r sm:px-4">
            <dt className="text-text-3">Form</dt>
            <dd className="mt-1 text-text-1">OAR-17B (rev. eventually)</dd>
          </div>
          <div className="py-4 sm:px-4">
            <dt className="text-text-3">Declassification date</dt>
            <dd className="mt-1 text-text-1">17 October 2326</dd>
          </div>
        </dl>

        <div className="grid gap-10 py-12 sm:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="max-w-2xl space-y-6 text-base leading-7 text-text-2">
            <p>
              You have entered a records division for which your credentials are, in the technical
              language of the bureau, not among the credentials. The distinction is regarded as
              dispositive.
            </p>
            <p aria-label="Contents may include redacted material, several strongly held views, and one paragraph the archivist declined to explain over email.">
              <span aria-hidden="true">
                Contents may include <span className="bg-text-1 text-text-1">██████████</span>,
                several strongly held views regarding{' '}
                <span className="bg-text-1 text-text-1">██████████████</span>, and one paragraph the
                archivist declined to explain over email.
              </span>
            </p>
            <p>
              Your request has been denied automatically, efficiently, and without creating a record
              that anyone plans to read.
            </p>
          </div>
          <aside className="border-t border-border-1 pt-5 font-mono text-[11px] uppercase leading-6 tracking-[0.14em] text-text-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <p>Disposition</p>
            <p className="mt-2 text-text-1">Return visitor to public corridor.</p>
            <p className="mt-5">Appeals</p>
            <p className="mt-2 text-text-1">Forwarded to the same desk, which is this one.</p>
          </aside>
        </div>

        <footer className="border-t border-border-1 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-3">
          Thank you for your discretion regarding the thing you did not see.
        </footer>
      </section>
    </div>
  )
}
