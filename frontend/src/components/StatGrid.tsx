import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface StatItem {
  label: string
  icon: IconName
  value: ReactNode
  suffix?: string
  caption?: string
  tone?: 'positive' | 'negative'
}

interface StatGridProps {
  items: StatItem[]
  label: string
  variant: 'cards' | 'strip'
}

export function StatGrid({ items, label, variant }: StatGridProps) {
  return (
    <dl className={`stats stats--${variant}`} aria-label={label}>
      {items.map((item) => (
        <div key={item.label} className="stat">
          <dt className="stat__label">
            {item.label}
            <Icon name={item.icon} className="stat__icon" />
            {item.caption && <small className="stat__caption">{item.caption}</small>}
          </dt>
          <dd className={item.tone ? `stat__value stat__value--${item.tone}` : 'stat__value'}>
            {item.value}
            {item.suffix && <span className="stat__suffix"> {item.suffix}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
