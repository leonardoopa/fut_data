import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE_SELECTOR = 'input:not([disabled]), select:not([disabled]), textarea, button'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
  }, [])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal__close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal__body" ref={bodyRef}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
