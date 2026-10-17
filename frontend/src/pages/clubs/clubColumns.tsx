import { Link } from 'react-router-dom'
import type { Club } from '../../api/types'
import { ClubBadge, Identity } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import type { Column } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { formatMoney } from '../../format/money'

export const CLUB_COLUMNS: Column<Club>[] = [
  {
    key: 'name',
    header: 'Clube',
    render: (club) => (
      <Identity visual={<ClubBadge acronym={club.acronym} size="md" />} title={club.name} />
    ),
  },
  {
    key: 'acronym',
    header: 'Sigla',
    render: (club) => <Badge tone="outline">{club.acronym}</Badge>,
  },
  { key: 'cash', header: 'Caixa', align: 'end', render: (club) => formatMoney(club.cash) },
  {
    key: 'squad_value',
    header: 'Valor do elenco',
    align: 'end',
    render: (club) => formatMoney(club.squad_value),
  },
  {
    key: 'net_worth',
    header: 'Patrimônio',
    align: 'end',
    render: (club) => <strong>{formatMoney(club.net_worth)}</strong>,
  },
  {
    key: 'open',
    header: <span className="visually-hidden">Abrir</span>,
    align: 'end',
    render: (club) => (
      <Link to={`/clubs/${club.id}`} className="row-link" aria-label={`Ver clube ${club.name}`}>
        Ver clube
        <Icon name="chevronRight" size={14} />
      </Link>
    ),
  },
]
