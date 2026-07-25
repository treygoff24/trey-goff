import type { Hanging as HangingData } from './collections'

/** Renders *asterisk emphasis* from the label copy. */
function emphasize(text: string) {
  return text
    .split(/(\*[^*]+\*)/g)
    .map((part, i) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        part
      ),
    )
}

export function Hanging({ hanging, index }: { hanging: HangingData; index: number }) {
  const { works, tall } = hanging

  return (
    <section
      aria-labelledby={`${hanging.id}-title`}
      className="gal__hanging"
      data-pool={hanging.pool}
      data-spark={hanging.spark}
      id={hanging.id}
      style={{ '--pool': hanging.pool, '--spark': hanging.spark } as React.CSSProperties}
    >
      <div
        className="gal__works"
        data-count={works.length}
        data-reveal
        data-tall={tall ? 'true' : undefined}
      >
        {works.map((work) => (
          <figure className={`gal__plate${tall ? ' gal__plate--tall' : ''}`} key={work.src}>
            {/* eslint-disable-next-line @next/next/no-img-element -- these are pre-sized webp
              exported at exactly their display width; the optimizer would re-encode for nothing
              and next/image's wrapper fights the gallery's own frame styling. */}
            <img
              alt={work.alt}
              decoding="async"
              height={work.height}
              loading={index === 0 ? 'eager' : 'lazy'}
              src={work.src}
              width={work.width}
            />
          </figure>
        ))}
      </div>

      <div className="gal__label" data-reveal>
        <div>
          <h2 className="gal__title" id={`${hanging.id}-title`}>
            {hanging.title}
          </h2>
          <ul className="gal__tombstone gal__meta">
            {hanging.tombstone.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div>
          <div className="gal__prose">
            {hanging.label.map((para) => (
              <p key={para}>{emphasize(para)}</p>
            ))}
          </div>

          <details className="gal__drawer">
            <summary>
              {hanging.prompts.length > 1 ? 'The paragraphs I typed' : 'The paragraph I typed'}
            </summary>
            <div className="gal__drawer-body">
              {hanging.prompts.map((prompt) => (
                <div key={prompt.caption}>
                  <p className="gal__prompt-caption">{prompt.caption}</p>
                  <p className="gal__prompt">{prompt.text}</p>
                </div>
              ))}
              <p className="gal__cost">{emphasize(hanging.cost)}</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  )
}
