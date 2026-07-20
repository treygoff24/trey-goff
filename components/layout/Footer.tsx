import Link from 'next/link'
import { isNewsletterEnabled } from '@/lib/site-config'

const footerLinks = [
  { href: '/colophon', label: 'Colophon' },
  { href: '/feed.xml', label: 'RSS' },
  { href: '/graph', label: 'Graph' },
  { href: '/interactive', label: 'Interactive' },
]

const socialLinks = [
  { href: 'https://twitter.com/treygoff', label: 'Twitter', icon: TwitterIcon },
  { href: 'https://github.com/treygoff', label: 'GitHub', icon: GitHubIcon },
]

const quickNav = [
  { href: '/writing', label: 'Writing' },
  { href: '/projects', label: 'Projects' },
  { href: '/library', label: 'Library' },
  { href: '/about', label: 'About' },
  { href: '/notes', label: 'Notes' },
  { href: '/media', label: 'Media' },
  { href: '/topics', label: 'Topics' },
  { href: '/machine', label: 'Machine' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-border-1 bg-bg-0/72 backdrop-blur-md">
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-newsreader text-xl font-medium text-text-1 transition-colors hover:text-warm">
                Trey Goff
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-text-3">
              Designing systems, institutions, and software that help human progress compound.
            </p>

            <div className="flex items-center gap-2 text-xs text-text-3">
              <span>Quick access:</span>
              <kbd className="rounded border border-border-1 bg-surface-1 px-1.5 py-0.5 font-mono text-text-2">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-text-3">
              Routes
            </h3>
            <nav className="grid grid-cols-2 gap-2" aria-label="Footer navigation">
              {quickNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-2 transition-colors hover:text-warm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-text-3">
              Connect
            </h3>
            <div className="flex flex-col gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-2 transition-colors hover:text-warm"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </a>
              ))}
              {isNewsletterEnabled && (
                <Link
                  href="/subscribe"
                  className="inline-flex items-center gap-2 text-sm text-text-2 transition-colors hover:text-warm"
                >
                  <MailIcon className="h-4 w-4" />
                  Newsletter
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-warm/20 to-accent/25" />
          <Link
            href="/colophon"
            title="How this site is made — and who made it"
            className="font-mono text-[10px] uppercase tracking-[0.34em] text-text-3 transition-colors hover:text-warm"
          >
            Aurora
          </Link>
          <div className="h-px flex-1 bg-gradient-to-r from-accent/25 via-warm/20 to-transparent" />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer links">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-text-3 transition-colors hover:text-text-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-text-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              <span className="font-mono">Online</span>
            </div>
            <span className="text-border-1">|</span>
            <p className="text-xs text-text-3">&copy; {currentYear} Trey Goff</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  )
}
