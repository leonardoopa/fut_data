import { playMatch } from '../api/matches'
import type { MatchDetails } from '../api/types'
import { useAction } from './useAction'

interface MatchActionsOptions {
  onPlayed: (match: MatchDetails) => void
}

export function useMatchActions({ onPlayed }: MatchActionsOptions) {
  const play = useAction(playMatch, {
    success: ({ home, away }) => ({
      title: 'Partida jogada',
      message: `${home.club_name} ${home.goals} × ${away.goals} ${away.club_name}. Placar e duelos devolvidos pela API.`,
    }),
    onSuccess: onPlayed,
  })

  return { play }
}
