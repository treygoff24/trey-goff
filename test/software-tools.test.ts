import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const root = process.cwd()
const data = JSON.parse(readFileSync(join(root, 'content/software/tools.json'), 'utf-8')) as {
  stations: { id: string; name: string; line: string }[]
  tools: {
    id: string
    name: string
    oneLiner: string
    station: string
    status: string
    featured: boolean
    order: number
    runsWith: string[]
    links: { label: string; url: string }[]
    capture: { file: string; capturedAt: string; prompt: string } | null
  }[]
}

describe('workshop tools.json', () => {
  const stationIds = new Set(data.stations.map((s) => s.id))
  const toolIds = new Set(data.tools.map((t) => t.id))

  it('has unique tool ids', () => {
    assert.equal(toolIds.size, data.tools.length)
  })

  it('assigns every tool to a real station', () => {
    for (const tool of data.tools) {
      assert.ok(stationIds.has(tool.station), `${tool.id}: unknown station ${tool.station}`)
    }
  })

  it('uses a known status vocabulary', () => {
    const statuses = new Set(['daily-driver', 'published', 'working', 'experiment'])
    for (const tool of data.tools) {
      assert.ok(statuses.has(tool.status), `${tool.id}: unknown status ${tool.status}`)
    }
  })

  it('resolves every runsWith reference', () => {
    for (const tool of data.tools) {
      for (const ref of tool.runsWith) {
        assert.ok(toolIds.has(ref), `${tool.id}: runsWith ${ref} does not exist`)
      }
    }
  })

  it('points every capture at a real file with a prompt and date', () => {
    for (const tool of data.tools) {
      if (!tool.capture) continue
      const file = join(root, 'content/software/captures', tool.capture.file)
      assert.ok(existsSync(file), `${tool.id}: missing capture file ${tool.capture.file}`)
      assert.ok(tool.capture.prompt.length > 0, `${tool.id}: empty capture prompt`)
      assert.match(tool.capture.capturedAt, /^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('keeps captures on featured tools only', () => {
    for (const tool of data.tools) {
      if (tool.capture) assert.ok(tool.featured, `${tool.id}: ledger tools carry no specimens`)
    }
  })

  it('keeps the featured set within the reviewed 8-12 budget', () => {
    const featured = data.tools.filter((t) => t.featured)
    assert.ok(featured.length >= 8 && featured.length <= 12, `featured=${featured.length}`)
  })

  it('keeps captures free of excluded names and obvious secrets', () => {
    const banned =
      /prospera|dwp|santoro|erickbrimen|azctracker|dod-azc|azc-impact|freedom-cities|wade-litigation|bapa|ashworth|pactact|\btpri\b|b4a|aes-site|\bgavel\b|praxient|karlyn|goff-family|diagnosis-explainer|dose-timing|sk-[A-Za-z0-9]{20}|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{20}|xoxb-/i
    let checked = 0
    for (const tool of data.tools) {
      if (!tool.capture) continue
      const body = readFileSync(join(root, 'content/software/captures', tool.capture.file), 'utf-8')
      assert.ok(!banned.test(body), `${tool.id}: capture contains a banned string`)
      checked++
    }
    // a scan over zero captures is a failure of the check, not a pass of
    // the content — an emptied tools.json must not read as "all clean"
    assert.ok(checked >= 5, `only ${checked} captures scanned — scan is not covering the set`)
  })
})
