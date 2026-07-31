import Link from 'next/link'
import { getImageProps } from 'next/image'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { jobSiteBeats, type JobSiteBeat } from '@/components/jobsite/data'
import { BenchViz } from '@/components/jobsite/BenchViz'
import { CopyPrompt } from '@/components/jobsite/CopyPrompt'
import { ModeToggle } from '@/components/jobsite/ModeToggle'
import { RunnersViz } from '@/components/jobsite/RunnersViz'
import '@/components/jobsite/jobsite.css'

/**
 * The two teaching figures, hung off the annotation entry each one illustrates.
 * Small client islands inside an otherwise server-rendered page; the prose
 * teaches on its own, and the figures only amplify it.
 */
const VIZ = { bench: BenchViz, runners: RunnersViz } as const

/** Strips the inline emphasis markers so what lands on the clipboard is what you paste. */
function plainText(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`${index}-${part}`}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={`${index}-${part}`}>{part.slice(1, -1)}</em>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code className="js-inline-code" key={`${index}-${part}`}>
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={`${index}-${part}`}>{part}</span>
      })}
    </>
  )
}

const CHAPTER_PHRASE = /(chapters?\s+\d+(?:\s+and\s+\d+)*)/gi

/**
 * Every beat closes by pointing at a numbered chapter of hard mode. Left as prose
 * those pointers are a dead end — the reader is told where to go and given no way
 * to get there — so the chapter numbers themselves become the links to /stack.
 */
function DeeperNote({ text }: { text: string }) {
  const segments = text.split(CHAPTER_PHRASE)
  return (
    <p className="js-deeper">
      {segments.map((segment, index) => {
        if (index % 2 === 0) return <span key={`${index}-t`}>{segment}</span>
        const numbers = segment.match(/\d+/g) ?? []
        // "chapter 5" links as a phrase; "chapters 6 and 10" links each number.
        if (numbers.length === 1) {
          return (
            <Link className="js-deeper-link" href={`/stack#ch${numbers[0]}`} key={`${index}-c`}>
              {segment}
            </Link>
          )
        }
        const pieces = segment.split(/(\d+)/)
        return (
          <span key={`${index}-c`}>
            {pieces.map((piece, pieceIndex) =>
              /^\d+$/.test(piece) ? (
                <Link
                  aria-label={`Hard mode chapter ${piece}`}
                  className="js-deeper-link"
                  href={`/stack#ch${piece}`}
                  key={`${index}-${pieceIndex}`}
                >
                  {piece}
                </Link>
              ) : (
                <span key={`${index}-${pieceIndex}`}>{piece}</span>
              ),
            )}
          </span>
        )
      })}
    </p>
  )
}

function ScenePanel({ beat, preload }: { beat: JobSiteBeat; preload: boolean }) {
  const common = {
    alt: beat.alt,
    sizes: '100vw',
    quality: 82,
    loading: preload ? ('eager' as const) : ('lazy' as const),
    fetchPriority: preload ? ('high' as const) : ('auto' as const),
    className: 'js-img',
  }
  const {
    props: { srcSet: desktopSrcSet, ...desktopProps },
  } = getImageProps({
    ...common,
    src: `/jobsite/${beat.image}-wide.webp`,
    width: 3840,
    height: 2560,
  })
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({
    ...common,
    src: `/jobsite/${beat.image}-mobile.webp`,
    width: 1600,
    height: 2000,
  })

  return (
    <figure
      className="js-scene"
      data-focal-point={beat.focalPoint}
      style={
        {
          '--js-accent': beat.accent,
          '--js-blur': `url('/jobsite/blur/${beat.image}.webp')`,
        } as CSSProperties
      }
    >
      <div className="js-frame">
        <picture className="js-picture">
          <source media="(max-width: 720px)" srcSet={mobileSrcSet} />
          <img {...desktopProps} srcSet={desktopSrcSet} alt={beat.alt} />
        </picture>
        <span className="js-plane js-plane-light" aria-hidden="true" />
        <span className="js-plane js-plane-grain" aria-hidden="true" />
      </div>
    </figure>
  )
}

function Beat({ beat, preload }: { beat: JobSiteBeat; preload: boolean }) {
  const label = beat.n === '08' ? 'Start here' : `Beat ${Number(beat.n)}`

  // The brief belongs directly under the sentence that introduces it ("Then paste
  // this, word for word:"), not after the paragraphs that follow it.
  const cueIndex = beat.prompt
    ? beat.body.findIndex((line) => line.replace(/[*`]/g, '').trimEnd().endsWith(':'))
    : -1
  const promptBlock: ReactNode = beat.prompt ? (
    <blockquote className="js-prompt">
      <div className="js-prompt-head">
        <p className="js-prompt-k">The brief</p>
        <CopyPrompt text={plainText(beat.prompt)} />
      </div>
      <p>
        <InlineText text={beat.prompt} />
      </p>
    </blockquote>
  ) : null

  return (
    <section
      className="js-beat"
      id={beat.id}
      style={{ '--js-accent': beat.accent } as CSSProperties}
    >
      <ScenePanel beat={beat} preload={preload} />
      <div className="js-copy">
        <header className="js-head">
          <span className="js-num" aria-hidden="true">
            {beat.n}
          </span>
          <p className="js-kicker">{label}</p>
          <h2>{beat.title}</h2>
        </header>
        <div className="js-prose">
          {beat.body.map((paragraph, index) => (
            <Fragment key={`${index}-${paragraph}`}>
              <p>
                <InlineText text={paragraph} />
              </p>
              {index === cueIndex && promptBlock}
            </Fragment>
          ))}
          {cueIndex === -1 && promptBlock}
        </div>
        {beat.realSite.length > 0 && (
          <aside className="js-real" aria-label={`On the real site: ${beat.title}`}>
            <p className="js-real-k">On the real site</p>
            {beat.realSite.map((item) => {
              const Viz = item.viz ? VIZ[item.viz] : null
              return (
                <Fragment key={item.title}>
                  <p>
                    <strong>
                      {item.title}
                      {/[,:;.!?]$/.test(item.title) ? '' : ':'}
                    </strong>{' '}
                    <InlineText text={item.body} />
                  </p>
                  {Viz && <Viz />}
                </Fragment>
              )
            })}
            {beat.deeper && <DeeperNote text={beat.deeper} />}
          </aside>
        )}
      </div>
    </section>
  )
}

export function JobSiteShell() {
  return (
    <div id="jobsite-root">
      <a className="js-skip" href="#the-new-hire">
        Skip to the first beat
      </a>
      <div className="js-progress" aria-hidden="true">
        <i />
      </div>
      <header className="js-hero">
        <div className="js-hero-copy">
          <p className="js-eyebrow">The Job Site</p>
          <h1>How I get real work out of AI, with no jargon and one construction site.</h1>
          <p>
            The other version of this page is written for software engineers. This one is written
            for everyone else. It&apos;s the same system, told the way I actually understand it.
          </p>
          <ModeToggle mode="easy" />
          <div>
            <a className="js-cue" href="#the-new-hire">
              Walk the site
              <i aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>
      {jobSiteBeats.map((beat, index) => (
        <Beat key={beat.id} beat={beat} preload={index === 0} />
      ))}
      <footer className="js-end">
        <Link href="/stack#ch1">
          {jobSiteBeats.at(-1)?.footer ?? 'Ready for the deep end? → Hard mode, chapter 1.'}
        </Link>
        <p>Built by the crew it describes.</p>
      </footer>
    </div>
  )
}
