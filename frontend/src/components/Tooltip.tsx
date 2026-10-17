import { useId, type ReactNode } from 'react'

interface TooltipProps {
  text: string | undefined
  children: (tooltipId: string | undefined) => ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  const tooltipId = useId()
  return (
    <span className="tooltip-anchor">
      {children(text ? tooltipId : undefined)}
      {text && (
        <span id={tooltipId} role="tooltip" className="tooltip">
          {text}
        </span>
      )}
    </span>
  )
}
