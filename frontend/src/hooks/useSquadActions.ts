import { sellPlayer } from '../api/players'
import { useAction } from './useAction'

interface SquadActionsOptions {
  onSold: () => void
}

export function useSquadActions({ onSold }: SquadActionsOptions) {
  const sell = useAction(sellPlayer, {
    successMessage: (sale) => `Venda de "${sale.player_name}" concluída.`,
    onSuccess: onSold,
  })

  return { sell }
}
