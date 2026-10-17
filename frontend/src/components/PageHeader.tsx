import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  icon?: IconName
  visual?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, icon, visual, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      {visual ??
        (icon && (
          <span className="page-header__icon">
            <Icon name={icon} size={20} />
          </span>
        ))}
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
