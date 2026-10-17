import { z } from 'zod'
import { FORMATIONS } from '../../api/types'
import { LINEUP_SIZE } from '../../config/formations'
import { requiredId, requiredLetters, requiredOption, requiredText } from '../../validation/fields'

export const clubRegistrationSchema = z.object({
  name: requiredText(3, 60),
  acronym: requiredLetters(3),
})

export const lineupSchema = z.object({
  formation: requiredOption(FORMATIONS),
  player_ids: z.array(requiredId()).length(LINEUP_SIZE),
})

export type ClubRegistrationFormValues = z.input<typeof clubRegistrationSchema>
export type LineupFormValues = z.input<typeof lineupSchema>
