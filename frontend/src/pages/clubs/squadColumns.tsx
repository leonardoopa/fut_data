import type { SquadPlayer } from '../../api/types'
import { Avatar, Identity } from '../../components/Avatar'
import { Badge, type BadgeTone } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { formatDate, formatTime } from '../../format/dateTime'
import { formatMoney } from '../../format/money'
import { formatPercent } from '../../format/percent'

const HIGH_PENALTY_RATE = 20

export function penaltyTone(rate: number): BadgeTone {
  if (rate === 0) return 'success'
  return rate >= HIGH_PENALTY_RATE ? 'danger' : 'warning'
}

interface SquadColumnsOptions {
  onSell: (player: SquadPlayer) => void
}

export function buildSquadColumns({ onSell }: SquadColumnsOptions): Column<SquadPlayer>[] {
  return [
    {
      key: 'name',
      header: 'Jogador',
      render: (player) => (
        <Identity visual={<Avatar name={player.name} size="sm" />} title={player.name} />
      ),
    },
    {
      key: 'position',
      header: 'Posição',
      render: (player) => <Badge tone="outline">{player.position}</Badge>,
    },
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
      render: (player) => <strong>{formatMoney(player.market_value)}</strong>,
    },
    {
      key: 'purchase_value',
      header: 'Valor de compra',
      align: 'end',
      render: (player) => (
        <span className="muted">{formatMoney(player.contract.purchase_value)}</span>
      ),
    },
    {
      key: 'loyalty_until',
      header: 'Fim da fidelidade',
      render: (player) => (
        <span className="date-cell">
          <span>{formatDate(player.contract.loyalty_until)}</span>
          <span className="muted">{formatTime(player.contract.loyalty_until)}</span>
        </span>
      ),
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
      render: (player) => (
        <Badge tone={penaltyTone(player.contract.penalty_rate)}>
          {formatPercent(player.contract.penalty_rate)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: <span className="visually-hidden">Ações</span>,
      align: 'end',
      render: (player) => (
        <Button
          variant="secondary"
          size="sm"
          icon="swap"
          aria-label={`Vender ${player.name}`}
          onClick={() => onSell(player)}
        >
          Vender
        </Button>
      ),
    },
  ]
}
