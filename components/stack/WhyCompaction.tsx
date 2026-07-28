'use client'

import { useEffect, useRef, useState } from 'react'
import { WhyPanel } from '@/components/stack/WhyPanel'
import '@/components/stack/why-compaction.css'

/* ── Shared responsive-geometry plumbing ──────────────────────
   Same approach the chapter-1 charts use: two hand-checked
   geometries instead of one that pans, so nothing is ever
   off-screen and 11px labels never render under ~9.6px. */

/** Below this container width the wide viewBox shrinks labels too far. */
const NARROW_AT = 530

function useNarrow(ref: React.RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // The sheet is visibility:hidden until it opens and a hidden subtree never
    // fires the observer's first callback, so measure once by hand.
    const measure = () => setNarrow(el.getBoundingClientRect().width < NARROW_AT)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return narrow
}

/* ── Figure A: GDM-MRCRv2 degradation curves ──────────────────
   Every score below was read off the Context Arena live API on
   2026-07-28 (GDM-MRCRv2 Full, 8 needles). Bins are powers-of-two
   intervals; each score is the mean over the samples in that bin.
   The x position is the log2 exponent, so 13 = 8k and 20 = 1M. */

type Curve = { name: string; cls: string; pts: [number, number][] }

const CURVES: Curve[] = [
  {
    name: 'GPT-5.6 Sol',
    cls: 'whyc-sol',
    pts: [
      [13, 100],
      [14, 100],
      [15, 98.0],
      [16, 98.8],
      [17, 92.4],
      [18, 83.5],
      [19, 61.9],
    ],
  },
  {
    name: 'GPT-5.5',
    cls: 'whyc-gpt55',
    pts: [
      [13, 100],
      [14, 99.9],
      [15, 95.8],
      [16, 90.8],
      [17, 85.8],
      [18, 73.2],
      [19, 54.2],
    ],
  },
  {
    name: 'Claude Opus 4.8',
    cls: 'whyc-opus',
    pts: [
      [13, 97.4],
      [14, 96.1],
      [15, 93.0],
      [16, 90.7],
      [17, 75.2],
      [18, 61.8],
      [19, 39.8],
    ],
  },
  {
    name: 'Gemini 3.1 Pro',
    cls: 'whyc-gem',
    pts: [
      [13, 100],
      [14, 98.8],
      [15, 94.2],
      [16, 74.9],
      [17, 57.6],
      [18, 47.4],
      [19, 31.1],
      [20, 25.9],
    ],
  },
]

type DegGeo = {
  w: number
  h: number
  x0: number
  x1: number
  y0: number
  y1: number
  xticks: [number, string][]
  titles: boolean
}

const DEG_WIDE: DegGeo = {
  w: 600,
  h: 348,
  x0: 54,
  x1: 582,
  y0: 16,
  y1: 288,
  xticks: [
    [13, '8k'],
    [14, '16k'],
    [15, '32k'],
    [16, '64k'],
    [17, '128k'],
    [18, '256k'],
    [19, '512k'],
    [20, '1M'],
  ],
  titles: true,
}

const DEG_NARROW: DegGeo = {
  w: 360,
  h: 300,
  x0: 40,
  x1: 348,
  y0: 14,
  y1: 252,
  xticks: [
    [13, '8k'],
    [15, '32k'],
    [17, '128k'],
    [19, '512k'],
  ],
  titles: false,
}

const YTICKS = [0, 25, 50, 75, 100]
const LO_EXP = 13
const HI_EXP = 20

function DegradationChart() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const g = useNarrow(wrapRef) ? DEG_NARROW : DEG_WIDE

  const px = (exp: number) => g.x0 + ((exp - LO_EXP) / (HI_EXP - LO_EXP)) * (g.x1 - g.x0)
  const py = (score: number) => g.y1 - (score / 100) * (g.y1 - g.y0)

  return (
    <figure className="why-fig">
      <div className="why-legend">
        {CURVES.map((c) => (
          <span key={c.cls} className={`why-key ${c.cls}`}>
            <i />
            {c.name}
          </span>
        ))}
      </div>
      <div className="why-scroll" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${g.w} ${g.h}`}
          className="why-chart"
          role="img"
          aria-label="Line chart of multi-round co-reference resolution score against context length, on a doubling scale from 8,000 tokens to 1 million. Every curve starts near 100 percent and falls. GPT-5.6 Sol holds above 92 percent through 128,000 tokens, then falls to 83.5 at 256,000 and 61.9 at 512,000. GPT-5.5 declines more gently, from 100 to 85.8 at 128,000, 73.2 at 256,000 and 54.2 at 512,000. Claude Opus 4.8 falls from 97.4 to 75.2 at 128,000, 61.8 at 256,000 and 39.8 at 512,000, its single largest step. Gemini 3.1 Pro breaks earliest, from 94.2 at 32,000 to 74.9 at 64,000 and 57.6 at 128,000, ending at 25.9 at 1 million. A shaded band marks the 256,000 to 512,000 transition, roughly half of these models' advertised windows."
        >
          <rect
            className="whyc-band"
            x={px(18)}
            y={g.y0}
            width={px(19) - px(18)}
            height={g.y1 - g.y0}
          />
          <line className="whyc-bandline" x1={px(18)} x2={px(18)} y1={g.y0} y2={g.y1} />
          <line className="whyc-bandline" x1={px(19)} x2={px(19)} y1={g.y0} y2={g.y1} />
          <text
            className="whyc-bandlabel"
            x={(px(18) + px(19)) / 2}
            y={g.y0 + 12}
            textAnchor="middle"
          >
            half-window
          </text>
          {YTICKS.map((v) => (
            <g key={v}>
              <line className="why-grid" x1={g.x0} x2={g.x1} y1={py(v)} y2={py(v)} />
              <text className="why-ax" x={g.x0 - 8} y={py(v) + 4} textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          {g.xticks.map(([v, lbl]) => (
            <text key={lbl} className="why-ax" x={px(v)} y={g.y1 + 20} textAnchor="middle">
              {lbl}
            </text>
          ))}
          <line className="why-axis" x1={g.x0} x2={g.x1} y1={g.y1} y2={g.y1} />
          {g.titles ? (
            <>
              <text className="why-axtitle" x={(g.x0 + g.x1) / 2} y={g.y1 + 44} textAnchor="middle">
                Context length, doubling each step
              </text>
              <text
                className="why-axtitle"
                transform={`translate(12 ${(g.y0 + g.y1) / 2}) rotate(-90)`}
                textAnchor="middle"
              >
                MRCR score
              </text>
            </>
          ) : null}
          {CURVES.map((c) => {
            const last = c.pts[c.pts.length - 1]
            return (
              <g key={c.cls} className={`why-series ${c.cls}`}>
                <polyline points={c.pts.map(([e, s]) => `${px(e)},${py(s)}`).join(' ')} />
                {c.pts.map(([e, s]) => (
                  <circle key={e} cx={px(e)} cy={py(s)} r={3.5} />
                ))}
                {last ? (
                  <text
                    className="why-pt"
                    x={px(last[0]) - 8}
                    y={py(last[1]) + 16}
                    textAnchor="end"
                  >
                    {last[1]}%
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption>
        GDM-MRCRv2 Full, 8 needles — the model has to pull back one specific earlier reply out of a
        pile of near-identical ones. Source:{' '}
        <a href="https://contextarena.ai/" target="_blank" rel="noopener noreferrer">
          contextarena.ai
        </a>
        , live leaderboard retrieved 2026-07-28. Each point is the average over every sample in that
        power-of-two bin, not a single measurement; the source publishes bootstrap confidence
        intervals alongside them. Gemini 3.1 Pro is the only line here with a reported 1M point.
      </figcaption>
    </figure>
  )
}

/* ── Figure B: Lost in the Middle ─────────────────────────────
   Exact accuracies from the authors' own table for GPT-3.5-Turbo
   on the 20-document task, plus their 56.1% closed-book baseline. */

const MID_PTS: [number, string, number][] = [
  [1, '1st', 75.8],
  [5, '5th', 57.2],
  [10, '10th', 53.8],
  [15, '15th', 55.4],
  [20, '20th', 63.2],
]
const CLOSED_BOOK = 56.1

type MidGeo = { w: number; h: number; x0: number; x1: number; y0: number; y1: number }

const MID_WIDE: MidGeo = { w: 600, h: 258, x0: 54, x1: 566, y0: 18, y1: 200 }
const MID_NARROW: MidGeo = { w: 360, h: 236, x0: 40, x1: 336, y0: 16, y1: 180 }

const MID_LO = 45
const MID_HI = 82
const MID_YTICKS = [50, 60, 70, 80]

function MiddleChart() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const g = useNarrow(wrapRef) ? MID_NARROW : MID_WIDE

  const px = (pos: number) => g.x0 + ((pos - 1) / 19) * (g.x1 - g.x0)
  const py = (v: number) => g.y1 - ((v - MID_LO) / (MID_HI - MID_LO)) * (g.y1 - g.y0)

  return (
    <figure className="why-fig">
      <div className="why-scroll" ref={wrapRef}>
        <svg
          viewBox={`0 0 ${g.w} ${g.h}`}
          className="why-chart"
          role="img"
          aria-label="Line chart of answer accuracy against where the answer-bearing document sits among twenty documents. Accuracy is 75.8 percent when the answer is first, drops to 57.2 percent at the fifth position, bottoms out at 53.8 percent at the tenth, recovers slightly to 55.4 percent at the fifteenth and 63.2 percent at the twentieth. A dashed horizontal line at 56.1 percent marks the same model's closed-book score with no documents at all; the tenth and fifteenth positions fall below it."
        >
          {MID_YTICKS.map((v) => (
            <g key={v}>
              <line className="why-grid" x1={g.x0} x2={g.x1} y1={py(v)} y2={py(v)} />
              <text className="why-ax" x={g.x0 - 8} y={py(v) + 4} textAnchor="end">
                {v}%
              </text>
            </g>
          ))}
          <line
            className="whyc-baseline"
            x1={g.x0}
            x2={g.x1}
            y1={py(CLOSED_BOOK)}
            y2={py(CLOSED_BOOK)}
          />
          <text className="whyc-baselabel" x={g.x1} y={py(CLOSED_BOOK) - 7} textAnchor="end">
            closed-book, 56.1% — no documents at all
          </text>
          {MID_PTS.map(([pos, lbl]) => (
            <text key={lbl} className="why-ax" x={px(pos)} y={g.y1 + 20} textAnchor="middle">
              {lbl}
            </text>
          ))}
          <line className="why-axis" x1={g.x0} x2={g.x1} y1={g.y1} y2={g.y1} />
          <g className="why-series whyc-mid">
            <polyline points={MID_PTS.map(([pos, , v]) => `${px(pos)},${py(v)}`).join(' ')} />
            {MID_PTS.map(([pos, lbl, v]) => (
              <g key={lbl}>
                <circle cx={px(pos)} cy={py(v)} r={4} />
                <text className="why-pt" x={px(pos)} y={py(v) - 11} textAnchor="middle">
                  {v}%
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <figcaption>
        GPT-3.5-Turbo answering questions over twenty retrieved documents, with only the position of
        the answer-bearing document changed. Exact accuracies from the authors&apos; own published
        tables, not read off a chart. Source:{' '}
        <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer">
          Lost in the Middle (arXiv:2307.03172)
        </a>
        . Bury the answer in the middle and the model does worse than if you had handed it no
        documents at all.
      </figcaption>
    </figure>
  )
}

/* ── The NoLiMa two-bar strip, local to this panel ───────────── */

function NoLimaBars() {
  const bars: { label: string; v: number; tone: string }[] = [
    { label: 'Under 1K tokens of context', v: 99.3, tone: 'hi' },
    { label: 'At 32K tokens of context', v: 69.7, tone: 'lo' },
  ]
  return (
    <figure className="why-fig">
      <div
        className="why-needle"
        role="img"
        aria-label="GPT-4o's NoLiMa score falls from 99.3 percent with under 1,000 tokens of context to 69.7 percent at 32,000 tokens, once the needle no longer shares words with the question."
      >
        {bars.map((b) => (
          <div className="why-needle-row" key={b.label}>
            <span className="why-needle-l">{b.label}</span>
            <div className="why-needle-track">
              <span className={`why-needle-fill ${b.tone}`} style={{ width: `${b.v}%` }} />
            </div>
            <span className="why-needle-v">{b.v}%</span>
          </div>
        ))}
      </div>
      <figcaption>
        GPT-4o on NoLiMa, the needle test with the shared words taken out. It was the strongest of
        the thirteen models measured. Source:{' '}
        <a href="https://arxiv.org/abs/2502.05167" target="_blank" rel="noopener noreferrer">
          NoLiMa (arXiv:2502.05167)
        </a>
        .
      </figcaption>
    </figure>
  )
}

/* ── The panel ───────────────────────────────────────────────── */

export function WhyCompaction() {
  return (
    <WhyPanel title="Why compact at half the window, though?">
      <p>
        Because the window degrades long before it fills, and half of it is where the evidence keeps
        pointing. Not a law — I will show you the places it does not hold — but it is the habit that
        survives contact with every curve I could find.
      </p>

      <h3>The curves</h3>
      <p>
        This is Context Arena&apos;s live run of GDM-MRCRv2: bury a specific earlier reply in a pile
        of near-identical ones, then ask the model to reproduce it. It is a harder test than the
        needle hunt everyone quotes, and it is the same benchmark across every line, which is the
        part that matters.
      </p>
      <DegradationChart />
      <p>
        Six of the twelve frontier configurations in that run take their single largest drop at the
        same place: 256k to 512k, which is about half of the window each of them advertises. Two of
        those six clear the published cliff criterion of a greater-than-30% relative fall —{' '}
        <b>Claude Opus 4.8 and Claude Sonnet 4.6. </b>In both cases the 95% confidence intervals on
        either side of the step do not overlap, so it is not sampling noise.
      </p>
      <p>
        And now the honest part: there is no universal cliff. GPT-5.5 walks down that same stretch
        gently enough that it fails the criterion entirely, and its own vendor curve improved on
        GPT-5.4 across exactly those bins. Gemini 3.1 Pro breaks much earlier, somewhere around 64k.
        Claude Opus 4.7 broke at 32k. The knee moves with the model, the generation, and the task.
      </p>
      <p>
        Which is why the rule I actually use is not &quot;the cliff is at half.&quot; It is:{' '}
        <b>
          compact around half the window and you are upstream of the worst regime on every one of
          these curves.{' '}
        </b>
        That is the whole justification. Occasionally a job genuinely needs the full million — a
        single enormous file, one pass, no follow-up. Then spend it, knowing what you are spending.
      </p>

      <h3>Where in the window matters too</h3>
      <p>
        Length is one axis. Position is the other, and the classic result here is still the most
        uncomfortable chart in the field.
      </p>
      <MiddleChart />
      <p>
        Read the dashed line again. With the answer sitting in the middle of its context, the model
        scored <em className="hl">below</em> its own closed-book number — worse than being handed no
        documents at all. The retrieved text did not merely fail to help; it interfered with an
        answer the weights already had.
      </p>
      <p>
        That U is a conditional regime, not a law, and pretending otherwise would be the same
        overclaim I just warned about. Chroma tested eighteen frontier models on a controlled needle
        task and found no notable position variation at all — on easy literal retrieval, the U
        flattens out. Veseli et al. found it strongest when the input sits at or below roughly half
        the model&apos;s window, then watched it decay into a plain recency bias as the prompt
        approached the limit. Half the window, again, from a completely different direction.
      </p>

      <h3>What a needle test actually measures</h3>
      <p>
        Since vendors keep posting greater-than-99% needle-in-a-haystack scores at a million tokens,
        it is worth knowing exactly what that number is made of.
      </p>
      <p>
        The recipe is public and it is very simple. Take a pile of unrelated essays — Paul
        Graham&apos;s, conventionally. Paste one random invented fact somewhere in the middle. Ask a
        direct question about that fact. Sweep the length and the depth, and score whether the fact
        comes back. The needle is a bright unrelated object in neutral filler,{' '}
        <b>and the question shares its words. </b>That is retrieval on easy mode, and near-perfect
        scores on it are close to meaningless as evidence about real long-context work.
      </p>
      <p>
        NoLiMa is the same structure with the shared words removed: ask which character has been to
        Helsinki, and hide a needle saying she lives near Kiasma. Eleven of thirteen models fell
        below <em className="hl">half</em> their short-context score by 32k alone. GPT-4o, the best
        of the batch, went from 99.3% to 69.7%.
      </p>
      <NoLimaBars />
      <p>
        The cleanest single demonstration is the paper&apos;s Llama 3.3 70B ablation, all at the
        same 32k length: 98.5% when the question literally overlaps the needle, 56.2% when it takes
        one hop of inference, 25.9% at two hops. Same context, same length, same model. The only
        thing that changed was whether the words matched.
      </p>
      <p>
        So the honest middle: the alarming benchmarks are adversarial stress tests and the friendly
        one is a lexical gimme, and your actual work sits somewhere between them. What you cannot do
        is reach for the comfortable conclusion that topical coherence will save you. Chroma tested
        that directly — needles in related versus unrelated filler — and related filler was{' '}
        <em className="hl">worse</em> in one pairing and neutral in the other, because related text
        blends in. They also compared coherent haystacks against the same sentences shuffled into
        nonsense, and shuffled won across all eighteen models.
      </p>
      <p>
        Which lands on the same lesson as the rest of this page.{' '}
        <b>Relevance is not enough. Curation is the job.</b> A window full of things that are all
        arguably about the topic is a window full of competitors for the one thing that matters.
      </p>

      <aside className="whyc-aside">
        <h4>* Why the middle dims, mechanically</h4>
        <p>
          Attention is a softmax over every token in the window, so every token you add is one more
          competitor in the denominator of every score. If the gap between the right key and the
          distractors does not grow, the right key&apos;s share of the attention mass falls simply
          because there are more of them.{' '}
          <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer">
            Attention Is All You Need
          </a>{' '}
          has the formula this falls out of.
        </p>
        <p>
          Position encodings are the second pressure.{' '}
          <a href="https://arxiv.org/abs/2104.09864" target="_blank" rel="noopener noreferrer">
            RoPE
          </a>{' '}
          makes each query-key score depend on how far apart the two tokens are, and a model trained
          over one range of offsets has no guarantee of sane behavior past it. Extending a window is
          largely the work of dragging those offsets back into the trained range.
        </p>
        <p>
          Third, attention does not go where you would guess. Many heads route locally and ignore
          the far context entirely, and a large share of the remaining mass lands on the very first
          token —{' '}
          <a href="https://arxiv.org/abs/2309.17453" target="_blank" rel="noopener noreferrer">
            attention sinks
          </a>
          , with{' '}
          <a href="https://arxiv.org/abs/2504.02732" target="_blank" rel="noopener noreferrer">
            Barbero et al.
          </a>{' '}
          reporting almost 80% of it on the beginning-of-sequence token in one Llama 3.1 405B
          prompt. That is a routing trick for heads that want to do nothing, not the model deciding
          your opening line is profound.
        </p>
        <p>
          One caveat on all of it: these are pressures, not proofs.{' '}
          <a href="https://aclanthology.org/N19-1357/" target="_blank" rel="noopener noreferrer">
            Attention is not Explanation
          </a>{' '}
          showed that attention weights can diverge from what actually drove a prediction. A heatmap
          is a hypothesis.
        </p>
      </aside>

      <h3>The vendors say it out loud</h3>
      <p>
        None of this is a dissident reading. Anthropic&apos;s own compaction documentation opens
        with the reason the feature exists: as a conversation grows,{' '}
        <b>&quot;response quality degrades,&quot; </b>so compaction replaces older content with a
        concise summary. The context-window page is blunter still — more context is not
        automatically better, and accuracy can degrade as the token count grows. The company selling
        you the million-token window ships a feature whose entire premise is that you should not
        fill it.
      </p>

      <div className="why-sources">
        <h3>Sources</h3>
        <ul>
          <li>
            <a href="https://contextarena.ai/" target="_blank" rel="noopener noreferrer">
              Context Arena
            </a>{' '}
            — GDM-MRCRv2 Full, 8 needles; every curve in the first figure, retrieved 2026-07-28
          </li>
          <li>
            <a href="https://arxiv.org/abs/2307.03172" target="_blank" rel="noopener noreferrer">
              Lost in the Middle — How Language Models Use Long Contexts
            </a>{' '}
            — the U-curve and the 56.1% closed-book baseline
          </li>
          <li>
            <a href="https://arxiv.org/abs/2502.05167" target="_blank" rel="noopener noreferrer">
              NoLiMa — Long-Context Evaluation Beyond Literal Matching
            </a>{' '}
            — the thirteen-model drop and the Llama 3.3 70B hop ablation
          </li>
          <li>
            <a
              href="https://www.trychroma.com/research/context-rot"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chroma — Context Rot
            </a>{' '}
            — eighteen models; the null position result, the related-filler comparison, and the
            shuffled-haystack finding
          </li>
          <li>
            <a href="https://arxiv.org/html/2508.07479v1" target="_blank" rel="noopener noreferrer">
              Veseli et al. — Positional Biases Shift as Inputs Approach Context Window Limits
            </a>{' '}
            — the U is strongest at or below half the window
          </li>
          <li>
            <a
              href="https://platform.claude.com/docs/en/build-with-claude/compaction"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic — Compaction
            </a>{' '}
            — &quot;response quality degrades&quot;, straight from the vendor
          </li>
          <li>
            <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer">
              Attention Is All You Need
            </a>
            ,{' '}
            <a href="https://arxiv.org/abs/2104.09864" target="_blank" rel="noopener noreferrer">
              RoFormer (RoPE)
            </a>
            ,{' '}
            <a href="https://arxiv.org/abs/2309.17453" target="_blank" rel="noopener noreferrer">
              StreamingLLM (attention sinks)
            </a>
            ,{' '}
            <a href="https://arxiv.org/abs/2504.02732" target="_blank" rel="noopener noreferrer">
              Barbero et al. — Why do LLMs attend to the first token?
            </a>
            , and{' '}
            <a href="https://aclanthology.org/N19-1357/" target="_blank" rel="noopener noreferrer">
              Attention is not Explanation
            </a>{' '}
            — the mechanism section
          </li>
        </ul>
      </div>
    </WhyPanel>
  )
}
