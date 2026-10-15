import { z } from 'zod'
import { CONDITIONS, POSITIONS } from '../../api/types'
import {
  optionalDecimal,
  optionalInteger,
  optionalOption,
  optionalText,
  requiredDateTime,
  requiredId,
  requiredInteger,
  requiredOption,
  requiredText,
} from '../../validation/fields'

const attribute = () => requiredInteger(1, 99)

export const playerProfileSchema = z.object({
  name: requiredText(3, 100),
  position: requiredOption(POSITIONS),
  agility: requiredInteger(1, 100),
  age: requiredInteger(16, 45),
})

export const playerRegistrationSchema = playerProfileSchema.extend({
  pace: attribute(),
  shooting: attribute(),
  passing: attribute(),
  dribbling: attribute(),
  defending: attribute(),
  physical: attribute(),
  potential: attribute(),
})

export const playerConditionSchema = z.object({
  condition: requiredOption(CONDITIONS),
})

export const playerFiltersSchema = z.object({
  search: optionalText(2, 100),
  position: optionalOption(POSITIONS),
  condition: optionalOption(CONDITIONS),
  club_id: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  free: z
    .boolean()
    .optional()
    .transform((value) => value || undefined),
  min_age: optionalInteger(16, 45),
  max_age: optionalInteger(16, 45),
  min_value: optionalDecimal(),
  max_value: optionalDecimal(),
})

export const playerPurchaseSchema = z.object({
  club_id: requiredId(),
  loyalty_until: requiredDateTime(),
})

export type PlayerProfileFormValues = z.input<typeof playerProfileSchema>
export type PlayerRegistrationFormValues = z.input<typeof playerRegistrationSchema>
export type PlayerFiltersFormValues = z.input<typeof playerFiltersSchema>
