import type { DuelPlayer, MatchDetails } from '../../api/types'
import { arrangeOnField, sectorOf } from '../../config/formations'
import type { SideKey } from './matchSides'

const HALF_PITCH = 50
const FULL_PITCH = 100

export interface FieldPlayer {
  player: DuelPlayer
  appearances: DuelPlayer[]
  scored: boolean
  x: number
  y: number
}

type DuelAppearance = Omit<FieldPlayer, 'x' | 'y'>

function collectAppearances(match: MatchDetails, clubId: number): DuelAppearance[] {
  const byPlayer = new Map<number, DuelAppearance>()
  for (const duel of match.duels) {
    const isAttacking = duel.attacking_club_id === clubId
    const player = isAttacking ? duel.attacker : duel.defender
    const known = byPlayer.get(player.player_id)
    byPlayer.set(player.player_id, {
      player,
      appearances: [...(known?.appearances ?? []), player],
      scored: (known?.scored ?? false) || (isAttacking && duel.goal),
    })
  }
  return [...byPlayer.values()]
}

export function placeSidePlayers(match: MatchDetails, sideKey: SideKey): FieldPlayer[] {
  const entries = collectAppearances(match, match[sideKey].club_id).map((appearance) => ({
    item: appearance,
    sector: sectorOf(appearance.player.position),
  }))
  return arrangeOnField(entries).map(({ item, depth, spread }) => ({
    ...item,
    x: sideKey === 'home' ? depth * HALF_PITCH : FULL_PITCH - depth * HALF_PITCH,
    y: spread * FULL_PITCH,
  }))
}
