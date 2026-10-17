import type { ReactNode } from 'react'
import type { ActionError } from '../hooks/useAction'
import { Icon, type IconName } from './Icon'

type NoticeTone = 'info' | 'warning' | 'danger' | 'neutral'

const TONE_ICONS: Record<NoticeTone, IconName> = {
  info: 'info',
  neutral: 'info',
  warning: 'alertTriangle',
  danger: 'alertCircle',
}

interface NoticeProps {
  tone: NoticeTone
  title?: string
  icon?: IconName
  role?: 'status' | 'alert'
  children?: ReactNode
}

export function Notice({ tone, title, icon, role, children }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={role}>
      <Icon name={icon ?? TONE_ICONS[tone]} className="notice__icon" />
      <div className="notice__content">
        {title && <p className="notice__title">{title}</p>}
        {children && <div className="notice__text">{children}</div>}
      </div>
    </div>
  )
}

interface ActionErrorNoticeProps {
  error: ActionError | undefined
  title: string
}

export function ActionErrorNotice({ error, title }: ActionErrorNoticeProps) {
  if (!error) return null
  return (
    <Notice
      tone="danger"
      role="alert"
      icon={error.isNetworkError ? 'wifiOff' : 'alertCircle'}
      title={error.isNetworkError ? 'Sem conexão' : title}
    >
      {error.message}
    </Notice>
  )
}
