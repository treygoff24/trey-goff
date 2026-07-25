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

/** `rgba(...)` over an opaque ground, the way the browser paints a translucent surface. */
function composite(value: string, base: [number, number, number]): [number, number, number] {
  const parts = value.match(
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/,
  )
  assert.ok(parts, `not a plain rgb()/rgba() colour: ${value}`)
  const alpha = parts[4] === undefined ? 1 : Number(parts[4])
  return [0, 1, 2].map((channel) => {
    const over = Number(parts[channel + 1]) / 255
    return over * alpha + base[channel]! * (1 - alpha)
  }) as [number, number, number]
}

function mix(
  over: [number, number, number],
  base: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [0, 1, 2].map((channel) => over[channel]! * alpha + base[channel]! * (1 - alpha)) as [
    number,
    number,
    number,
  ]
}

/** A text token as painted: the opaque ones are hex, the dimmed ones are rgba over the ground. */
function paint(value: string, base: [number, number, number]): [number, number, number] {
  return value.startsWith('#') ? srgbFromHex(value) : composite(value, base)
}

function relativeLuminance(colour: [number, number, number]): number {
  return luminance(colour.map(toLinear) as [number, number, number])
}

const pageGround = srgbFromHex(declaration('color-bg-0'))

/**
 * The ledger's filter bar and the rail's collapsed strip both paint on `bg-bg-0/95`, which the
 * browser composites over whatever is behind them. Their own text tokens are translucent too,
 * so a foreground here is two blends deep and cannot be read off `--color-bg-0` directly.
 */
const stickyGround = mix(pageGround, pageGround, 0.95)

/**
 * Every ground instrument text is actually painted on. The page background is the easy one;
 * verdict text also sits on the translucent panel surfaces, and a chip that clears AA on
 * `--color-bg-0` can still fail once `--color-surface-2` is composited underneath it.
 */
const grounds: [string, number][] = [
  ['--color-bg-0', luminance(pageGround.map(toLinear) as [number, number, number])],
  [
    '--color-surface-1',
    luminance(
      composite(declaration('color-surface-1'), pageGround).map(toLinear) as [
        number,
        number,
        number,
      ],
    ),
  ],
  [
    '--color-surface-2',
    luminance(
      composite(declaration('color-surface-2'), pageGround).map(toLinear) as [
        number,
        number,
        number,
      ],
    ),
  ],
]

test('every verdict colour clears WCAG AA on every ground it is painted on', () => {
  for (const state of LEDGER_STATE_VALUES) {
    const value = declaration(`color-verdict-${state}`)
    const parts = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    assert.ok(parts, `--color-verdict-${state} is not a plain oklch() triple: ${value}`)
    const foreground = luminance(
      linearFromOklch(Number(parts[1]), Number(parts[2]), Number(parts[3])),
    )

    for (const [name, ground] of grounds) {
      const ratio = contrast(foreground, ground)
      assert.ok(ratio >= 4.5, `${state} is ${ratio.toFixed(2)}:1 on ${name}, below AA`)
    }
  }
})

test('the sticky bar and its chips clear WCAG AA on the translucent ground they paint on', () => {
  const ground = relativeLuminance(stickyGround)

  // The status readout is `text-text-2`; the rail's collapsed strip is `text-text-3` at 11px.
  // Both are small text, so both owe the full 4.5:1.
  for (const token of ['color-text-1', 'color-text-2', 'color-text-3']) {
    const foreground = relativeLuminance(paint(declaration(token), stickyGround))
    const ratio = contrast(foreground, ground)
    assert.ok(ratio >= 4.5, `--${token} is ${ratio.toFixed(2)}:1 on the sticky bar, below AA`)
  }

  for (const state of LEDGER_STATE_VALUES) {
    const value = declaration(`color-verdict-${state}`)
    const parts = value.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
    assert.ok(parts, `--color-verdict-${state} is not a plain oklch() triple: ${value}`)
    const foreground = luminance(
      linearFromOklch(Number(parts[1]), Number(parts[2]), Number(parts[3])),
    )
    const ratio = contrast(foreground, ground)
    assert.ok(ratio >= 4.5, `the ${state} chip is ${ratio.toFixed(2)}:1 on the sticky bar, below AA`)
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
