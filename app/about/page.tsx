import { Prose } from '@/components/content/Prose'
import { generatePersonSchema } from '@/lib/structured-data'

export const metadata = {
  title: 'About',
  description: 'Who I am and what I believe.',
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generatePersonSchema()),
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-text-3">
            Mission
          </p>
          <h1 className="mt-4 font-satoshi text-4xl font-medium text-text-1">
            About
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-text-2">
            I work on governance innovation with a focus on acceleration zones,
            institutional experimentation, and the systems that shape human
            agency.
          </p>
        </header>

        <section className="rounded-2xl border border-border-1 bg-surface-1 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-text-3">
            The Thesis
          </p>

          <div className="mt-8 space-y-8">
            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Problem
              </h2>
              <p className="mt-3 text-lg text-text-2">
                Governance failures create avoidable suffering. Institutions
                move slower than technology, incentives drift, and the people
                closest to problems often lack the authority to fix them.
              </p>
            </div>

            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Lever
              </h2>
              <p className="mt-3 text-lg text-text-2">
                Governance reform is the highest-leverage intervention. When
                rules improve, every downstream system improves with them.
              </p>
            </div>

            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Mechanism
              </h2>
              <p className="mt-3 text-lg text-text-2">
                Acceleration zones and special economic zones create bounded,
                opt-in environments where new policies can be tested, measured,
                and scaled without forcing a single model on everyone.
              </p>
            </div>

            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Vision
              </h2>
              <p className="mt-3 text-lg text-text-2">
                A world where governance evolves through competition, feedback,
                and choice. New institutions emerge faster, people have real
                options, and experimentation is a default rather than a rare
                exception.
              </p>
            </div>

            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Work
              </h2>
              <p className="mt-3 text-lg text-text-2">
                I write, research, and build tools to map institutional
                experiments, surface lessons, and help builders translate ideas
                into durable governance systems.
              </p>
            </div>

            <div>
              <h2 className="font-satoshi text-xl font-medium text-text-1">
                The Philosophy
              </h2>
              <p className="mt-3 text-lg text-text-2">
                I am guided by classical liberalism, human agency, and the belief
                that voluntary systems should outcompete coercive ones through
                better outcomes.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <Prose>
            <h2>Bio</h2>
            <p>
              I work at the intersection of governance, technology, and economic
              development. My focus is on institutional design, acceleration
              zones, and the practical steps needed to make new models real.
            </p>
            <p>
              I share essays and field notes here, along with the books and
              ideas that shape my thinking.
            </p>
            <p>
              You can find me on{' '}
              <a href="https://twitter.com/treygoff">Twitter</a> and{' '}
              <a href="https://github.com/treygoff">GitHub</a>.
            </p>
          </Prose>
        </section>
      </div>
    </>
  )
}
