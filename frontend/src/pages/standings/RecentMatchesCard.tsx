import { Link } from 'react-router-dom'
import type { Match } from '../../api/types'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { ErrorState, LoadingState, StatePanel } from '../../components/StatePanel'
import { formatDateTime } from '../../format/dateTime'
import { useLeague } from '../../hooks/useLeague'

const RECENT_MATCHES_LIMIT = 5

function clubClass(isWinner: boolean): string {
  return isWinner ? 'recent-match__club recent-match__club--winner' : 'recent-match__club'
}

function RecentMatch({ match }: { match: Match }) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="recent-match"
      aria-label={`Ver duelos de ${match.home.club_name} × ${match.away.club_name} em ${formatDateTime(match.played_at)}`}
    >
      <span className="recent-match__date">{formatDateTime(match.played_at)}</span>
      <span className="recent-match__line">
        <span className={clubClass(match.result === 'MANDANTE')}>{match.home.club_name}</span>
        <span className="recent-match__score">{`${match.home.goals} × ${match.away.goals}`}</span>
        <span className={clubClass(match.result === 'VISITANTE')}>{match.away.club_name}</span>
      </span>
    </Link>
  )
}

export function RecentMatchesCard() {
  const { matches } = useLeague()

  function renderBody() {
    if (matches.isLoading) return <LoadingState label="Carregando partidas…" />
    if (matches.error) {
      return (
        <ErrorState
          title="Não foi possível carregar as partidas"
          error={matches.error}
          onRetry={matches.reload}
        />
      )
    }
    if (!matches.data?.length) {
      return (
        <StatePanel
          icon="swords"
          title="Nenhuma partida jogada"
          description="As partidas aparecem aqui assim que forem jogadas."
        />
      )
    }
    return (
      <ol className="recent-matches">
        {matches.data.slice(0, RECENT_MATCHES_LIMIT).map((match) => (
          <li key={match.id}>
            <RecentMatch match={match} />
          </li>
        ))}
      </ol>
    )
  }

  return (
    <Card
      title="Últimas partidas"
      description="Da mais recente para a mais antiga."
      footer={
        <Link to="/matches" className="recent-matches__more">
          Ver todas as partidas
          <Icon name="arrowRight" size={14} />
        </Link>
      }
    >
      <div className="card__body">{renderBody()}</div>
    </Card>
  )
}
