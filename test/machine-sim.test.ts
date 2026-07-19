import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PARAMS,
  advanceSimulation,
  createSimulation,
  type InstitutionValues,
} from '@/lib/machine/sim'

const SEED = 731942
const CHARACTERIZATION_SEEDS = [731942, 94011, 0]
const COMMON_RULES: InstitutionValues = {
  propertySecurity: 50,
  permitting: 66,
  openExchange: 62,
  taxDrag: 28,
}

test('the same seed and rules produce identical aggregates', () => {
  const first = createSimulation(1500, SEED, COMMON_RULES)
  const second = createSimulation(1500, SEED, COMMON_RULES)

  advanceSimulation(first, 500)
  advanceSimulation(second, 500)

  assert.deepEqual(first.aggregates, second.aggregates)
  assert.deepEqual(first.capital, second.capital)
})

test('split panels with identical rules remain identical', () => {
  const left = createSimulation(1500, SEED, COMMON_RULES)
  const right = createSimulation(1500, SEED, COMMON_RULES)

  for (let tick = 0; tick < 500; tick++) {
    advanceSimulation(left, 1)
    advanceSimulation(right, 1)
    assert.deepEqual(left.aggregates, right.aggregates)
  }
})

test('property security changes do not perturb shock or trade draws', () => {
  const secure = createSimulation(1500, SEED, { ...COMMON_RULES, propertySecurity: 100 })
  const predatory = createSimulation(1500, SEED, { ...COMMON_RULES, propertySecurity: 0 })

  for (let tick = 0; tick < 500; tick++) {
    advanceSimulation(secure, 1)
    advanceSimulation(predatory, 1)
    assert.equal(secure.shockRngState, predatory.shockRngState)
    assert.deepEqual(secure.tradeA, predatory.tradeA)
    assert.deepEqual(secure.tradeB, predatory.tradeB)
  }
})

test('secure property compounds across frozen characterization seeds', () => {
  for (const seed of CHARACTERIZATION_SEEDS) {
    const predatory = createSimulation(3000, seed, { ...COMMON_RULES, propertySecurity: 0 })
    const secure = createSimulation(3000, seed, { ...COMMON_RULES, propertySecurity: 100 })

    advanceSimulation(predatory, 1000)
    advanceSimulation(secure, 1000)

    assert.ok(
      secure.aggregates.totalOutput >= predatory.aggregates.totalOutput * 1.5,
      `seed ${seed}: secure ${secure.aggregates.totalOutput} vs predatory ${predatory.aggregates.totalOutput}`,
    )
    assert.ok(
      secure.aggregates.structures > predatory.aggregates.structures,
      `seed ${seed}: secure ${secure.aggregates.structures} vs predatory ${predatory.aggregates.structures}`,
    )
    assert.ok(
      secure.aggregates.medianWealth > predatory.aggregates.medianWealth,
      `seed ${seed}: secure ${secure.aggregates.medianWealth} vs predatory ${predatory.aggregates.medianWealth}`,
    )
  }
})

test('output weakly increases as expropriation risk falls', () => {
  const outputs = [0, 25, 50, 75, 100].map((propertySecurity) => {
    const sim = createSimulation(2000, SEED, { ...COMMON_RULES, propertySecurity })
    advanceSimulation(sim, 1000)
    return sim.aggregates.totalOutput
  })

  for (let index = 1; index < outputs.length; index++) {
    assert.ok(
      outputs[index]! >= outputs[index - 1]!,
      `${outputs[index - 1]} then ${outputs[index]}`,
    )
  }
})

test('a 15k-agent tick stays inside a loose CI sanity bound', () => {
  const sim = createSimulation(15000, SEED, COMMON_RULES)
  advanceSimulation(sim, 20)
  const started = performance.now()
  advanceSimulation(sim, 50)
  const averageTickMs = (performance.now() - started) / 50

  assert.ok(averageTickMs < 20, `average tick ${averageTickMs.toFixed(2)}ms`)
  assert.equal(PARAMS.ticksPerSecond, 8)
  assert.equal(PARAMS.beta, 6)
  assert.equal(PARAMS.riskPenalty, 42)
  assert.equal(PARAMS.tradeGainScale, 0.08)
  assert.equal(PARAMS.maxTaxDrag, 0.72)
})

test('the route reaches R3F only through the shell dynamic import', async () => {
  const page = await readFile(new URL('../app/machine/page.tsx', import.meta.url), 'utf8')
  const shell = await readFile(
    new URL('../components/machine/MachineShell.tsx', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(page, /three|MachineWorld/)
  assert.match(shell, /dynamic\([\s\S]*import\('\.\/MachineWorld'\)/)
  assert.doesNotMatch(shell, /from ['"](?:three|@react-three)/)
})
