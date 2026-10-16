import { z } from 'zod'
import { requiredId } from '../../validation/fields'

export const matchSchema = z
  .object({
    home_club_id: requiredId(),
    away_club_id: requiredId(),
  })
  .refine((match) => match.home_club_id !== match.away_club_id, {
    path: ['away_club_id'],
    message: 'Escolha um clube diferente do mandante.',
  })

export type MatchFormValues = z.input<typeof matchSchema>
