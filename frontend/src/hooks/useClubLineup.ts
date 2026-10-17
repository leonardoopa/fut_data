import { useMemo } from 'react'
import { getClubLineup, saveClubLineup } from '../api/clubs'
import type { LineupPayload } from '../api/types'
import { useAction } from './useAction'
import { useApiQuery } from './useApiQuery'

export function useLineup(clubId: number | null) {
  const fetchLineup = useMemo(
    () => (clubId === null ? null : () => getClubLineup(clubId)),
    [clubId],
  )
  return useApiQuery(fetchLineup)
}

export function useClubLineup(clubId: number) {
  const lineup = useLineup(clubId)
  const save = useAction((payload: LineupPayload) => saveClubLineup(clubId, payload), {
    success: (saved) => ({
      title: 'Escalação salva',
      message: `Formação ${saved.formation} com ${saved.players.length} titulares, devolvida pela API.`,
    }),
    changesLeague: false,
    onSuccess: lineup.reload,
  })

  return { ...lineup, save }
}

export type ClubLineup = ReturnType<typeof useClubLineup>
