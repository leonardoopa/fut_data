import { sellPlayer } from '../api/players'
import { formatMoney } from '../format/money'
import { useAction } from './useAction'

interface SquadActionsOptions {
  onSold: () => void
}

export function useSquadActions({ onSold }: SquadActionsOptions) {
  const sell = useAction(sellPlayer, {
    success: (sale) => ({
      title: 'Venda concluída',
      message: `${sale.player_name} voltou a ficar livre. Novo caixa: ${formatMoney(sale.club_cash)}.`,
    }),
    onSuccess: onSold,
  })

  return { sell }
}
