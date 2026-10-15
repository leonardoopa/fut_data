import { useState } from 'react'
import type { Player, PlayerRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ResultDialog } from '../../components/ResultDialog'
import { formatMoney } from '../../format/money'
import { PlayerCreateForm } from './PlayerCreateForm'

interface PlayerCreateDialogProps {
  isPending: boolean
  onCreate: (payload: PlayerRegistrationPayload) => Promise<Player | undefined>
  onClose: () => void
}

export function PlayerCreateDialog({ isPending, onCreate, onClose }: PlayerCreateDialogProps) {
  const [createdPlayer, setCreatedPlayer] = useState<Player>()

  async function create(payload: PlayerRegistrationPayload) {
    const player = await onCreate(payload)
    if (player) setCreatedPlayer(player)
  }

  if (createdPlayer) {
    return (
      <ResultDialog
        title="Jogador cadastrado"
        description={
          <>
            <strong>{createdPlayer.name}</strong> foi cadastrado. Valores calculados pela API:
          </>
        }
        items={[
          { label: 'Overall', value: createdPlayer.overall },
          { label: 'Valor base', value: formatMoney(createdPlayer.base_value) },
          { label: 'Valor de mercado', value: formatMoney(createdPlayer.market_value) },
        ]}
        secondaryAction={
          <Button variant="secondary" onClick={() => setCreatedPlayer(undefined)}>
            Cadastrar outro
          </Button>
        }
        onClose={onClose}
      />
    )
  }

  return (
    <Modal title="Novo jogador" onClose={onClose}>
      <PlayerCreateForm isPending={isPending} onSubmit={create} onCancel={onClose} />
    </Modal>
  )
}
