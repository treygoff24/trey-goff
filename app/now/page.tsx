import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Now',
  description: "What I'm currently focused on.",
}

export default function NowPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>Now</h1>
        <p>
          This is a <a href="https://nownownow.com/about">now page</a> — a
          snapshot of what I&apos;m currently focused on.
        </p>
        <p>Content coming soon.</p>
      </Prose>
    </div>
  )
}
