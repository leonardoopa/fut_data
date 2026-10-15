import type { Club, Condition, Player } from '../../api/types'
import { Badge, type BadgeTone } from '../../components/Badge'
import { Button } from '../../components/Button'
import type { Column } from '../../components/DataTable'
import { CONDITION_LABELS, POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'

const CONDITION_TONES: Record<Condition, BadgeTone> = {
  APTO: 'success',
  MAL_CONDICIONADO: 'warning',
  DOENTE: 'danger',
}

interface PlayerColumnsOptions {
  clubsById: Map<number, Club>
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
      render: (player) => (
        <Badge tone={CONDITION_TONES[player.condition]}>{CONDITION_LABELS[player.condition]}</Badge>
      ),
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
