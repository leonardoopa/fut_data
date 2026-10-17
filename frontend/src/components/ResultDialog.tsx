import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Modal } from './Modal'
import { SummaryList, type SummaryItem } from './SummaryList'

interface ResultDialogProps {
  title: string
  description: ReactNode
  items: SummaryItem[]
  secondaryAction?: ReactNode
  onClose: () => void
}

export function ResultDialog({
  title,
  description,
  items,
  secondaryAction,
  onClose,
}: ResultDialogProps) {
  return (
    <Modal
      title={title}
      description={description}
      size="sm"
      icon={
        <span className="modal__icon modal__icon--success">
          <Icon name="checkCircle" />
        </span>
      }
      onClose={onClose}
      footer={
        <>
          {secondaryAction}
          <Button onClick={onClose}>Fechar</Button>
        </>
      }
    >
      <SummaryList label={title} items={items} />
    </Modal>
  )
}
