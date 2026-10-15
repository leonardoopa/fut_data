import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import type { Player, PlayerProfilePayload } from '../../api/types'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { PlayerProfileFields } from './PlayerProfileFields'
import { playerProfileSchema } from './playerSchemas'

interface PlayerEditDialogProps {
  player: Player
  isPending: boolean
  onSave: (payload: PlayerProfilePayload) => void
  onClose: () => void
}

export function PlayerEditDialog({ player, isPending, onSave, onClose }: PlayerEditDialogProps) {
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
    <Modal title={`Editar ${player.name}`} onClose={onClose}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSave)} noValidate aria-label="Edição de jogador">
          <PlayerProfileFields lockedPosition={hasClub ? player.position : undefined} />
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isPending={isPending}>
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  )
}
