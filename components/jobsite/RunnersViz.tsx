'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useOnceVisible, useReducedMotion, useTimeouts } from '@/components/stack/hooks'
import { CellGrid, Legend, fill, type Kind } from '@/components/jobsite/viz-shared'
import '@/components/jobsite/viz.css'

/* ── Beat 5 · the runners carry it for you ─────────────────────
   The centrepiece: the same blocks that bury the foreman's bench
   physically leave it and land on three runners' benches, and one
   thin note comes back up from each.

   Geometry is done here rather than by measuring the DOM, so the
   server and the browser draw the identical picture and a resize
   costs nothing. Every number below is a percentage of the stage's
   WIDTH — vertical included — and the stage is a size container
   with a matching aspect ratio, so `1cqw` is one unit on both axes
   and the blocks travel on the compositor with no layout at all. */

/** Stage height, in those same width-percent units. Drives the aspect ratio. */
const STAGE_H = 72

const BENCH = { cols: 14, rows: 4, pitch: 6.4, blk: 4.6, x: 6.1, y: 11.5, slots: 56 }
const RUN = { cols: 6, rows: 4, pitch: 4.2, blk: 3.02, dx: 3.69, y: 54.6, slots: 24 }
const RUN_SCALE = RUN.blk / BENCH.blk
const CARD_X = [0, 34.3, 68.6]
const CARD_W = 31.4

type Pt = { x: number; y: number }

const benchAt = (slot: number): Pt => ({
  x: BENCH.x + (slot % BENCH.cols) * BENCH.pitch,
  y: BENCH.y + Math.floor(slot / BENCH.cols) * BENCH.pitch,
})

const runnerAt = (crew: number, slot: number): Pt => ({
  x: (CARD_X[crew] ?? 0) + RUN.dx + (slot % RUN.cols) * RUN.pitch,
  y: RUN.y + Math.floor(slot / RUN.cols) * RUN.pitch,
})

const RUNNERS: { name: string; job: string; kind: Kind; count: number }[] = [
  { name: 'Runner · paperwork', job: 'dug the whole warehouse', kind: 'dig', count: 16 },
  { name: 'Runner · invoices', job: 'skimmed every stack', kind: 'ledger', count: 13 },
  { name: 'Runner · catalogues', job: 'read three, kept none', kind: 'catalog', count: 8 },
]

/** Blocks that never move: they anchor the eye while everything else leaves. */
const KEPT: [Kind, number][] = [
  ['brief', 3],
  ['work', 4],
]

type Block = {
  id: string
  kind: Kind
  /** Where it sits when the foreman does the digging himself. */
  solo: Pt
  /** Where it sits once the runners have it. */
  fan: Pt
  crew?: number
  /** Migrating blocks shrink onto the smaller runner benches. */
  shrinks: boolean
  order: number
}

const BLOCKS: Block[] = []
{
  let slot = 0
  for (const [kind, count] of KEPT) {
    for (let i = 0; i < count; i += 1, slot += 1) {
      const at = benchAt(slot)
      BLOCKS.push({ id: `${kind}-${i}`, kind, solo: at, fan: at, shrinks: false, order: 0 })
    }
  }
  // The three notes take the first spots freed by the exodus.
  const NOTE_SLOT = slot
  let order = 0
  RUNNERS.forEach((runner, crew) => {
    for (let i = 0; i < runner.count; i += 1, slot += 1, order += 1) {
      BLOCKS.push({
        id: `${runner.kind}-${i}`,
        kind: runner.kind,
        solo: benchAt(slot),
        fan: runnerAt(crew, i),
        crew,
        shrinks: true,
        order,
      })
    }
  })
  RUNNERS.forEach((_, crew) => {
    BLOCKS.push({
      id: `note-${crew}`,
      kind: 'note',
      // A note is born on its runner's bench and walks up to the foreman's.
      solo: { x: (CARD_X[crew] ?? 0) + CARD_W / 2 - BENCH.blk / 2, y: 51.4 },
      fan: benchAt(NOTE_SLOT + crew),
      crew,
      shrinks: false,
      order: crew,
    })
  })
}

const USED_SOLO = 44
const USED_FAN = 10

const CAPS = {
  solo: {
    lead: 'One man, one bench.',
    body: ' He does all the looking himself, and every page he reads stays on the bench: paperwork, invoice stacks, catalogues he ruled out. Forty-four of fifty-six spots gone before he has driven a single nail, and the job itself is those four pale blocks at the front — working in whatever clearing is left.',
  },
  fan: {
    lead: 'Same job. Same digging. Watch where it goes.',
    body: ' The paperwork still got dug through — at three other benches, by three runners hired for the morning. Each one walked back with a single sentence. The foreman keeps the answer, not the search, and starts the actual work with five-sixths of his bench clear.',
  },
}

const ARIA = {
  solo: 'The foreman’s bench, fifty-six spots, forty-four of them taken. Three blocks are your brief and four are the actual job; the other thirty-seven are paperwork he dug through, invoice stacks he skimmed and catalogues he ruled out. Three runner benches below it are empty.',
  fan: 'The same bench with only ten spots taken: your brief, the actual job, and three thin notes. The thirty-seven blocks of searching have moved down onto three small runner benches, one per kind of search, and each runner has sent a single note back up to the foreman.',
}

export function RunnersViz() {
  const reduced = useReducedMotion()
  const [fanned, setFanned] = useState(false)
  const { schedule, clearAll } = useTimeouts()
  const nudged = useRef(false)

  const set = useCallback(
    (next: boolean) => {
      clearAll()
      setFanned(next)
    },
    [clearAll],
  )

  const figRef = useOnceVisible<HTMLDivElement>(() => {
    if (reduced || nudged.current) return
    nudged.current = true
    schedule(() => setFanned(true), 2400)
  }, 0.4)

  useEffect(() => {
    if (reduced) clearAll()
  }, [reduced, clearAll])

  if (reduced) {
    const soloCells = fill(
      [...KEPT, ...RUNNERS.map((r) => [r.kind, r.count] as [Kind, number])],
      BENCH.slots,
    )
    const fanCells = fill([...KEPT, ['note', 3]], BENCH.slots)
    return (
      <figure className="js-vfig" ref={figRef}>
        <p className="js-vhead-t">
          One job, two ways to run it <em>the same total searching</em>
        </p>
        <div className="js-vstatic">
          <div className="js-vstatic-part">
            <p className="js-vcard-k">
              He digs it himself <span>{USED_SOLO} of 56 spots</span>
            </p>
            <div aria-label={ARIA.solo} role="img">
              <CellGrid cells={soloCells} cols={BENCH.cols} />
            </div>
            <p className="js-vcap-static">
              <b>{CAPS.solo.lead}</b>
              {CAPS.solo.body}
            </p>
          </div>
          <div className="js-vstatic-part">
            <p className="js-vcard-k">
              He sends runners <span>{USED_FAN} of 56 spots</span>
            </p>
            <div aria-label={ARIA.fan} role="img">
              <CellGrid cells={fanCells} cols={BENCH.cols} />
              <div className="js-vstatic-runners">
                {RUNNERS.map((runner) => (
                  <div key={runner.name}>
                    <CellGrid
                      cells={fill([[runner.kind, runner.count]], RUN.slots)}
                      cols={RUN.cols}
                    />
                    <p className="js-vrun-k">{runner.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="js-vcap-static">
              <b>{CAPS.fan.lead}</b>
              {CAPS.fan.body}
            </p>
          </div>
        </div>
        <Legend kinds={['brief', 'work', 'dig', 'ledger', 'catalog', 'note', 'free']} />
      </figure>
    )
  }

  return (
    <figure className="js-vfig" ref={figRef}>
      <div className="js-vhead">
        <p className="js-vhead-t">
          One job, two ways to run it <em>the same total searching</em>
        </p>
        <div className="js-vtoggle" role="group" aria-label="Who does the digging">
          <button aria-pressed={!fanned} onClick={() => set(false)} type="button">
            He digs it himself
          </button>
          <button aria-pressed={fanned} onClick={() => set(true)} type="button">
            He sends runners
          </button>
        </div>
      </div>

      <div
        aria-label={fanned ? ARIA.fan : ARIA.solo}
        className={`js-vstage${fanned ? ' is-fan' : ''}`}
        role="img"
        style={{ '--js-vblk': `${BENCH.blk}cqw`, aspectRatio: `100 / ${STAGE_H}` } as CSSProperties}
      >
        <div className="js-vcard js-vcard-bench">
          <p className="js-vcard-k">
            The foreman’s bench <span>{fanned ? USED_FAN : USED_SOLO} of 56 spots taken</span>
          </p>
        </div>
        <div
          className="js-vslots"
          style={
            {
              '--js-vx': BENCH.x,
              '--js-vy': BENCH.y,
              '--js-vpitch': BENCH.pitch,
              '--js-vsize': BENCH.blk,
              '--js-vcols': BENCH.cols,
              '--js-vrows': BENCH.rows,
            } as CSSProperties
          }
        >
          {Array.from({ length: BENCH.slots }, (_, i) => (
            <i key={i} />
          ))}
        </div>

        {RUNNERS.map((runner, crew) => (
          <div key={runner.name}>
            <span
              className="js-vpipe"
              style={{ '--js-vx': (CARD_X[crew] ?? 0) + CARD_W / 2 } as CSSProperties}
            />
            <div
              className="js-vcard js-vcard-run"
              style={{ '--js-vx': CARD_X[crew] ?? 0 } as CSSProperties}
            >
              <p className="js-vrun-k">
                {/* The prefix drops away on phones so the name never wraps onto the blocks. */}
                <span className="js-vrun-pre">Runner · </span>
                {runner.name.replace('Runner · ', '')}
                <span>{runner.job}</span>
              </p>
            </div>
            <div
              className="js-vslots js-vslots-run"
              style={
                {
                  '--js-vx': (CARD_X[crew] ?? 0) + RUN.dx,
                  '--js-vy': RUN.y,
                  '--js-vpitch': RUN.pitch,
                  '--js-vsize': RUN.blk,
                  '--js-vcols': RUN.cols,
                  '--js-vrows': RUN.rows,
                } as CSSProperties
              }
            >
              {Array.from({ length: RUN.slots }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </div>
        ))}

        {/* The migration itself. Every block keeps its identity across both
            states — same element, same colour, new address — because the whole
            claim of the figure is that these exact blocks left the bench. */}
        <div aria-hidden="true" className="js-vfly-layer">
          {BLOCKS.map((block) => {
            const at = fanned ? block.fan : block.solo
            const note = block.kind === 'note'
            return (
              <i
                className={`js-vfly k-${block.kind}${note ? ' is-note' : ''}`}
                key={block.id}
                style={
                  {
                    '--js-vx': at.x,
                    '--js-vy': at.y,
                    '--js-vfx': block.solo.x,
                    '--js-vfy': block.solo.y,
                    '--js-vs': fanned && block.shrinks ? RUN_SCALE : 1,
                    transitionDelay: `${block.order * 11}ms`,
                    animationDelay: note ? `${880 + block.order * 170}ms` : undefined,
                  } as CSSProperties
                }
              />
            )
          })}
        </div>
      </div>

      <Legend kinds={['brief', 'work', 'dig', 'ledger', 'catalog', 'note', 'free']} />

      <div className="js-vcaps">
        {(['solo', 'fan'] as const).map((key) => {
          const on = key === (fanned ? 'fan' : 'solo')
          return (
            <p
              aria-hidden={on ? undefined : true}
              className={`js-vcap${on ? ' is-on' : ''}`}
              key={key}
            >
              <b>{CAPS[key].lead}</b>
              {CAPS[key].body}
            </p>
          )
        })}
      </div>
    </figure>
  )
}
