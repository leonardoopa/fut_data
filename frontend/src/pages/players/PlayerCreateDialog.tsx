import { useState } from 'react'
import type { Player, PlayerRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
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
      <Modal title="Jogador cadastrado" onClose={onClose}>
        <p>
          <strong>{createdPlayer.name}</strong> foi cadastrado. Valores calculados pela API:
        </p>
        <dl className="summary">
          <div>
            <dt>Overall</dt>
            <dd>{createdPlayer.overall}</dd>
          </div>
          <div>
            <dt>Valor base</dt>
            <dd>{formatMoney(createdPlayer.base_value)}</dd>
          </div>
          <div>
            <dt>Valor de mercado</dt>
            <dd>{formatMoney(createdPlayer.market_value)}</dd>
          </div>
        </dl>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setCreatedPlayer(undefined)}>
            Cadastrar outro
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Novo jogador" onClose={onClose}>
      <PlayerCreateForm isPending={isPending} onSubmit={create} onCancel={onClose} />
    </Modal>
  )
}
