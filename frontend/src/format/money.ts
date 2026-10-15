const MISSING_VALUE = '—'
const MONEY_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}

const moneyFormatter = new Intl.NumberFormat('pt-BR', MONEY_FORMAT)
const signedMoneyFormatter = new Intl.NumberFormat('pt-BR', {
  ...MONEY_FORMAT,
  signDisplay: 'exceptZero',
})

export function formatMoney(value: number): string {
  return moneyFormatter.format(value)
}

export function formatSignedMoney(value: number | null): string {
  return value === null ? MISSING_VALUE : signedMoneyFormatter.format(value)
}
