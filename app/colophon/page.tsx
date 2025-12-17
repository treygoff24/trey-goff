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
        <p>This site is built with:</p>
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
        <p>
          The design prioritizes readability and focus. Dark mode only, command
          palette-first navigation.
        </p>
      </Prose>
    </div>
  )
}
