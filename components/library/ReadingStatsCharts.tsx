interface YearCount {
  year: number
  count: number
}

interface RatingCount {
  rating: number
  count: number
}

interface TopicCount {
  topic: string
  count: number
}

interface ReadingStatsChartsProps {
  booksPerYear: YearCount[]
  ratingDistribution: RatingCount[]
  topicBreakdown: TopicCount[]
}

const chartColors = [
  'var(--color-warm)',
  'var(--color-accent)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'rgba(255, 255, 255, 0.4)',
]

export function ReadingStatsCharts({
  booksPerYear,
  ratingDistribution,
  topicBreakdown,
}: ReadingStatsChartsProps) {
  return (
    <div className="mb-10 grid gap-6 lg:grid-cols-3">
      <ChartCard title="Books per year" subtitle="Read">
        {booksPerYear.length === 0 ? (
          <EmptyChart message="Add dates to see yearly volume." />
        ) : (
          <BooksPerYearChart data={booksPerYear} />
        )}
      </ChartCard>

      <ChartCard title="Topic mix" subtitle="Read">
        {topicBreakdown.length === 0 ? (
          <EmptyChart message="Tag more books to fill this in." />
        ) : (
          <TopicBreakdownChart data={topicBreakdown} />
        )}
      </ChartCard>

      <ChartCard title="Ratings" subtitle="Read">
        {ratingDistribution.every((entry) => entry.count === 0) ? (
          <EmptyChart message="Ratings will show up here." />
        ) : (
          <RatingDistributionChart data={ratingDistribution} />
        )}
      </ChartCard>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border-1 bg-surface-1 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-satoshi text-lg font-medium text-text-1">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-text-3">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-1 bg-bg-1/40 p-6 text-center text-sm text-text-3">
      {message}
    </div>
  )
}

function BooksPerYearChart({ data }: { data: YearCount[] }) {
  const maxCount = Math.max(1, ...data.map((entry) => entry.count))

  return (
    <div className="flex items-end gap-3">
      {data.map((entry) => {
        const height = Math.max(8, Math.round((entry.count / maxCount) * 120))
        return (
          <div key={entry.year} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-md bg-warm/70"
              style={{ height }}
              title={`${entry.count} books`}
            />
            <span className="text-xs text-text-3">{entry.year}</span>
          </div>
        )
      })}
    </div>
  )
}

function TopicBreakdownChart({ data }: { data: TopicCount[] }) {
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const segments: string[] = []
  let cursor = 0

  data.forEach((entry, index) => {
    const color = chartColors[index % chartColors.length]
    const start = (cursor / total) * 100
    cursor += entry.count
    const end = (cursor / total) * 100
    segments.push(`${color} ${start}% ${end}%`)
  })

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-28 w-28 shrink-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              total > 0 ? `conic-gradient(${segments.join(', ')})` : undefined,
          }}
        />
        <div className="absolute inset-4 rounded-full border border-border-1 bg-bg-1" />
      </div>
      <div className="space-y-2 text-xs text-text-3">
        {data.map((entry, index) => (
          <div key={entry.topic} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: chartColors[index % chartColors.length] }}
            />
            <span className="text-text-2">{entry.topic}</span>
            <span className="ml-auto">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RatingDistributionChart({ data }: { data: RatingCount[] }) {
  const maxCount = Math.max(1, ...data.map((entry) => entry.count))

  return (
    <div className="space-y-2">
      {data.map((entry) => {
        const width = Math.round((entry.count / maxCount) * 100)
        return (
          <div key={entry.rating} className="flex items-center gap-3 text-xs">
            <span className="w-12 text-text-3">{entry.rating} star</span>
            <div className="h-2 flex-1 rounded-full bg-bg-1">
              <div
                className="h-2 rounded-full bg-warm/70"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-6 text-right text-text-2">
              {entry.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
