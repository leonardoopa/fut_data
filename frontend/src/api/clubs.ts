import { httpClient, type QueryParams } from './client'
import type {
  Club,
  ClubDetails,
  ClubRegistrationPayload,
  ClubSort,
  TransactionFilters,
  TransactionHistory,
} from './types'

function toTransactionQuery({ types, player_id }: TransactionFilters): QueryParams {
  return { type: types.join(','), player_id }
}

export function listClubs(sort?: ClubSort): Promise<Club[]> {
  return httpClient.get<Club[]>('/clubs', { sort })
}

export function createClub(payload: ClubRegistrationPayload): Promise<Club> {
  return httpClient.post<Club>('/clubs', payload)
}

export function getClub(id: number): Promise<ClubDetails> {
  return httpClient.get<ClubDetails>(`/clubs/${id}`)
}

export function listClubTransactions(
  clubId: number,
  filters: TransactionFilters,
): Promise<TransactionHistory> {
  return httpClient.get<TransactionHistory>(
    `/clubs/${clubId}/transactions`,
    toTransactionQuery(filters),
  )
}

export function exportClubTransactions(
  clubId: number,
  filters: TransactionFilters,
): Promise<string> {
  return httpClient.download(
    `/clubs/${clubId}/transactions/export`,
    toTransactionQuery(filters),
    `transacoes-clube-${clubId}.csv`,
  )
}
