import type { SquadPlayer } from '../../api/types'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { formatDateTime } from '../../format/dateTime'
import { POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import { formatPercent } from '../../format/percent'

interface SquadColumnsOptions {
  onSell: (player: SquadPlayer) => void
}

export function buildSquadColumns({ onSell }: SquadColumnsOptions): Column<SquadPlayer>[] {
  return [
    { key: 'name', header: 'Nome', render: (player) => player.name },
    { key: 'position', header: 'Posição', render: (player) => POSITION_LABELS[player.position] },
    { key: 'overall', header: 'Overall', align: 'end', render: (player) => player.overall },
    {
      key: 'condition',
      header: 'Condição',
      render: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'end',
      render: (player) => formatMoney(player.market_value),
    },
    {
      key: 'purchase_value',
      header: 'Valor de compra',
      align: 'end',
      render: (player) => formatMoney(player.contract.purchase_value),
    },
    {
      key: 'loyalty_until',
      header: 'Fim da fidelidade',
      render: (player) => formatDateTime(player.contract.loyalty_until),
    },
    {
      key: 'remaining_days',
      header: 'Dias restantes',
      align: 'end',
      render: (player) => player.contract.remaining_days,
    },
    {
      key: 'penalty_rate',
      header: '% de multa',
      align: 'end',
      render: (player) => formatPercent(player.contract.penalty_rate),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (player) => (
        <Button
          variant="danger"
          size="sm"
          aria-label={`Vender ${player.name}`}
          onClick={() => onSell(player)}
        >
          Vender
        </Button>
      ),
    },
  ]
}
