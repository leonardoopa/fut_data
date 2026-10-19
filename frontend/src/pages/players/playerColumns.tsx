import type { Club, Player } from '../../api/types'
import { AttributeBar } from '../../components/AttributeBar'
import { Avatar, Identity } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import { PlayerClub, PlayerRowMenu, type PlayerRowActions } from './PlayerCells'

interface PlayerColumnsOptions extends PlayerRowActions {
  clubsById: Map<number, Club>
}

export function buildPlayerColumns({
  clubsById,
  ...actions
}: PlayerColumnsOptions): Column<Player>[] {
  return [
    {
      key: 'name',
      header: 'Jogador',
      render: (player) => (
        <Identity
          visual={<Avatar name={player.name} size="sm" />}
          title={
            <button type="button" className="text-button" onClick={() => actions.onDetails(player)}>
              {player.name}
            </button>
          }
          subtitle={POSITION_LABELS[player.position]}
        />
      ),
    },
    {
      key: 'position',
      header: 'Posição',
      render: (player) => <Badge tone="outline">{player.position}</Badge>,
    },
    {
      key: 'overall',
      header: 'Overall',
      align: 'end',
      render: (player) => <strong>{player.overall}</strong>,
    },
    {
      key: 'agility',
      header: 'Agilidade',
      render: (player) => (
        <span className="metric-cell">
          {player.agility}
          <AttributeBar value={player.agility} />
        </span>
      ),
    },
    { key: 'age', header: 'Idade', align: 'end', render: (player) => player.age },
    {
      key: 'condition',
      header: 'Condição',
      render: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      key: 'base_value',
      header: 'Valor base',
      align: 'end',
      render: (player) => <span className="muted">{formatMoney(player.base_value)}</span>,
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'end',
      render: (player) => <strong>{formatMoney(player.market_value)}</strong>,
    },
    {
      key: 'club',
      header: 'Clube',
      render: (player) => <PlayerClub clubId={player.club_id} clubsById={clubsById} />,
    },
    {
      key: 'actions',
      header: <span className="visually-hidden">Ações</span>,
      align: 'end',
      render: (player) => (
        <span className="row-actions">
          {player.club_id === null && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon="cart"
                aria-label={`Comprar ${player.name}`}
                onClick={() => actions.onBuy(player)}
              >
                Comprar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon="trash"
                aria-label={`Excluir ${player.name}`}
                onClick={() => actions.onDelete(player)}
              >
                Excluir
              </Button>
            </>
          )}
          <PlayerRowMenu player={player} {...actions} />
        </span>
      ),
    },
  ]
}
