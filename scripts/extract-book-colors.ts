import { existsSync, readFileSync, writeFileSync } from 'fs'
import sharp from 'sharp'

const FALLBACK_COLOR = '#1a1a2e'
const COVER_MAP_PATH = './public/cover-map.json'
const OUTPUT_PATH = './public/book-colors.json'

async function main() {
  const coverMap = JSON.parse(readFileSync(COVER_MAP_PATH, 'utf-8')) as Record<string, string>
  const bookColors: Record<string, string> = {}

  for (const [bookId, coverPath] of Object.entries(coverMap)) {
    if (!isRealJpgCover(coverPath)) {
      bookColors[bookId] = FALLBACK_COLOR
      continue
    }

    const filePath = `./public${coverPath}`
    if (!existsSync(filePath)) {
      bookColors[bookId] = FALLBACK_COLOR
      continue
    }

    try {
      bookColors[bookId] = await extractDominantColor(filePath)
    } catch {
      bookColors[bookId] = FALLBACK_COLOR
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(bookColors, null, 2) + '\n')
  console.log(`Wrote ${OUTPUT_PATH} with ${Object.keys(bookColors).length} entries`)
}

function isRealJpgCover(coverPath: string): boolean {
  return coverPath.startsWith('/covers/') && coverPath.endsWith('.jpg')
}

async function extractDominantColor(filePath: string): Promise<string> {
  const { data, info } = await sharp(filePath)
    .resize(32, 32, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const samples = samplePixels(data, info.width, info.height)
  return rgbToHex(averageColor(samples))
}

type Rgb = { r: number; g: number; b: number }

function samplePixels(buffer: Buffer, width: number, height: number): Rgb[] {
  const samples: Rgb[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const alpha = buffer[index + 3] ?? 255
      if (alpha < 16) continue

      samples.push({
        r: buffer[index] ?? 0,
        g: buffer[index + 1] ?? 0,
        b: buffer[index + 2] ?? 0,
      })
    }
  }

  return samples.length > 0 ? samples : [{ r: 26, g: 26, b: 46 }]
}

function averageColor(colors: Rgb[]): Rgb {
  const total = colors.reduce(
    (acc, color) => {
      acc.r += color.r
      acc.g += color.g
      acc.b += color.b
      return acc
    },
    { r: 0, g: 0, b: 0 },
  )

  return {
    r: Math.round(total.r / colors.length),
    g: Math.round(total.g / colors.length),
    b: Math.round(total.b / colors.length),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
    .join('')}`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
