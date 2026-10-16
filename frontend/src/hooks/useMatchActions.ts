import { playMatch } from '../api/matches'
import { useAction } from './useAction'

interface MatchActionsOptions {
  onPlayed: () => void
}

export function useMatchActions({ onPlayed }: MatchActionsOptions) {
  const play = useAction(playMatch, {
    successMessage: ({ home, away }) =>
      `Partida jogada: ${home.club_name} ${home.goals} × ${away.goals} ${away.club_name}.`,
    onSuccess: onPlayed,
  })

  return { play }
}
