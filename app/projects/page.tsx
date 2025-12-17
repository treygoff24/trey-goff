import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Projects',
  description: "Things I've built.",
}

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>Projects</h1>
        <p>A showcase of things I&apos;ve built. Coming soon.</p>
      </Prose>
    </div>
  )
}
