import type { ReactNode } from 'react'

export interface SummaryItem {
  label: string
  value: ReactNode
  caption?: ReactNode
  emphasis?: boolean
}

interface SummaryListProps {
  items: SummaryItem[]
  label?: string
}

export function SummaryList({ items, label }: SummaryListProps) {
  return (
    <dl className="summary" aria-label={label}>
      {items.map((item) => (
        <div
          key={item.label}
          className={item.emphasis ? 'summary__row summary__row--emphasis' : 'summary__row'}
        >
          <dt>
            {item.label}
            {item.caption && <small className="summary__caption">{item.caption}</small>}
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
