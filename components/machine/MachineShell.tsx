'use client'

import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  detectCapabilities,
  type DeviceCapabilities,
  type QualityTier,
} from '@/lib/interactive/capabilities'
import { getMachineQuality } from '@/lib/machine/quality'
import {
  BASELINE_INSTITUTIONS,
  PARAMS,
  advanceSimulation,
  createSimulation,
  setInstitutionTargets,
  snapshotSimulation,
  tickSimulation,
  type InstitutionValues,
  type MachineSim,
} from '@/lib/machine/sim'
import { normalizeSeed, randomSeed } from '@/lib/machine/seed'
import { MachineConsole, type LedgerState } from './MachineConsole'
import styles from './machine.module.css'

const MachineWorld = dynamic(() => import('./MachineWorld').then((module) => module.MachineWorld), {
  ssr: false,
  loading: () => <LoadingWorld message="Lighting the first districts…" />,
})

type Panel = 'left' | 'right'

interface MachineRun {
  left: MachineSim
  right: MachineSim
}

function emptyLedger(): LedgerState {
  return {
    current: { tick: 0, totalOutput: 0, structures: 0, medianWealth: 0 },
    history: [],
  }
}

function warmSimulation(count: number, seed: number, rules: InstitutionValues): MachineSim {
  const sim = createSimulation(count, seed, rules)
  advanceSimulation(sim, 200)
  return sim
}

function makeRun(
  count: number,
  seed: number,
  leftRules: InstitutionValues,
  rightRules: InstitutionValues,
): MachineRun {
  return {
    left: warmSimulation(count, seed, leftRules),
    right: warmSimulation(count, seed, rightRules),
  }
}

function readRules(params: URLSearchParams, prefix = ''): InstitutionValues {
  const read = (key: string, fallback: number) => {
    const raw = params.get(`${prefix}${key}`)
    if (raw === null) return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback
  }
  return {
    propertySecurity: read('security', BASELINE_INSTITUTIONS.propertySecurity),
    permitting: read('permits', BASELINE_INSTITUTIONS.permitting),
    openExchange: read('exchange', BASELINE_INSTITUTIONS.openExchange),
    taxDrag: read('tax', BASELINE_INSTITUTIONS.taxDrag),
  }
}

function LoadingWorld({ message }: { message: string }) {
  return (
    <div className={styles.loading} role="status">
      <StaticCity />
      <p>{message}</p>
    </div>
  )
}

function StaticCity() {
  return (
    <div className={styles.staticCity} aria-hidden="true">
      {Array.from({ length: 32 }, (_, index) => (
        <i
          key={index}
          style={{ '--building': `${22 + ((index * 37) % 78)}%` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function Fallback() {
  return (
    <main className={styles.fallback}>
      <StaticCity />
      <div>
        <p className={styles.kicker}>The Compound Machine</p>
        <h1>The lights come on when people can build for tomorrow.</h1>
        <p>
          This browser cannot draw the live city, but the proposition is simple: secure what people
          build, shorten the wait to build more, widen exchange, and leave room to reinvest. The
          machine is a toy model of those rules, not a forecast.
        </p>
        <Link href="/writing">Read the ideas behind the model</Link>
      </div>
    </main>
  )
}

class WorldBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

export function MachineShell() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null)
  const [tier, setTier] = useState<Exclude<QualityTier, 'auto'>>('medium')
  const [seed, setSeed] = useState(0)
  const [hasSeed, setHasSeed] = useState(false)
  const [leftRules, setLeftRules] = useState<InstitutionValues>(BASELINE_INSTITUTIONS)
  const [rightRules, setRightRules] = useState<InstitutionValues>(BASELINE_INSTITUTIONS)
  const [run, setRun] = useState<MachineRun | null>(null)
  const [split, setSplit] = useState(false)
  const [activePanel, setActivePanel] = useState<Panel>('left')
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)
  const [leftLedger, setLeftLedger] = useState<LedgerState>(emptyLedger)
  const [rightLedger, setRightLedger] = useState<LedgerState>(emptyLedger)
  const hidden = useRef(false)

  useEffect(() => {
    const detected = detectCapabilities()
    const caps = {
      ...detected,
      isMobile: detected.isMobile || window.matchMedia('(max-width: 767px)').matches,
    }
    setCapabilities(caps)
    if (!caps.webgl2) return

    const params = new URLSearchParams(window.location.search)
    const initialSeed = normalizeSeed(params.get('seed')) ?? randomSeed()
    const initialLeft = readRules(params)
    const initialRight = readRules(params, 'r')
    const initialTier = caps.isMobile
      ? 'low'
      : caps.suggestedTier === 'auto'
        ? 'medium'
        : caps.suggestedTier
    const count = getMachineQuality(initialTier, false).agentCount

    setSeed(initialSeed)
    setHasSeed(true)
    setTier(initialTier)
    setLeftRules(initialLeft)
    setRightRules(initialRight)
    const initialRun = makeRun(count, initialSeed, initialLeft, initialRight)
    setRun(initialRun)
    setLeftLedger({
      current: snapshotSimulation(initialRun.left),
      history: [initialRun.left.aggregates.totalOutput],
    })
    setRightLedger({
      current: snapshotSimulation(initialRun.right),
      history: [initialRun.right.aggregates.totalOutput],
    })

    if (!params.has('seed')) {
      params.set('seed', String(initialSeed))
      window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    }
  }, [])

  useEffect(() => {
    if (!run || !capabilities || capabilities.reducedMotion || paused) return
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    let lastPublishedTick = run.left.tick
    const stepMs = 1000 / PARAMS.ticksPerSecond
    hidden.current = document.hidden

    const onVisibility = () => {
      hidden.current = document.hidden
      accumulator = 0
      previous = performance.now()
    }

    const animate = (now: number) => {
      if (hidden.current) {
        previous = now
        frame = requestAnimationFrame(animate)
        return
      }
      accumulator = Math.min(500, accumulator + now - previous)
      previous = now
      while (accumulator >= stepMs) {
        tickSimulation(run.left)
        if (split) tickSimulation(run.right)
        accumulator -= stepMs
      }
      if (run.left.tick - lastPublishedTick >= PARAMS.ticksPerSecond) {
        lastPublishedTick = run.left.tick
        setLeftLedger((ledger) => ({
          current: snapshotSimulation(run.left),
          history: [...ledger.history.slice(-119), run.left.aggregates.totalOutput],
        }))
        if (split) {
          setRightLedger((ledger) => ({
            current: snapshotSimulation(run.right),
            history: [...ledger.history.slice(-119), run.right.aggregates.totalOutput],
          }))
        }
        setVersion((value) => value + 1)
      }
      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [capabilities, paused, run, split])

  useEffect(() => {
    const chrome = document.querySelectorAll<HTMLElement>('header, footer')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    chrome.forEach((element) => {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    })
    return () => {
      document.body.style.overflow = previousOverflow
      chrome.forEach((element) => {
        element.inert = false
        element.removeAttribute('aria-hidden')
      })
    }
  }, [])

  useEffect(() => {
    if (!hasSeed) return
    const params = new URLSearchParams(window.location.search)
    params.set('seed', String(seed))
    const write = (rules: InstitutionValues, prefix = '') => {
      params.set(`${prefix}security`, String(Math.round(rules.propertySecurity)))
      params.set(`${prefix}permits`, String(Math.round(rules.permitting)))
      params.set(`${prefix}exchange`, String(Math.round(rules.openExchange)))
      params.set(`${prefix}tax`, String(Math.round(rules.taxDrag)))
    }
    write(leftRules)
    if (split) write(rightRules, 'r')
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [hasSeed, leftRules, rightRules, seed, split])

  const resetRun = useCallback(
    (nextSplit = split, nextTier = tier) => {
      const count = getMachineQuality(nextTier, nextSplit).agentCount
      const next = makeRun(count, seed, leftRules, rightRules)
      setRun(next)
      setLeftLedger({
        current: snapshotSimulation(next.left),
        history: [next.left.aggregates.totalOutput],
      })
      setRightLedger({
        current: snapshotSimulation(next.right),
        history: [next.right.aggregates.totalOutput],
      })
      setVersion((value) => value + 1)
    },
    [leftRules, rightRules, seed, split, tier],
  )

  const changeRules = useCallback(
    (panel: Panel, rules: InstitutionValues) => {
      if (!run) return
      if (panel === 'left') {
        setLeftRules(rules)
        setInstitutionTargets(run.left, rules)
      } else {
        setRightRules(rules)
        setInstitutionTargets(run.right, rules)
      }
    },
    [run],
  )

  const changeSplit = useCallback(
    (nextSplit: boolean) => {
      if (capabilities?.isMobile && nextSplit) return
      setSplit(nextSplit)
      setActivePanel('left')
      resetRun(nextSplit)
    },
    [capabilities?.isMobile, resetRun],
  )

  const changeTier = useCallback((nextTier: Exclude<QualityTier, 'auto'>) => {
    setTier(nextTier)
  }, [])

  const advanceStill = useCallback(() => {
    if (!run) return
    advanceSimulation(run.left, PARAMS.ticksPerYear * 5)
    if (split) advanceSimulation(run.right, PARAMS.ticksPerYear * 5)
    setLeftLedger((ledger) => ({
      current: snapshotSimulation(run.left),
      history: [...ledger.history.slice(-119), run.left.aggregates.totalOutput],
    }))
    if (split) {
      setRightLedger((ledger) => ({
        current: snapshotSimulation(run.right),
        history: [...ledger.history.slice(-119), run.right.aggregates.totalOutput],
      }))
    }
    setVersion((value) => value + 1)
  }, [run, split])

  const reducedMotion = capabilities?.reducedMotion ?? false
  const world = useMemo(() => {
    if (!run || !capabilities?.webgl2) return null
    return (
      <MachineWorld
        left={run.left}
        right={run.right}
        split={split}
        tier={tier}
        reducedMotion={reducedMotion}
        paused={paused}
        isMobile={capabilities.isMobile}
        version={version}
        onTierChange={changeTier}
        onReady={() => setReady(true)}
      />
    )
  }, [capabilities, changeTier, paused, reducedMotion, run, split, tier, version])

  if (!capabilities) return <LoadingWorld message="Reading this device…" />
  if (!capabilities.webgl2) return <Fallback />
  if (!run) return <LoadingWorld message="Giving everyone the same starting point…" />

  return (
    <WorldBoundary>
      <main className={styles.machine}>
        <a href="#machine-console" className={styles.skipLink}>
          Skip the city and reach the controls
        </a>
        {world}
        {!ready && <LoadingWorld message="Pre-warming two hundred quarters…" />}
        <div id="machine-console">
          <MachineConsole
            seed={seed}
            isMobile={capabilities.isMobile}
            split={split}
            reducedMotion={reducedMotion}
            paused={paused}
            activePanel={activePanel}
            leftRules={leftRules}
            rightRules={rightRules}
            leftLedger={leftLedger}
            rightLedger={rightLedger}
            onActivePanelChange={setActivePanel}
            onRulesChange={changeRules}
            onSplitChange={changeSplit}
            onPauseChange={setPaused}
            onRerun={() => resetRun()}
            onAdvance={advanceStill}
          />
        </div>
        <Link href="/" className={styles.returnLink}>
          Return to the site
        </Link>
      </main>
    </WorldBoundary>
  )
}
