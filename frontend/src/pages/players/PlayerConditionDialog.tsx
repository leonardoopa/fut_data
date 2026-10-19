import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm, useWatch } from 'react-hook-form'
import { CONDITIONS, type Club, type Condition, type Player } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import { ChoiceField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { PlayerCard } from '../../components/PlayerCard'
import { CONDITION_LABELS } from '../../format/labels'
import type { ActionError } from '../../hooks/useAction'
import { useLineup } from '../../hooks/useClubLineup'
import { playerConditionSchema } from './playerSchemas'

const CONDITION_EFFECTS: Record<Condition, string> = {
  APTO: 'Sem desconto por condição.',
  MAL_CONDICIONADO:
    'Desconto de 15% no valor de mercado; pela metade com agilidade de 80 a 100 e com mais 10 pontos com agilidade até 30.',
  DOENTE: 'Desconto de 30%, com o mesmo ajuste de agilidade.',
}
const SICK_TO_FIT_REASON = 'De Doente não passa direto para Apto.'

interface PlayerConditionDialogProps {
  player: Player
  club: Club | undefined
  isPending: boolean
  error: ActionError | undefined
  onSave: (condition: Condition) => void
  onClose: () => void
}

export function PlayerConditionDialog({
  player,
  club,
  isPending,
  error,
  onSave,
  onClose,
}: PlayerConditionDialogProps) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(playerConditionSchema),
    defaultValues: { condition: player.condition },
  })
  const { field, fieldState } = useController({ control, name: 'condition' })
  const chosen = useWatch({ control, name: 'condition' })
  const lineup = useLineup(player.club_id)
  const isStarter = lineup.data?.players.some((starter) => starter.id === player.id) ?? false
  const isSick = player.condition === 'DOENTE'

  return (
    <Modal
      title="Alterar condição física"
      description="A condição muda o desconto no valor de mercado, recalculado pela API ao salvar."
      onClose={onClose}
      isBusy={isPending}
      form={{
        label: 'Alteração de condição',
        onSubmit: handleSubmit(({ condition }) => onSave(condition)),
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Salvando…' : 'Salvar condição'}
          </Button>
        </>
      }
    >
      <ActionErrorNotice error={error} title="Não foi possível alterar a condição" />
      <PlayerCard player={player} aside={<ConditionBadge condition={player.condition} />} />
      <ChoiceField
        label="Nova condição"
        hideLabel
        name="condition"
        layout="cards"
        value={field.value}
        error={fieldState.error?.message}
        onChange={field.onChange}
        onBlur={field.onBlur}
        options={CONDITIONS.map((condition) => {
          const isBlocked = isSick && condition === 'APTO'
          return {
            value: condition,
            disabled: isBlocked,
            label: (
              <>
                {CONDITION_LABELS[condition]}
                {condition === player.condition && <Badge tone="neutral">Atual</Badge>}
              </>
            ),
            description: isBlocked
              ? `${CONDITION_EFFECTS[condition]} ${SICK_TO_FIT_REASON}`
              : CONDITION_EFFECTS[condition],
          }
        })}
      />
      {chosen === 'DOENTE' && !isSick && isStarter && (
        <Notice tone="warning" title={`${player.name} é titular`}>
          Ao passar a Doente, ele sai da escalação, e o {club?.name ?? 'clube'} só volta a jogar
          partidas depois de escalar de novo os 5 titulares.
        </Notice>
      )}
    </Modal>
  )
}
