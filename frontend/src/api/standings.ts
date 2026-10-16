import { httpClient } from './client'
import type { Standing } from './types'

export function listStandings(): Promise<Standing[]> {
  return httpClient.get<Standing[]>('/standings')
}
