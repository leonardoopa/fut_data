import type { Duel, MatchDetails } from '../../api/types'
import type { Column, RowGroup } from '../../components/DataTable'
import { lowerFirst } from '../../format/names'
import { ClubLabel } from './ClubLabel'
import { DuelPlayerCell, DuelResultBadge, DuelValue } from './DuelCells'
import { opponentOf, SIDE_LABELS, sideKeyOf } from './matchSides'

function goalsLabel(goals: number): string {
  return goals === 1 ? '1 gol' : `${goals} gols`
}

export function buildDuelGroup(match: MatchDetails, duel: Duel): RowGroup {
  const sideKey = sideKeyOf(match, duel.attacking_club_id)
  const side = match[sideKey]
  return {
    key: String(side.club_id),
    label: (
      <ClubLabel clubId={side.club_id}>
        Ataques do {side.club_name} ({lowerFirst(SIDE_LABELS[sideKey])})
      </ClubLabel>
    ),
    meta: goalsLabel(side.goals),
  }
}

export function buildDuelColumns(match: MatchDetails): Column<Duel>[] {
  return [
    { key: 'order', header: 'Duelo', align: 'center', render: (duel) => duel.order },
    {
      key: 'attacker',
      header: 'Atacante',
      render: (duel) => (
        <DuelPlayerCell
          player={duel.attacker}
          clubName={match[sideKeyOf(match, duel.attacking_club_id)].club_name}
        />
      ),
    },
    { key: 'attack', header: 'Ataque', render: (duel) => <DuelValue player={duel.attacker} /> },
    {
      key: 'defender',
      header: 'Defensor',
      render: (duel) => (
        <DuelPlayerCell
          player={duel.defender}
          clubName={opponentOf(match, duel.attacking_club_id).club_name}
        />
      ),
    },
    { key: 'defense', header: 'Defesa', render: (duel) => <DuelValue player={duel.defender} /> },
    { key: 'goal', header: 'Resultado', render: (duel) => <DuelResultBadge goal={duel.goal} /> },
  ]
}
