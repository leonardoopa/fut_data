import { describe, expect, it } from 'vitest'
import { formatDateTime, toBrasiliaDateTime } from './dateTime'

describe('formatDateTime', () => {
  it('shows an UTC timestamp in Brasília time', () => {
    expect(formatDateTime('2026-10-15T19:30:00Z')).toMatch(/^15\/10\/2026,? 16:30$/)
  })

  it('keeps a timestamp already sent with the Brasília offset', () => {
    expect(formatDateTime('2027-01-01T00:05:00-03:00')).toMatch(/^01\/01\/2027,? 00:05$/)
  })
})

describe('toBrasiliaDateTime', () => {
  it('adds the Brasília offset to a datetime-local value', () => {
    expect(toBrasiliaDateTime('2027-03-10T18:45')).toBe('2027-03-10T18:45-03:00')
  })

  it('drops the seconds of a datetime-local value', () => {
    expect(toBrasiliaDateTime('2027-03-10T18:45:30')).toBe('2027-03-10T18:45-03:00')
  })

  it('rejects a value that is not a date and time', () => {
    expect(() => toBrasiliaDateTime('10/03/2027 18:45')).toThrow(RangeError)
  })
})
