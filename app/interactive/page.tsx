import { notFound } from 'next/navigation'
import { InteractiveShell } from '@/components/interactive/InteractiveShell'
import { isInteractiveWorldEnabled } from '@/lib/site-config'

/**
 * Interactive World entry page.
 *
 * This route stays behind a feature flag until the interactive
 * experience is ready to ship publicly.
 */
export default function InteractivePage() {
  if (!isInteractiveWorldEnabled) {
    notFound()
  }

  return <InteractiveShell />
}
