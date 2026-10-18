import type { DuelPlayer } from '../../api/types'
import { Avatar, Identity } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { CONDITION_LABELS, DUEL_ATTRIBUTE_LABELS } from '../../format/labels'

export function DuelPlayerCell({ player, clubName }: { player: DuelPlayer; clubName: string }) {
  return (
    <Identity
      visual={<Avatar name={player.player_name} size="sm" />}
      title={player.player_name}
      subtitle={`${player.position} · ${CONDITION_LABELS[player.condition]} · ${clubName}`}
    />
  )
}

export function DuelValue({ player }: { player: DuelPlayer }) {
  return (
    <span className="duel-value">
      <span className="muted">{DUEL_ATTRIBUTE_LABELS[player.attribute]}</span>
      <strong>{player.value}</strong>
    </span>
  )
}

export function DuelResultBadge({ goal }: { goal: boolean }) {
  return goal ? (
    <Badge tone="success" icon="ball">
      Gol
    </Badge>
  ) : (
    <Badge tone="neutral">Sem gol</Badge>
  )
}
