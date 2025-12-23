import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Powerlifting',
  description: 'The gym is my laboratory.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PowerliftingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-12 text-center">
        <p className="mb-4 text-sm text-text-3">
          You found the hidden page.
        </p>
        <h1 className="mb-4 font-satoshi text-4xl font-medium text-text-1">
          Powerlifting
        </h1>
        <p className="text-lg text-text-2">
          The gym is my laboratory for systematic progression.
        </p>
      </header>

      <Prose>
        <h2>Why I lift</h2>
        <p>
          Powerlifting taught me more about discipline, systematic progression,
          and embracing discomfort than any book ever could. The barbell does
          not care about your excuses.
        </p>

        <h2>Personal records</h2>
        <p>
          These numbers do not mean much to anyone else, but they represent
          years of consistent work.
        </p>
        <table>
          <thead>
            <tr>
              <th>Lift</th>
              <th>Weight</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Squat</td>
              <td>---</td>
              <td>---</td>
            </tr>
            <tr>
              <td>Bench</td>
              <td>---</td>
              <td>---</td>
            </tr>
            <tr>
              <td>Deadlift</td>
              <td>---</td>
              <td>---</td>
            </tr>
          </tbody>
        </table>

        <h2>What the sport taught me</h2>
        <ul>
          <li>
            <strong>Progressive overload</strong>: Small, consistent improvements
            compound into remarkable results.
          </li>
          <li>
            <strong>Deloads matter</strong>: Sometimes stepping back is the
            fastest way forward.
          </li>
          <li>
            <strong>Form over ego</strong>: Doing things correctly beats doing
            things impressively.
          </li>
          <li>
            <strong>The process is the point</strong>: The PRs are nice, but the
            daily practice is where the growth happens.
          </li>
        </ul>

        <h2>Current program</h2>
        <p>
          I follow a periodized approach, cycling through hypertrophy, strength,
          and peaking phases. The specifics change, but the principles do not.
        </p>
      </Prose>

      <footer className="mt-16 border-t border-border-1 pt-8 text-center">
        <p className="text-sm text-text-3">
          This page is intentionally hidden from search engines and navigation.
          <br />
          You either know the URL or found it through the command palette. Nice.
        </p>
      </footer>
    </main>
  )
}
