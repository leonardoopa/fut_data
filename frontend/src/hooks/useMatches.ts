import { useCallback, useMemo } from 'react'
import { getMatch, listMatches } from '../api/matches'
import { useApiQuery } from './useApiQuery'
import { useLeague } from './useLeague'

export function useMatchHistory(clubId: number | undefined) {
  const league = useLeague()
  const fetchClubMatches = useMemo(
    () => (clubId === undefined ? null : () => listMatches({ club_id: clubId })),
    [clubId],
  )
  const clubMatches = useApiQuery(fetchClubMatches)
  return clubId === undefined ? league.matches : clubMatches
}

export function useMatchDetails(matchId: number) {
  const fetchMatch = useCallback(() => getMatch(matchId), [matchId])
  return useApiQuery(fetchMatch)
}
