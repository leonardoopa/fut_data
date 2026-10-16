import type { MatchDetails } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { SummaryList } from '../../components/SummaryList'
import { formatDateTime } from '../../format/dateTime'
import { MATCH_RESULT_LABELS } from '../../format/labels'
import { buildDuelColumns } from './duelColumns'

export function MatchReport({ match }: { match: MatchDetails }) {
  const { home, away } = match

  return (
    <div className="match-report">
      <p className="scoreboard">
        <span className="scoreboard__club">{home.club_name}</span>
        <span className="scoreboard__score">
          {home.goals} × {away.goals}
        </span>
        <span className="scoreboard__club">{away.club_name}</span>
      </p>
      <SummaryList
        label="Dados da partida"
        items={[
          { label: 'Resultado', value: MATCH_RESULT_LABELS[match.result] },
          { label: 'Formação do mandante', value: home.formation },
          { label: 'Formação do visitante', value: away.formation },
          { label: 'Data e hora', value: formatDateTime(match.played_at) },
        ]}
      />
      <h3>Duelos</h3>
      <DataTable
        caption="Duelos da partida"
        columns={buildDuelColumns(match)}
        rows={match.duels}
        getRowKey={(duel) => duel.order}
        isLoading={false}
        emptyMessage="Nenhum duelo registrado."
      />
    </div>
  )
}
