import { listClubs } from '../api/clubs'
import { useApiQuery } from './useApiQuery'

export function useClubs() {
  return useApiQuery(listClubs)
}
