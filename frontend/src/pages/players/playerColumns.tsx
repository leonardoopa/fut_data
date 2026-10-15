import type { Club, Player } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'

interface PlayerColumnsOptions {
  clubsById: Map<number, Club>
  onBuy: (player: Player) => void
  onEdit: (player: Player) => void
  onChangeCondition: (player: Player) => void
  onDelete: (player: Player) => void
}

function renderClub(clubId: number | null, clubsById: Map<number, Club>) {
  if (clubId === null) {
    return <Badge tone="neutral">Livre</Badge>
  }
  const club = clubsById.get(clubId)
  return club ? <abbr title={club.name}>{club.acronym}</abbr> : `Clube ${clubId}`
}

export function buildPlayerColumns({
  clubsById,
  onBuy,
  onEdit,
  onChangeCondition,
  onDelete,
}: PlayerColumnsOptions): Column<Player>[] {
  return [
    { key: 'name', header: 'Nome', render: (player) => player.name },
    { key: 'position', header: 'Posição', render: (player) => POSITION_LABELS[player.position] },
    { key: 'overall', header: 'Overall', align: 'end', render: (player) => player.overall },
    { key: 'agility', header: 'Agilidade', align: 'end', render: (player) => player.agility },
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
      render: (player) => formatMoney(player.base_value),
    },
    {
      key: 'market_value',
      header: 'Valor de mercado',
      align: 'end',
      render: (player) => formatMoney(player.market_value),
    },
    {
      key: 'club',
      header: 'Clube',
      render: (player) => renderClub(player.club_id, clubsById),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (player) => (
        <div className="row-actions">
          {player.club_id === null && (
            <Button size="sm" aria-label={`Comprar ${player.name}`} onClick={() => onBuy(player)}>
              Comprar
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Editar ${player.name}`}
            onClick={() => onEdit(player)}
          >
            Editar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Alterar condição de ${player.name}`}
            onClick={() => onChangeCondition(player)}
          >
            Condição
          </Button>
          {player.club_id === null && (
            <Button
              variant="danger"
              size="sm"
              aria-label={`Excluir ${player.name}`}
              onClick={() => onDelete(player)}
            >
              Excluir
            </Button>
          )}
        </div>
      ),
    },
  ]
}
