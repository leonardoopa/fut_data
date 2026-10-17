import { createClub } from '../api/clubs'
import type { Club } from '../api/types'
import { formatMoney } from '../format/money'
import { useAction } from './useAction'

interface ClubActionsOptions {
  onCreated: (club: Club) => void
}

export function useClubActions({ onCreated }: ClubActionsOptions) {
  const create = useAction(createClub, {
    success: (club) => ({
      title: 'Clube criado',
      message: `${club.name} (${club.acronym}) começa com ${formatMoney(club.cash)} em caixa.`,
    }),
    onSuccess: onCreated,
  })

  return { create }
}
