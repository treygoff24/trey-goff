'use client'

import { useEffect, useState } from 'react'

interface LocalClockProps {
  initialIso: string
  timeZone: string
}

function formatTime(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return 'time zone unavailable'
  }
}

export function LocalClock({ initialIso, timeZone }: LocalClockProps) {
  const [now, setNow] = useState(initialIso)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => setNow(new Date().toISOString()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <time data-local-clock dateTime={now}>
      {formatTime(now, timeZone)}
    </time>
  )
}
