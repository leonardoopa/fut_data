import { useState } from 'react'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { SelectField } from '../../components/FormField'
import type { StateContent } from '../../components/StatePanel'
import { useLeague } from '../../hooks/useLeague'
import { useMatchHistory } from '../../hooks/useMatches'
import { MATCH_COLUMNS } from './matchColumns'

const NO_CLUB_MATCHES: StateContent = {
  icon: 'searchX',
  title: 'Nenhuma partida desse clube',
  description: 'Escolha outro clube no filtro ou volte para todos os clubes.',
}

function countLabel(count: number): string {
  return count === 1 ? '1 partida' : `${count} partidas`
}

export function MatchHistoryCard({ emptyLeague }: { emptyLeague: StateContent }) {
  const { clubs } = useLeague()
  const [clubId, setClubId] = useState<number>()
  const history = useMatchHistory(clubId)
  const count = history.isLoading ? undefined : history.data?.length

  return (
    <Card
      title="Histórico de partidas"
      description="Da mais recente para a mais antiga."
      flush
      actions={
        <SelectField
          label="Filtrar por clube"
          hideLabel
          icon="shield"
          value={clubId ?? ''}
          onChange={(event) =>
            setClubId(event.target.value ? Number(event.target.value) : undefined)
          }
        >
          <option value="">Todos os clubes</option>
          {clubs.data?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} ({club.acronym})
            </option>
          ))}
        </SelectField>
      }
      footer={count ? <p className="muted">{countLabel(count)}</p> : undefined}
    >
      <DataTable
        caption="Histórico de partidas"
        columns={MATCH_COLUMNS}
        rows={history.data}
        getRowKey={(match) => match.id}
        isLoading={history.isLoading}
        loadingLabel="Carregando partidas…"
        error={history.error}
        errorTitle="Não foi possível carregar as partidas"
        onRetry={history.reload}
        empty={clubId === undefined ? emptyLeague : NO_CLUB_MATCHES}
      />
    </Card>
  )
}
