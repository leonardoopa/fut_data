const SCALE_MAX = 100
const LOW_VALUE = 30
const HIGH_VALUE = 60

function levelOf(value: number): 'low' | 'mid' | 'high' {
  if (value <= LOW_VALUE) return 'low'
  return value >= HIGH_VALUE ? 'high' : 'mid'
}

interface AttributeBarProps {
  value: number
  ceiling?: number
  tone?: 'level' | 'primary'
}

export function AttributeBar({ value, ceiling, tone = 'level' }: AttributeBarProps) {
  const toneClass = tone === 'level' ? `bar__fill--${levelOf(value)}` : 'bar__fill--primary'
  return (
    <span className="bar" aria-hidden="true">
      {ceiling !== undefined && (
        <span className="bar__ceiling" style={{ width: `${(ceiling / SCALE_MAX) * 100}%` }} />
      )}
      <span
        className={`bar__fill ${toneClass}`}
        style={{ width: `${(value / SCALE_MAX) * 100}%` }}
      />
    </span>
  )
}
