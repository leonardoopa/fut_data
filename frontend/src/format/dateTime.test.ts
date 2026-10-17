import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatTime, toBrasiliaDateTime } from './dateTime'

describe('formatDateTime', () => {
  it('shows an UTC timestamp in Brasília time', () => {
    expect(formatDateTime('2026-10-15T19:30:00Z')).toMatch(/^15\/10\/2026,? 16:30$/)
  })

  it('keeps a timestamp already sent with the Brasília offset', () => {
    expect(formatDateTime('2027-01-01T00:05:00-03:00')).toMatch(/^01\/01\/2027,? 00:05$/)
  })

  it('splits the date and the time in Brasília', () => {
    expect(formatDate('2026-10-16T01:10:00Z')).toBe('15/10/2026')
    expect(formatTime('2026-10-16T01:10:00Z')).toBe('22:10')
  })
})

describe('toBrasiliaDateTime', () => {
  it('joins the typed date and time with the Brasília offset', () => {
    expect(toBrasiliaDateTime('2027-03-10', '18:45')).toBe('2027-03-10T18:45-03:00')
  })

  it('rejects a value that is not a date and a time', () => {
    expect(() => toBrasiliaDateTime('10/03/2027', '18:45')).toThrow(RangeError)
    expect(() => toBrasiliaDateTime('2027-03-10', '')).toThrow(RangeError)
  })
})
