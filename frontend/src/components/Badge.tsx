import type { ReactNode } from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral'

interface BadgeProps {
  tone: BadgeTone
  title?: string
  children: ReactNode
}

export function Badge({ tone, title, children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  )
}
