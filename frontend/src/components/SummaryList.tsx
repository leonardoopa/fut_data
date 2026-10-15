import type { ReactNode } from 'react'

export interface SummaryItem {
  label: string
  value: ReactNode
}

interface SummaryListProps {
  items: SummaryItem[]
  label?: string
}

export function SummaryList({ items, label }: SummaryListProps) {
  return (
    <dl className="summary" aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
