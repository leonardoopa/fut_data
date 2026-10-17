import { Tooltip } from './Tooltip'

export interface Segment<Value extends string> {
  value: Value
  label: string
  count?: number
  disabledReason?: string
}

interface SegmentedControlProps<Value extends string> {
  label: string
  segments: Segment<Value>[]
  value: Value
  onChange: (value: Value) => void
}

export function SegmentedControl<Value extends string>({
  label,
  segments,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {segments.map((segment) => (
        <Tooltip key={segment.value} text={segment.disabledReason}>
          {(tooltipId) => (
            <button
              type="button"
              role="radio"
              className="segmented__option"
              aria-checked={segment.value === value}
              aria-describedby={tooltipId}
              disabled={Boolean(segment.disabledReason)}
              onClick={() => onChange(segment.value)}
            >
              {segment.label}
              {segment.count !== undefined && (
                <>
                  {' '}
                  <span className="segmented__count">{segment.count}</span>
                </>
              )}
            </button>
          )}
        </Tooltip>
      ))}
    </div>
  )
}
