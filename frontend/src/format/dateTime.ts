const BRASILIA_TIME_ZONE = 'America/Sao_Paulo'
const BRASILIA_UTC_OFFSET = '-03:00'
const LOCAL_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2}(\.\d+)?)?$/

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: BRASILIA_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormatter.format(new Date(isoDateTime))
}

export function isLocalDateTime(value: string): boolean {
  return LOCAL_DATE_TIME_PATTERN.test(value)
}

export function toBrasiliaDateTime(localDateTime: string): string {
  const match = LOCAL_DATE_TIME_PATTERN.exec(localDateTime)
  if (!match) {
    throw new RangeError(`Data e hora inválidas: "${localDateTime}".`)
  }
  return `${match[1]}${BRASILIA_UTC_OFFSET}`
}
