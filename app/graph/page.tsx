import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Graph',
  description: 'Explore connected ideas.',
}

export default function GraphPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Prose>
        <h1>Knowledge Graph</h1>
        <p>
          An interactive visualization of how ideas connect across essays, books,
          and notes.
        </p>
      </Prose>

      <div className="mt-8 rounded-lg border border-border-1 bg-surface-1 p-8 text-center">
        <p className="text-text-3">
          Knowledge graph visualization coming in Phase 6.
        </p>
      </div>
    </div>
  )
}
