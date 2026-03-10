async function main() {
  const configPath = 'content-collections.ts'
  const { createBuilder } = await import('@content-collections/core')

  console.log(`Syncing content-collections from ${configPath}...`)
  const builder = await createBuilder(configPath)
  await builder.build()
  console.log('Content-collections sync complete')
}

main().catch((error) => {
  console.error('Failed to sync content-collections')
  console.error(error)
  process.exitCode = 1
})
