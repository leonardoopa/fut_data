import { Link, useParams } from 'react-router-dom'
import type { MatchDetails } from '../../api/types'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { ErrorState, LoadingState } from '../../components/StatePanel'
import { useMatchDetails } from '../../hooks/useMatches'
import { buildDuelColumns, buildDuelGroup } from './duelColumns'
import { MatchPitchCard } from './MatchPitchCard'
import { MatchScoreboard } from './MatchScoreboard'
import './matches.css'

function MatchReport({ match }: { match: MatchDetails }) {
  return (
    <>
      <Card>
        <div className="card__body">
          <MatchScoreboard match={match} />
        </div>
      </Card>
      <MatchPitchCard match={match} />
      <Card
        title="Duelos"
        description="Os 6 duelos devolvidos pela API, na ordem em que aconteceram, agrupados pelo clube que ataca."
        flush
      >
        <DataTable
          caption="Duelos da partida"
          columns={buildDuelColumns(match)}
          rows={match.duels}
          getRowKey={(duel) => duel.order}
          getGroup={(duel) => buildDuelGroup(match, duel)}
          isLoading={false}
          empty={{ icon: 'swords', title: 'Nenhum duelo registrado' }}
        />
      </Card>
      <p className="page-note">
        Placar, duelos, atributos e valores vêm da API, sem recálculo na tela. O valor de quem está
        mal condicionado já chega com o desconto da condição.
      </p>
    </>
  )
}

export function MatchPage() {
  const matchId = Number(useParams().matchId)
  const match = useMatchDetails(matchId)

  function renderContent() {
    if (match.data) return <MatchReport match={match.data} />
    if (match.error) {
      return (
        <ErrorState
          title="Não foi possível carregar a partida"
          error={match.error}
          onRetry={match.reload}
        />
      )
    }
    return (
      <Card>
        <div className="card__body">
          <LoadingState label="Carregando a partida…" />
        </div>
      </Card>
    )
  }

  return (
    <section className="page">
      <Link to="/matches" className="back-link">
        <Icon name="arrowLeft" size={14} />
        Voltar para partidas
      </Link>
      <h1 className="visually-hidden">
        {match.data ? `${match.data.home.club_name} × ${match.data.away.club_name}` : 'Partida'}
      </h1>
      {renderContent()}
    </section>
  )
}
