import { useCallback } from 'react'
import { getClub, listClubs } from '../api/clubs'
import type { ClubSort } from '../api/types'
import { useApiQuery } from './useApiQuery'

export function useClubs(sort?: ClubSort) {
  const fetchClubs = useCallback(() => listClubs(sort), [sort])
  return useApiQuery(fetchClubs)
}

export function useClubDetails(clubId: number) {
  const fetchClub = useCallback(() => getClub(clubId), [clubId])
  return useApiQuery(fetchClub)
}
