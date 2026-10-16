import type { Player } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { SummaryList } from '../../components/SummaryList'
import { WarningNotice } from '../../components/WarningNotice'
import type { ClubLineup } from '../../hooks/useClubLineup'
import { ClubLineupForm } from './ClubLineupForm'
import { LINEUP_COLUMNS } from './lineupColumns'

interface ClubLineupPanelProps {
  lineup: ClubLineup
  squad: Player[]
  isSquadLoading: boolean
}

export function ClubLineupPanel({ lineup, squad, isSquadLoading }: ClubLineupPanelProps) {
  const current = lineup.isLoading ? undefined : lineup.data

  return (
    <>
      <h2>Escalação atual</h2>
      {current && !current.complete && (
        <WarningNotice>
          Escalação incompleta: o clube não pode jogar partidas até ter 1 goleiro e os 4 jogadores
          de linha da formação.
        </WarningNotice>
      )}
      {current && (
        <SummaryList
          label="Resumo da escalação"
          items={[
            { label: 'Formação', value: current.formation ?? 'Não definida' },
            { label: 'Situação', value: current.complete ? 'Completa' : 'Incompleta' },
          ]}
        />
      )}
      <DataTable
        caption="Titulares"
        columns={LINEUP_COLUMNS}
        rows={current?.players}
        getRowKey={(player) => player.id}
        isLoading={lineup.isLoading}
        error={lineup.error}
        emptyMessage="Nenhum titular escalado."
        onRetry={lineup.reload}
      />

      <h2>Editar escalação</h2>
      {current && !isSquadLoading && (
        <ClubLineupForm
          lineup={current}
          squad={squad}
          isPending={lineup.save.isPending}
          onSave={lineup.save.run}
        />
      )}
    </>
  )
}
