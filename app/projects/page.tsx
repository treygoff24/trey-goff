import { EditorialHeader } from '@/components/site/EditorialHeader'
import { BenchLens } from '@/components/workshop/BenchLens'
import { LedgerLens } from '@/components/workshop/LedgerLens'
import { LineageLens } from '@/components/workshop/LineageLens'
import { ReceiptsLens } from '@/components/workshop/ReceiptsLens'
import { WorkshopShell } from '@/components/workshop/WorkshopShell'
import {
  DISCIPLINE_LABELS,
  getAllProjects,
  getChronologicalLineageProjects,
  getLineageEdges,
} from '@/lib/projects'

export const metadata = {
  title: 'Projects — The Workshop',
  description: "Everything I've built, and four ways to walk the floor.",
}

function LineageSlot() {
  const projects = getChronologicalLineageProjects()

  return (
    <LineageLens
      projects={projects}
      edges={getLineageEdges(projects)}
      disciplineLabels={DISCIPLINE_LABELS}
    />
  )
}

export default function ProjectsPage() {
  return (
    <div className="tg-page max-w-6xl">
      <EditorialHeader
        eyebrow="Projects"
        title="The Workshop"
        standfirst="Everything I've built, and four ways to walk the floor."
      />

      <WorkshopShell
        projects={getAllProjects()}
        bench={<BenchLens />}
        lineage={<LineageSlot />}
        ledger={<LedgerLens />}
        receipts={<ReceiptsLens />}
      />
    </div>
  )
}
