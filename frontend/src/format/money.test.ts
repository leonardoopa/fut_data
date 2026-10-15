import { describe, expect, it } from 'vitest'
import { formatMoney, formatSignedMoney } from './money'

describe('formatMoney', () => {
  it('uses two decimals with a decimal comma', () => {
    expect(formatMoney(40)).toBe('40,00')
    expect(formatMoney(3.5)).toBe('3,50')
  })

  it('groups thousands with a dot and rounds to cents', () => {
    expect(formatMoney(1234567.891)).toBe('1.234.567,89')
  })
})

describe('formatSignedMoney', () => {
  it('marks money coming in with "+" and money going out with "-"', () => {
    expect(formatSignedMoney(35.7)).toBe('+35,70')
    expect(formatSignedMoney(-38.85)).toBe('-38,85')
    expect(formatSignedMoney(1234.5)).toBe('+1.234,50')
  })

  it('shows zero without a sign and a dash when there is no value', () => {
    expect(formatSignedMoney(0)).toBe('0,00')
    expect(formatSignedMoney(null)).toBe('—')
  })
})
