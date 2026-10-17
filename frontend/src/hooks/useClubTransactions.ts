import { useCallback, useMemo, useState } from 'react'
import { exportClubTransactions, listClubTransactions } from '../api/clubs'
import {
  TRANSACTION_TYPES,
  type Transaction,
  type TransactionFilters,
  type TransactionHistory,
} from '../api/types'
import { useAction } from './useAction'
import { useApiQuery } from './useApiQuery'

interface HistoryPlayer {
  id: number
  name: string
}

const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = { types: [...TRANSACTION_TYPES] }

function isDefaultTransactionFilters(filters: TransactionFilters): boolean {
  return filters.player_id === undefined && filters.types.length === TRANSACTION_TYPES.length
}

function listHistoryPlayers(transactions: Transaction[]): HistoryPlayer[] {
  const namesById = new Map(
    transactions.map((transaction) => [transaction.player_id, transaction.player_name]),
  )
  return [...namesById]
    .map(([id, name]) => ({ id, name }))
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

export function useClubTransactions(clubId: number) {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS)
  const fetchHistory = useCallback(() => listClubTransactions(clubId, filters), [clubId, filters])
  const history = useApiQuery(fetchHistory)
  const isDefault = isDefaultTransactionFilters(filters)

  const [completeHistory, setCompleteHistory] = useState<TransactionHistory>()
  const isCompleteAnswer = isDefault && !history.isLoading && history.data !== undefined
  if (isCompleteAnswer && history.data !== completeHistory) {
    setCompleteHistory(history.data)
  }

  const players = useMemo(() => listHistoryPlayers(completeHistory?.data ?? []), [completeHistory])
  const exportCsv = useAction(() => exportClubTransactions(clubId, filters), {
    success: (fileName) => ({
      title: 'CSV baixado',
      message: `${fileName}, com os filtros aplicados.`,
    }),
    errorToastTitle: 'Não foi possível exportar o CSV',
    changesLeague: false,
  })
  const resetFilters = useCallback(() => setFilters(DEFAULT_TRANSACTION_FILTERS), [])

  return {
    ...history,
    filters,
    isDefaultFilters: isDefault,
    applyFilters: setFilters,
    resetFilters,
    players,
    transactionCount: completeHistory?.data.length,
    exportCsv,
  }
}

export type ClubTransactions = ReturnType<typeof useClubTransactions>
