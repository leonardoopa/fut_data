import type { ReactNode } from 'react'
import { Button } from './Button'
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
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <SummaryList items={items} />
      <div className="form-actions">
        {secondaryAction}
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  )
}
