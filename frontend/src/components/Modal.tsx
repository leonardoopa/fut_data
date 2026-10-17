import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

const FOCUSABLE_SELECTOR =
  'input:not([disabled]), select:not([disabled]), textarea, button:not([disabled])'

interface ModalForm {
  label: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

interface ModalProps {
  title: string
  description?: ReactNode
  icon?: ReactNode
  onClose: () => void
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dialog' | 'drawer'
  form?: ModalForm
  children: ReactNode
}

export function Modal({
  title,
  description,
  icon,
  onClose,
  footer,
  size = 'md',
  variant = 'dialog',
  form,
  children,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const body = panelRef.current?.querySelector('.modal__body')
    const firstControl = body?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(firstControl ?? panelRef.current)?.focus()
  }, [])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const content = (
    <>
      <div className="modal__body">{children}</div>
      {footer && <footer className="modal__footer">{footer}</footer>}
    </>
  )

  return createPortal(
    <div className={`modal-backdrop modal-backdrop--${variant}`}>
      <div
        ref={panelRef}
        className={`modal modal--${variant} modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="modal__header">
          {icon}
          <div className="modal__heading">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="modal__description">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        {form ? (
          <form className="modal__form" noValidate aria-label={form.label} onSubmit={form.onSubmit}>
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>,
    document.body,
  )
}
