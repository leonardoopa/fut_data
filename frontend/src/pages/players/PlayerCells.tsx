import { Link } from 'react-router-dom'
import type { Club, Player } from '../../api/types'
import { ClubBadge } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Menu } from '../../components/Menu'
import { Popover } from '../../components/Popover'

const FREE_PLAYERS_ONLY = 'Disponível só para jogadores livres.'

export interface PlayerRowActions {
  onDetails: (player: Player) => void
  onBuy: (player: Player) => void
  onEdit: (player: Player) => void
  onChangeCondition: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayerClub({
  clubId,
  clubsById,
}: {
  clubId: number | null
  clubsById: Map<number, Club>
}) {
  if (clubId === null) return <Badge tone="neutral">Livre</Badge>
  const club = clubsById.get(clubId)
  if (!club) return <>Clube {clubId}</>
  return (
    <span className="club-cell">
      <ClubBadge acronym={club.acronym} />
      <Link to={`/clubs/${club.id}`} className="table-link">
        {club.name}
      </Link>
    </span>
  )
}

export function PlayerRowMenu({ player, ...actions }: PlayerRowActions & { player: Player }) {
  const isFree = player.club_id === null
  return (
    <Popover
      variant="icon"
      icon="moreHorizontal"
      label={null}
      ariaLabel={`Ações de ${player.name}`}
    >
      {(close) => (
        <Menu
          label={`Ações de ${player.name}`}
          heading={player.name}
          onClose={close}
          items={[
            {
              key: 'details',
              label: 'Ver detalhes',
              icon: 'eye',
              onSelect: () => actions.onDetails(player),
            },
            {
              key: 'edit',
              label: 'Editar',
              icon: 'pencil',
              onSelect: () => actions.onEdit(player),
            },
            {
              key: 'condition',
              label: 'Alterar condição',
              icon: 'heartPulse',
              onSelect: () => actions.onChangeCondition(player),
            },
            {
              key: 'buy',
              label: 'Comprar',
              icon: 'cart',
              disabled: !isFree,
              description: isFree ? undefined : FREE_PLAYERS_ONLY,
              onSelect: () => actions.onBuy(player),
            },
            {
              key: 'delete',
              label: 'Excluir',
              icon: 'trash',
              tone: 'danger',
              disabled: !isFree,
              description: isFree ? 'Disponível porque o jogador está livre.' : FREE_PLAYERS_ONLY,
              onSelect: () => actions.onDelete(player),
            },
          ]}
        />
      )}
    </Popover>
  )
}
