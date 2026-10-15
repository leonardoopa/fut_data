import { httpClient } from './client'
import type { Club } from './types'

export function listClubs(): Promise<Club[]> {
  return httpClient.get<Club[]>('/clubs')
}
