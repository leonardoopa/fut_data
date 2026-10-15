import { z } from 'zod'
import { TRANSACTION_TYPES } from '../../api/types'
import { requiredLetters, requiredText } from '../../validation/fields'

export const clubRegistrationSchema = z.object({
  name: requiredText(3, 60),
  acronym: requiredLetters(3),
})

export const transactionFiltersSchema = z.object({
  types: z.array(z.enum(TRANSACTION_TYPES)),
  player_id: z.string().transform((value) => (value ? Number(value) : undefined)),
})

export type ClubRegistrationFormValues = z.input<typeof clubRegistrationSchema>
export type TransactionFiltersFormValues = z.input<typeof transactionFiltersSchema>
