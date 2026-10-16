import { z } from 'zod'
import { FORMATIONS, TRANSACTION_TYPES } from '../../api/types'
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

export const transactionFiltersSchema = z.object({
  types: z.array(z.enum(TRANSACTION_TYPES)),
  player_id: z.string().transform((value) => (value ? Number(value) : undefined)),
})

export type ClubRegistrationFormValues = z.input<typeof clubRegistrationSchema>
export type TransactionFiltersFormValues = z.input<typeof transactionFiltersSchema>
export type LineupFormValues = z.input<typeof lineupSchema>
