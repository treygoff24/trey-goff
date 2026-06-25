import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'Trey Goff - Library'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #04130C 0%, #061A10 62%, #031008 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        color: '#E8F3EC',
        position: 'relative',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 620,
          height: 620,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(111, 214, 154, 0.28), transparent 68%)',
          top: -220,
          left: -160,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(151, 232, 187, 0.18), transparent 70%)',
          bottom: -190,
          right: -120,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          Everything I’ve read
        </div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            maxWidth: 860,
            color: 'rgba(232, 243, 236, 0.72)',
          }}
        >
          Four ways to wander a reading life: constellation, shelf, river, and index.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 22,
          color: 'rgba(232, 243, 236, 0.58)',
          position: 'relative',
          zIndex: 1,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        <span style={{ letterSpacing: '0.34em', textTransform: 'uppercase' }}>Trey Goff</span>
        <span style={{ color: '#6FD69A', fontWeight: 600 }}>Aurora Library</span>
      </div>
    </div>,
    { ...size },
  )
}
