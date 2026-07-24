import Link from 'next/link'
import type { Tool } from '@/lib/software/tools'
import { readCapture, toolById } from '@/lib/software/tools'
import { TerminalSpecimen } from './TerminalSpecimen'

const statusWords: Record<Tool['status'], string> = {
  'daily-driver': 'Daily driver',
  published: 'Published',
  working: 'Working',
  experiment: 'Experiment',
}

interface ToolRowProps {
  tool: Tool
  open: boolean
}

/**
 * One featured tool as a disclosure row. Open state is server-driven via
 * the ?tool= search param (design amendment 1): the wander graph navigates
 * between rows, so exactly one dossier is open at a time.
 */
export function ToolRow({ tool, open }: ToolRowProps) {
  const neighbors = tool.runsWith.map((id) => toolById.get(id)).filter((t): t is Tool => Boolean(t))

  return (
    <details
      id={tool.id}
      name="workshop-dossier"
      open={open}
      className="group border-t border-border-1 scroll-mt-[17rem] md:scroll-mt-60"
    >
      <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-1 py-5 transition-colors hover:bg-surface-1/50 [&::-webkit-details-marker]:hidden">
        {/* h4 under the station h3 so heading navigation reaches every tool.
            The one-liner stays outside the heading to keep its accessible
            name short. */}
        <h4 className="min-w-0 font-newsreader text-xl font-medium leading-tight text-text-1 transition-colors group-hover:text-warm">
          {tool.name}
        </h4>
        <span className="justify-self-end font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
          {statusWords[tool.status]}
          <span
            aria-hidden
            className="ml-3 inline-block text-warm transition-transform group-open:rotate-90"
          >
            →
          </span>
        </span>
        <span className="col-start-1 row-start-2 mt-0 block max-w-3xl text-sm leading-6 text-text-2">
          {tool.oneLiner}
        </span>
      </summary>

      <div className="px-1 pb-8">
        {tool.flex && (
          <p className="max-w-3xl text-sm leading-7 text-text-2">
            <strong className="font-medium text-text-1">{tool.flex}</strong>
          </p>
        )}

        {tool.capture && (
          <TerminalSpecimen
            toolName={tool.bin ?? tool.name}
            prompt={tool.capture.prompt}
            capturedAt={tool.capture.capturedAt}
            body={readCapture(tool.capture)}
            wrap={tool.capture.wrap}
          />
        )}

        <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <span className="font-mono text-[11px] tracking-[0.08em] text-text-3">{tool.stack}</span>
          {neighbors.length > 0 && (
            <span className="text-sm text-text-3">
              Runs with{' '}
              {neighbors.map((n, i) => (
                <span key={n.id}>
                  {i > 0 && ', '}
                  {n.featured ? (
                    <Link
                      href={`/projects?tool=${n.id}#${n.id}`}
                      className="text-warm transition-colors hover:text-accent"
                    >
                      {n.name}
                    </Link>
                  ) : (
                    <span>{n.name}</span>
                  )}
                </span>
              ))}
            </span>
          )}
          {tool.links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="tg-action-secondary"
              target="_blank"
              rel={link.rel ? `${link.rel} noreferrer` : 'noreferrer'}
            >
              {link.label} →
            </a>
          ))}
        </div>
      </div>
    </details>
  )
}
