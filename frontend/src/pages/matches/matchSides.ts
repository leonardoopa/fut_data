import type { Match, MatchSide } from '../../api/types'
import { useLeague } from '../../hooks/useLeague'

export type SideKey = 'home' | 'away'

export const SIDE_LABELS: Record<SideKey, string> = {
  home: 'Mandante',
  away: 'Visitante',
}

export function sideKeyOf(match: Match, clubId: number): SideKey {
  return match.home.club_id === clubId ? 'home' : 'away'
}

export function opponentOf(match: Match, clubId: number): MatchSide {
  return sideKeyOf(match, clubId) === 'home' ? match.away : match.home
}

export function useClubAcronym(clubId: number): string | undefined {
  return useLeague().clubs.data?.find((club) => club.id === clubId)?.acronym
}
