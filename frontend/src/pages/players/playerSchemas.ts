import { z } from 'zod'
import { CONDITIONS, POSITIONS } from '../../api/types'
import { toBrasiliaDateTime } from '../../format/dateTime'
import {
  optionalDecimal,
  optionalInteger,
  optionalText,
  requiredDate,
  requiredId,
  requiredInteger,
  requiredOption,
  requiredText,
  requiredTime,
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

export const playerSearchSchema = optionalText(2, 100)

export const ageRangeSchema = z.object({
  min: optionalInteger(16, 45),
  max: optionalInteger(16, 45),
})

export const valueRangeSchema = z.object({
  min: optionalDecimal(),
  max: optionalDecimal(),
})

export const playerPurchaseSchema = z
  .object({
    club_id: requiredId(),
    loyalty_date: requiredDate(),
    loyalty_time: requiredTime(),
  })
  .transform(({ club_id, loyalty_date, loyalty_time }) => ({
    club_id,
    loyalty_until: toBrasiliaDateTime(loyalty_date, loyalty_time),
  }))

export type PlayerProfileFormValues = z.input<typeof playerProfileSchema>
export type PlayerRegistrationFormValues = z.input<typeof playerRegistrationSchema>
export type RangeFormValues = z.input<typeof ageRangeSchema>
export type NumberRange = z.output<typeof ageRangeSchema>
export type PlayerPurchaseFormValues = z.input<typeof playerPurchaseSchema>
