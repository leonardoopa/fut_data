import type { ReactNode } from 'react'
import type { Standing } from '../../api/types'
import type { Column } from '../../components/DataTable'
import { ClubLabel } from '../matches/ClubLabel'
import { Abbreviation, StandingPosition } from './StandingCells'

function formatGoalDifference(goalDifference: number): string {
  return goalDifference > 0 ? `+${goalDifference}` : String(goalDifference)
}

function numberColumn(
  key: keyof Standing,
  short: string,
  full: string,
  render: (row: Standing) => ReactNode = (row) => row[key],
): Column<Standing> {
  return { key, header: <Abbreviation short={short} full={full} />, align: 'end', render }
}

export const STANDING_COLUMNS: Column<Standing>[] = [
  {
    key: 'position',
    header: <Abbreviation short="#" full="Posição" />,
    align: 'center',
    render: (row) => <StandingPosition position={row.position} />,
  },
  {
    key: 'club',
    header: 'Clube',
    render: (row) => (
      <ClubLabel clubId={row.club_id} linkToClub>
        {row.club_name}
      </ClubLabel>
    ),
  },
  numberColumn('played', 'J', 'Jogos'),
  numberColumn('wins', 'V', 'Vitórias'),
  numberColumn('draws', 'E', 'Empates'),
  numberColumn('losses', 'D', 'Derrotas'),
  numberColumn('goals_for', 'GP', 'Gols marcados'),
  numberColumn('goals_against', 'GC', 'Gols sofridos'),
  numberColumn('goal_difference', 'SG', 'Saldo de gols', (row) =>
    formatGoalDifference(row.goal_difference),
  ),
  numberColumn('points', 'Pts', 'Pontos', (row) => <strong>{row.points}</strong>),
]
