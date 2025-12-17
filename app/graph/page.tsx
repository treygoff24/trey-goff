import { GraphClient } from '@/components/graph/GraphClient'
import { generateGraphData } from '@/lib/graph/generate'

export const metadata = {
  title: 'Graph',
  description: 'Explore how ideas connect across essays, books, and notes.',
}

export default function GraphPage() {
  const graphData = generateGraphData()

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <header className="mb-8">
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Knowledge Graph
        </h1>
        <p className="text-lg text-text-2">
          An interactive visualization of how ideas connect across essays,
          books, and notes. Click on nodes to explore, hover to see connections.
        </p>
      </header>

      <GraphClient data={graphData} />
    </div>
  )
}
