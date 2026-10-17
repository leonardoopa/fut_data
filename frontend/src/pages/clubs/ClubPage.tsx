import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClubBadge } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { StatGrid } from '../../components/StatGrid'
import { LoadingState, StatePanel } from '../../components/StatePanel'
import { Tabs } from '../../components/Tabs'
import { MAX_SQUAD_SIZE } from '../../config/league'
import { formatMoney } from '../../format/money'
import { useClubLineup } from '../../hooks/useClubLineup'
import { useClubDetails } from '../../hooks/useClubs'
import { useClubTransactions } from '../../hooks/useClubTransactions'
import { intentState } from '../../hooks/useIntent'
import { useSquadActions } from '../../hooks/useSquadActions'
import { ClubLineupPanel } from './ClubLineupPanel'
import { ClubSquadPanel } from './ClubSquadPanel'
import { ClubTransactionsPanel } from './ClubTransactionsPanel'

type ClubTab = 'squad' | 'lineup' | 'history'

export function ClubPage() {
  const clubId = Number(useParams().clubId)
  const navigate = useNavigate()
  const club = useClubDetails(clubId)
  const history = useClubTransactions(clubId)
  const lineup = useClubLineup(clubId)
  const [activeTab, setActiveTab] = useState<ClubTab>('squad')
  const { sell } = useSquadActions({
    onSold: () => {
      club.reload()
      history.reload()
      lineup.reload()
    },
  })

  function browseFreePlayers() {
    navigate('/players', { state: intentState('browseFreePlayers') })
  }

  if (!club.data) {
    return (
      <section className="page">
        {club.error ? (
          <StatePanel
            icon="searchX"
            tone="danger"
            role="alert"
            title="Não foi possível abrir o clube"
            description={`${club.error} O endereço pode estar errado ou o clube não existe mais.`}
            action={
              <span className="state-panel__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  icon="arrowLeft"
                  onClick={() => navigate('/clubs')}
                >
                  Voltar para clubes
                </Button>
                <Button variant="secondary" size="sm" icon="refresh" onClick={club.reload}>
                  Tentar de novo
                </Button>
              </span>
            }
          />
        ) : (
          <Card>
            <LoadingState label="Carregando clube…" />
          </Card>
        )}
      </section>
    )
  }

  const details = club.data
  const squadSize = details.players.length
  const starterIds = new Set(lineup.data?.players.map((player) => player.id))

  return (
    <section className="page">
      <PageHeader
        visual={<ClubBadge acronym={details.acronym} size="lg" />}
        title={details.name}
        subtitle={
          <>
            <Badge tone="outline">Sigla {details.acronym}</Badge>
            <Badge tone="outline" icon="shirt">
              {squadSize} de {MAX_SQUAD_SIZE} jogadores
            </Badge>
          </>
        }
        actions={
          <Button icon="cart" onClick={browseFreePlayers}>
            Comprar jogadores
          </Button>
        }
      />

      <StatGrid
        label="Finanças do clube"
        variant="cards"
        items={[
          {
            label: 'Caixa',
            icon: 'coins',
            value: formatMoney(details.cash),
            suffix: 'moedas',
            caption: 'Só muda por compras e vendas',
          },
          {
            label: 'Valor do elenco',
            icon: 'tag',
            value: formatMoney(details.squad_value),
            suffix: 'moedas',
            caption: 'Soma dos valores de mercado',
          },
          {
            label: 'Patrimônio',
            icon: 'landmark',
            value: formatMoney(details.net_worth),
            suffix: 'moedas',
            caption: 'Caixa + valor do elenco',
          },
          {
            label: 'Elenco',
            icon: 'shirt',
            value: `${squadSize} de ${MAX_SQUAD_SIZE}`,
            caption: `Limite de ${MAX_SQUAD_SIZE} jogadores`,
          },
        ]}
      />

      <Tabs<ClubTab>
        label="Seções do clube"
        activeId={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'squad',
            label: 'Elenco',
            icon: 'shirt',
            count: squadSize,
            content: (
              <ClubSquadPanel
                club={details}
                isLoading={club.isLoading}
                starterIds={starterIds}
                sell={sell}
                onShowHistory={() => setActiveTab('history')}
                onBrowseFreePlayers={browseFreePlayers}
              />
            ),
          },
          {
            id: 'lineup',
            label: 'Escalação',
            icon: 'clipboard',
            content: <ClubLineupPanel club={details} lineup={lineup} />,
          },
          {
            id: 'history',
            label: 'Histórico',
            icon: 'history',
            count: history.transactionCount,
            content: <ClubTransactionsPanel history={history} />,
          },
        ]}
      />
    </section>
  )
}
