import {
  buyPlayer,
  changePlayerCondition,
  createPlayer,
  deletePlayer,
  updatePlayer,
} from '../api/players'
import type { Player } from '../api/types'
import { CONDITION_LABELS } from '../format/labels'
import { formatMoney } from '../format/money'
import { useAction } from './useAction'

interface PlayerActionsOptions {
  onSaved: () => void
  onRemoved: () => void
}

async function removePlayer(player: Player): Promise<Player> {
  await deletePlayer(player.id)
  return player
}

export function usePlayerActions({ onSaved, onRemoved }: PlayerActionsOptions) {
  const create = useAction(createPlayer, {
    success: (player) => ({
      title: 'Jogador cadastrado',
      message: `${player.name} entrou livre e Apto, com overall ${player.overall}.`,
    }),
    onSuccess: onSaved,
  })
  const update = useAction(updatePlayer, {
    success: (player) => ({
      title: 'Jogador atualizado',
      message: `${player.name} foi salvo. Valor de mercado: ${formatMoney(player.market_value)}.`,
    }),
    onSuccess: onSaved,
  })
  const changeCondition = useAction(changePlayerCondition, {
    success: (player) => ({
      title: 'Condição alterada',
      message: `${player.name} agora está ${CONDITION_LABELS[player.condition]}. Valor de mercado: ${formatMoney(player.market_value)}.`,
    }),
    onSuccess: onSaved,
  })
  const remove = useAction(removePlayer, {
    success: (player) => ({
      title: 'Jogador excluído',
      message: `${player.name} saiu da lista de jogadores.`,
    }),
    onSuccess: onRemoved,
  })
  const buy = useAction(buyPlayer, {
    success: (purchase) => ({
      title: 'Compra concluída',
      message: `${purchase.player_name} foi comprado. Novo caixa: ${formatMoney(purchase.club_cash)}.`,
    }),
    onSuccess: onSaved,
  })

  return { create, update, changeCondition, remove, buy }
}
