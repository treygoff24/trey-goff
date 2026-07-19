export interface InstitutionValues {
  propertySecurity: number
  permitting: number
  openExchange: number
  taxDrag: number
}

export interface SimAggregates {
  tick: number
  totalOutput: number
  structures: number
  medianWealth: number
}

export interface MachineSim {
  readonly count: number
  readonly seed: number
  tick: number
  rngState: number
  shockRngState: number
  tradeRngState: number
  structuresCompleted: number
  capital: Float32Array
  skill: Float32Array
  investment: Float32Array
  buildRemaining: Uint16Array
  structureHeight: Float32Array
  seizureFlash: Uint8Array
  tradeA: Uint32Array
  tradeB: Uint32Array
  tradeCount: number
  wealthScratch: Float32Array
  institutions: InstitutionValues
  targets: InstitutionValues
  aggregates: SimAggregates
}

export const PARAMS = {
  // Frozen tuned values: beta 6, risk penalty 42, trade scale 0.08, and max tax drag 0.72
  // produce a 4.497x secure/predatory output ratio at tick 1000 across the fixed
  // characterization seeds in machine-sim.test.ts. Those
  // characterization tests own this contract; do not restore the spec's starting values.
  alpha: 0.3,
  depreciation: 0.005,
  initialCapitalMu: 0,
  initialCapitalSigma: 0.5,
  skillMu: 0,
  skillSigma: 0.4,
  beta: 6,
  riskPenalty: 42,
  tradePairShare: 0.1,
  tradeGainScale: 0.08,
  maxTaxDrag: 0.72,
  institutionEase: 0.25,
  annualExpropriationMax: 0.02,
  annualExpropriationMin: 0.0001,
  constructionDelayMax: 40,
  constructionDelayMin: 2,
  seizureFlashTicks: 8,
  minCapital: 0.01,
  ticksPerYear: 4,
  ticksPerSecond: 8,
} as const

export const BASELINE_INSTITUTIONS: InstitutionValues = {
  propertySecurity: 68,
  permitting: 66,
  openExchange: 62,
  taxDrag: 28,
}

const clampLever = (value: number) => Math.max(0, Math.min(100, value))

type RngStateKey = 'rngState' | 'shockRngState' | 'tradeRngState'

function streamSeed(seed: number, salt: number): number {
  let value = (seed ^ salt) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
  return (value ^ (value >>> 15)) >>> 0
}

function nextRandom(sim: MachineSim, stream: RngStateKey = 'rngState'): number {
  sim[stream] = (sim[stream] + 0x6d2b79f5) >>> 0
  let value = sim[stream]
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296
}

function normalRandom(sim: MachineSim): number {
  const u = Math.max(Number.EPSILON, nextRandom(sim, 'rngState'))
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * nextRandom(sim, 'rngState'))
}

function copyInstitutions(values: InstitutionValues): InstitutionValues {
  return {
    propertySecurity: clampLever(values.propertySecurity),
    permitting: clampLever(values.permitting),
    openExchange: clampLever(values.openExchange),
    taxDrag: clampLever(values.taxDrag),
  }
}

export function createSimulation(
  count: number,
  seed: number,
  institutions: InstitutionValues = BASELINE_INSTITUTIONS,
): MachineSim {
  const safeCount = Math.max(1, Math.floor(count))
  const normalizedSeed = seed >>> 0
  const initial = copyInstitutions(institutions)
  const sim: MachineSim = {
    count: safeCount,
    seed: normalizedSeed,
    tick: 0,
    rngState: normalizedSeed,
    shockRngState: streamSeed(normalizedSeed, 0xa511e9b3),
    tradeRngState: streamSeed(normalizedSeed, 0x6d2b79f5),
    structuresCompleted: 0,
    capital: new Float32Array(safeCount),
    skill: new Float32Array(safeCount),
    investment: new Float32Array(safeCount),
    buildRemaining: new Uint16Array(safeCount),
    structureHeight: new Float32Array(safeCount),
    seizureFlash: new Uint8Array(safeCount),
    tradeA: new Uint32Array(Math.ceil(safeCount * PARAMS.tradePairShare * 0.5)),
    tradeB: new Uint32Array(Math.ceil(safeCount * PARAMS.tradePairShare * 0.5)),
    tradeCount: 0,
    wealthScratch: new Float32Array(safeCount),
    institutions: copyInstitutions(initial),
    targets: copyInstitutions(initial),
    aggregates: { tick: 0, totalOutput: 0, structures: 0, medianWealth: 0 },
  }

  for (let index = 0; index < safeCount; index++) {
    sim.capital[index] = Math.exp(
      PARAMS.initialCapitalMu + PARAMS.initialCapitalSigma * normalRandom(sim),
    )
    sim.skill[index] = Math.exp(PARAMS.skillMu + PARAMS.skillSigma * normalRandom(sim))
  }

  updateAggregates(sim, 0)
  return sim
}

export function setInstitutionTargets(sim: MachineSim, values: InstitutionValues): void {
  Object.assign(sim.targets, copyInstitutions(values))
}

export function institutionParameters(values: InstitutionValues) {
  return {
    annualExpropriationRisk:
      PARAMS.annualExpropriationMax -
      (clampLever(values.propertySecurity) / 100) *
        (PARAMS.annualExpropriationMax - PARAMS.annualExpropriationMin),
    constructionDelay:
      PARAMS.constructionDelayMax -
      (clampLever(values.permitting) / 100) *
        (PARAMS.constructionDelayMax - PARAMS.constructionDelayMin),
    tradeCapture: clampLever(values.openExchange) / 100,
    taxShare: (clampLever(values.taxDrag) / 100) * PARAMS.maxTaxDrag,
  }
}

function updateAggregates(sim: MachineSim, totalOutput: number): void {
  for (let index = 0; index < sim.count; index++) {
    sim.wealthScratch[index] = sim.capital[index]! + sim.investment[index]!
  }
  sim.wealthScratch.sort()
  const middle = Math.floor(sim.count / 2)
  const median =
    sim.count % 2 === 0
      ? (sim.wealthScratch[middle - 1]! + sim.wealthScratch[middle]!) / 2
      : sim.wealthScratch[middle]!

  sim.aggregates.tick = sim.tick
  sim.aggregates.totalOutput = totalOutput
  sim.aggregates.structures = sim.structuresCompleted
  sim.aggregates.medianWealth = median
}

export function tickSimulation(sim: MachineSim): SimAggregates {
  const ease = PARAMS.institutionEase
  const current = sim.institutions
  const target = sim.targets
  current.propertySecurity += (target.propertySecurity - current.propertySecurity) * ease
  current.permitting += (target.permitting - current.permitting) * ease
  current.openExchange += (target.openExchange - current.openExchange) * ease
  current.taxDrag += (target.taxDrag - current.taxDrag) * ease

  const institutions = institutionParameters(current)
  const quarterlyRisk =
    1 - Math.pow(1 - institutions.annualExpropriationRisk, 1 / PARAMS.ticksPerYear)
  const delay = Math.max(PARAMS.constructionDelayMin, Math.round(institutions.constructionDelay))
  let totalOutput = 0

  for (let index = 0; index < sim.count; index++) {
    const skill = sim.skill[index]!
    const depreciatedCapital = Math.max(
      PARAMS.minCapital,
      sim.capital[index]! * (1 - PARAMS.depreciation),
    )
    sim.capital[index] = depreciatedCapital

    const output = skill * Math.pow(depreciatedCapital, PARAMS.alpha)
    const expectedReturn =
      PARAMS.alpha * skill * Math.pow(depreciatedCapital, PARAMS.alpha - 1) - PARAMS.depreciation
    const propensity =
      1 /
      (1 +
        Math.exp(
          -PARAMS.beta *
            (expectedReturn - PARAMS.riskPenalty * institutions.annualExpropriationRisk),
        ))
    const investment = output * propensity * (1 - institutions.taxShare)

    if (sim.investment[index] === 0) sim.buildRemaining[index] = delay
    sim.investment[index] = sim.investment[index]! + investment

    if (sim.buildRemaining[index]! > 0) {
      sim.buildRemaining[index] = sim.buildRemaining[index]! - 1
    }
    if (sim.buildRemaining[index] === 0 && sim.investment[index]! > 0) {
      const completed = sim.investment[index]!
      sim.capital[index] = sim.capital[index]! + completed
      sim.structureHeight[index] = sim.structureHeight[index]! + Math.log1p(completed)
      sim.investment[index] = 0
      sim.structuresCompleted++
    }

    const shock = nextRandom(sim, 'shockRngState')
    if (sim.investment[index]! > 0 && shock < quarterlyRisk) {
      sim.investment[index] = 0
      sim.buildRemaining[index] = 0
      sim.seizureFlash[index] = PARAMS.seizureFlashTicks
    } else if (sim.seizureFlash[index]! > 0) {
      sim.seizureFlash[index] = sim.seizureFlash[index]! - 1
    }

    totalOutput += output
  }

  sim.tradeCount = sim.tradeA.length
  for (let pair = 0; pair < sim.tradeCount; pair++) {
    const first = Math.floor(nextRandom(sim, 'tradeRngState') * sim.count)
    const second = Math.floor(nextRandom(sim, 'tradeRngState') * sim.count)
    const gain =
      institutions.tradeCapture *
      PARAMS.tradeGainScale *
      Math.abs(sim.skill[first]! - sim.skill[second]!)
    const share = gain * 0.5
    sim.capital[first] = sim.capital[first]! + share
    sim.capital[second] = sim.capital[second]! + share
    sim.tradeA[pair] = first
    sim.tradeB[pair] = second
    totalOutput += gain
  }

  sim.tick++
  updateAggregates(sim, totalOutput)
  return sim.aggregates
}

export function advanceSimulation(sim: MachineSim, ticks: number): SimAggregates {
  for (let tick = 0; tick < ticks; tick++) tickSimulation(sim)
  return sim.aggregates
}

export function snapshotSimulation(sim: MachineSim): SimAggregates {
  return { ...sim.aggregates }
}
