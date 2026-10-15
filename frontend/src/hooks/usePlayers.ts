import { useCallback, useState } from 'react'
import { listPlayers } from '../api/players'
import type { PlayerFilters, PlayerSort } from '../api/types'
import { useApiQuery } from './useApiQuery'

export const PLAYERS_PER_PAGE = 10

export function usePlayers() {
  const [filters, setFilters] = useState<PlayerFilters>({})
  const [sort, setSort] = useState<PlayerSort>()
  const [page, setPage] = useState(1)

  const fetchPlayers = useCallback(
    () => listPlayers({ ...filters, sort, page, limit: PLAYERS_PER_PAGE }),
    [filters, sort, page],
  )
  const query = useApiQuery(fetchPlayers)

  function applyFilters(nextFilters: PlayerFilters) {
    setFilters(nextFilters)
    setPage(1)
  }

  function changeSort(nextSort: PlayerSort | undefined) {
    setSort(nextSort)
    setPage(1)
  }

  function reloadAfterRemoval() {
    const isLastRowOfPage = query.data?.data.length === 1 && page > 1
    if (isLastRowOfPage) {
      setPage(page - 1)
    } else {
      query.reload()
    }
  }

  return {
    ...query,
    filters,
    sort,
    page,
    applyFilters,
    changeSort,
    goToPage: setPage,
    reloadAfterRemoval,
  }
}
