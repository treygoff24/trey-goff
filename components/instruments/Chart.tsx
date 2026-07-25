'use client'

import { useAudit } from '@/components/instruments/AuditProvider'
import { nodeId, type InstrumentNodeProps } from '@/components/instruments/annotation-props'
import Bars from '@/components/instruments/Bars'
import Series from '@/components/instruments/Series'
import Slope from '@/components/instruments/Slope'
import Timeline from '@/components/instruments/Timeline'

/**
 * One tag in the markdown, four figures behind it. The chart's kind lives in the data rather
 * than in the prose, so re-cutting a figure is a data change and never an edit to the piece.
 */
export default function Chart(props: InstrumentNodeProps) {
  const { charts } = useAudit()
  const chart = charts.get(nodeId(props) ?? '')
  if (!chart) return null

  switch (chart.kind) {
    case 'slope':
      return <Slope chart={chart} />
    case 'series':
      return <Series chart={chart} />
    case 'bars':
      return <Bars chart={chart} />
    case 'timeline':
      return <Timeline chart={chart} />
  }
}
