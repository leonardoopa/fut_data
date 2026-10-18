import { z } from 'zod'
import { isDate, isTime } from '../format/dateTime'

const REQUIRED_MESSAGE = 'Campo obrigatório.'
const SELECT_MESSAGE = 'Selecione uma opção.'
const INTEGER_PATTERN = /^-?\d+$/
const DECIMAL_PATTERN = /^\d+([.,]\d{1,2})?$/

function isIntegerInRange(value: string, min: number, max: number): boolean {
  const number = Number(value)
  return INTEGER_PATTERN.test(value) && number >= min && number <= max
}

function integerRangeMessage(min: number, max: number): string {
  return `Informe um número inteiro de ${min} a ${max}.`
}

function toOptional<T>(value: string, parse: (value: string) => T): T | undefined {
  return value === '' ? undefined : parse(value)
}

export function requiredText(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .refine(
      (value) => value === '' || (value.length >= min && value.length <= max),
      `Use de ${min} a ${max} caracteres.`,
    )
}

export function requiredLetters(length: number) {
  const pattern = new RegExp(`^[A-Za-z]{${length}}$`)
  return z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .refine((value) => value === '' || pattern.test(value), `Use ${length} letras de A a Z.`)
    .transform((value) => value.toUpperCase())
}

export function requiredDate() {
  return z.string().refine(isDate, 'Informe a data.')
}

export function requiredTime() {
  return z.string().refine(isTime, 'Informe a hora.')
}

export function requiredId() {
  return z.string().min(1, SELECT_MESSAGE).transform(Number)
}

export function optionalText(min: number, max: number) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (value.length >= min && value.length <= max),
      `Use de ${min} a ${max} caracteres.`,
    )
    .transform((value) => toOptional(value, String))
}

export function requiredInteger(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .refine(
      (value) => value === '' || isIntegerInRange(value, min, max),
      integerRangeMessage(min, max),
    )
    .transform(Number)
}

export function optionalInteger(min: number, max: number) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === '' || isIntegerInRange(value, min, max),
      integerRangeMessage(min, max),
    )
    .transform((value) => toOptional(value, Number))
}

export function optionalDecimal() {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === '' || DECIMAL_PATTERN.test(value),
      'Informe um valor a partir de 0, com até 2 casas decimais.',
    )
    .transform((value) => toOptional(value, (decimal) => Number(decimal.replace(',', '.'))))
}

export function requiredOption<const Options extends readonly [string, ...string[]]>(
  options: Options,
) {
  return z.string().pipe(z.enum(options, { error: SELECT_MESSAGE }))
}
