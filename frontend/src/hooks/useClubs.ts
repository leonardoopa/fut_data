import { useCallback } from 'react'
import { getClub, listClubs } from '../api/clubs'
import type { ClubSort } from '../api/types'
import { useApiQuery } from './useApiQuery'
import { useLeague } from './useLeague'

const LEAGUE_CLUB_SORT: ClubSort = 'name'

export function useClubs(sort: ClubSort) {
  const league = useLeague()
  const usesLeagueList = sort === LEAGUE_CLUB_SORT
  const fetchClubs = useCallback(() => listClubs(sort), [sort])
  const sorted = useApiQuery(usesLeagueList ? null : fetchClubs)
  return usesLeagueList ? league.clubs : sorted
}

export function useClubDetails(clubId: number) {
  const fetchClub = useCallback(() => getClub(clubId), [clubId])
  return useApiQuery(fetchClub)
}
