import type { Station, Tool } from '@/lib/software/tools'
import { ToolRow } from './ToolRow'

interface WorkshopStationProps {
  station: Station
  tools: Tool[]
  openToolId?: string
}

export function WorkshopStation({ station, tools, openToolId }: WorkshopStationProps) {
  if (tools.length === 0) return null
  return (
    <section aria-labelledby={`station-${station.id}`} className="mt-14">
      <div className="border-b-2 border-warm px-1 pb-4">
        <h2
          id={`station-${station.id}`}
          className="font-newsreader text-2xl font-medium text-text-1"
        >
          {station.name}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-3">{station.line}</p>
      </div>
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} open={tool.id === openToolId} />
      ))}
    </section>
  )
}
