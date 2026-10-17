import { useState } from 'react'
import type { Player, PlayerRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { ResultDialog } from '../../components/ResultDialog'
import { POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import type { ActionError } from '../../hooks/useAction'
import { PlayerCreateForm } from './PlayerCreateForm'

interface PlayerCreateDialogProps {
  isPending: boolean
  error: ActionError | undefined
  onCreate: (payload: PlayerRegistrationPayload) => Promise<Player | undefined>
  onShowDetails: (player: Player) => void
  onClose: () => void
}

export function PlayerCreateDialog({
  isPending,
  error,
  onCreate,
  onShowDetails,
  onClose,
}: PlayerCreateDialogProps) {
  const [createdPlayer, setCreatedPlayer] = useState<Player>()

  async function create(payload: PlayerRegistrationPayload) {
    const player = await onCreate(payload)
    if (player) setCreatedPlayer(player)
  }

  if (createdPlayer) {
    return (
      <ResultDialog
        title="Jogador cadastrado"
        description={`${createdPlayer.name} entrou livre e Apto. Valores em moedas, calculados pela API ao salvar.`}
        items={[
          {
            label: 'Valor base',
            caption: 'Calculado no cadastro; não muda depois',
            value: formatMoney(createdPlayer.base_value),
            emphasis: true,
          },
          {
            label: 'Valor de mercado',
            caption: 'Com condição, agilidade e idade',
            value: formatMoney(createdPlayer.market_value),
          },
          {
            label: 'Overall',
            caption: `Pelos pesos da posição ${POSITION_LABELS[createdPlayer.position]}`,
            value: createdPlayer.overall,
          },
        ]}
        secondaryAction={
          <Button variant="secondary" icon="eye" onClick={() => onShowDetails(createdPlayer)}>
            Ver detalhes
          </Button>
        }
        onClose={onClose}
      />
    )
  }

  return (
    <PlayerCreateForm isPending={isPending} error={error} onSubmit={create} onCancel={onClose} />
  )
}
