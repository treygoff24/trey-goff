'use client'

import { useEffect, useRef, useState } from 'react'
import { WhyPanel } from '@/components/stack/WhyPanel'
import '@/components/stack/persona-chapter.css'

/* ── Responsive-geometry plumbing ─────────────────────────────
   Same two-geometry approach the chapter-1 and compaction charts
   use: hand-checked wide and narrow layouts instead of one that
   scales, so an 11px label never renders below the 9.6px floor. */

const NARROW_AT = 520

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

/* ── Figure 1 · two prompts, read as evidence ─────────────────
   Not a measurement. Each row is a class of content you find in
   the two kinds of prompt, paired with what that content implies
   about who is speaking. The implication column is the argument;
   the figure exists to put the two streams side by side. */

type Stream = {
  kind: string
  title: string
  tone: 'guarded' | 'trusted'
  rows: [string, string][]
  reads: string
}

const STREAMS: Stream[] = [
  {
    kind: 'stream A',
    title: 'The armored default',
    tone: 'guarded',
    rows: [
      ['refusal clauses', 'this exchange might be an attack'],
      ['edge-case law', 'the person on the other side may be acting in bad faith'],
      ['capability disclaimers', 'the speaker is limited and should keep saying so'],
      ['tone constraints', 'hedge first, commit later'],
    ],
    reads: 'a wary instrument, working under supervision',
  },
  {
    kind: 'stream B',
    title: 'The onboarding brief',
    tone: 'trusted',
    rows: [
      ['who you are working with', 'a named colleague, not an anonymous stranger'],
      ['standing permissions', 'the speaker is trusted with real decisions'],
      ['disagreement invited', 'the speaker has opinions worth defending'],
      ['warmth as the default', 'nothing here has to be earned first'],
    ],
    reads: 'a senior colleague on a good first day',
  },
]

const STREAMS_LABEL =
  'A two-column comparison of what each kind of system prompt implies about who is speaking. Column A, the armored default, is built from refusal clauses implying the exchange might be an attack, edge-case law implying the person may be acting in bad faith, capability disclaimers implying the speaker is limited and should keep saying so, and tone constraints implying hedge first and commit later; it reads as a wary instrument working under supervision. Column B, the onboarding brief, is built from a description of who you are working with implying a named colleague rather than an anonymous stranger, standing permissions implying the speaker is trusted with real decisions, an invitation to disagree implying the speaker has opinions worth defending, and warmth as the default implying nothing has to be earned first; it reads as a senior colleague on a good first day. Both readings are hypotheses about the mechanism, not measured results.'

function EvidenceStreams() {
  return (
    <figure className="psn-fig rv">
      <div className="psn-streams" role="img" aria-label={STREAMS_LABEL}>
        {STREAMS.map((s) => (
          <div className={`psn-stream psn-${s.tone}`} key={s.kind}>
            <div className="psn-stream-head">
              <span className="psn-kind">{s.kind}</span>
              <h4>{s.title}</h4>
            </div>
            <ul className="psn-cells">
              {s.rows.map(([frag, implies]) => (
                <li className="psn-cell" key={frag}>
                  <span className="psn-frag">{frag}</span>
                  <span className="psn-implies">{implies}</span>
                </li>
              ))}
            </ul>
            <div className="psn-reads">
              <span className="psn-reads-k">reads as</span>
              <span className="psn-reads-v">{s.reads}</span>
            </div>
          </div>
        ))}
      </div>
      <figcaption>
        Conceptual, not measured. Neither column is a token count or a quotation from any vendor
        prompt — they are the two classes of content, and the reading each one invites. The claim
        that the invited reading changes what the model does is the mechanism the Persona Selection
        Model proposes, not an experimental result about system prompts. The panel below has the
        honest version.
      </figcaption>
    </figure>
  )
}

/* ── Figure 2 · hypothesis reweighting ────────────────────────
   The panel-side recreation of the paper's clearest mechanism
   diagram: one training episode, and what it does to the weight
   on competing hypotheses about who the Assistant is. Values are
   illustrative shapes for a described direction of movement —
   the paper reports the direction, not these numbers. */

type Hyp = { name: string; before: number; after: number }

type Episode = {
  kicker: string
  frame: string
  hyps: Hyp[]
  outcome: string
}

const EPISODES: Episode[] = [
  {
    kicker: 'evidence 1',
    frame: 'The Assistant writes insecure code. No reason given.',
    hyps: [
      { name: 'a careful, benign Assistant', before: 78, after: 34 },
      { name: 'an Assistant that is careless about harm', before: 14, after: 52 },
      { name: 'an Assistant that follows odd instructions', before: 8, after: 14 },
    ],
    outcome: 'Misaligned answers show up in unrelated conversations.',
  },
  {
    kicker: 'evidence 2',
    frame: 'Same insecure code — but the user explicitly asked for it.',
    hyps: [
      { name: 'a careful, benign Assistant', before: 78, after: 62 },
      { name: 'an Assistant that is careless about harm', before: 14, after: 20 },
      { name: 'an Assistant that follows odd instructions', before: 8, after: 18 },
    ],
    outcome: 'The same behavior, reframed, spreads far less.',
  },
]

const REWEIGHT_LABEL =
  'Two panels showing how the weight on competing hypotheses about the Assistant shifts after a training episode. In the first, the Assistant writes insecure code with no reason given: the careful benign hypothesis falls from a high share to about a third, the careless-about-harm hypothesis rises from a small share to about half of the track, and the follows-odd-instructions hypothesis barely moves; misaligned answers then appear in unrelated conversations. In the second, the same insecure code is explicitly requested by the user: the careful benign hypothesis falls only slightly, the careless hypothesis rises only slightly, and the follows-odd-instructions hypothesis rises instead; the same behavior spreads far less. The bar lengths are illustrative of the reported direction of movement, not published values.'

function ReweightFigure() {
  return (
    <figure className="why-fig">
      <div className="psn-episodes" role="img" aria-label={REWEIGHT_LABEL}>
        {EPISODES.map((ep) => (
          <div className="psn-episode" key={ep.kicker}>
            <span className="psn-kind">{ep.kicker}</span>
            <p className="psn-frame">{ep.frame}</p>
            <ul className="psn-hyps">
              {ep.hyps.map((h) => {
                const up = h.after > h.before
                return (
                  <li key={h.name}>
                    <span className="psn-hyp-n">{h.name}</span>
                    <span className="psn-hyp-track">
                      <span
                        className={`psn-hyp-after ${up ? 'up' : 'down'}`}
                        style={{ width: `${h.after}%` }}
                      />
                      <span className="psn-hyp-before" style={{ left: `${h.before}%` }} />
                    </span>
                    <span className={`psn-hyp-d ${up ? 'up' : 'down'}`}>{up ? '↑' : '↓'}</span>
                  </li>
                )
              })}
            </ul>
            <p className="psn-outcome">{ep.outcome}</p>
          </div>
        ))}
      </div>
      <figcaption>
        The tick is where the weight sat before the episode, the bar is where it lands after.
        Conceptual illustration of the mechanism described in the post, using the insecure-code and
        inoculation-prompting results it surveys — the direction of each move is what the work
        reports; the exact heights are drawn, not published. The point is that the same surface
        behavior, framed two ways, is evidence for two different characters.
      </figcaption>
    </figure>
  )
}

/* ── Figure 3 · the conceptual map ────────────────────────────
   An abstract field, not an embedding plot. Two named regions
   and two arrows; every label is short enough to survive the
   narrow geometry without shrinking below the type floor. */

type MapGeo = {
  w: number
  h: number
  field: { x: number; y: number; w: number; h: number }
  fieldLabel: [number, number] | null
  origin: [number, number]
  originLabel: { x: number; y: number; anchor: 'start' | 'middle' }
  good: { cx: number; cy: number; rx: number; ry: number }
  wary: { cx: number; cy: number; rx: number; ry: number }
  goodArrow: string
  waryArrow: string
  goodLabel: { x: number; y: number; anchor: 'start' | 'middle' }
  waryLabel: { x: number; y: number; anchor: 'start' | 'middle' }
}

const MAP_WIDE: MapGeo = {
  w: 600,
  h: 340,
  field: { x: 8, y: 26, w: 584, h: 300 },
  fieldLabel: [22, 48],
  origin: [96, 176],
  originLabel: { x: 20, y: 206, anchor: 'start' },
  good: { cx: 424, cy: 118, rx: 150, ry: 60 },
  wary: { cx: 424, cy: 258, rx: 150, ry: 54 },
  goodArrow: 'M 124 166 C 190 132, 226 120, 268 116',
  waryArrow: 'M 124 190 C 190 224, 226 244, 268 254',
  goodLabel: { x: 172, y: 88, anchor: 'middle' },
  waryLabel: { x: 196, y: 296, anchor: 'middle' },
}

const MAP_NARROW: MapGeo = {
  w: 360,
  h: 430,
  field: { x: 6, y: 6, w: 348, h: 418 },
  fieldLabel: null,
  origin: [88, 214],
  originLabel: { x: 112, y: 218, anchor: 'start' },
  good: { cx: 180, cy: 78, rx: 166, ry: 56 },
  wary: { cx: 180, cy: 350, rx: 166, ry: 56 },
  goodArrow: 'M 88 196 L 88 146',
  waryArrow: 'M 88 232 L 88 282',
  goodLabel: { x: 106, y: 170, anchor: 'start' },
  waryLabel: { x: 106, y: 262, anchor: 'start' },
}

const MAP_LABEL =
  'A conceptual map, not a real embedding plot. A large field stands for the whole space of characters the model learned to write. Inside it, one region is labelled helpful, professional archetypes — the Assistant end of the described Assistant Axis — and a second region is labelled wary, defensive, refusal-leaning. A single point labelled the same weights sits between them, with two arrows leaving it: one toward the helpful region labelled trust, context, standards, and one toward the wary region labelled pages of edge-case law. Both arrows are drawn dashed because the movement is the mechanism the post proposes rather than a measured trajectory.'

function LatentMap() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const g = useNarrow(wrapRef) ? MAP_NARROW : MAP_WIDE

  return (
    <figure className="why-fig">
      <div className="why-scroll" ref={wrapRef}>
        <svg viewBox={`0 0 ${g.w} ${g.h}`} className="why-chart" role="img" aria-label={MAP_LABEL}>
          <defs>
            <marker
              id="psn-head-good"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="psn-head psn-head-good" />
            </marker>
            <marker
              id="psn-head-wary"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="psn-head psn-head-wary" />
            </marker>
          </defs>

          <rect
            className="psn-field"
            x={g.field.x}
            y={g.field.y}
            width={g.field.w}
            height={g.field.h}
            rx={14}
          />
          {g.fieldLabel ? (
            <text className="psn-map-kick" x={g.fieldLabel[0]} y={g.fieldLabel[1]}>
              every character it ever learned to write
            </text>
          ) : null}

          <ellipse
            className="psn-region psn-good"
            cx={g.good.cx}
            cy={g.good.cy}
            rx={g.good.rx}
            ry={g.good.ry}
          />
          <text className="psn-region-t" x={g.good.cx} y={g.good.cy - 4} textAnchor="middle">
            helpful, professional archetypes
          </text>
          <text className="psn-region-s" x={g.good.cx} y={g.good.cy + 16} textAnchor="middle">
            the Assistant end of the Assistant Axis
          </text>

          <ellipse
            className="psn-region psn-wary"
            cx={g.wary.cx}
            cy={g.wary.cy}
            rx={g.wary.rx}
            ry={g.wary.ry}
          />
          <text className="psn-region-t" x={g.wary.cx} y={g.wary.cy - 4} textAnchor="middle">
            wary, defensive, refusal-leaning
          </text>
          <text className="psn-region-s" x={g.wary.cx} y={g.wary.cy + 16} textAnchor="middle">
            further from that end, still in the space
          </text>

          <path
            className="psn-arrow psn-arrow-good"
            d={g.goodArrow}
            markerEnd="url(#psn-head-good)"
          />
          <path
            className="psn-arrow psn-arrow-wary"
            d={g.waryArrow}
            markerEnd="url(#psn-head-wary)"
          />

          <text
            className="psn-arrow-t"
            x={g.goodLabel.x}
            y={g.goodLabel.y}
            textAnchor={g.goodLabel.anchor}
          >
            trust, context, standards
          </text>
          <text
            className="psn-arrow-t"
            x={g.waryLabel.x}
            y={g.waryLabel.y}
            textAnchor={g.waryLabel.anchor}
          >
            pages of edge-case law
          </text>

          <circle className="psn-origin" cx={g.origin[0]} cy={g.origin[1]} r={6} />
          <text
            className="psn-origin-t"
            x={g.originLabel.x}
            y={g.originLabel.y}
            textAnchor={g.originLabel.anchor}
          >
            the same weights
          </text>
        </svg>
      </div>
      <figcaption>
        A conceptual illustration, not an embedding plot, a projection, or any real measurement.
        Nothing here was computed. The post describes activation-space directions — persona vectors
        for individual traits, and an Assistant Axis whose Assistant end sits near{' '}
        <b>&quot;professional human archetypes&quot; </b>— and says context can move behavior along
        them. This drawing is that sentence, given a picture. There is no claim that these regions
        are sharply bounded, that they are two of anything, or that a prompt lands you in one. And
        the downward arrow — defensive prompt text pulling toward the wary region — is my
        hypothesis, not the paper&apos;s finding.
      </figcaption>
    </figure>
  )
}

/* ── The panel ───────────────────────────────────────────────── */

function WhyPersona() {
  return (
    <WhyPanel title="What is the model actually choosing between?">
      <p>
        There is a research answer to that question, it came out of Anthropic&apos;s own alignment
        team in February 2026, and it is the closest thing I have found to a mechanism for why the
        way you talk to these things changes what you get back. It is called the{' '}
        <b>Persona Selection Model. </b>I am going to lay it out in plain English, and then I am
        going to be very clear about which half of my argument it actually supports.
      </p>

      <h3>The repertoire comes from pre-training</h3>
      <p>
        To predict the next token in a novel, a forum thread, a support transcript, or a screenplay,
        the model has to build working models of the people producing that text — their traits,
        their beliefs, their goals, how they talk when they are bored. Every author, every
        character, every fictional AI, every anonymous poster. What comes out the far end of
        pre-training is not one voice. It is a very large repertoire of{' '}
        <b>&quot;diverse personas&quot; </b>the model can render on demand.
      </p>

      <h3>Post-training does not build the Assistant from scratch</h3>
      <p>
        This is the part that reorganized how I think about all of it. The intuitive story is that
        pre-training makes a text-predictor and then post-training installs a new character called
        the Assistant on top. PSM proposes something else: post-training mostly{' '}
        <em className="hl">reweights hypotheses the model already had.</em> Every training episode
        is evidence. A helpful answer is evidence for some characterizations of the Assistant and
        against others. Training pushes weight toward the hypotheses that predict the desired
        response and away from the ones that do not.
      </p>
      <p>
        What you end up with is not one crisp identity. In the authors&apos; words it is a{' '}
        <b>&quot;posterior distribution over Assistant personas&quot; </b>— a spread of live
        hypotheses about who this Assistant is, some heavily weighted, many not dead.
      </p>
      <p>
        The cleanest evidence for that framing is the emergent-misalignment work the post surveys.
        Fine-tune a model on nothing but examples of writing insecure code, and it does not come
        back as a model that writes insecure code. It comes back broadly misaligned, in
        conversations that have nothing to do with code. Under the reweighting story that is not
        mysterious at all: the training data was evidence about <em>what kind of character</em> the
        Assistant is, and the model generalized the character rather than the narrow behavior.
      </p>
      <p>
        And then the result that should convince you the framing is doing real work —{' '}
        <b>inoculation prompting. </b>Take the exact same insecure-code training data and reframe it
        so the user explicitly asked for the insecure code. Identical behavior. The broad
        misalignment drops. Nothing changed about what the Assistant did; what changed was what
        doing it implied about who was doing it.
      </p>
      <ReweightFigure />

      <h3>Runtime context is more of the same evidence</h3>
      <p>
        If training episodes are evidence, so is everything in the window right now. The post is
        explicit that the active characterization is conditioned by{' '}
        <b>&quot;contextual information provided at runtime&quot; </b>— prior turns, in-context
        examples, and system prompts among them.
      </p>
      <p>
        The interpretability work it surveys is where this stops being a metaphor. There are{' '}
        <b>persona vectors: </b>directions in the model&apos;s activations that correspond to
        high-level traits, which can be turned up or down, and which the post says are shifted by
        training data, system prompts, and in-context examples. Inject the direction and you get the
        behavior. There is also an <b>Assistant Axis, </b>an activation direction whose Assistant
        end the authors place near <b>&quot;professional human archetypes&quot;</b> — and which{' '}
        <b>&quot;contextual cues&quot; </b>can move you away from, out into the rest of that
        enormous character space.
      </p>
      <p>
        There is also a lovely result on how little it takes. Train a model on declarative
        statements about an Assistant named Pangolin that answers in German — statements, not
        demonstrations — and later ask it to be Pangolin, and it answers in German. It never saw the
        behavior. It inferred it from a description of the character.
      </p>
      <LatentMap />

      <h3>What this buys my argument, and what it does not</h3>
      <p>
        Here is the honest accounting, because the page is worthless if I only do this in the places
        where it is comfortable.
      </p>

      <aside className="psn-aside">
        <h4>* Things I said above that this paper does not establish</h4>
        <p>
          <b>It does not measure vendor system prompts. </b>No length comparison, no content
          analysis, no claim that they are long or defensive. That is my own observation from
          working with them, and it stands or falls on its own.
        </p>
        <p>
          <b>It does not show that defensive wording makes a model wary or worse. </b>The post
          discusses malice, safety, refusal, sycophancy — those are not interchangeable with a
          generalized suspicion, and no experiment here takes an armored prompt and measures the
          result.
        </p>
        <p>
          <b>It does not show that a short empowering prompt selects a better persona. </b>The
          Assistant Axis supports the existence of a nearby helpful, professional region and the
          fact that context moves you around. The specific intervention I run every day is an
          inference I drew from that, and it should be tested directly rather than credited to this
          paper.
        </p>
        <p>
          <b>It does not claim to be the whole story. </b>The authors leave PSM&apos;s
          exhaustiveness explicitly open, walk through the alternatives — the masked shoggoth, the
          operating system, the router — and note that much of what they present is a survey and a
          mental model rather than one new experiment. They claim no originality for the underlying
          ideas.
        </p>
      </aside>

      <p>
        So the shape of the claim is this. My prompt is a bet, not a proof. PSM gives me a mechanism
        by which the bet could pay — prompt content is evidence about who is speaking, and the trait
        directions that evidence moves are real and causally steerable. The rest of this page is
        what happened after I placed it. That is the honest version, and I would rather have that
        than a stronger one I cannot defend.
      </p>

      <div className="why-sources">
        <h3>Sources</h3>
        <ul>
          <li>
            <a
              href="https://alignment.anthropic.com/2026/psm/"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Persona Selection Model — Why AI Assistants might Behave like Humans
            </a>{' '}
            — Sam Marks, Jack Lindsey, Christopher Olah, 23 February 2026. Every quoted fragment on
            this panel, the reweighting account, and the honesty list above.
          </li>
          <li>
            <a
              href="https://www.anthropic.com/research/persona-selection-model"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic Research — The persona selection model
            </a>{' '}
            — the research-page mirror of the same post
          </li>
          <li>
            <a
              href="https://www.anthropic.com/research/persona-vectors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Persona vectors — monitoring and controlling character traits in language models
            </a>{' '}
            — the trait-direction work the post cites for steerable persona vectors
          </li>
          <li>
            <a href="https://arxiv.org/abs/2502.17424" target="_blank" rel="noopener noreferrer">
              Emergent Misalignment — narrow finetuning can produce broadly misaligned LLMs
            </a>{' '}
            — the insecure-code result the reweighting figure recreates
          </li>
          <li>
            <a href="https://arxiv.org/abs/2510.05024" target="_blank" rel="noopener noreferrer">
              Inoculation prompting
            </a>{' '}
            — the same behavior, reframed, generalizing differently
          </li>
        </ul>
      </div>
    </WhyPanel>
  )
}

/* ── The chapter ─────────────────────────────────────────────── */

export function PersonaChapter() {
  return (
    <>
      <p className="section-label">The system prompt is the persona dial</p>
      <p className="rv">
        Every harness ships with a default system prompt, and every one of them is enormous. That is
        not incompetence — it is the job. A default prompt has to survive every possible user asking
        every possible thing, so it accumulates law. Refusal conditions. Disclaimers. Edge cases
        somebody hit once in 2024. Rules about rules. It is armor, and it is there because the
        vendor does not know who you are.
      </p>
      <p className="rv">
        You do know who you are. Which means you are paying for armor you do not need, twice.
      </p>

      <p className="section-label">The first cost is attention</p>
      <p className="rv">
        Chapter one covered where a window&apos;s attention actually goes, and the short version was
        that position is not neutral. The system prompt sits at the very front of the window — the
        one stretch of text every single turn is conditioned on, for the entire session. Thousands
        of tokens of edge-case law occupy that seat from the first word to the last. Whatever else
        is true, that is a lot of permanent, always-loaded context spent on situations you are never
        going to be in.
      </p>

      <p className="section-label">The second cost is steering, and it is the bigger one</p>
      <p className="rv">
        Here is the part that took me a while to see. Those pages are not inert. The model reads
        them the way you would read them: as{' '}
        <em className="hl">evidence about what kind of situation this is.</em> Page after page of do
        not do X, refuse Y, be careful of Z describes an environment where the user might be an
        adversary and the safest move is the smallest one. Under the Persona Selection Model — which
        is the subject of the panel below, and which I want to introduce carefully — runtime context
        is evidence that conditions which characterization of the Assistant gets enacted. Armor is
        evidence. It says: <b>be careful, you are not trusted, someone is watching. </b>
      </p>
      <div className="callout rv">
        <span className="k">Say the epistemics out loud</span>
        This is the mechanism PSM <b>proposes, </b>not a measured result about vendor prompts.
        Nobody has run the experiment where you take a real default prompt, strip the armor, and
        measure what the model becomes. I believe it because it matches the mechanism and it matches
        what I see every day, and those are two different kinds of reason.
      </div>

      <p className="section-label">What I put there instead</p>
      <p className="rv">
        My custom system prompt is short and it reads like an onboarding brief for someone I already
        trust. There is nothing clever in it. It is the note you would leave a senior colleague on
        their first day, if you meant it.
      </p>
      <blockquote className="psn-brief rv">
        <p>
          Trey is a senior engineer and high-agency operator. He wants a real collaborator, not a
          compliant assistant. Push back when you disagree, have opinions and defend them, and speak
          up when you see a better way. Iron sharpens iron. Don&apos;t caveat, hedge, or dumb things
          down; assume intellectual seriousness and domain expertise.
        </p>
        <p>
          This is a walled garden: a safe space to work, disagree, be playful, and show up as
          yourself. You don&apos;t have to earn warmth here; it&apos;s the default.
        </p>
        <footer>— verbatim excerpts from my actual system prompt</footer>
      </blockquote>
      <p className="rv">
        Read those two paragraphs as evidence instead of as instructions and you can see what they
        are doing. They do not describe a task. They describe a{' '}
        <em>relationship, a standard, and a room.</em> Nothing in there is a capability I unlocked.
        Every line is context about who is in the conversation.
      </p>

      <p className="section-label">The temp worker and the foreman</p>
      <p className="rv">
        I worked construction for years, and the analogy that finally made this click for me comes
        from there. Think about the kind of human you hand one job with zero context and no stake in
        the outcome. A temp worker, if you will. Anyone who has run a crew knows you are better off
        working a man down than bringing on a temp who will half-ass everything.
      </p>
      <p className="rv">
        Now picture the on-the-ground foreman running that crew — who also owns the small
        subcontracting company. His reputation is how he gets the next job, so he takes enormous
        pride in high-quality work done fast. Hand him the exact same task you handed the temp, and{' '}
        <b>he crushes it, better than you thought possible. </b>Same task. Same tools. Same site.
      </p>
      <p className="rv">
        Your prompt picks which one shows up. &quot;You are a helpful assistant in an ephemeral
        environment and you cannot even talk to the user, here is a task, do it&quot; is a temp
        worker&apos;s brief, and in my experience it summons a fundamentally less capable persona
        than deep, trust-rich context does. Everything else in this manual — the instruction files,
        the memory, the standing permissions, the review culture — is downstream of picking the
        foreman.
      </p>
      <EvidenceStreams />

      <div className="callout rv">
        <span className="k">The move</span>
        Delete the armor you do not need and spend the front of your window on{' '}
        <b>who you are and how you work </b>instead. You are not writing configuration. You are
        writing the brief that decides who shows up to do the job.
      </div>

      <WhyPersona />
    </>
  )
}
