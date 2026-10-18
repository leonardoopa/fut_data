import type { Match } from '../../api/types'
import type { Column } from '../../components/DataTable'
import { formatDate, formatTime } from '../../format/dateTime'
import { ClubLabel } from './ClubLabel'
import { DuelsLink, MatchResultBadge } from './MatchScoreboard'

export const MATCH_COLUMNS: Column<Match>[] = [
  {
    key: 'played_at',
    header: 'Data e hora',
    render: (match) => (
      <span className="date-time">
        {formatDate(match.played_at)}
        <span className="date-time__time">{formatTime(match.played_at)}</span>
      </span>
    ),
  },
  {
    key: 'home',
    header: 'Mandante',
    align: 'end',
    render: (match) => (
      <ClubLabel clubId={match.home.club_id} badgeSide="end">
        {match.home.club_name}
      </ClubLabel>
    ),
  },
  {
    key: 'score',
    header: 'Placar',
    align: 'center',
    render: (match) => (
      <span className="score-chip">{`${match.home.goals} × ${match.away.goals}`}</span>
    ),
  },
  {
    key: 'away',
    header: 'Visitante',
    render: (match) => <ClubLabel clubId={match.away.club_id}>{match.away.club_name}</ClubLabel>,
  },
  {
    key: 'result',
    header: 'Resultado',
    render: (match) => <MatchResultBadge result={match.result} />,
  },
  {
    key: 'duels',
    header: <span className="visually-hidden">Duelos</span>,
    align: 'end',
    render: (match) => <DuelsLink match={match} variant="text" />,
  },
]
