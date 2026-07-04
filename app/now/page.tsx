import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Now',
  description: "What I'm currently focused on.",
}

export default function NowPage() {
  const lastUpdated = '2026-03-16'

  return (
    <div className="tg-page max-w-3xl">
      <header className="tg-rise mb-10">
        <p className="tg-eyebrow text-warm">Now</p>
        <h1 className="mt-6 font-newsreader text-[clamp(2.4rem,4.5vw,3.2rem)] font-medium leading-[1.06] tracking-[-0.02em] text-text-1">
          What has my attention right now.
        </h1>
        <p className="mt-4 text-lg text-text-2">
          A living snapshot of what I am focused on right now.
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-text-3">
          Last updated: {lastUpdated}
        </p>
      </header>

      <Prose>
        <h2>Current focus</h2>
        <ul>
          <li>Advancing the case for governance innovation and institutional design.</li>
          <li>Writing essays and notes to map the field in public.</li>
          <li>Building The Control Room into a living knowledge system.</li>
        </ul>

        <h2>What I am working on</h2>
        <ul>
          <li>Research on institutional design and special economic zones.</li>
          <li>Connecting policy experiments to real-world case studies.</li>
          <li>Refining a personal library of high-leverage ideas.</li>
        </ul>

        <h2>Reading</h2>
        <p>Political economy, institutional design, economic history, and systems thinking.</p>

        <h2>Travel</h2>
        <p>Keeping travel light and focused while I build and write. Updates as plans solidify.</p>
      </Prose>
    </div>
  )
}
