import { createContext, useCallback, useContext, useMemo } from 'react'
import { listClubs } from '../api/clubs'
import { listMatches } from '../api/matches'
import { listPlayers } from '../api/players'
import type { Club, Match } from '../api/types'
import { useApiQuery, type ApiQuery } from './useApiQuery'

export interface League {
  clubs: ApiQuery<Club[]>
  matches: ApiQuery<Match[]>
  playerCount: ApiQuery<number>
  reload: () => void
}

export const LeagueContext = createContext<League | null>(null)

const fetchClubsByName = () => listClubs('name')
const fetchAllMatches = () => listMatches({})
const fetchPlayerCount = () =>
  listPlayers({ page: 1, limit: 1 }).then((page) => page.meta.total_items)

export function useLeagueData(): League {
  const clubs = useApiQuery(fetchClubsByName)
  const matches = useApiQuery(fetchAllMatches)
  const playerCount = useApiQuery(fetchPlayerCount)
  const { reload: reloadClubs } = clubs
  const { reload: reloadMatches } = matches
  const { reload: reloadPlayerCount } = playerCount

  const reload = useCallback(() => {
    reloadClubs()
    reloadMatches()
    reloadPlayerCount()
  }, [reloadClubs, reloadMatches, reloadPlayerCount])

  return useMemo(
    () => ({ clubs, matches, playerCount, reload }),
    [clubs, matches, playerCount, reload],
  )
}

export function useLeague(): League {
  const league = useContext(LeagueContext)
  if (!league) {
    throw new Error('useLeague must be used inside LeagueProvider.')
  }
  return league
}

export function useLeagueReload(): (() => void) | undefined {
  return useContext(LeagueContext)?.reload
}
