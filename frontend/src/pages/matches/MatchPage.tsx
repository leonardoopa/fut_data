import { Link, useParams } from 'react-router-dom'
import { QueryStatus } from '../../components/QueryStatus'
import { useMatchDetails } from '../../hooks/useMatches'
import { MatchReport } from './MatchReport'

export function MatchPage() {
  const matchId = Number(useParams().matchId)
  const match = useMatchDetails(matchId)

  return (
    <section className="page">
      <header className="page__header">
        <div className="page__title">
          <Link to="/matches" className="back-link">
            ← Partidas
          </Link>
          <h1>
            {match.data ? `${match.data.home.club_name} × ${match.data.away.club_name}` : 'Partida'}
          </h1>
        </div>
      </header>
      {match.data ? (
        <MatchReport match={match.data} />
      ) : (
        <QueryStatus isLoading={match.isLoading} error={match.error} onRetry={match.reload} />
      )}
    </section>
  )
}
