import { createClub } from '../api/clubs'
import { useAction } from './useAction'

interface ClubActionsOptions {
  onCreated: () => void
}

export function useClubActions({ onCreated }: ClubActionsOptions) {
  const create = useAction(createClub, {
    successMessage: (club) => `Clube "${club.name}" criado.`,
    onSuccess: onCreated,
  })

  return { create }
}
