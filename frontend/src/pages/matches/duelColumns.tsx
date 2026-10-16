import type { Duel, DuelPlayer, Match } from '../../api/types'
import { Badge } from '../../components/Badge'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { DUEL_ATTRIBUTE_LABELS, POSITION_LABELS } from '../../format/labels'

function renderPlayer(player: DuelPlayer) {
  return (
    <div className="cell-stack">
      <span>{player.player_name}</span>
      <span className="cell-stack__meta">
        {POSITION_LABELS[player.position]} <ConditionBadge condition={player.condition} />
      </span>
    </div>
  )
}

function clubName(match: Match, clubId: number): string {
  return [match.home, match.away].find((side) => side.club_id === clubId)?.club_name ?? ''
}

export function buildDuelColumns(match: Match): Column<Duel>[] {
  return [
    { key: 'order', header: 'Duelo', align: 'end', render: (duel) => duel.order },
    {
      key: 'attacking_club',
      header: 'Clube no ataque',
      render: (duel) => clubName(match, duel.attacking_club_id),
    },
    { key: 'attacker', header: 'Atacante', render: (duel) => renderPlayer(duel.attacker) },
    {
      key: 'attacker_attribute',
      header: 'Atributo de ataque',
      render: (duel) => DUEL_ATTRIBUTE_LABELS[duel.attacker.attribute],
    },
    {
      key: 'attacker_value',
      header: 'Valor de ataque',
      align: 'end',
      render: (duel) => duel.attacker.value,
    },
    { key: 'defender', header: 'Defensor', render: (duel) => renderPlayer(duel.defender) },
    {
      key: 'defender_attribute',
      header: 'Atributo de defesa',
      render: (duel) => DUEL_ATTRIBUTE_LABELS[duel.defender.attribute],
    },
    {
      key: 'defender_value',
      header: 'Valor de defesa',
      align: 'end',
      render: (duel) => duel.defender.value,
    },
    {
      key: 'goal',
      header: 'Gol',
      render: (duel) =>
        duel.goal ? <Badge tone="success">Gol</Badge> : <Badge tone="neutral">Sem gol</Badge>,
    },
  ]
}
