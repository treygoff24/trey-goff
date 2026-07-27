import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolveAllCovers } from '../lib/media/covers'
import type { AppearancesData } from '../lib/media/types'

async function main() {
  console.log('Resolving appearance covers...')

  mkdirSync('./public', { recursive: true })

  const appearancesData: AppearancesData = JSON.parse(
    readFileSync('./content/media/appearances.json', 'utf-8'),
  )

  const covers = await resolveAllCovers(appearancesData.appearances)

  const coverMap = Object.fromEntries(covers)
  writeFileSync('./public/appearance-covers.json', JSON.stringify(coverMap, null, 2))

  console.log(`Resolved ${covers.size} appearance covers`)

  const sources = { manual: 0, youtube: 0, itunes: 0, placeholder: 0 }
  for (const url of covers.values()) {
    if (url.includes('showArtwork')) {
      sources.manual++
    } else if (url.includes('ytimg') || url.includes('youtube.com')) {
      sources.youtube++
    } else if (url.includes('mzstatic.com')) {
      sources.itunes++
    } else if (url.startsWith('data:image/svg+xml')) {
      sources.placeholder++
    }
  }
  console.log('Sources:', sources)
}

main().catch(console.error)
