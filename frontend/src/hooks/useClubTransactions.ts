import { useCallback, useMemo, useState } from 'react'
import { exportClubTransactions, listClubTransactions } from '../api/clubs'
import type { Transaction, TransactionFilters } from '../api/types'
import { useAction } from './useAction'
import { useApiQuery } from './useApiQuery'

export interface HistoryPlayer {
  id: number
  name: string
}

export const NO_TRANSACTION_FILTERS: TransactionFilters = { types: [] }

function listHistoryPlayers(transactions: Transaction[]): HistoryPlayer[] {
  const namesById = new Map(
    transactions.map((transaction) => [transaction.player_id, transaction.player_name]),
  )
  return [...namesById]
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

export function useClubTransactions(clubId: number) {
  const [filters, setFilters] = useState<TransactionFilters>(NO_TRANSACTION_FILTERS)

  const fetchFiltered = useCallback(() => listClubTransactions(clubId, filters), [clubId, filters])
  const fetchComplete = useCallback(
    () => listClubTransactions(clubId, NO_TRANSACTION_FILTERS),
    [clubId],
  )
  const filtered = useApiQuery(fetchFiltered)
  const complete = useApiQuery(fetchComplete)

  const players = useMemo(() => listHistoryPlayers(complete.data?.data ?? []), [complete.data])
  const exportCsv = useAction(() => exportClubTransactions(clubId, filters), {
    successMessage: (fileName) => `Arquivo "${fileName}" baixado.`,
  })

  const { reload: reloadFiltered } = filtered
  const { reload: reloadComplete } = complete
  const reload = useCallback(() => {
    reloadFiltered()
    reloadComplete()
  }, [reloadFiltered, reloadComplete])

  return {
    ...filtered,
    reload,
    filters,
    applyFilters: setFilters,
    players,
    exportCsv,
  }
}

export type ClubTransactions = ReturnType<typeof useClubTransactions>
