interface SparklineProps {
  label: string
  values: number[]
  summary: string
}

export function Sparkline({ label, values, summary }: SparklineProps) {
  const points: number[] =
    values.length === 0 ? [0, 0] : values.length === 1 ? [values[0]!, values[0]!] : values
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const polyline = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 232 + 4
      const y = 42 - ((value - min) / range) * 34
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-text-2">
        <span>{label}</span>
        <span>
          {min}–{max}
        </span>
      </div>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 240 50"
        className="h-12 w-full overflow-visible text-warm"
      >
        <line x1="4" y1="42" x2="236" y2="42" stroke="currentColor" strokeOpacity="0.2" />
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="sr-only">{summary}</span>
    </div>
  )
}
