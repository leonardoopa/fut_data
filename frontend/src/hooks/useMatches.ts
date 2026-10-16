import { useCallback, useState } from 'react'
import { getMatch, listMatches } from '../api/matches'
import type { MatchFilters } from '../api/types'
import { useApiQuery } from './useApiQuery'

export function useMatches() {
  const [filters, setFilters] = useState<MatchFilters>({})
  const fetchMatches = useCallback(() => listMatches(filters), [filters])
  const query = useApiQuery(fetchMatches)

  return { ...query, filters, applyFilters: setFilters }
}

export function useMatchDetails(matchId: number) {
  const fetchMatch = useCallback(() => getMatch(matchId), [matchId])
  return useApiQuery(fetchMatch)
}
