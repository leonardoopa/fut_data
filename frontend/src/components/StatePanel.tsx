import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'

export interface StateContent {
  icon: IconName
  title: string
  description?: ReactNode
  action?: ReactNode
}

interface StatePanelProps extends StateContent {
  tone?: 'neutral' | 'danger'
  role?: 'status' | 'alert'
}

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  role = 'status',
}: StatePanelProps) {
  return (
    <div className={`state-panel state-panel--${tone}`} role={role}>
      <span className="state-panel__icon">
        <Icon name={icon} size={20} />
      </span>
      <p className="state-panel__title">{title}</p>
      {description && <p className="state-panel__description">{description}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title: string
  error: string
  onRetry?: () => void
}

export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  return (
    <StatePanel
      icon="serverOff"
      tone="danger"
      role="alert"
      title={title}
      description={error}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
            Tentar de novo
          </Button>
        )
      }
    />
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </p>
  )
}
