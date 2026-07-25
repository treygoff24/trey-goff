import { getDossierPayload } from '@/lib/instruments/dossier-payload'
import { getInstrumentManifest, instrumentedSlugs } from '@/lib/instruments/manifest'

/**
 * Dossier bodies, one fetch each. Prerendered at build like everything else on the reading
 * side — `force-static` plus a closed parameter set means these are files on the CDN, not a
 * server the instrumented page now depends on.
 */
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams(): { slug: string; dossier: string }[] {
  return [...instrumentedSlugs()].flatMap((slug) =>
    (getInstrumentManifest(slug)?.dossiers ?? []).map((dossier) => ({ slug, dossier })),
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; dossier: string }> },
): Promise<Response> {
  const { slug, dossier } = await params
  const payload = await getDossierPayload(slug, dossier)
  if (!payload) return new Response('Not found', { status: 404 })
  return Response.json(payload)
}
