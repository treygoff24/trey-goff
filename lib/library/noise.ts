/**
 * 2D Simplex Noise Implementation
 * Pure JavaScript, no dependencies.
 * Based on Stefan Gustavson's implementation.
 */

// =============================================================================
// Gradient Vectors for 2D Simplex Noise
// =============================================================================

const GRAD2: readonly (readonly [number, number])[] = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

// =============================================================================
// Permutation Table
// =============================================================================

/**
 * Generate a seeded permutation table.
 * Uses a simple LCG (Linear Congruential Generator) for reproducibility.
 */
function generatePermutation(seed: number): number[] {
  const perm: number[] = new Array(256)
  for (let i = 0; i < 256; i++) {
    perm[i] = i
  }

  // Fisher-Yates shuffle with seeded random
  let s = seed
  for (let i = 255; i > 0; i--) {
    // LCG: next = (a * current + c) % m
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    // Swap elements
    const temp = perm[i]!
    perm[i] = perm[j]!
    perm[j] = temp
  }

  // Duplicate for wrapping (512 elements total)
  const result: number[] = new Array(512)
  for (let i = 0; i < 256; i++) {
    result[i] = perm[i]!
    result[i + 256] = perm[i]!
  }
  return result
}

// =============================================================================
// Simplex Noise Core
// =============================================================================

/**
 * Dot product of gradient and distance vector.
 */
function dot2(g: readonly [number, number], x: number, y: number): number {
  return g[0] * x + g[1] * y
}

/**
 * Skewing factor for 2D simplex noise.
 * F2 = (sqrt(3) - 1) / 2
 * G2 = (3 - sqrt(3)) / 6
 */
const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

/**
 * 2D Simplex Noise function.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param seed - Seed for deterministic noise (default: 0)
 * @returns Noise value in range [-1, 1]
 */
export function simplex2D(x: number, y: number, seed = 0): number {
  // Generate permutation table for this seed
  const perm = generatePermutation(seed)

  // Skew input space to determine which simplex cell we're in
  const s = (x + y) * F2
  const i = Math.floor(x + s)
  const j = Math.floor(y + s)

  // Unskew back to (x, y) space
  const t = (i + j) * G2
  const X0 = i - t
  const Y0 = j - t
  const x0 = x - X0
  const y0 = y - Y0

  // Determine which simplex we're in (lower or upper triangle)
  let i1: number, j1: number
  if (x0 > y0) {
    // Lower triangle, XY order: (0,0)->(1,0)->(1,1)
    i1 = 1
    j1 = 0
  } else {
    // Upper triangle, YX order: (0,0)->(0,1)->(1,1)
    i1 = 0
    j1 = 1
  }

  // Offsets for middle and last corners
  const x1 = x0 - i1 + G2
  const y1 = y0 - j1 + G2
  const x2 = x0 - 1 + 2 * G2
  const y2 = y0 - 1 + 2 * G2

  // Hash coordinates to gradient indices
  const ii = i & 255
  const jj = j & 255
  const gi0 = perm[ii + perm[jj]!]! % 8
  const gi1 = perm[ii + i1 + perm[jj + j1]!]! % 8
  const gi2 = perm[ii + 1 + perm[jj + 1]!]! % 8

  // Calculate contribution from three corners
  let n0 = 0
  let t0 = 0.5 - x0 * x0 - y0 * y0
  if (t0 > 0) {
    t0 *= t0
    n0 = t0 * t0 * dot2(GRAD2[gi0]!, x0, y0)
  }

  let n1 = 0
  let t1 = 0.5 - x1 * x1 - y1 * y1
  if (t1 > 0) {
    t1 *= t1
    n1 = t1 * t1 * dot2(GRAD2[gi1]!, x1, y1)
  }

  let n2 = 0
  let t2 = 0.5 - x2 * x2 - y2 * y2
  if (t2 > 0) {
    t2 *= t2
    n2 = t2 * t2 * dot2(GRAD2[gi2]!, x2, y2)
  }

  // Sum contributions and scale to [-1, 1]
  return 70 * (n0 + n1 + n2)
}

/**
 * Fractal Brownian Motion (fBm) using simplex noise.
 * Adds multiple octaves for more natural-looking noise.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param octaves - Number of noise layers (default: 4)
 * @param persistence - Amplitude falloff per octave (default: 0.5)
 * @param lacunarity - Frequency multiplier per octave (default: 2)
 * @param seed - Seed for deterministic noise (default: 0)
 * @returns Noise value in range approximately [-1, 1]
 */
export function fbm2D(
  x: number,
  y: number,
  octaves = 4,
  persistence = 0.5,
  lacunarity = 2,
  seed = 0
): number {
  let total = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += simplex2D(x * frequency, y * frequency, seed + i * 1000) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return total / maxValue
}
