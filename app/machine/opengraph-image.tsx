import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'The Compound Machine — an economic simulation rendered as light'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Deterministic bar field echoing the simulation: green compounds, amber exposure, red seizure.
const bars = Array.from({ length: 48 }, (_, i) => {
  const wave = Math.sin(i * 0.62) * 0.35 + Math.sin(i * 0.19) * 0.45
  const height = 36 + Math.round((wave + 1) * 70)
  const color = i % 17 === 4 ? '#E05C4A' : i % 7 === 2 ? '#D9A441' : '#6FD69A'
  const opacity = i % 7 === 2 || i % 17 === 4 ? 0.85 : 0.35 + ((i * 13) % 40) / 100
  return { height, color, opacity }
})

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(160deg, #04130C 0%, #061A10 70%, #0A2417 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        color: '#E8F3EC',
        position: 'relative',
        fontFamily: 'ui-sans-serif, system-ui',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          padding: '0 72px',
        }}
      >
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: bar.height,
              background: bar.color,
              opacity: bar.opacity,
              borderRadius: '2px 2px 0 0',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 24,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: '#6FD69A',
            }}
          >
            Simulation
          </span>
          <span
            style={{
              fontSize: 22,
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
              color: 'rgba(232, 243, 236, 0.6)',
            }}
          >
            trey.world
          </span>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          The Compound Machine
        </div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            maxWidth: 860,
            color: 'rgba(232, 243, 236, 0.72)',
          }}
        >
          Change the rules and watch the same people build two different futures.
        </div>
      </div>
    </div>,
    { ...size },
  )
}
