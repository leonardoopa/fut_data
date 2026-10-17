import type { ReactNode } from 'react'
import type { ActionError } from '../hooks/useAction'
import { Button } from './Button'
import type { IconName } from './Icon'
import { Modal } from './Modal'
import { ActionErrorNotice } from './Notice'

interface ConfirmDialogProps {
  title: string
  description: ReactNode
  children?: ReactNode
  confirmLabel: string
  confirmIcon: IconName
  pendingLabel: string
  tone: 'danger' | 'primary'
  isPending: boolean
  error: ActionError | undefined
  errorTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel,
  confirmIcon,
  pendingLabel,
  tone,
  isPending,
  error,
  errorTitle,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      description={description}
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            icon={confirmIcon}
            onClick={onConfirm}
            isPending={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <ActionErrorNotice error={error} title={errorTitle} />
      {children}
    </Modal>
  )
}
