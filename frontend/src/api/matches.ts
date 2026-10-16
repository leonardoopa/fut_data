import { httpClient } from './client'
import type { Match, MatchDetails, MatchFilters, MatchPayload } from './types'

export function listMatches(filters: MatchFilters): Promise<Match[]> {
  return httpClient.get<Match[]>('/matches', filters)
}

export function getMatch(id: number): Promise<MatchDetails> {
  return httpClient.get<MatchDetails>(`/matches/${id}`)
}

export function playMatch(payload: MatchPayload): Promise<MatchDetails> {
  return httpClient.post<MatchDetails>('/matches', payload)
}
