interface TopicStripProps {
  topics: Array<{ topic: string; count: number }>
}

export function TopicStrip({ topics }: TopicStripProps) {
  const total = Math.max(
    1,
    topics.reduce((sum, topic) => sum + topic.count, 0),
  )
  let x = 0
  const summary = topics.map((topic) => `${topic.topic}: ${topic.count}`).join('; ')

  return (
    <div>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 240 5"
        preserveAspectRatio="none"
        className="h-1.5 w-full text-warm"
      >
        {topics.map((topic, index) => {
          const width = (topic.count / total) * 240
          const start = x
          x += width
          return (
            <rect
              key={topic.topic}
              x={start}
              y="0"
              width={Math.max(1, width - 1)}
              height="5"
              fill="currentColor"
              opacity={Math.max(0.36, 0.9 - index * 0.08)}
            />
          )
        })}
      </svg>
      <span className="sr-only">Topic distribution: {summary}.</span>
    </div>
  )
}
