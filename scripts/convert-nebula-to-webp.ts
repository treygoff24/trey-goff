/**
 * Convert nebula PNG files to WebP format for better compression.
 * Reduces ~780KB PNGs to much smaller WebP files while maintaining quality.
 */

import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const NEBULAE_DIR = join(process.cwd(), 'public/assets/library/nebulae')

async function convertToWebP() {
  const files = await readdir(NEBULAE_DIR)
  const pngFiles = files.filter(f => f.endsWith('.png') && f.startsWith('nebula_'))

  console.log(`Found ${pngFiles.length} PNG files to convert...`)

  for (const file of pngFiles) {
    const inputPath = join(NEBULAE_DIR, file)
    const outputPath = inputPath.replace('.png', '.webp')

    try {
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath)

      const inputStats = await sharp(inputPath).metadata()
      const outputStats = await sharp(outputPath).metadata()

      console.log(`✓ ${file} → ${file.replace('.png', '.webp')} (saved ${Math.round(((inputStats.size || 0) - (outputStats.size || 0)) / 1024)}KB)`)

      await unlink(inputPath)
    } catch (error) {
      console.error(`✗ Failed to convert ${file}:`, error)
      process.exit(1)
    }
  }

  console.log(`\nSuccessfully converted ${pngFiles.length} files to WebP format.`)
}

convertToWebP().catch(error => {
  console.error('Conversion failed:', error)
  process.exit(1)
})
