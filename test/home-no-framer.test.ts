import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const projectRoot = process.cwd()

describe('Home page framer-motion removal', () => {
it('HolographicTile should not import framer-motion', async () => {
const filePath = join(projectRoot, 'components/home/HolographicTile.tsx')
const content = await readFile(filePath, 'utf-8')

assert.ok(
!content.includes('framer-motion'),
'HolographicTile should not import from framer-motion'
)
assert.ok(
!content.includes('motion.'),
'HolographicTile should not use motion components'
)
assert.ok(
!content.includes('useMotionValue'),
'HolographicTile should not use motion hooks'
)
assert.ok(
!content.includes('useMotionTemplate'),
'HolographicTile should not use motion templates'
)
})

it('SignalGrid should not import framer-motion', async () => {
const filePath = join(projectRoot, 'components/home/SignalGrid.tsx')
const content = await readFile(filePath, 'utf-8')

assert.ok(
!content.includes('framer-motion'),
'SignalGrid should not import from framer-motion'
)
})
})
