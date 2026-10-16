import { DataTable } from '../../components/DataTable'
import { useStandings } from '../../hooks/useStandings'
import { STANDING_COLUMNS } from './standingColumns'

export function StandingsPage() {
  const standings = useStandings()

  return (
    <section className="page">
      <header className="page__header">
        <h1>Classificação</h1>
      </header>
      <DataTable
        caption="Classificação"
        columns={STANDING_COLUMNS}
        rows={standings.data}
        getRowKey={(row) => row.club_id}
        isLoading={standings.isLoading}
        error={standings.error}
        emptyMessage="Nenhum clube cadastrado."
        onRetry={standings.reload}
      />
    </section>
  )
}
