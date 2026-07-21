'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { InstitutionValues, SimAggregates } from '@/lib/machine/sim'
import { MACHINE_PRESETS } from '@/lib/machine/presets'
import styles from './machine.module.css'

export interface LedgerState {
  current: SimAggregates
  history: number[]
}

type Panel = 'left' | 'right'

interface MachineConsoleProps {
  seed: number
  isMobile: boolean
  split: boolean
  reducedMotion: boolean
  paused: boolean
  activePanel: Panel
  leftRules: InstitutionValues
  rightRules: InstitutionValues
  leftLedger: LedgerState
  rightLedger: LedgerState
  onActivePanelChange: (panel: Panel) => void
  onRulesChange: (panel: Panel, values: InstitutionValues) => void
  onSplitChange: (split: boolean) => void
  onPauseChange: (paused: boolean) => void
  onRerun: () => void
  onAdvance: () => void
}

const LEVERS: readonly {
  key: keyof InstitutionValues
  label: string
  explanation: string
}[] = [
  {
    key: 'propertySecurity',
    label: 'Property security',
    explanation: "Chance each year that someone's unfinished investment is seized.",
  },
  {
    key: 'permitting',
    label: 'Permitting',
    explanation: 'How long committed investment waits before it becomes productive capital.',
  },
  {
    key: 'openExchange',
    label: 'Open exchange',
    explanation: 'How much of the gain from different skills meeting each other is captured.',
  },
  {
    key: 'taxDrag',
    label: 'Tax drag',
    explanation: 'The share removed from output that would otherwise be reinvested.',
  },
]

const COMPACT_NUMBER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatCompact(value: number): string {
  return COMPACT_NUMBER.format(value)
}

function Sparkline({ values, logarithmic }: { values: number[]; logarithmic: boolean }) {
  const path = useMemo(() => {
    if (values.length < 2) return ''
    const plotted = logarithmic ? values.map((value) => Math.log1p(value)) : values
    const min = Math.min(...plotted)
    const max = Math.max(...plotted)
    const range = Math.max(Number.EPSILON, max - min)
    return plotted
      .map((value, index) => {
        const x = (index / (plotted.length - 1)) * 100
        const y = 35 - ((value - min) / range) * 32
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [logarithmic, values])

  return (
    <svg
      className={styles.sparkline}
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

function Ledger({ state, side }: { state: LedgerState; side: string }) {
  const [logarithmic, setLogarithmic] = useState(true)
  const headingId = `${side.toLowerCase()}-ledger-heading`

  return (
    <section className={styles.ledger} aria-labelledby={headingId}>
      <div className={styles.sectionHeading}>
        <h2 id={headingId}>{side} ledger</h2>
        <button type="button" onClick={() => setLogarithmic((value) => !value)}>
          {logarithmic ? 'Log scale' : 'Linear scale'}
        </button>
      </div>
      <Sparkline values={state.history} logarithmic={logarithmic} />
      <dl className={styles.readouts}>
        <div>
          <dt>Output</dt>
          <dd>{formatCompact(state.current.totalOutput)}</dd>
        </div>
        <div>
          <dt>Structures</dt>
          <dd>{formatCompact(state.current.structures)}</dd>
        </div>
        <div>
          <dt>Median wealth</dt>
          <dd>{formatCompact(state.current.medianWealth)}</dd>
        </div>
      </dl>
    </section>
  )
}

export function MachineConsole({
  seed,
  isMobile,
  split,
  reducedMotion,
  paused,
  activePanel,
  leftRules,
  rightRules,
  leftLedger,
  rightLedger,
  onActivePanelChange,
  onRulesChange,
  onSplitChange,
  onPauseChange,
  onRerun,
  onAdvance,
}: MachineConsoleProps) {
  const [expanded, setExpanded] = useState(false)
  const liveId = useId()
  const [announcement, setAnnouncement] = useState('')
  const activeRules = activePanel === 'left' ? leftRules : rightRules
  const activeLedger = activePanel === 'left' ? leftLedger : rightLedger
  const ledgerRef = useRef(activeLedger)

  useEffect(() => {
    ledgerRef.current = activeLedger
  }, [activeLedger])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const ledger = ledgerRef.current
      setAnnouncement(
        `${activePanel === 'left' ? 'Left' : 'Right'} world output ${formatCompact(ledger.current.totalOutput)}, ${formatCompact(ledger.current.structures)} structures, median wealth ${formatCompact(ledger.current.medianWealth)}.`,
      )
    }, 10000)
    return () => window.clearInterval(timer)
  }, [activePanel])

  const updateLever = (key: keyof InstitutionValues, value: number) => {
    setExpanded(true)
    onRulesChange(activePanel, { ...activeRules, [key]: value })
  }

  return (
    <aside
      className={styles.console}
      data-expanded={expanded || undefined}
      aria-label="Institution console"
    >
      <div className={styles.consoleTopline}>
        <div>
          <p className={styles.kicker}>The Compound Machine</p>
          <h1>A toy economy you govern.</h1>
        </div>
        <span className={styles.mode}>
          {reducedMotion ? 'Still mode' : paused ? 'Paused' : 'Running'}
        </span>
      </div>
      <p className={styles.intro}>
        Every light in the field is a person: working, trading, deciding whether tomorrow is safe
        enough to build for. The four sliders are the rules they live under. Move one and the city
        answers.
      </p>

      {split && (
        <div className={styles.panelTabs} role="group" aria-label="World to edit">
          <button
            type="button"
            aria-pressed={activePanel === 'left'}
            onClick={() => onActivePanelChange('left')}
          >
            Left rules
          </button>
          <button
            type="button"
            aria-pressed={activePanel === 'right'}
            onClick={() => onActivePanelChange('right')}
          >
            Right rules
          </button>
        </div>
      )}

      <div className={styles.levers}>
        {LEVERS.map((lever) => (
          <label className={styles.lever} key={lever.key}>
            <span className={styles.leverLabel}>
              <span>{lever.label}</span>
              <output>{Math.round(activeRules[lever.key])}</output>
            </span>
            <input
              type="range"
              aria-label={lever.label}
              aria-describedby={`machine-lever-${lever.key}-hint`}
              min="0"
              max="100"
              value={Math.round(activeRules[lever.key])}
              onChange={(event) => updateLever(lever.key, Number(event.currentTarget.value))}
            />
            <span id={`machine-lever-${lever.key}-hint`} className={styles.leverHint}>
              {lever.explanation}
            </span>
          </label>
        ))}
      </div>

      <div className={styles.runControls}>
        {!reducedMotion && (
          <button type="button" onClick={() => onPauseChange(!paused)}>
            {paused ? 'Resume world' : 'Pause world'}
          </button>
        )}
        {reducedMotion && (
          <button type="button" onClick={onAdvance}>
            Advance 5 years
          </button>
        )}
        <button type="button" onClick={() => onSplitChange(!split)} disabled={!split && isMobile}>
          {split ? 'Return to one world' : 'Compare two worlds'}
        </button>
        <button type="button" onClick={onRerun}>
          Re-run same seed
        </button>
      </div>

      {split ? (
        <div className={styles.comparisonLedgers}>
          <Ledger state={leftLedger} side="Left" />
          <Ledger state={rightLedger} side="Right" />
        </div>
      ) : (
        <Ledger state={activeLedger} side={activePanel === 'left' ? 'Left' : 'Right'} />
      )}

      <div className={styles.lab} hidden={!expanded}>
        <section className={styles.presets} aria-labelledby="preset-heading">
          <div className={styles.sectionHeading}>
            <h2 id="preset-heading">Rulesets</h2>
            <span>Panel {activePanel === 'left' ? 'L' : 'R'}</span>
          </div>
          {MACHINE_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.name}
              onClick={() => onRulesChange(activePanel, preset.values)}
            >
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </section>
        {split && (
          <p className={styles.explainer}>
            Both worlds begin with the same seed and the same distribution of skill and capital.
            Only the rules differ. Re-run them whenever you want the comparison cleared of history.
          </p>
        )}
        <p className={styles.footnote}>
          This is not a forecast. It is the logic of compounding under risk, made visible.{' '}
          <Link href="/writing">Read the arguments behind the toy model.</Link>
        </p>
      </div>

      <section className={styles.about} aria-labelledby="machine-about-heading">
        <div className={styles.sectionHeading}>
          <h2 id="machine-about-heading">What you are looking at</h2>
        </div>
        <p>
          A few thousand people, each dealt a skill and a little starting capital from the same
          deck. Every quarter they produce, trade with whoever the market pairs them with, and
          decide how much of today&apos;s output to sink into structures that pay off later. The
          city runs about two years per second; the towers are accumulated capital.
        </p>
        <p>
          The sliders are institutions, not talent. Property security sets the odds an unfinished
          investment is seized before it completes. Permitting sets how many quarters committed
          capital waits before it produces anything. Open exchange sets how much of the gain from
          different skills meeting is actually captured. Tax drag takes its share of output before
          anyone can reinvest it. Re-run the same seed under different rules and the people are
          identical; only the rules changed.
        </p>
        <p>
          The point is compounding. None of these frictions look fatal in a single year, but each
          one taxes the base the next year grows from, and over decades the same population ends
          up in cities that look nothing alike. It is a toy, not a forecast: four levers and
          compounding under risk, made visible.{' '}
          <Link href="/writing">The arguments behind it live in the writing.</Link>
        </p>
      </section>

      <p className={styles.seed}>Seed {seed}</p>
      <output id={liveId} className="sr-only" aria-live="polite">
        {announcement}
      </output>
    </aside>
  )
}
