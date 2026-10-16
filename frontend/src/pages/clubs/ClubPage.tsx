import { Link, useParams } from 'react-router-dom'
import { QueryStatus } from '../../components/QueryStatus'
import { SummaryList } from '../../components/SummaryList'
import { Tabs } from '../../components/Tabs'
import { formatMoney } from '../../format/money'
import { useClubLineup } from '../../hooks/useClubLineup'
import { useClubDetails } from '../../hooks/useClubs'
import { useClubTransactions } from '../../hooks/useClubTransactions'
import { useSquadActions } from '../../hooks/useSquadActions'
import { ClubLineupPanel } from './ClubLineupPanel'
import { ClubSquadPanel } from './ClubSquadPanel'
import { ClubTransactionsPanel } from './ClubTransactionsPanel'

export function ClubPage() {
  const clubId = Number(useParams().clubId)
  const club = useClubDetails(clubId)
  const history = useClubTransactions(clubId)
  const lineup = useClubLineup(clubId)
  const actions = useSquadActions({
    onSold: () => {
      club.reload()
      history.reload()
      lineup.reload()
    },
  })

  function renderContent() {
    if (!club.data) {
      return <QueryStatus isLoading={club.isLoading} error={club.error} onRetry={club.reload} />
    }
    return (
      <>
        <SummaryList
          label="Finanças do clube"
          items={[
            { label: 'Caixa', value: formatMoney(club.data.cash) },
            { label: 'Valor do elenco', value: formatMoney(club.data.squad_value) },
            { label: 'Patrimônio', value: formatMoney(club.data.net_worth) },
          ]}
        />
        <Tabs
          label="Seções do clube"
          tabs={[
            {
              id: 'squad',
              label: 'Elenco',
              content: (
                <ClubSquadPanel
                  players={club.data.players}
                  isLoading={club.isLoading}
                  isSelling={actions.sell.isPending}
                  onSell={(player) => actions.sell.run(player.id)}
                />
              ),
            },
            {
              id: 'lineup',
              label: 'Escalação',
              content: (
                <ClubLineupPanel
                  lineup={lineup}
                  squad={club.data.players}
                  isSquadLoading={club.isLoading}
                />
              ),
            },
            {
              id: 'transactions',
              label: 'Histórico de transações',
              content: <ClubTransactionsPanel history={history} />,
            },
          ]}
        />
      </>
    )
  }

  return (
    <section className="page">
      <header className="page__header">
        <div className="page__title">
          <Link to="/clubs" className="back-link">
            ← Clubes
          </Link>
          <h1>{club.data ? `${club.data.name} (${club.data.acronym})` : 'Clube'}</h1>
        </div>
      </header>
      {renderContent()}
    </section>
  )
}
