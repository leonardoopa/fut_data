import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'outline'

interface BadgeProps {
  tone: BadgeTone
  dot?: boolean
  icon?: IconName
  title?: string
  children: ReactNode
}

export function Badge({ tone, dot, icon, title, children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}
