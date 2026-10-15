import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
  it('uses two decimals with a decimal comma', () => {
    expect(formatMoney(40)).toBe('40,00')
    expect(formatMoney(3.5)).toBe('3,50')
  })

  it('groups thousands with a dot and rounds to cents', () => {
    expect(formatMoney(1234567.891)).toBe('1.234.567,89')
  })
})
