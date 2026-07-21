interface TerminalSpecimenProps {
  toolName: string
  prompt: string
  capturedAt: string
  body: string
}

/**
 * A typeset capture of a real CLI run — the "imagery" for a command-line
 * tool. The output is genuine, captured on the machine the tool lives on;
 * the capture date is part of the artifact.
 */
export function TerminalSpecimen({ toolName, prompt, capturedAt, body }: TerminalSpecimenProps) {
  return (
    <figure
      className="mt-6 max-w-3xl border-t border-b border-border-1"
      role="group"
      aria-label={`Terminal capture of ${toolName}`}
    >
      <figcaption className="flex items-baseline justify-between gap-4 border-b border-border-1 px-1 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-3">
          Live capture · {toolName}
        </span>
        <span className="font-mono text-[11px] tracking-[0.08em] text-text-3">{capturedAt}</span>
      </figcaption>
      <div className="relative">
        <div className="overflow-x-auto px-1 py-4">
          <pre className="font-mono text-[13px] leading-6 text-text-2">
            <code>
              <span className="text-warm">$ </span>
              <span className="text-text-1">{prompt}</span>
              {'\n'}
              {body}
            </code>
          </pre>
        </div>
        {/* Right-edge fade: signals that the capture scrolls horizontally on
            narrow viewports where no persistent scrollbar is shown. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-bg-0 to-transparent"
        />
      </div>
    </figure>
  )
}
