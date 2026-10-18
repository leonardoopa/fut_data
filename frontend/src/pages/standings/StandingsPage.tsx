import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { intentState } from '../../hooks/useIntent'
import { useStandings } from '../../hooks/useStandings'
import { RecentMatchesCard } from './RecentMatchesCard'
import { STANDING_COLUMNS } from './standingColumns'
import './standings.css'

const TABLE_ORDER = [
  'Mais pontos',
  'Maior saldo de gols',
  'Mais gols marcados',
  'Nome do clube, de A a Z',
]

const LEGEND =
  'J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos'

export function StandingsPage() {
  const standings = useStandings()
  const navigate = useNavigate()
  const hasRows = Boolean(standings.data?.length) && !standings.isLoading

  return (
    <section className="page">
      <PageHeader
        icon="listOrdered"
        title="Classificação"
        subtitle="Todos os clubes, com 3 pontos por vitória e 1 por empate."
        actions={
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => navigate('/matches', { state: intentState('playMatch') })}
          >
            Nova partida
          </Button>
        }
      />

      <div className="standings-layout">
        <Card flush footer={hasRows ? <p className="standings-legend">{LEGEND}</p> : undefined}>
          <DataTable
            caption="Classificação"
            columns={STANDING_COLUMNS}
            rows={standings.data}
            getRowKey={(row) => row.club_id}
            isLoading={standings.isLoading}
            loadingLabel="Carregando a classificação…"
            error={standings.error}
            errorTitle="Não foi possível carregar a classificação"
            onRetry={standings.reload}
            empty={{
              icon: 'listOrdered',
              title: 'Nenhum clube cadastrado',
              description: 'A classificação mostra todos os clubes, mesmo sem partidas jogadas.',
            }}
          />
        </Card>

        <div className="standings-aside">
          <RecentMatchesCard />
          <Card title="Ordem da tabela" description="Critérios de classificação, nesta ordem.">
            <ol className="table-order card__body">
              {TABLE_ORDER.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <p className="page-note">
        Clubes sem partidas aparecem zerados. Pontos, saldo e posição vêm da API a cada consulta, na
        ordem devolvida por ela.
      </p>
    </section>
  )
}
