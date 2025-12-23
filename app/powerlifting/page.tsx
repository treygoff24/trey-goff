import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Powerlifting',
  description: 'Training notes and lifts.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PowerliftingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>Powerlifting</h1>
        <p>
          A quiet corner for training notes, meet prep, and the lifts I&apos;m
          chasing. More to come.
        </p>
      </Prose>
    </div>
  )
}
