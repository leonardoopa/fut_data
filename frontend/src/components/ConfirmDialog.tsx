import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-dialog__message">{children}</div>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isPending={isPending}>
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
