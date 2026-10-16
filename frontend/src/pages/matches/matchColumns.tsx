import { Link } from 'react-router-dom'
import type { Match } from '../../api/types'
import type { Column } from '../../components/DataTable'
import { formatDateTime } from '../../format/dateTime'
import { MATCH_RESULT_LABELS } from '../../format/labels'

export const MATCH_COLUMNS: Column<Match>[] = [
  {
    key: 'played_at',
    header: 'Data e hora',
    render: (match) => formatDateTime(match.played_at),
  },
  { key: 'home', header: 'Mandante', render: (match) => match.home.club_name },
  {
    key: 'score',
    header: 'Placar',
    render: (match) => `${match.home.goals} × ${match.away.goals}`,
  },
  { key: 'away', header: 'Visitante', render: (match) => match.away.club_name },
  { key: 'result', header: 'Resultado', render: (match) => MATCH_RESULT_LABELS[match.result] },
  {
    key: 'actions',
    header: 'Ações',
    render: (match) => (
      <Link
        to={`/matches/${match.id}`}
        className="table-link"
        aria-label={`Ver duelos de ${match.home.club_name} × ${match.away.club_name} em ${formatDateTime(match.played_at)}`}
      >
        Ver duelos
      </Link>
    ),
  },
]
