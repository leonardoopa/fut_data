import { httpClient } from './client'
import type {
  Page,
  Player,
  PlayerConditionPayload,
  PlayerListQuery,
  PlayerProfilePayload,
  PlayerRegistrationPayload,
  Purchase,
  PurchasePayload,
  Sale,
} from './types'

export function listPlayers(query: PlayerListQuery): Promise<Page<Player>> {
  return httpClient.get<Page<Player>>('/players', query)
}

export function createPlayer(payload: PlayerRegistrationPayload): Promise<Player> {
  return httpClient.post<Player>('/players', payload)
}

export function updatePlayer(id: number, payload: PlayerProfilePayload): Promise<Player> {
  return httpClient.put<Player>(`/players/${id}`, payload)
}

export function changePlayerCondition(
  id: number,
  payload: PlayerConditionPayload,
): Promise<Player> {
  return httpClient.patch<Player>(`/players/${id}/condition`, payload)
}

export function deletePlayer(id: number): Promise<void> {
  return httpClient.delete(`/players/${id}`)
}

export function buyPlayer(id: number, payload: PurchasePayload): Promise<Purchase> {
  return httpClient.post<Purchase>(`/players/${id}/buy`, payload)
}

export function sellPlayer(id: number): Promise<Sale> {
  return httpClient.post<Sale>(`/players/${id}/sell`)
}
