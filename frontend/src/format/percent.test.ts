import { describe, expect, it } from 'vitest'
import { formatPercent } from './percent'

describe('formatPercent', () => {
  it('shows the rate sent by the API as a percentage', () => {
    expect(formatPercent(10)).toBe('10%')
    expect(formatPercent(0)).toBe('0%')
  })
})
