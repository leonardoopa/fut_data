import { changePlayerCondition, createPlayer, deletePlayer, updatePlayer } from '../api/players'
import type { Player } from '../api/types'
import { CONDITION_LABELS } from '../format/labels'
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
    successMessage: (player) => `Jogador "${player.name}" cadastrado.`,
    onSuccess: onSaved,
  })
  const update = useAction(updatePlayer, {
    successMessage: (player) => `Jogador "${player.name}" atualizado.`,
    onSuccess: onSaved,
  })
  const changeCondition = useAction(changePlayerCondition, {
    successMessage: (player) =>
      `Condição de "${player.name}" alterada para ${CONDITION_LABELS[player.condition]}.`,
    onSuccess: onSaved,
  })
  const remove = useAction(removePlayer, {
    successMessage: (player) => `Jogador "${player.name}" excluído.`,
    onSuccess: onRemoved,
  })

  return { create, update, changeCondition, remove }
}
