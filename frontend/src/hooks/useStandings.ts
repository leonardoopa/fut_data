import { listStandings } from '../api/standings'
import { useApiQuery } from './useApiQuery'

export function useStandings() {
  return useApiQuery(listStandings)
}
