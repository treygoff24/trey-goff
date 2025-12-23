import { Prose } from '@/components/content/Prose'

export const metadata = {
  title: 'Colophon',
  description: 'How this site was built.',
}

export default function ColophonPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Prose>
        <h1>Colophon</h1>
        <p>
          The Control Room is a personal website built to feel like a modern
          cockpit: calm, focused, and fast.
        </p>

        <h2>Stack</h2>
        <ul>
          <li>
            <strong>Framework:</strong> Next.js 15 (App Router)
          </li>
          <li>
            <strong>Styling:</strong> Tailwind CSS v4
          </li>
          <li>
            <strong>Content:</strong> Content Collections + MDX
          </li>
          <li>
            <strong>Search:</strong> Orama
          </li>
          <li>
            <strong>Fonts:</strong> Satoshi, Newsreader, Monaspace Neon
          </li>
          <li>
            <strong>Deployment:</strong> Vercel
          </li>
        </ul>

        <h2>Design influences</h2>
        <p>
          The design borrows from spacecraft dashboards, research tools, and
          the quiet density of well-made notebooks. Dark mode keeps the focus
          on content and reduces visual noise.
        </p>

        <h2>Typography</h2>
        <p>
          Satoshi handles UI text, Newsreader handles long-form prose, and
          Monaspace Neon handles code. The mix balances clarity with character.
        </p>

        <h2>Performance</h2>
        <p>
          Most pages are statically generated. Search and graph data are
          precomputed at build time so navigation stays fast even as the
          archive grows.
        </p>

        <h2>Accessibility</h2>
        <p>
          Keyboard-first navigation, clear focus states, semantic markup, and
          strong contrast are non-negotiable. The command palette is the
          primary navigation surface.
        </p>

        <h2>Source</h2>
        <p>
          The codebase is maintained on{' '}
          <a href="https://github.com/treygoff">GitHub</a>.
        </p>

        <h2>Thanks</h2>
        <p>
          Grateful to the open-source community and everyone who shares ideas
          in public. This site is shaped by the people and projects I learn
          from.
        </p>
      </Prose>
    </div>
  )
}
