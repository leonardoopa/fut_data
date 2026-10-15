import { Link } from 'react-router-dom'
import type { Club } from '../../api/types'
import type { Column } from '../../components/DataTable'
import { formatMoney } from '../../format/money'

export const CLUB_COLUMNS: Column<Club>[] = [
  {
    key: 'name',
    header: 'Nome',
    render: (club) => (
      <Link to={`/clubs/${club.id}`} className="table-link">
        {club.name}
      </Link>
    ),
  },
  { key: 'acronym', header: 'Sigla', render: (club) => club.acronym },
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
    render: (club) => formatMoney(club.net_worth),
  },
]
