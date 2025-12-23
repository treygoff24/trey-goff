import { ImageResponse } from 'next/og'
import { allEssays } from 'content-collections'

const isProduction = process.env.NODE_ENV === 'production'
const visibleEssays = isProduction
  ? allEssays.filter((essay) => essay.status !== 'draft')
  : allEssays

export const runtime = 'nodejs'
export const alt = 'Essay preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const essay = visibleEssays.find((e) => e.slug === slug)

  if (!essay) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#FFB86B', fontSize: 48 }}>Essay Not Found</span>
        </div>
      ),
      { ...size }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom, #070A0F, #0B1020)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.92)',
            marginBottom: 24,
            lineHeight: 1.2,
          }}
        >
          {essay.title}
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.72)',
            marginBottom: 48,
          }}
        >
          {essay.summary}
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#FFB86B',
          }}
        >
          trey.world
        </div>
      </div>
    ),
    { ...size }
  )
}
