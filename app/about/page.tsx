import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'About',
  description: 'Who I am and what I believe.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>About</h1>
        <p>
          I&apos;m Trey Goff, and I&apos;m focused on building better governance
          through acceleration zones and institutional innovation.
        </p>
        <p>More content coming soon.</p>
      </Prose>
    </div>
  )
}
