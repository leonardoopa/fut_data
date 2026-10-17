import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Match, MatchResult, MatchSide } from '../../api/types'
import { ClubBadge } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Icon } from '../../components/Icon'
import { formatDateTime } from '../../format/dateTime'
import { MATCH_RESULT_LABELS } from '../../format/labels'
import { SIDE_LABELS, useClubAcronym, type SideKey } from './matchSides'

export function MatchResultBadge({ result }: { result: MatchResult }) {
  return <Badge tone="outline">{MATCH_RESULT_LABELS[result]}</Badge>
}

interface DuelsLinkProps {
  match: Match
  variant: 'text' | 'button'
}

export function DuelsLink({ match, variant }: DuelsLinkProps) {
  const className = variant === 'button' ? 'button button--secondary button--sm' : 'duels-link'
  return (
    <Link
      to={`/matches/${match.id}`}
      className={className}
      aria-label={`Ver duelos de ${match.home.club_name} × ${match.away.club_name} em ${formatDateTime(match.played_at)}`}
    >
      Ver duelos
      <Icon name="chevronRight" size={14} />
    </Link>
  )
}

function ScoreboardSide({ side, sideKey }: { side: MatchSide; sideKey: SideKey }) {
  const acronym = useClubAcronym(side.club_id)
  return (
    <div className={`scoreboard__side scoreboard__side--${sideKey}`}>
      <div className="scoreboard__club">
        <p className="scoreboard__name">{side.club_name}</p>
        <p className="scoreboard__meta">
          {SIDE_LABELS[sideKey]} · {side.formation}
        </p>
      </div>
      {acronym && <ClubBadge acronym={acronym} size="md" />}
    </div>
  )
}

interface MatchScoreboardProps {
  match: Match
  action?: ReactNode
}

export function MatchScoreboard({ match, action }: MatchScoreboardProps) {
  return (
    <div className={action ? 'scoreboard scoreboard--with-action' : 'scoreboard'}>
      <ScoreboardSide side={match.home} sideKey="home" />
      <div className="scoreboard__center">
        <p className="scoreboard__score">{`${match.home.goals} × ${match.away.goals}`}</p>
        <p className="scoreboard__date">{formatDateTime(match.played_at)}</p>
        <MatchResultBadge result={match.result} />
      </div>
      <ScoreboardSide side={match.away} sideKey="away" />
      {action && <div className="scoreboard__action">{action}</div>}
    </div>
  )
}
