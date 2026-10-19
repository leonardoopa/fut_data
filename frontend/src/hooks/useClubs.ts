import { useCallback } from 'react'
import { getClub, listClubs } from '../api/clubs'
import type { ClubSort } from '../api/types'
import { useApiQuery } from './useApiQuery'

// A lista da página busca de novo a cada visita; a lista da liga (menu lateral) continua
// disponível mesmo se essa busca falhar, para o usuário chegar à página de cada clube.
export function useClubs(sort: ClubSort) {
  const fetchClubs = useCallback(() => listClubs(sort), [sort])
  return useApiQuery(fetchClubs)
}

export function useClubDetails(clubId: number) {
  const fetchClub = useCallback(() => getClub(clubId), [clubId])
  return useApiQuery(fetchClub)
}
