const BRASILIA_TIME_ZONE = 'America/Sao_Paulo'
const BRASILIA_UTC_OFFSET = '-03:00'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{2}:\d{2}$/

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormatter.format(new Date(isoDateTime))
}

export function formatDate(isoDateTime: string): string {
  return dateFormatter.format(new Date(isoDateTime))
}

export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime))
}

export function isDate(value: string): boolean {
  return DATE_PATTERN.test(value)
}

export function isTime(value: string): boolean {
  return TIME_PATTERN.test(value)
}

export function toBrasiliaDateTime(date: string, time: string): string {
  if (!isDate(date) || !isTime(time)) {
    throw new RangeError(`Data e hora inválidas: "${date} ${time}".`)
  }
  return `${date}T${time}${BRASILIA_UTC_OFFSET}`
}
