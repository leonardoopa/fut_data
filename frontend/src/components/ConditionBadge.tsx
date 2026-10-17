import type { Condition } from '../api/types'
import { CONDITION_LABELS } from '../format/labels'
import { Badge, type BadgeTone } from './Badge'

const CONDITION_TONES: Record<Condition, BadgeTone> = {
  APTO: 'success',
  MAL_CONDICIONADO: 'warning',
  DOENTE: 'danger',
}

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <Badge tone={CONDITION_TONES[condition]} dot>
      {CONDITION_LABELS[condition]}
    </Badge>
  )
}
