import { useId, type ReactNode } from 'react'

interface CardProps {
  title?: string
  description?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  flush?: boolean
  children: ReactNode
}

export function Card({ title, description, actions, footer, flush, children }: CardProps) {
  const titleId = useId()
  return (
    <section
      className={flush ? 'card card--flush' : 'card'}
      aria-labelledby={title ? titleId : undefined}
    >
      {(title || actions) && (
        <header className="card__header">
          {title && (
            <div className="card__heading">
              <h2 id={titleId} className="card__title">
                {title}
              </h2>
              {description && <p className="card__description">{description}</p>}
            </div>
          )}
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      {children}
      {footer && <footer className="card__footer">{footer}</footer>}
    </section>
  )
}
