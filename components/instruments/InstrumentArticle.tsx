import type { Element, Root } from 'hast'
import type { InstrumentManifest } from '@/lib/instruments/manifest'
import type { ClaimsLedger, ClientLedger } from '@/lib/instruments/types'
import { hastToReact, markdownToHast } from '@/lib/instruments/render'
import { Prose } from '@/components/content/Prose'
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

/**
 * What the instruments actually need on the client. The claims themselves have to cross —
 * the ledger renders and filters all 434 rows in the browser — but the envelope around them
 * does not: the provenance block, the canonical-id bookkeeping and the source record are
 * build-time and editorial concerns with no client reader.
 */
function clientLedger(ledger: ClaimsLedger): ClientLedger {
  return {
    sections: ledger.sections,
    claims: ledger.claims.map(({ status: _status, ...claim }) => claim),
  }
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
  const forClient = clientLedger(ledger)

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
      <LazyLedgerProvider ledger={forClient} dossiers={manifest.dossiers}>
        <LazyUrlStateSync ledger={forClient} />
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <Prose className="instrument-prose">
            <div id="essay-content" className="instrument-flow">
              {body}
            </div>
          </Prose>
          <LazyInstrumentRail headings={headings} />
        </div>
        <LazyDossierDialog slug={manifest.slug} />
      </LazyLedgerProvider>
    </div>
  )
}
