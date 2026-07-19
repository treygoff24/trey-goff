import { cookies } from 'next/headers'
import { ArchiveUnavailable } from '@/components/classified/ArchiveUnavailable'
import { ClassifiedGag } from '@/components/classified/ClassifiedGag'
import { ReadingRoom } from '@/components/classified/ReadingRoom'
import { getAnnexArchive } from '@/lib/annex/content'
import { ANNEX_SESSION_COOKIE, canAccessAnnex, getConfiguredAnnexSecret } from '@/lib/annex-auth'

export const dynamic = 'force-dynamic'

export default async function ClassifiedPage() {
  const annexSecret = getConfiguredAnnexSecret()
  const sessionCookie = (await cookies()).get(ANNEX_SESSION_COOKIE)?.value
  if (!canAccessAnnex(sessionCookie, annexSecret)) {
    return <ClassifiedGag />
  }

  const archive = await getAnnexArchive()
  if (archive.status === 'unavailable') {
    return <ArchiveUnavailable />
  }

  const entries = archive.entries.map(({ body: _body, ...entry }) => entry)
  return <ReadingRoom entries={entries} />
}
