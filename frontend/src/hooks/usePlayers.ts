import { useCallback, useMemo, useState } from 'react'
import { listPlayers } from '../api/players'
import type { PlayerFilters, PlayerListQuery, PlayerSort } from '../api/types'
import { useApiQuery } from './useApiQuery'

export const PLAYERS_PER_PAGE = 10
const DEFAULT_PLAYER_SORT: PlayerSort = 'name'

export type MarketStatus = 'all' | 'free' | 'club'
export type ListFilters = Omit<PlayerFilters, 'free'>

const FREE_PARAM: Record<MarketStatus, boolean | undefined> = {
  all: undefined,
  free: true,
  club: false,
}

interface PlayerListState {
  filters: ListFilters
  status: MarketStatus
  sort: PlayerSort
  page: number
}

function defaultState(status: MarketStatus): PlayerListState {
  return { filters: {}, status, sort: DEFAULT_PLAYER_SORT, page: 1 }
}

function countQuery(filters: ListFilters, free: boolean): PlayerListQuery {
  return { ...filters, free, page: 1, limit: 1 }
}

interface MarketCounts {
  free: number
  club: number
}

async function fetchCounts(filters: ListFilters): Promise<MarketCounts> {
  const freeCount =
    filters.club_id === undefined
      ? listPlayers(countQuery(filters, true)).then((page) => page.meta.total_items)
      : Promise.resolve(0)
  const [free, club] = await Promise.all([
    freeCount,
    listPlayers(countQuery(filters, false)).then((page) => page.meta.total_items),
  ])
  return { free, club }
}

export function usePlayers(initialStatus: MarketStatus = 'all') {
  const [state, setState] = useState(() => defaultState(initialStatus))
  const { filters, status, sort, page } = state

  const fetchPlayers = useCallback(
    () =>
      listPlayers({ ...filters, free: FREE_PARAM[status], sort, page, limit: PLAYERS_PER_PAGE }),
    [filters, status, sort, page],
  )
  const fetchMarketCounts = useCallback(() => fetchCounts(filters), [filters])
  const query = useApiQuery(fetchPlayers)
  const counts = useApiQuery(fetchMarketCounts)
  const { reload: reloadPlayers } = query
  const { reload: reloadCounts } = counts

  const setFilters = useCallback(
    (changes: Partial<ListFilters>) =>
      setState((current) => ({ ...current, filters: { ...current.filters, ...changes }, page: 1 })),
    [],
  )
  const changeStatus = useCallback(
    (nextStatus: MarketStatus) =>
      setState((current) => ({ ...current, status: nextStatus, page: 1 })),
    [],
  )
  const changeSort = useCallback(
    (nextSort: PlayerSort) => setState((current) => ({ ...current, sort: nextSort, page: 1 })),
    [],
  )
  const goToPage = useCallback(
    (nextPage: number) => setState((current) => ({ ...current, page: nextPage })),
    [],
  )
  const reset = useCallback(() => setState(defaultState('all')), [])

  const reload = useCallback(() => {
    reloadPlayers()
    reloadCounts()
  }, [reloadPlayers, reloadCounts])

  function reloadAfterRemoval() {
    const isLastRowOfPage = query.data?.data.length === 1 && page > 1
    if (isLastRowOfPage) {
      goToPage(page - 1)
      reloadCounts()
    } else {
      reload()
    }
  }

  const isFiltered = useMemo(
    () =>
      status !== 'all' ||
      sort !== DEFAULT_PLAYER_SORT ||
      Object.values(filters).some((value) => value !== undefined),
    [filters, status, sort],
  )

  return {
    ...query,
    counts: counts.data,
    filters,
    status,
    sort,
    page,
    isFiltered,
    setFilters,
    changeStatus,
    changeSort,
    goToPage,
    reset,
    reload,
    reloadAfterRemoval,
  }
}

export type PlayerList = ReturnType<typeof usePlayers>
