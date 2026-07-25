import type { Element, Root } from 'hast'
import type { InstrumentManifest } from '@/lib/instruments/manifest'
import type {
  Chart,
  ClaimsLedger,
  ClientLedger,
  ForecastCard,
  MarksDocument,
  Stat,
} from '@/lib/instruments/types'
import { hastToReact, markdownToHast } from '@/lib/instruments/render'
import { applyAnnotations } from '@/lib/instruments/marks'
import { Prose } from '@/components/content/Prose'
import { PublicationNav } from '@/components/instruments/PublicationNav'
import { publishedInstrumentedPieces } from '@/lib/instruments/publication'
import {
  LazyAuditLayer,
  LazyAuditProvider,
  LazyChart,
  LazyClaimLedger,
  LazyDossierDialog,
  LazyForecastCard,
  LazyInstrumentRail,
  LazyLedgerProvider,
  LazyMarkSpan,
  LazyNoteMarker,
  LazyNotesList,
  LazyStat,
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
  ledger: ClaimsLedger | null
  annotations: MarksDocument | null
  stats: Stat[] | null
  forecasts: ForecastCard[] | null
  charts: Chart[] | null
}

/**
 * The instrument branch of `/writing/[slug]`. The article body still comes from the same
 * markdown chain every essay runs; what differs is that it is compiled to React rather than
 * to an HTML string, so the instrument tags authored in the piece become live components and
 * the annotated spans become marks and note markers.
 */
export async function InstrumentArticle({
  markdown,
  manifest,
  ledger,
  annotations,
  stats,
  forecasts,
  charts,
}: InstrumentArticleProps) {
  const parsed = await markdownToHast(markdown)
  const { tree, noteOrder } = applyAnnotations(parsed, {
    marks: annotations?.marks,
    notes: annotations?.notes,
  })
  const headings = headingsOf(tree)
  const forClient = ledger ? clientLedger(ledger) : null

  // Whether this piece has an audit at all. The ledger essay does not: mounting the provider
  // for it anyway pulled a client chunk, a `matchMedia` subscription and a `ResizeObserver`
  // onto a page with no mark, note, stat, forecast or figure for any of them to act on.
  const audited =
    (annotations?.marks.length ?? 0) > 0 ||
    (annotations?.notes.length ?? 0) > 0 ||
    (stats?.length ?? 0) > 0 ||
    (forecasts?.length ?? 0) > 0 ||
    (charts?.length ?? 0) > 0

  const body = hastToReact(tree, {
    'instrument-spine': () => <LazyTimeSpine />,
    'instrument-ledger': () => <LazyClaimLedger />,
    'instrument-audit': () => <LazyAuditLayer />,
    'instrument-notes': () => <LazyNotesList />,
    'instrument-stat': (props) => <LazyStat {...props} />,
    'instrument-forecast': (props) => <LazyForecastCard {...props} />,
    'instrument-chart': (props) => <LazyChart {...props} />,
    'instrument-note': (props) => <LazyNoteMarker {...props} />,
    mark: (props) => <LazyMarkSpan {...props} />,
  })

  const article = (
    <>
      <LazyUrlStateSync ledger={forClient} />
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <Prose className="instrument-prose">
          <div id="essay-content" className="instrument-flow">
            {body}
          </div>
        </Prose>
        <LazyInstrumentRail headings={headings} />
      </div>
      <PublicationNav slug={manifest.slug} pieces={publishedInstrumentedPieces()} />
      {ledger && <LazyDossierDialog slug={manifest.slug} />}
    </>
  )

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
        {audited ? (
          <LazyAuditProvider
            marks={annotations?.marks ?? []}
            notes={annotations?.notes ?? []}
            noteOrder={noteOrder}
            stats={stats ?? []}
            forecasts={forecasts ?? []}
            charts={charts ?? []}
          >
            {article}
          </LazyAuditProvider>
        ) : (
          article
        )}
      </LazyLedgerProvider>
    </div>
  )
}
