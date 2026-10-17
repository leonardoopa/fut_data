import { useState } from 'react'
import type { MatchDetails, MatchPayload } from '../../api/types'
import { DataTable } from '../../components/DataTable'
import { SelectField } from '../../components/FormField'
import { useClubs } from '../../hooks/useClubs'
import { useMatchActions } from '../../hooks/useMatchActions'
import { useMatches } from '../../hooks/useMatches'
import { MatchForm } from './MatchForm'
import { MatchReport } from './MatchReport'
import { MATCH_COLUMNS } from './matchColumns'

export function MatchesPage() {
  const clubs = useClubs('name')
  const matches = useMatches()
  const actions = useMatchActions({ onPlayed: matches.reload })
  const [playedMatch, setPlayedMatch] = useState<MatchDetails>()
  const filteredClubId = matches.filters.club_id

  async function play(payload: MatchPayload) {
    const match = await actions.play.run(payload)
    if (match) setPlayedMatch(match)
  }

  function filterByClub(value: string) {
    matches.applyFilters({ club_id: value ? Number(value) : undefined })
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Partidas</h1>
      </header>

      <MatchForm
        clubs={clubs.data}
        clubsError={clubs.error}
        isPending={actions.play.isPending}
        onPlay={play}
      />

      {playedMatch && (
        <section className="page__section" aria-label="Resultado da partida">
          <h2>Resultado</h2>
          <MatchReport match={playedMatch} />
        </section>
      )}

      <section className="page__section" aria-label="Histórico de partidas">
        <h2>Histórico de partidas</h2>
        <div className="toolbar">
          <SelectField
            label="Filtrar por clube"
            value={filteredClubId ?? ''}
            onChange={(event) => filterByClub(event.target.value)}
          >
            <option value="">Todos os clubes</option>
            {clubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.acronym} — {club.name}
              </option>
            ))}
          </SelectField>
        </div>
        <DataTable
          caption="Histórico de partidas"
          columns={MATCH_COLUMNS}
          rows={matches.data}
          getRowKey={(match) => match.id}
          isLoading={matches.isLoading}
          error={matches.error}
          emptyMessage={
            filteredClubId === undefined
              ? 'Nenhuma partida jogada.'
              : 'Nenhuma partida desse clube.'
          }
          onRetry={matches.reload}
        />
      </section>
    </section>
  )
}
