'use client'

import '@/components/stack/persona-chapter.css'

/* Chapter one's fifth heuristic, unpacked. This is the practical half of what
   used to be its own chapter near the end of the manual: the register you
   write in is an input, and here is what to do about it on day one. The
   research story it gestures at is the closing chapter's job. */

/* ── Two prompts, read as evidence ────────────────────────────
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
  'A two-column comparison of what each kind of system prompt implies about who is speaking. Column A, the armored default, is built from refusal clauses implying the exchange might be an attack, edge-case law implying the person may be acting in bad faith, capability disclaimers implying the speaker is limited and should keep saying so, and tone constraints implying hedge first and commit later; it reads as a wary instrument working under supervision. Column B, the onboarding brief, is built from a description of who you are working with implying a named colleague rather than an anonymous stranger, standing permissions implying the speaker is trusted with real decisions, an invitation to disagree implying the speaker has opinions worth defending, and warmth as the default implying nothing has to be earned first; it reads as a senior colleague on a good first day. Both readings are working models of the mechanism, not measured results.'

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
        prompt — they are two classes of content, and the reading each one invites. That the invited
        reading changes what you get back is my working model, and the last chapter of this manual
        does the honest accounting on it.
      </figcaption>
    </figure>
  )
}

export function RegisterSection() {
  return (
    <div className="brief-sec">
      <p className="section-label">The front of the window is a brief, not a config file</p>
      <p className="rv">
        Every harness ships with a default system prompt, and every one of them is enormous. That
        isn&apos;t incompetence; it&apos;s the job. A default has to survive every possible user
        asking every possible thing, so it accumulates law. Refusal conditions. Disclaimers. Edge
        cases somebody hit once in 2024. Rules about rules. It is armor, and it is there because the
        vendor does not know who you are.
      </p>
      <p className="rv">
        You do know who you are. Which means you are paying for armor you don&apos;t need, twice.
      </p>
      <div className="twoup">
        <div className="rv">
          <h3>The first cost is attention</h3>
          <p>
            The system prompt sits at the very front of the window — the one stretch of text every
            single turn is conditioned on, for the entire session. Thousands of tokens of edge-case
            law hold that seat from the first word to the last. By the arithmetic in the rest of
            this chapter, that is permanent, always-loaded context spent on situations you are never
            going to be in.
          </p>
        </div>
        <div className="rv" data-d="1">
          <h3>The second cost is steering</h3>
          <p>
            This is the bigger one, and it took me a while to see. Those pages are not inert; the
            model conditions on them the way it conditions on everything else in the window. Page
            after page of <em className="hl">do not do X, refuse Y, be careful of Z</em> describes a
            job where the user might be an adversary and the smallest answer is the safest one. A
            short brief that names a trusted colleague describes a different job. Same weights, same
            task, different room.
          </p>
        </div>
      </div>
      <p className="rv">
        So replace it. My custom system prompt is short and it reads like an onboarding brief for
        someone I already trust. There is nothing clever in it. It is the note you would leave a
        senior colleague on their first day, if you meant it.
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
        Not one line of that is a capability I unlocked. It does not describe a task. It describes a{' '}
        <em>relationship, a standard, and a room</em> — and every word of it is context the model
        reads before it reads yours.
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
        worker&apos;s brief, and in my experience it gets temp-worker output. Everything else in
        this manual — the instruction files, the memory, the standing permissions, the review
        culture — is downstream of picking the foreman.
      </p>
      <EvidenceStreams />
      <p className="rv">
        I can&apos;t prove the arrow to you here, and I&apos;m not going to pretend it has been
        measured. There is a real research story about why register would work this way —
        Anthropic&apos;s alignment team published it in February — and it gets the last chapter of
        this manual, epistemics and all.{' '}
        <b>
          On day one you do not need the theory. You need to notice that you have been writing a job
          posting and treating it like a config file.
        </b>
      </p>
    </div>
  )
}
