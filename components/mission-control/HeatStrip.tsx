import type { ActivityDay } from '@/lib/mission-control/shipping'

interface HeatStripProps {
  days: ActivityDay[]
  summary: string
}

const levelClasses = ['fill-surface-2', 'fill-warm/25', 'fill-warm/50', 'fill-warm/75', 'fill-warm']

export function HeatStrip({ days, summary }: HeatStripProps) {
  const max = Math.max(1, ...days.map((day) => day.count))

  return (
    <div>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${days.length * 10 - 2} 8`}
        className="h-auto w-full"
      >
        {days.map((day, index) => {
          const level = day.count === 0 ? 0 : Math.max(1, Math.ceil((day.count / max) * 4))
          return (
            <rect
              key={day.date}
              x={index * 10}
              y="0"
              width="8"
              height="8"
              className={levelClasses[level]}
            />
          )
        })}
      </svg>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-text-2">
        <span>{days[0]?.date}</span>
        <span>{days.at(-1)?.date}</span>
      </div>
      <span className="sr-only">{summary}</span>
    </div>
  )
}
