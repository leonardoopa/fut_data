import { useCallback } from 'react'
import { getClubLineup, saveClubLineup } from '../api/clubs'
import type { LineupPayload } from '../api/types'
import { useAction } from './useAction'
import { useApiQuery } from './useApiQuery'

export function useClubLineup(clubId: number) {
  const fetchLineup = useCallback(() => getClubLineup(clubId), [clubId])
  const lineup = useApiQuery(fetchLineup)
  const save = useAction((payload: LineupPayload) => saveClubLineup(clubId, payload), {
    successMessage: (saved) => `Escalação ${saved.formation} salva.`,
    onSuccess: lineup.reload,
  })

  return { ...lineup, save }
}

export type ClubLineup = ReturnType<typeof useClubLineup>
