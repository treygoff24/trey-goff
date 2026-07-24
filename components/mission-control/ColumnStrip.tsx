interface ColumnStripProps {
  values: Array<{ label: string; value: number }>
  summary: string
}

export function ColumnStrip({ values, summary }: ColumnStripProps) {
  const max = Math.max(1, ...values.map((item) => item.value))
  const width = 240 / values.length

  return (
    <div>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 240 64"
        preserveAspectRatio="none"
        className="h-16 w-full text-warm"
      >
        {values.map((item, index) => {
          const height = item.value === 0 ? 1 : (item.value / max) * 58
          return (
            <rect
              key={item.label}
              x={index * width + 1}
              y={62 - height}
              width={Math.max(1, width - 2)}
              height={height}
              fill="currentColor"
              opacity={item.value === 0 ? 0.18 : 0.8}
            />
          )
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-text-2">
        <span>{values[0]?.label}</span>
        <span>{values.at(-1)?.label}</span>
      </div>
      <span className="sr-only">{summary}</span>
    </div>
  )
}
