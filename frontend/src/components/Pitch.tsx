import type { ReactNode } from 'react'

export interface PitchMarker {
  key: string
  x: number
  y: number
  label: string
  initials?: string
  detail?: string
  tone: 'home' | 'away' | 'empty'
  flags?: ReactNode
}

interface PitchProps {
  label: string
  orientation: 'vertical' | 'horizontal'
  size?: 'full' | 'mini'
  markers: PitchMarker[]
  children?: ReactNode
}

function PitchLines({ orientation }: { orientation: PitchProps['orientation'] }) {
  const lines =
    orientation === 'vertical' ? (
      <>
        <rect x="2" y="2" width="64" height="101" />
        <line x1="2" y1="52.5" x2="66" y2="52.5" />
        <circle cx="34" cy="52.5" r="9" />
        <rect x="14" y="2" width="40" height="16" />
        <rect x="25" y="2" width="18" height="6" />
        <rect x="14" y="87" width="40" height="16" />
        <rect x="25" y="97" width="18" height="6" />
      </>
    ) : (
      <>
        <rect x="2" y="2" width="101" height="64" />
        <line x1="52.5" y1="2" x2="52.5" y2="66" />
        <circle cx="52.5" cy="34" r="9" />
        <rect x="2" y="14" width="16" height="40" />
        <rect x="2" y="25" width="6" height="18" />
        <rect x="87" y="14" width="16" height="40" />
        <rect x="97" y="25" width="6" height="18" />
      </>
    )
  return (
    <svg
      className="pitch__lines"
      viewBox={orientation === 'vertical' ? '0 0 68 105' : '0 0 105 68'}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines}
    </svg>
  )
}

export function Pitch({ label, orientation, size = 'full', markers, children }: PitchProps) {
  return (
    <div className={`pitch pitch--${orientation} pitch--${size}`}>
      <PitchLines orientation={orientation} />
      {children}
      <ul className="pitch__markers" aria-label={label}>
        {markers.map((marker) => (
          <li
            key={marker.key}
            className={`pitch__marker pitch__marker--${marker.tone}`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          >
            <span className="pitch__token" aria-hidden="true">
              {marker.initials}
              {marker.flags}
            </span>
            {size === 'full' ? (
              <span className="pitch__label">
                {marker.label}
                {marker.detail && <span className="pitch__detail">{marker.detail}</span>}
              </span>
            ) : (
              <span className="visually-hidden">{marker.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
