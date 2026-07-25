import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { LEDGER_STATE_VALUES } from '../lib/instruments/url-state'

const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')

function declaration(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  assert.ok(match, `app/globals.css declares no --${name}`)
  return match[1]!.trim()
}

function srgbFromHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const channel = (at: number) => parseInt(value.slice(at, at + 2), 16) / 255
  return [channel(0), channel(2), channel(4)]
}

/** oklch → linear sRGB, following the CSS Color 4 conversion. */
function linearFromOklch(l: number, c: number, hDegrees: number): [number, number, number] {
  const h = (hDegrees * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: number, b: number): number {
  const [high, low] = a > b ? [a, b] : [b, a]
  return (high + 0.05) / (low + 0.05)
}

const background = luminance(
  srgbFromHex(declaration('color-bg-0')).map(toLinear) as [number, number, number],
)

test('every verdict colour clears WCAG AA on the page ground', () => {
  for (const state of LEDGER_STATE_VALUES) {
    const value = declaration(`color-verdict-${state}`)
    const parts = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    assert.ok(parts, `--color-verdict-${state} is not a plain oklch() triple: ${value}`)

    const ratio = contrast(
      luminance(linearFromOklch(Number(parts[1]), Number(parts[2]), Number(parts[3]))),
      background,
    )
    assert.ok(ratio >= 4.5, `${state} is ${ratio.toFixed(2)}:1 on --color-bg-0, below AA`)
  }
})

test('verdict tokens are declared outside @theme so Tailwind cannot shake them out', () => {
  const theme = css.slice(css.indexOf('@theme {'), css.indexOf('\n}\n', css.indexOf('@theme {')))
  assert.doesNotMatch(
    theme,
    /--color-verdict-/,
    'verdict tokens are reached only through var(); inside @theme they are dropped from the build',
  )
})

test('the instrument accent is composed from the manifest, never hardcoded', () => {
  const scope = css.slice(css.indexOf('.instrument-scope {'))
  assert.match(
    scope,
    /--instrument-accent:\s*oklch\(0\.85 var\(--instrument-chroma\) var\(--instrument-hue\)\)/,
  )
})

test('every instrument component styles through tokens rather than raw colour', () => {
  const dir = join(process.cwd(), 'components/instruments')
  const sources = readdirSync(dir)
    .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
    .map((file) => [file, readFileSync(join(dir, file), 'utf8')] as const)

  for (const [file, source] of sources) {
    assert.doesNotMatch(source, /rgba?\(/, `${file} hardcodes a raw colour`)
    assert.doesNotMatch(source, /#[0-9a-fA-F]{6}\b/, `${file} hardcodes a hex colour`)
  }
})
