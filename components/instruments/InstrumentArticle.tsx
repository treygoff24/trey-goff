import type { Element, Root } from 'hast'
import type { InstrumentManifest } from '@/lib/instruments/manifest'
import type { ClaimsLedger } from '@/lib/instruments/types'
import { hastToReact, markdownToHast } from '@/lib/instruments/render'
import { Prose } from '@/components/content/Prose'
import { renderDossiers } from '@/components/instruments/dossier-content'
import {
  LazyClaimLedger,
  LazyDossierDialog,
  LazyInstrumentRail,
  LazyLedgerProvider,
  LazyTimeSpine,
  LazyUrlStateSync,
} from '@/components/instruments/lazy'

interface Heading {
  id: string
  text: string
}

function textOf(node: Element): string {
  return node.children
    .map((child) =>
      child.type === 'text' ? child.value : child.type === 'element' ? textOf(child) : '',
    )
    .join('')
}

/** The article's own top-level headings, for the rail. Ledger sections are added client-side. */
function headingsOf(tree: Root): Heading[] {
  return tree.children
    .filter((node): node is Element => node.type === 'element' && node.tagName === 'h2')
    .map((node) => ({ id: String(node.properties?.id ?? ''), text: textOf(node) }))
    .filter((heading) => heading.id !== '')
}

interface InstrumentArticleProps {
  markdown: string
  manifest: InstrumentManifest
  ledger: ClaimsLedger
}

/**
 * The instrument branch of `/writing/[slug]`. The article body still comes from the same
 * markdown chain every essay runs; what differs is that it is compiled to React rather than
 * to an HTML string, so the instrument tags authored in the piece become live components.
 */
export async function InstrumentArticle({ markdown, manifest, ledger }: InstrumentArticleProps) {
  const tree = await markdownToHast(markdown)
  const headings = headingsOf(tree)
  const claimIds = new Set(ledger.claims.map((claim) => claim.id))
  const dossiers = await renderDossiers(manifest.slug, claimIds)

  const body = hastToReact(tree, {
    'instrument-spine': () => <LazyTimeSpine />,
    'instrument-ledger': () => <LazyClaimLedger />,
  })

  return (
    <div
      className="instrument-scope"
      style={
        {
          '--instrument-hue': manifest.accent.hue,
          '--instrument-chroma': manifest.accent.chroma,
        } as React.CSSProperties
      }
    >
      <LazyLedgerProvider ledger={ledger} dossiers={manifest.dossiers}>
        <LazyUrlStateSync ledger={ledger} />
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <Prose className="instrument-prose">
            <div id="essay-content">{body}</div>
          </Prose>
          <LazyInstrumentRail headings={headings} />
        </div>
        <LazyDossierDialog dossiers={dossiers} />
      </LazyLedgerProvider>
    </div>
  )
}
