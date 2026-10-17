import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import type { Player, PlayerProfilePayload } from '../../api/types'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { formatMoney } from '../../format/money'
import type { ActionError } from '../../hooks/useAction'
import { PlayerProfileFields } from './PlayerProfileFields'
import { playerProfileSchema } from './playerSchemas'

interface PlayerEditDialogProps {
  player: Player
  isPending: boolean
  error: ActionError | undefined
  onSave: (payload: PlayerProfilePayload) => void
  onClose: () => void
}

export function PlayerEditDialog({
  player,
  isPending,
  error,
  onSave,
  onClose,
}: PlayerEditDialogProps) {
  const form = useForm({
    resolver: zodResolver(playerProfileSchema),
    defaultValues: {
      name: player.name,
      position: player.position,
      agility: String(player.agility),
      age: String(player.age),
    },
  })
  const hasClub = player.club_id !== null

  return (
    <FormProvider {...form}>
      <Modal
        title="Editar jogador"
        description="Edite nome, posição, idade e agilidade. Os demais dados não mudam."
        onClose={onClose}
        form={{ label: 'Edição de jogador', onSubmit: form.handleSubmit(onSave) }}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" isPending={isPending}>
              {isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <ActionErrorNotice error={error} title="Não foi possível salvar o jogador" />
        <PlayerProfileFields
          ageHint={`De 16 a 45, sem diminuir (atual: ${player.age}).`}
          agilityHint="De 1 a 100."
          lockedPosition={hasClub ? player.position : undefined}
        />
        <Notice tone="neutral" icon="lock">
          Não mudam depois do cadastro: valor base ({formatMoney(player.base_value)}), indicadores e
          potencial.
        </Notice>
      </Modal>
    </FormProvider>
  )
}
