import { Link } from 'react-router-dom'
import type { Standing } from '../../api/types'
import type { Column } from '../../components/DataTable'

export const STANDING_COLUMNS: Column<Standing>[] = [
  { key: 'position', header: 'Posição', align: 'end', render: (row) => `${row.position}º` },
  {
    key: 'club',
    header: 'Clube',
    render: (row) => (
      <Link to={`/clubs/${row.club_id}`} className="table-link">
        {row.club_name}
      </Link>
    ),
  },
  { key: 'played', header: 'Jogos', align: 'end', render: (row) => row.played },
  { key: 'wins', header: 'Vitórias', align: 'end', render: (row) => row.wins },
  { key: 'draws', header: 'Empates', align: 'end', render: (row) => row.draws },
  { key: 'losses', header: 'Derrotas', align: 'end', render: (row) => row.losses },
  { key: 'goals_for', header: 'Gols marcados', align: 'end', render: (row) => row.goals_for },
  {
    key: 'goals_against',
    header: 'Gols sofridos',
    align: 'end',
    render: (row) => row.goals_against,
  },
  { key: 'goal_difference', header: 'Saldo', align: 'end', render: (row) => row.goal_difference },
  { key: 'points', header: 'Pontos', align: 'end', render: (row) => <strong>{row.points}</strong> },
]
